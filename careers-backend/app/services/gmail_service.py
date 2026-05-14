"""Gmail service for OAuth and email sending."""

import logging
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Dict, Any, Optional
import json

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings
from app.db.connection import get_db

logger = logging.getLogger(__name__)


class GmailService:
    """Service for Gmail OAuth and email operations."""
    
    def __init__(self):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri
        self.scopes = [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    
    def get_authorization_url(self, state: str) -> str:
        """
        Generate OAuth authorization URL.
        
        Args:
            state: State parameter for CSRF protection
        
        Returns:
            Authorization URL
        """
        from urllib.parse import urlencode
        
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': ' '.join(self.scopes),
            'access_type': 'offline',
            'prompt': 'consent',
            'state': state,
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        return auth_url
    
    async def exchange_code_for_tokens(
        self,
        code: str
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens.
        
        Args:
            code: Authorization code from OAuth callback
        
        Returns:
            Token data including access_token and refresh_token
        """
        import httpx
        
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            'code': code,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'redirect_uri': self.redirect_uri,
            'grant_type': 'authorization_code',
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code != 200:
                raise ValueError(f"Token exchange failed: {response.text}")
            
            return response.json()
    
    async def store_gmail_connection(
        self,
        user_id: str,
        email: str,
        tokens: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Store Gmail OAuth tokens in database.
        
        Args:
            user_id: User ID
            email: Gmail address
            tokens: Token data from OAuth
        
        Returns:
            Gmail connection record
        """
        async for conn in get_db():
            # Check if connection exists
            existing = await conn.fetchrow(
                "SELECT * FROM gmail_connections WHERE user_id = $1",
                user_id
            )
            
            if existing:
                # Update existing
                result = await conn.fetchrow(
                    """
                    UPDATE gmail_connections
                    SET
                        email = $1,
                        refresh_token = $2,
                        access_token = $3,
                        token_expiry = NOW() + INTERVAL '1 hour',
                        scopes = $4,
                        is_active = true,
                        updated_at = NOW()
                    WHERE user_id = $5
                    RETURNING *
                    """,
                    email,
                    tokens.get('refresh_token'),
                    tokens.get('access_token'),
                    json.dumps(self.scopes),
                    user_id
                )
            else:
                # Create new
                result = await conn.fetchrow(
                    """
                    INSERT INTO gmail_connections (
                        user_id,
                        email,
                        refresh_token,
                        access_token,
                        token_expiry,
                        scopes,
                        is_active
                    )
                    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour', $5, true)
                    RETURNING *
                    """,
                    user_id,
                    email,
                    tokens.get('refresh_token'),
                    tokens.get('access_token'),
                    json.dumps(self.scopes)
                )
            
            return dict(result)
    
    async def get_gmail_connection(
        self,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get Gmail connection for user."""
        async for conn in get_db():
            result = await conn.fetchrow(
                "SELECT * FROM gmail_connections WHERE user_id = $1 AND is_active = true",
                user_id
            )
            return dict(result) if result else None
    
    async def refresh_access_token(
        self,
        refresh_token: str
    ) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Refresh token
        
        Returns:
            New token data
        """
        import httpx
        
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            'refresh_token': refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'refresh_token',
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code != 200:
                raise ValueError(f"Token refresh failed: {response.text}")
            
            return response.json()
    
    async def get_valid_credentials(
        self,
        user_id: str
    ) -> Optional[Credentials]:
        """
        Get valid Gmail credentials for user.
        
        Automatically refreshes if expired.
        """
        connection = await self.get_gmail_connection(user_id)
        
        if not connection:
            return None
        
        # Create credentials
        creds = Credentials(
            token=connection['access_token'],
            refresh_token=connection['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.scopes
        )
        
        # Refresh if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            
            # Update database
            async for conn in get_db():
                await conn.execute(
                    """
                    UPDATE gmail_connections
                    SET access_token = $1, token_expiry = NOW() + INTERVAL '1 hour'
                    WHERE user_id = $2
                    """,
                    creds.token,
                    user_id
                )
        
        return creds
    
    async def send_email(
        self,
        user_id: str,
        to_email: str,
        subject: str,
        body: str,
        attachments: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Send email via Gmail API.
        
        Args:
            user_id: User ID
            to_email: Recipient email
            subject: Email subject
            body: Email body (HTML or plain text)
            attachments: Optional list of attachments
        
        Returns:
            Sent message data
        """
        try:
            # Get credentials
            creds = await self.get_valid_credentials(user_id)
            
            if not creds:
                raise ValueError("Gmail not connected. Please authorize Gmail access.")
            
            # Build Gmail service
            service = build('gmail', 'v1', credentials=creds)
            
            # Create message
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            
            # Add body
            message.attach(MIMEText(body, 'html'))
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename={attachment["filename"]}'
                    )
                    message.attach(part)
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            # Send message
            sent_message = service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            logger.info(f"Email sent successfully: {sent_message['id']}")
            
            return {
                'success': True,
                'message_id': sent_message['id'],
                'thread_id': sent_message.get('threadId')
            }
        
        except HttpError as e:
            logger.error(f"Gmail API error: {e}")
            return {
                'success': False,
                'error': f"Gmail API error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def disconnect_gmail(self, user_id: str) -> bool:
        """Disconnect Gmail for user."""
        async for conn in get_db():
            result = await conn.execute(
                "UPDATE gmail_connections SET is_active = false WHERE user_id = $1",
                user_id
            )
            return result == "UPDATE 1"

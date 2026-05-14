"""Authentication API routes."""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import secrets
import logging

from app.middleware.auth import CurrentUser
from app.services.gmail_service import GmailService

router = APIRouter()
logger = logging.getLogger(__name__)


class HealthResponse(BaseModel):
    status: str
    message: str


class GmailStatusResponse(BaseModel):
    connected: bool
    email: str | None = None


@router.get("/health", response_model=HealthResponse)
async def auth_health():
    """Health check for auth module."""
    return HealthResponse(
        status="ok",
        message="Authentication module is running"
    )


@router.get("/gmail/status", response_model=GmailStatusResponse)
async def gmail_status(current_user: CurrentUser = None):
    """Check Gmail connection status."""
    try:
        gmail_service = GmailService()
        connection = await gmail_service.get_gmail_connection(current_user["id"])
        
        if connection and connection.get('is_active'):
            return GmailStatusResponse(
                connected=True,
                email=connection.get('email')
            )
        else:
            return GmailStatusResponse(connected=False)
    
    except Exception as e:
        logger.error(f"Failed to check Gmail status: {e}")
        return GmailStatusResponse(connected=False)


@router.get("/gmail/authorize")
async def gmail_authorize(current_user: CurrentUser = None):
    """Initiate Gmail OAuth flow."""
    try:
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state in session (in production, use Redis or database)
        # For now, we'll include user_id in state
        state_with_user = f"{current_user['id']}:{state}"
        
        # Get authorization URL
        gmail_service = GmailService()
        auth_url = gmail_service.get_authorization_url(state_with_user)
        
        return {"authorization_url": auth_url}
    
    except Exception as e:
        logger.error(f"Failed to initiate Gmail OAuth: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate Gmail OAuth")


@router.get("/gmail/callback")
async def gmail_callback(
    code: str,
    state: str,
    request: Request
):
    """Handle Gmail OAuth callback."""
    try:
        # Extract user_id from state
        user_id, _ = state.split(':', 1)
        
        # Exchange code for tokens
        gmail_service = GmailService()
        tokens = await gmail_service.exchange_code_for_tokens(code)
        
        # Get user email from Google
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f"Bearer {tokens['access_token']}"}
            )
            user_info = response.json()
            email = user_info.get('email')
        
        # Store connection
        await gmail_service.store_gmail_connection(
            user_id=user_id,
            email=email,
            tokens=tokens
        )
        
        logger.info(f"Gmail connected successfully for user {user_id}")
        
        # Redirect to frontend success page
        frontend_url = request.headers.get('referer', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}/careers/settings?gmail=connected")
    
    except Exception as e:
        logger.error(f"Gmail OAuth callback failed: {e}")
        # Redirect to frontend error page
        return RedirectResponse(url="http://localhost:3000/careers/settings?gmail=error")


@router.post("/gmail/disconnect")
async def gmail_disconnect(current_user: CurrentUser = None):
    """Disconnect Gmail."""
    try:
        gmail_service = GmailService()
        success = await gmail_service.disconnect_gmail(current_user["id"])
        
        if success:
            return {"success": True, "message": "Gmail disconnected successfully"}
        else:
            raise HTTPException(status_code=404, detail="Gmail connection not found")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to disconnect Gmail: {e}")
        raise HTTPException(status_code=500, detail="Failed to disconnect Gmail")

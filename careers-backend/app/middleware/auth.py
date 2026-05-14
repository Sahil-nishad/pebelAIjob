"""Authentication middleware for FastAPI."""

from fastapi import Header, HTTPException, Depends
from typing import Annotated
import httpx
import logging

from app.config import settings

logger = logging.getLogger(__name__)


async def verify_internal_api_key(
    x_api_key: Annotated[str | None, Header()] = None
) -> bool:
    """Verify internal API key for service-to-service communication."""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")
    
    if x_api_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    return True


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None
) -> dict:
    """
    Extract and verify user from NextAuth JWT token.
    
    The Next.js frontend will send the NextAuth session token in the Authorization header.
    We'll verify it by calling the Next.js /api/auth/session endpoint.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    # Verify token by calling Next.js session endpoint
    # In production, you might want to verify the JWT directly using the NEXTAUTH_SECRET
    try:
        async with httpx.AsyncClient() as client:
            # Call the Next.js API to verify the session
            response = await client.get(
                f"{settings.allowed_origins_list[0]}/api/auth/session",
                cookies={"next-auth.session-token": token},
                timeout=5.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = response.json()
            
            if not session_data or "user" not in session_data:
                raise HTTPException(status_code=401, detail="No active session")
            
            user = session_data["user"]
            
            # Extract user ID from the session
            # NextAuth stores the database ID in the token
            if "dbId" not in user and "id" not in user:
                raise HTTPException(status_code=401, detail="Invalid user data")
            
            return {
                "id": user.get("dbId") or user.get("id"),
                "email": user.get("email"),
                "name": user.get("name"),
            }
    
    except httpx.RequestError as e:
        logger.error(f"Failed to verify session: {e}")
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# Dependency for routes that require authentication
CurrentUser = Annotated[dict, Depends(get_current_user)]

# Dependency for internal API routes
InternalAuth = Annotated[bool, Depends(verify_internal_api_key)]

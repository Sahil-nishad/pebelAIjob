"""Authentication middleware for FastAPI."""

from fastapi import Header, HTTPException, Depends
from typing import Annotated
import logging

from app.config import settings

logger = logging.getLogger(__name__)


async def get_current_user(
    x_pebel_user_id: Annotated[str | None, Header()] = None,
    x_pebel_user_email: Annotated[str | None, Header()] = None,
    x_internal_service_key: Annotated[str | None, Header()] = None,
) -> dict:
    """
    Extract user from headers set by the Next.js proxy.

    The Next.js API routes verify the session via requireAuth(), then forward:
      x-pebel-user-id: <user_id>
      x-pebel-user-email: <user_email>
      x-internal-service-key: <INTERNAL_API_KEY>

    This avoids the backend needing to call back to Next.js to verify the session.
    """
    # Verify the internal service key so only our proxy can call this
    if not x_internal_service_key:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if x_internal_service_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Invalid service key")

    if not x_pebel_user_id or not x_pebel_user_email:
        raise HTTPException(status_code=401, detail="Missing user identity headers")

    return {
        "id": x_pebel_user_id,
        "email": x_pebel_user_email,
    }


async def verify_internal_api_key(
    x_internal_service_key: Annotated[str | None, Header()] = None,
) -> bool:
    """Verify internal API key for service-to-service communication."""
    if not x_internal_service_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    if x_internal_service_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")

    return True


# Dependency for routes that require authentication
CurrentUser = Annotated[dict, Depends(get_current_user)]

# Dependency for internal API routes
InternalAuth = Annotated[bool, Depends(verify_internal_api_key)]

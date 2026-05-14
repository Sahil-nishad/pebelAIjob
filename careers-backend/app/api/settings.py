"""Settings API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.middleware.auth import CurrentUser

router = APIRouter()


class SettingsResponse(BaseModel):
    """User settings response."""
    daily_email_limit: int
    auto_follow_up_enabled: bool
    follow_up_delay_days: int
    preferred_email_time: str | None
    timezone: str


class SettingsUpdate(BaseModel):
    """User settings update."""
    daily_email_limit: int | None = None
    auto_follow_up_enabled: bool | None = None
    follow_up_delay_days: int | None = None
    preferred_email_time: str | None = None
    timezone: str | None = None


@router.get("/", response_model=SettingsResponse)
async def get_settings(
    current_user: CurrentUser = None,
):
    """Get user settings."""
    # TODO: Implement
    return SettingsResponse(
        daily_email_limit=5,
        auto_follow_up_enabled=False,
        follow_up_delay_days=3,
        preferred_email_time=None,
        timezone="UTC"
    )


@router.patch("/", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdate,
    current_user: CurrentUser = None,
):
    """Update user settings."""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")

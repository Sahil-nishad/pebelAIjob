"""Campaign schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List


class CampaignCreate(BaseModel):
    """Schema for creating a new campaign."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    target_role: str | None = None
    target_location: str | None = None
    target_companies: List[str] = Field(default_factory=list)
    daily_limit: int = Field(5, ge=1, le=100)


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign."""
    name: str | None = None
    description: str | None = None
    target_role: str | None = None
    target_location: str | None = None
    target_companies: List[str] | None = None
    status: str | None = Field(None, pattern="^(active|paused|completed)$")
    daily_limit: int | None = Field(None, ge=1, le=100)


class CampaignResponse(BaseModel):
    """Schema for campaign response."""
    id: str
    user_id: str
    name: str
    description: str | None
    target_role: str | None
    target_location: str | None
    target_companies: List[str] = Field(default_factory=list)
    status: str
    daily_limit: int
    emails_sent_today: int
    total_emails_sent: int
    total_opened: int
    total_replied: int
    last_sent_at: datetime | None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CampaignStatsResponse(BaseModel):
    """Schema for campaign statistics."""
    campaign_id: str
    total_emails: int
    sent: int
    opened: int
    replied: int
    bounced: int
    open_rate: float
    reply_rate: float
    bounce_rate: float

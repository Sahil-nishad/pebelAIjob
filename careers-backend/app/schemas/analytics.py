"""Analytics schemas."""

from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Dict, Any


class AnalyticsQuery(BaseModel):
    """Schema for analytics query parameters."""
    start_date: date | None = None
    end_date: date | None = None
    campaign_id: str | None = None
    group_by: str = Field("day", pattern="^(day|week|month)$")


class AnalyticsResponse(BaseModel):
    """Schema for analytics response."""
    total_emails_sent: int
    total_opened: int
    total_replied: int
    total_bounced: int
    open_rate: float
    reply_rate: float
    bounce_rate: float
    avg_response_time_hours: float | None
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    top_campaigns: List[Dict[str, Any]] = Field(default_factory=list)
    top_recruiters: List[Dict[str, Any]] = Field(default_factory=list)


class DashboardStatsResponse(BaseModel):
    """Schema for dashboard statistics."""
    total_resumes: int
    active_campaigns: int
    total_recruiters_found: int
    emails_sent_today: int
    daily_limit: int
    total_emails_sent: int
    total_opened: int
    total_replied: int
    open_rate: float
    reply_rate: float
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)

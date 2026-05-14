"""Email schemas."""

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Dict, Any


class EmailCreate(BaseModel):
    """Schema for creating an email draft."""
    campaign_id: str | None = None
    recruiter_id: str
    recruiter_post_id: str | None = None
    resume_id: str
    email_subject: str = Field(..., min_length=1, max_length=500)
    email_body: str = Field(..., min_length=1)
    match_percentage: int = Field(0, ge=0, le=100)
    missing_skills: list[str] = Field(default_factory=list)
    match_summary: str | None = None


class EmailSendRequest(BaseModel):
    """Schema for sending an email."""
    email_id: str
    send_immediately: bool = True
    scheduled_at: datetime | None = None


class EmailResponse(BaseModel):
    """Schema for email response."""
    id: str
    user_id: str
    campaign_id: str | None
    recruiter_id: str | None
    recruiter_post_id: str | None
    resume_id: str | None
    email_subject: str
    email_body: str
    email_type: str
    match_percentage: int
    missing_skills: list[str]
    match_summary: str | None
    sent_status: str
    reply_status: str
    gmail_message_id: str | None
    sent_at: datetime | None
    opened_at: datetime | None
    replied_at: datetime | None
    bounced_at: datetime | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EmailGenerateRequest(BaseModel):
    """Schema for AI email generation request."""
    recruiter_id: str
    recruiter_post_id: str | None = None
    resume_id: str
    template_id: str | None = None
    tone: str = Field("professional", pattern="^(professional|casual|enthusiastic)$")
    custom_instructions: str | None = None


class EmailGenerateResponse(BaseModel):
    """Schema for AI email generation response."""
    success: bool
    subject: str | None = None
    body: str | None = None
    match_percentage: int = 0
    missing_skills: list[str] = Field(default_factory=list)
    match_summary: str | None = None
    error: str | None = None

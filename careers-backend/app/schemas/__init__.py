"""Pydantic schemas for request/response validation."""

from app.schemas.resume import ResumeCreate, ResumeResponse, ResumeUpdate
from app.schemas.recruiter import RecruiterResponse, RecruiterSearchParams
from app.schemas.campaign import CampaignCreate, CampaignResponse, CampaignUpdate
from app.schemas.email import EmailCreate, EmailResponse, EmailSendRequest
from app.schemas.analytics import AnalyticsResponse, AnalyticsQuery

__all__ = [
    "ResumeCreate",
    "ResumeResponse",
    "ResumeUpdate",
    "RecruiterResponse",
    "RecruiterSearchParams",
    "CampaignCreate",
    "CampaignResponse",
    "CampaignUpdate",
    "EmailCreate",
    "EmailResponse",
    "EmailSendRequest",
    "AnalyticsResponse",
    "AnalyticsQuery",
]

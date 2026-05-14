"""Recruiter schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Dict, Any


class RecruiterSearchParams(BaseModel):
    """Schema for recruiter search parameters."""
    keywords: str = Field(..., description="Search keywords (e.g., 'Software Engineer recruiter')")
    location: str | None = Field(None, description="Location filter")
    company: str | None = Field(None, description="Company filter")
    limit: int = Field(10, ge=1, le=50, description="Number of results to return")


class RecruiterResponse(BaseModel):
    """Schema for recruiter response."""
    id: str
    recruiter_name: str
    company: str | None
    email: str | None
    linkedin_url: str | None
    designation: str | None
    profile_image_url: str | None
    about: str | None
    followers_count: int | None
    connections_count: int | None
    is_verified: bool
    last_scraped_at: datetime | None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RecruiterPostResponse(BaseModel):
    """Schema for recruiter post response."""
    id: str
    recruiter_id: str | None
    recruiter: RecruiterResponse | None
    role: str | None
    location: str | None
    job_type: str | None
    experience_level: str | None
    salary_range: str | None
    company_size: str | None
    is_remote: bool
    post_content: str
    extracted_skills: List[str] = Field(default_factory=list)
    extracted_email_candidates: List[str] = Field(default_factory=list)
    source_url: str
    source_platform: str | None
    posted_date: datetime | None
    engagement_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RecruiterSearchResponse(BaseModel):
    """Schema for recruiter search response."""
    success: bool
    message: str
    job_id: str | None = None
    recruiters: List[RecruiterResponse] = Field(default_factory=list)
    total_found: int = 0

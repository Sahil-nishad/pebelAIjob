"""Resume schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Dict, Any


class ResumeCreate(BaseModel):
    """Schema for creating a new resume."""
    file_url: str
    file_name: str
    file_size: int
    mime_type: str


class ResumeUpdate(BaseModel):
    """Schema for updating a resume."""
    is_active: bool | None = None


class ResumeResponse(BaseModel):
    """Schema for resume response."""
    id: str
    user_id: str
    file_url: str
    file_name: str | None
    file_size: int | None
    mime_type: str | None
    parsed_name: str | None
    extracted_skills: List[str] = Field(default_factory=list)
    extracted_projects: List[Dict[str, Any]] = Field(default_factory=list)
    extracted_education: List[Dict[str, Any]] = Field(default_factory=list)
    extracted_experience: List[Dict[str, Any]] = Field(default_factory=list)
    raw_text: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResumeParseRequest(BaseModel):
    """Schema for resume parsing request."""
    resume_id: str


class ResumeParseResponse(BaseModel):
    """Schema for resume parsing response."""
    success: bool
    message: str
    resume: ResumeResponse | None = None

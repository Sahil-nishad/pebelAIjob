"""Resume schemas."""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import List, Dict, Any
import json


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
    file_url: str | None = None
    file_name: str | None = None
    file_size: int | None = None
    mime_type: str | None = None
    parsed_name: str | None = None
    extracted_skills: List[Any] = Field(default_factory=list)
    extracted_projects: List[Any] = Field(default_factory=list)
    extracted_education: List[Any] = Field(default_factory=list)
    extracted_experience: List[Any] = Field(default_factory=list)
    raw_text: str | None = None
    ats_score: int | None = 0
    ats_data: Dict[str, Any] | None = Field(default_factory=dict)
    target_job_title: str | None = None
    experience_level: str | None = "fresher"
    total_experience_years: float | None = 0
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def stringify_uuid(cls, v):
        return str(v) if v else v

    @field_validator('extracted_skills', 'extracted_projects', 'extracted_education', 'extracted_experience', mode='before')
    @classmethod
    def parse_json_field(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        if isinstance(v, list):
            return v
        return []

    @field_validator('ats_data', mode='before')
    @classmethod
    def parse_ats_data(cls, v):
        if v is None:
            return {}
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return {}
        if isinstance(v, dict):
            return v
        return {}

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

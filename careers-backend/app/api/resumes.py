"""Resume API routes."""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List
import logging
import uuid

from app.middleware.auth import CurrentUser
from app.schemas.resume import (
    ResumeCreate,
    ResumeResponse,
    ResumeUpdate,
    ResumeParseRequest,
    ResumeParseResponse,
)
from app.services.resume_service import ResumeService
from app.services.storage_service import StorageService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
):
    """
    Upload a resume file.
    
    Accepts PDF, DOCX files. Stores in Supabase Storage and creates a database record.
    """
    # Validate file type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF and DOCX files are allowed."
        )
    
    # Validate file size (max 10MB)
    content = await file.read()
    file_size = len(content)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    try:
        # Upload to storage
        storage_service = StorageService()
        file_url = await storage_service.upload_resume(
            user_id=current_user["id"],
            file_name=file.filename,
            file_content=content,
            content_type=file.content_type,
        )
        
        # Create database record
        resume_service = ResumeService()
        resume = await resume_service.create_resume(
            user_id=current_user["id"],
            file_url=file_url,
            file_name=file.filename,
            file_size=file_size,
            mime_type=file.content_type,
        )
        
        # Trigger async parsing
        await resume_service.parse_resume_async(resume["id"])
        
        return resume
    
    except Exception as e:
        logger.error(f"Failed to upload resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload resume")


@router.get("/", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: CurrentUser = None,
    active_only: bool = True,
):
    """List all resumes for the current user."""
    resume_service = ResumeService()
    resumes = await resume_service.list_resumes(
        user_id=current_user["id"],
        active_only=active_only,
    )
    return resumes


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: CurrentUser = None,
):
    """Get a specific resume by ID."""
    resume_service = ResumeService()
    resume = await resume_service.get_resume(resume_id, current_user["id"])
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return resume


@router.patch("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str,
    data: ResumeUpdate,
    current_user: CurrentUser = None,
):
    """Update a resume."""
    resume_service = ResumeService()
    resume = await resume_service.update_resume(
        resume_id=resume_id,
        user_id=current_user["id"],
        data=data.model_dump(exclude_unset=True),
    )
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return resume


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: CurrentUser = None,
):
    """Delete a resume (soft delete by setting is_active=false)."""
    resume_service = ResumeService()
    success = await resume_service.delete_resume(resume_id, current_user["id"])
    
    if not success:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {"success": True, "message": "Resume deleted successfully"}


@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    data: ResumeParseRequest,
    current_user: CurrentUser = None,
):
    """
    Manually trigger resume parsing.
    
    This is useful if automatic parsing failed or needs to be re-run.
    """
    resume_service = ResumeService()
    
    # Verify ownership
    resume = await resume_service.get_resume(data.resume_id, current_user["id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Parse resume
    try:
        parsed_resume = await resume_service.parse_resume(data.resume_id)
        return ResumeParseResponse(
            success=True,
            message="Resume parsed successfully",
            resume=parsed_resume,
        )
    except Exception as e:
        logger.error(f"Failed to parse resume: {e}")
        return ResumeParseResponse(
            success=False,
            message=f"Failed to parse resume: {str(e)}",
        )

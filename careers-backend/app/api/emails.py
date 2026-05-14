"""Email API routes."""

from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.middleware.auth import CurrentUser
from app.schemas.email import (
    EmailCreate,
    EmailResponse,
    EmailSendRequest,
    EmailGenerateRequest,
    EmailGenerateResponse,
)
from app.services.email_service import EmailService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=EmailGenerateResponse)
async def generate_email(
    data: EmailGenerateRequest,
    current_user: CurrentUser = None,
):
    """Generate a personalized cold email using AI."""
    try:
        email_service = EmailService()
        result = await email_service.generate_cold_email(
            user_id=current_user["id"],
            recruiter_id=data.recruiter_id,
            resume_id=data.resume_id,
            recruiter_post_id=data.recruiter_post_id,
            tone=data.tone,
            custom_instructions=data.custom_instructions
        )
        
        if result.get('success'):
            return EmailGenerateResponse(
                success=True,
                subject=result.get('subject'),
                body=result.get('body'),
                match_percentage=result.get('match_percentage', 0),
                missing_skills=result.get('missing_skills', []),
                match_summary=result.get('match_summary')
            )
        else:
            return EmailGenerateResponse(
                success=False,
                error=result.get('error', 'Failed to generate email')
            )
    
    except Exception as e:
        logger.error(f"Email generation failed: {e}")
        return EmailGenerateResponse(
            success=False,
            error=str(e)
        )


@router.post("/", response_model=EmailResponse)
async def create_email_draft(
    data: EmailCreate,
    current_user: CurrentUser = None,
):
    """Create an email draft."""
    try:
        email_service = EmailService()
        email = await email_service.create_email_draft(
            user_id=current_user["id"],
            data=data.model_dump()
        )
        return email
    except Exception as e:
        logger.error(f"Failed to create email draft: {e}")
        raise HTTPException(status_code=500, detail="Failed to create email draft")


@router.get("/", response_model=List[EmailResponse])
async def list_emails(
    current_user: CurrentUser = None,
    campaign_id: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all emails for the user."""
    try:
        email_service = EmailService()
        emails = await email_service.list_emails(
            user_id=current_user["id"],
            campaign_id=campaign_id,
            status=status,
            limit=limit,
            offset=offset
        )
        return emails
    except Exception as e:
        logger.error(f"Failed to list emails: {e}")
        raise HTTPException(status_code=500, detail="Failed to list emails")


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    current_user: CurrentUser = None,
):
    """Get a specific email by ID."""
    try:
        email_service = EmailService()
        email = await email_service.get_email(email_id, current_user["id"])
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return email
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get email: {e}")
        raise HTTPException(status_code=500, detail="Failed to get email")


@router.patch("/{email_id}", response_model=EmailResponse)
async def update_email(
    email_id: str,
    data: dict,
    current_user: CurrentUser = None,
):
    """Update an email draft."""
    try:
        email_service = EmailService()
        email = await email_service.update_email(
            email_id=email_id,
            user_id=current_user["id"],
            data=data
        )
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return email
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update email: {e}")
        raise HTTPException(status_code=500, detail="Failed to update email")


@router.delete("/{email_id}")
async def delete_email(
    email_id: str,
    current_user: CurrentUser = None,
):
    """Delete an email draft."""
    try:
        email_service = EmailService()
        success = await email_service.delete_email(email_id, current_user["id"])
        
        if not success:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return {"success": True, "message": "Email deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete email: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete email")


@router.post("/send")
async def send_email(
    data: EmailSendRequest,
    current_user: CurrentUser = None,
):
    """Send an email via Gmail API."""
    # TODO: Implement Gmail sending
    raise HTTPException(status_code=501, detail="Email sending is under development")

"""Recruiter API routes."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import logging

from app.middleware.auth import CurrentUser
from app.schemas.recruiter import (
    RecruiterSearchParams,
    RecruiterSearchResponse,
    RecruiterResponse,
)
from app.services.recruiter_service import RecruiterService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/search", response_model=RecruiterSearchResponse)
async def search_recruiters(
    params: RecruiterSearchParams,
    current_user: CurrentUser = None,
    background_tasks: BackgroundTasks = None,
):
    """
    Search for recruiters on LinkedIn.
    
    This uses Playwright to scrape LinkedIn search results.
    """
    try:
        recruiter_service = RecruiterService()
        
        # Search and store recruiters
        recruiters = await recruiter_service.search_and_store_recruiters(
            user_id=current_user["id"],
            keywords=params.keywords,
            location=params.location,
            limit=params.limit
        )
        
        return RecruiterSearchResponse(
            success=True,
            message=f"Found {len(recruiters)} recruiters",
            recruiters=recruiters,
            total_found=len(recruiters)
        )
    
    except Exception as e:
        logger.error(f"Recruiter search failed: {e}")
        return RecruiterSearchResponse(
            success=False,
            message=f"Search failed: {str(e)}",
            recruiters=[],
            total_found=0
        )


@router.get("/", response_model=List[RecruiterResponse])
async def list_recruiters(
    current_user: CurrentUser = None,
    limit: int = 50,
    offset: int = 0,
    company: str = None,
):
    """List all recruiters with optional filters."""
    try:
        recruiter_service = RecruiterService()
        recruiters = await recruiter_service.list_recruiters(
            limit=limit,
            offset=offset,
            company=company
        )
        return recruiters
    except Exception as e:
        logger.error(f"Failed to list recruiters: {e}")
        raise HTTPException(status_code=500, detail="Failed to list recruiters")


@router.get("/search-db", response_model=List[RecruiterResponse])
async def search_recruiters_in_db(
    q: str,
    current_user: CurrentUser = None,
    limit: int = 50,
):
    """Search recruiters in database by name or company."""
    try:
        recruiter_service = RecruiterService()
        recruiters = await recruiter_service.search_recruiters_in_db(
            query=q,
            limit=limit
        )
        return recruiters
    except Exception as e:
        logger.error(f"Failed to search recruiters: {e}")
        raise HTTPException(status_code=500, detail="Failed to search recruiters")


@router.get("/{recruiter_id}", response_model=RecruiterResponse)
async def get_recruiter(
    recruiter_id: str,
    current_user: CurrentUser = None,
):
    """Get a specific recruiter by ID."""
    try:
        recruiter_service = RecruiterService()
        recruiter = await recruiter_service.get_recruiter(recruiter_id)
        
        if not recruiter:
            raise HTTPException(status_code=404, detail="Recruiter not found")
        
        return recruiter
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get recruiter: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recruiter")

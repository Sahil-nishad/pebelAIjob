"""API routes module."""

from fastapi import APIRouter

from app.api import resumes, jobs

router = APIRouter()

router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])

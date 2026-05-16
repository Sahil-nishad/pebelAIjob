"""API routes module."""

import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter()

# Import and register routes
from app.api import resumes
router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])

try:
    from app.api import jobs
    router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
    logger.info("Jobs router registered successfully")
except Exception as e:
    logger.error(f"Failed to import jobs module: {e}")

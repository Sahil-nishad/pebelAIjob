"""API routes module."""

from fastapi import APIRouter

from app.api import (
    auth,
    resumes,
    recruiters,
    campaigns,
    emails,
    analytics,
    settings as settings_routes,
)

router = APIRouter()

# Include all route modules
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
router.include_router(recruiters.router, prefix="/recruiters", tags=["Recruiters"])
router.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
router.include_router(emails.router, prefix="/emails", tags=["Emails"])
router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
router.include_router(settings_routes.router, prefix="/settings", tags=["Settings"])

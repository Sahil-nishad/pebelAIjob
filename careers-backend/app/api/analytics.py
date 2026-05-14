"""Analytics API routes."""

from fastapi import APIRouter
from datetime import date
import logging

from app.middleware.auth import CurrentUser
from app.schemas.analytics import (
    AnalyticsQuery,
    AnalyticsResponse,
    DashboardStatsResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: CurrentUser = None,
):
    """Get dashboard statistics for the user."""
    try:
        analytics_service = AnalyticsService()
        stats = await analytics_service.get_dashboard_stats(current_user["id"])
        return stats
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}")
        # Return empty stats on error
        return DashboardStatsResponse(
            total_resumes=0,
            active_campaigns=0,
            total_recruiters_found=0,
            emails_sent_today=0,
            daily_limit=5,
            total_emails_sent=0,
            total_opened=0,
            total_replied=0,
            open_rate=0.0,
            reply_rate=0.0,
            recent_activity=[]
        )


@router.post("/", response_model=AnalyticsResponse)
async def get_analytics(
    query: AnalyticsQuery,
    current_user: CurrentUser = None,
):
    """Get detailed analytics based on query parameters."""
    try:
        analytics_service = AnalyticsService()
        analytics = await analytics_service.get_analytics(
            user_id=current_user["id"],
            start_date=query.start_date,
            end_date=query.end_date,
            campaign_id=query.campaign_id,
            group_by=query.group_by
        )
        return analytics
    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        # Return empty analytics on error
        return AnalyticsResponse(
            total_emails_sent=0,
            total_opened=0,
            total_replied=0,
            total_bounced=0,
            open_rate=0.0,
            reply_rate=0.0,
            bounce_rate=0.0,
            avg_response_time_hours=None,
            timeline=[],
            top_campaigns=[],
            top_recruiters=[]
        )

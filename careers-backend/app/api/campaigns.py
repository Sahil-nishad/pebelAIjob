"""Campaign API routes."""

from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.middleware.auth import CurrentUser
from app.schemas.campaign import (
    CampaignCreate,
    CampaignResponse,
    CampaignUpdate,
    CampaignStatsResponse,
)
from app.services.campaign_service import CampaignService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=CampaignResponse)
async def create_campaign(
    data: CampaignCreate,
    current_user: CurrentUser = None,
):
    """Create a new outreach campaign."""
    try:
        campaign_service = CampaignService()
        campaign = await campaign_service.create_campaign(
            user_id=current_user["id"],
            data=data.model_dump()
        )
        return campaign
    except Exception as e:
        logger.error(f"Failed to create campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to create campaign")


@router.get("/", response_model=List[CampaignResponse])
async def list_campaigns(
    current_user: CurrentUser = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all campaigns for the user."""
    try:
        campaign_service = CampaignService()
        campaigns = await campaign_service.list_campaigns(
            user_id=current_user["id"],
            status=status,
            limit=limit,
            offset=offset
        )
        return campaigns
    except Exception as e:
        logger.error(f"Failed to list campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to list campaigns")


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    current_user: CurrentUser = None,
):
    """Get a specific campaign by ID."""
    try:
        campaign_service = CampaignService()
        campaign = await campaign_service.get_campaign(campaign_id, current_user["id"])
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return campaign
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to get campaign")


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    current_user: CurrentUser = None,
):
    """Update a campaign."""
    try:
        campaign_service = CampaignService()
        campaign = await campaign_service.update_campaign(
            campaign_id=campaign_id,
            user_id=current_user["id"],
            data=data.model_dump(exclude_unset=True)
        )
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return campaign
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to update campaign")


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: CurrentUser = None,
):
    """Delete a campaign."""
    try:
        campaign_service = CampaignService()
        success = await campaign_service.delete_campaign(campaign_id, current_user["id"])
        
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {"success": True, "message": "Campaign deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete campaign")


@router.get("/{campaign_id}/stats", response_model=CampaignStatsResponse)
async def get_campaign_stats(
    campaign_id: str,
    current_user: CurrentUser = None,
):
    """Get statistics for a campaign."""
    try:
        campaign_service = CampaignService()
        stats = await campaign_service.get_campaign_stats(campaign_id, current_user["id"])
        
        if not stats:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get campaign stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get campaign stats")

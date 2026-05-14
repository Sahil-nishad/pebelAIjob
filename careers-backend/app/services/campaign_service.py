"""Campaign service for managing outreach campaigns."""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from app.db.connection import get_db

logger = logging.getLogger(__name__)


class CampaignService:
    """Service for campaign management."""
    
    async def create_campaign(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new campaign."""
        async for conn in get_db():
            result = await conn.fetchrow(
                """
                INSERT INTO campaigns (
                    user_id,
                    name,
                    description,
                    target_role,
                    target_location,
                    target_companies,
                    daily_limit,
                    status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
                RETURNING *
                """,
                user_id,
                data.get('name'),
                data.get('description'),
                data.get('target_role'),
                data.get('target_location'),
                data.get('target_companies', []),
                data.get('daily_limit', 5)
            )
            return dict(result)
    
    async def list_campaigns(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List campaigns for a user."""
        async for conn in get_db():
            query = "SELECT * FROM campaigns WHERE user_id = $1"
            params = [user_id]
            param_idx = 2
            
            if status:
                query += f" AND status = ${param_idx}"
                params.append(status)
                param_idx += 1
            
            query += f" ORDER BY created_at DESC LIMIT ${param_idx} OFFSET ${param_idx + 1}"
            params.extend([limit, offset])
            
            results = await conn.fetch(query, *params)
            return [dict(r) for r in results]
    
    async def get_campaign(
        self,
        campaign_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific campaign."""
        async for conn in get_db():
            result = await conn.fetchrow(
                "SELECT * FROM campaigns WHERE id = $1 AND user_id = $2",
                campaign_id,
                user_id
            )
            return dict(result) if result else None
    
    async def update_campaign(
        self,
        campaign_id: str,
        user_id: str,
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a campaign."""
        if not data:
            return await self.get_campaign(campaign_id, user_id)
        
        # Build dynamic UPDATE query
        set_clauses = []
        params = []
        param_idx = 1
        
        for key, value in data.items():
            set_clauses.append(f"{key} = ${param_idx}")
            params.append(value)
            param_idx += 1
        
        params.extend([campaign_id, user_id])
        
        async for conn in get_db():
            result = await conn.fetchrow(
                f"""
                UPDATE campaigns
                SET {', '.join(set_clauses)}, updated_at = NOW()
                WHERE id = ${param_idx} AND user_id = ${param_idx + 1}
                RETURNING *
                """,
                *params
            )
            return dict(result) if result else None
    
    async def delete_campaign(
        self,
        campaign_id: str,
        user_id: str
    ) -> bool:
        """Delete a campaign."""
        async for conn in get_db():
            result = await conn.execute(
                "DELETE FROM campaigns WHERE id = $1 AND user_id = $2",
                campaign_id,
                user_id
            )
            return result == "DELETE 1"
    
    async def get_campaign_stats(
        self,
        campaign_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get statistics for a campaign."""
        async for conn in get_db():
            # Verify ownership
            campaign = await conn.fetchrow(
                "SELECT * FROM campaigns WHERE id = $1 AND user_id = $2",
                campaign_id,
                user_id
            )
            
            if not campaign:
                return {}
            
            # Get email stats
            stats = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) as total_emails,
                    COUNT(*) FILTER (WHERE sent_status = 'sent') as sent,
                    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
                    COUNT(*) FILTER (WHERE replied_at IS NOT NULL) as replied,
                    COUNT(*) FILTER (WHERE bounced_at IS NOT NULL) as bounced
                FROM outreach_emails
                WHERE campaign_id = $1
                """,
                campaign_id
            )
            
            total = stats['total_emails'] or 0
            sent = stats['sent'] or 0
            opened = stats['opened'] or 0
            replied = stats['replied'] or 0
            bounced = stats['bounced'] or 0
            
            return {
                'campaign_id': campaign_id,
                'total_emails': total,
                'sent': sent,
                'opened': opened,
                'replied': replied,
                'bounced': bounced,
                'open_rate': (opened / sent * 100) if sent > 0 else 0,
                'reply_rate': (replied / sent * 100) if sent > 0 else 0,
                'bounce_rate': (bounced / sent * 100) if sent > 0 else 0,
            }
    
    async def check_daily_limit(
        self,
        campaign_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Check if campaign has reached daily limit."""
        async for conn in get_db():
            campaign = await conn.fetchrow(
                "SELECT * FROM campaigns WHERE id = $1 AND user_id = $2",
                campaign_id,
                user_id
            )
            
            if not campaign:
                return {'can_send': False, 'reason': 'Campaign not found'}
            
            # Check if limit reached
            if campaign['emails_sent_today'] >= campaign['daily_limit']:
                return {
                    'can_send': False,
                    'reason': 'Daily limit reached',
                    'sent_today': campaign['emails_sent_today'],
                    'daily_limit': campaign['daily_limit']
                }
            
            return {
                'can_send': True,
                'sent_today': campaign['emails_sent_today'],
                'daily_limit': campaign['daily_limit'],
                'remaining': campaign['daily_limit'] - campaign['emails_sent_today']
            }
    
    async def increment_email_count(
        self,
        campaign_id: str,
        user_id: str
    ) -> bool:
        """Increment email count for campaign."""
        async for conn in get_db():
            result = await conn.execute(
                """
                UPDATE campaigns
                SET
                    emails_sent_today = emails_sent_today + 1,
                    total_emails_sent = total_emails_sent + 1,
                    last_sent_at = NOW(),
                    updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                """,
                campaign_id,
                user_id
            )
            return result == "UPDATE 1"
    
    async def reset_daily_counts(self) -> int:
        """Reset daily email counts for all campaigns (run daily via cron)."""
        async for conn in get_db():
            result = await conn.execute(
                """
                UPDATE campaigns
                SET emails_sent_today = 0, updated_at = NOW()
                WHERE emails_sent_today > 0
                """
            )
            # Extract number from "UPDATE N"
            count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
            logger.info(f"Reset daily counts for {count} campaigns")
            return count

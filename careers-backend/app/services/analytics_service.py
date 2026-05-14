"""Analytics service for tracking and reporting."""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date

from app.db.connection import get_db

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics and reporting."""
    
    async def get_dashboard_stats(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """Get dashboard statistics for user."""
        async for conn in get_db():
            # Get resume count
            resume_count = await conn.fetchval(
                "SELECT COUNT(*) FROM resumes WHERE user_id = $1 AND is_active = true",
                user_id
            )
            
            # Get active campaigns count
            active_campaigns = await conn.fetchval(
                "SELECT COUNT(*) FROM campaigns WHERE user_id = $1 AND status = 'active'",
                user_id
            )
            
            # Get recruiters count
            recruiters_count = await conn.fetchval(
                "SELECT COUNT(DISTINCT recruiter_id) FROM outreach_emails WHERE user_id = $1",
                user_id
            )
            
            # Get today's email count
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            emails_today = await conn.fetchval(
                """
                SELECT COUNT(*) FROM outreach_emails
                WHERE user_id = $1 AND sent_at >= $2
                """,
                user_id,
                today_start
            )
            
            # Get daily limit (from first active campaign or default)
            daily_limit = await conn.fetchval(
                """
                SELECT daily_limit FROM campaigns
                WHERE user_id = $1 AND status = 'active'
                ORDER BY created_at DESC
                LIMIT 1
                """,
                user_id
            ) or 5
            
            # Get email stats
            email_stats = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE sent_status = 'sent') as sent,
                    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
                    COUNT(*) FILTER (WHERE replied_at IS NOT NULL) as replied
                FROM outreach_emails
                WHERE user_id = $1
                """,
                user_id
            )
            
            total = email_stats['total'] or 0
            sent = email_stats['sent'] or 0
            opened = email_stats['opened'] or 0
            replied = email_stats['replied'] or 0
            
            # Get recent activity
            recent_activity = await conn.fetch(
                """
                SELECT
                    event_type,
                    event_data,
                    created_at
                FROM analytics_events
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 10
                """,
                user_id
            )
            
            return {
                'total_resumes': resume_count or 0,
                'active_campaigns': active_campaigns or 0,
                'total_recruiters_found': recruiters_count or 0,
                'emails_sent_today': emails_today or 0,
                'daily_limit': daily_limit,
                'total_emails_sent': sent,
                'total_opened': opened,
                'total_replied': replied,
                'open_rate': (opened / sent * 100) if sent > 0 else 0,
                'reply_rate': (replied / sent * 100) if sent > 0 else 0,
                'recent_activity': [dict(r) for r in recent_activity]
            }
    
    async def get_analytics(
        self,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        campaign_id: Optional[str] = None,
        group_by: str = 'day'
    ) -> Dict[str, Any]:
        """Get detailed analytics with timeline."""
        async for conn in get_db():
            # Set default date range (last 30 days)
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=30)
            
            # Build query filters
            where_clauses = ["user_id = $1"]
            params = [user_id]
            param_idx = 2
            
            if campaign_id:
                where_clauses.append(f"campaign_id = ${param_idx}")
                params.append(campaign_id)
                param_idx += 1
            
            where_clauses.append(f"created_at >= ${param_idx}")
            params.append(datetime.combine(start_date, datetime.min.time()))
            param_idx += 1
            
            where_clauses.append(f"created_at <= ${param_idx}")
            params.append(datetime.combine(end_date, datetime.max.time()))
            param_idx += 1
            
            where_clause = " AND ".join(where_clauses)
            
            # Get overall stats
            stats = await conn.fetchrow(
                f"""
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE sent_status = 'sent') as sent,
                    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
                    COUNT(*) FILTER (WHERE replied_at IS NOT NULL) as replied,
                    COUNT(*) FILTER (WHERE bounced_at IS NOT NULL) as bounced,
                    AVG(EXTRACT(EPOCH FROM (replied_at - sent_at)) / 3600) as avg_response_hours
                FROM outreach_emails
                WHERE {where_clause}
                """,
                *params
            )
            
            total = stats['total'] or 0
            sent = stats['sent'] or 0
            opened = stats['opened'] or 0
            replied = stats['replied'] or 0
            bounced = stats['bounced'] or 0
            
            # Get timeline data
            date_trunc = 'day' if group_by == 'day' else 'week' if group_by == 'week' else 'month'
            timeline = await conn.fetch(
                f"""
                SELECT
                    DATE_TRUNC('{date_trunc}', created_at) as period,
                    COUNT(*) as emails,
                    COUNT(*) FILTER (WHERE sent_status = 'sent') as sent,
                    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
                    COUNT(*) FILTER (WHERE replied_at IS NOT NULL) as replied
                FROM outreach_emails
                WHERE {where_clause}
                GROUP BY period
                ORDER BY period
                """,
                *params
            )
            
            # Get top campaigns
            top_campaigns = await conn.fetch(
                f"""
                SELECT
                    c.id,
                    c.name,
                    COUNT(e.id) as emails,
                    COUNT(e.id) FILTER (WHERE e.opened_at IS NOT NULL) as opened,
                    COUNT(e.id) FILTER (WHERE e.replied_at IS NOT NULL) as replied
                FROM campaigns c
                LEFT JOIN outreach_emails e ON e.campaign_id = c.id AND e.user_id = $1
                WHERE c.user_id = $1
                GROUP BY c.id, c.name
                ORDER BY emails DESC
                LIMIT 5
                """,
                user_id
            )
            
            # Get top recruiters
            top_recruiters = await conn.fetch(
                f"""
                SELECT
                    r.id,
                    r.recruiter_name,
                    r.company,
                    COUNT(e.id) as emails,
                    COUNT(e.id) FILTER (WHERE e.replied_at IS NOT NULL) as replied
                FROM recruiters r
                LEFT JOIN outreach_emails e ON e.recruiter_id = r.id AND e.user_id = $1
                WHERE e.user_id = $1
                GROUP BY r.id, r.recruiter_name, r.company
                ORDER BY emails DESC
                LIMIT 5
                """,
                user_id
            )
            
            return {
                'total_emails_sent': sent,
                'total_opened': opened,
                'total_replied': replied,
                'total_bounced': bounced,
                'open_rate': (opened / sent * 100) if sent > 0 else 0,
                'reply_rate': (replied / sent * 100) if sent > 0 else 0,
                'bounce_rate': (bounced / sent * 100) if sent > 0 else 0,
                'avg_response_time_hours': float(stats['avg_response_hours']) if stats['avg_response_hours'] else None,
                'timeline': [
                    {
                        'date': r['period'].isoformat(),
                        'emails': r['emails'],
                        'sent': r['sent'],
                        'opened': r['opened'],
                        'replied': r['replied']
                    }
                    for r in timeline
                ],
                'top_campaigns': [dict(r) for r in top_campaigns],
                'top_recruiters': [dict(r) for r in top_recruiters]
            }
    
    async def track_event(
        self,
        user_id: str,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> bool:
        """Track an analytics event."""
        async for conn in get_db():
            await conn.execute(
                """
                INSERT INTO analytics_events (user_id, event_type, event_data)
                VALUES ($1, $2, $3)
                """,
                user_id,
                event_type,
                event_data
            )
            return True

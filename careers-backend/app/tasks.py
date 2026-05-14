"""Celery tasks for background processing."""

import logging
import asyncio
from datetime import datetime, timedelta

from app.celery_app import celery_app
from app.services.campaign_service import CampaignService
from app.services.email_service import EmailService
from app.services.gmail_service import GmailService
from app.services.resume_service import ResumeService
from app.db.connection import get_db

logger = logging.getLogger(__name__)


@celery_app.task(name='app.tasks.parse_resume')
def parse_resume(resume_id: str):
    """
    Background task to parse a resume.
    
    Args:
        resume_id: Resume ID to parse
    """
    logger.info(f"Starting resume parsing for {resume_id}")
    
    try:
        # Run async function in sync context
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Create new loop if one is already running
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        resume_service = ResumeService()
        result = loop.run_until_complete(resume_service.parse_resume(resume_id))
        
        logger.info(f"Resume parsing completed for {resume_id}")
        return {'success': True, 'resume_id': resume_id}
    
    except Exception as e:
        logger.error(f"Resume parsing failed for {resume_id}: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(name='app.tasks.send_email')
def send_email(email_id: str, user_id: str):
    """
    Background task to send an email.
    
    Args:
        email_id: Email ID to send
        user_id: User ID
    """
    logger.info(f"Starting email send for {email_id}")
    
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        async def _send():
            # Get email
            email_service = EmailService()
            email = await email_service.get_email(email_id, user_id)
            
            if not email:
                raise ValueError("Email not found")
            
            # Get recruiter
            async for conn in get_db():
                recruiter = await conn.fetchrow(
                    "SELECT * FROM recruiters WHERE id = $1",
                    email['recruiter_id']
                )
                
                if not recruiter or not recruiter['email']:
                    raise ValueError("Recruiter email not found")
                
                # Send via Gmail
                gmail_service = GmailService()
                result = await gmail_service.send_email(
                    user_id=user_id,
                    to_email=recruiter['email'],
                    subject=email['email_subject'],
                    body=email['email_body']
                )
                
                if result['success']:
                    # Update email status
                    await conn.execute(
                        """
                        UPDATE outreach_emails
                        SET
                            sent_status = 'sent',
                            sent_at = NOW(),
                            gmail_message_id = $1,
                            updated_at = NOW()
                        WHERE id = $2
                        """,
                        result['message_id'],
                        email_id
                    )
                    
                    # Increment campaign count if applicable
                    if email['campaign_id']:
                        campaign_service = CampaignService()
                        await campaign_service.increment_email_count(
                            email['campaign_id'],
                            user_id
                        )
                    
                    return {'success': True, 'message_id': result['message_id']}
                else:
                    # Update with error
                    await conn.execute(
                        """
                        UPDATE outreach_emails
                        SET
                            sent_status = 'failed',
                            error_message = $1,
                            updated_at = NOW()
                        WHERE id = $2
                        """,
                        result['error'],
                        email_id
                    )
                    return {'success': False, 'error': result['error']}
        
        result = loop.run_until_complete(_send())
        logger.info(f"Email send completed for {email_id}")
        return result
    
    except Exception as e:
        logger.error(f"Email send failed for {email_id}: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(name='app.tasks.reset_daily_campaign_limits')
def reset_daily_campaign_limits():
    """
    Reset daily email counts for all campaigns.
    
    This task runs daily at midnight UTC.
    """
    logger.info("Starting daily campaign limit reset")
    
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        campaign_service = CampaignService()
        count = loop.run_until_complete(campaign_service.reset_daily_counts())
        
        logger.info(f"Reset daily limits for {count} campaigns")
        return {'success': True, 'campaigns_reset': count}
    
    except Exception as e:
        logger.error(f"Daily limit reset failed: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(name='app.tasks.process_follow_ups')
def process_follow_ups():
    """
    Process scheduled follow-up emails.
    
    This task runs every 6 hours to check for follow-ups that need to be sent.
    """
    logger.info("Starting follow-up processing")
    
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        async def _process():
            async for conn in get_db():
                # Find follow-ups that are scheduled and not sent
                follow_ups = await conn.fetch(
                    """
                    SELECT f.*, e.user_id
                    FROM followups f
                    JOIN outreach_emails e ON e.id = f.outreach_email_id
                    WHERE f.sent_status = 'pending'
                    AND f.scheduled_at <= NOW()
                    ORDER BY f.scheduled_at
                    LIMIT 100
                    """
                )
                
                sent_count = 0
                for follow_up in follow_ups:
                    try:
                        # Send follow-up
                        gmail_service = GmailService()
                        
                        # Get recruiter email
                        email = await conn.fetchrow(
                            """
                            SELECT r.email
                            FROM outreach_emails e
                            JOIN recruiters r ON r.id = e.recruiter_id
                            WHERE e.id = $1
                            """,
                            follow_up['outreach_email_id']
                        )
                        
                        if not email or not email['email']:
                            continue
                        
                        result = await gmail_service.send_email(
                            user_id=follow_up['user_id'],
                            to_email=email['email'],
                            subject=follow_up['subject'],
                            body=follow_up['body']
                        )
                        
                        if result['success']:
                            await conn.execute(
                                """
                                UPDATE followups
                                SET
                                    sent_status = 'sent',
                                    sent_at = NOW(),
                                    gmail_message_id = $1,
                                    updated_at = NOW()
                                WHERE id = $2
                                """,
                                result['message_id'],
                                follow_up['id']
                            )
                            sent_count += 1
                        else:
                            await conn.execute(
                                """
                                UPDATE followups
                                SET
                                    sent_status = 'failed',
                                    error_message = $1,
                                    updated_at = NOW()
                                WHERE id = $2
                                """,
                                result['error'],
                                follow_up['id']
                            )
                    
                    except Exception as e:
                        logger.error(f"Failed to send follow-up {follow_up['id']}: {e}")
                        continue
                
                return sent_count
        
        count = loop.run_until_complete(_process())
        logger.info(f"Processed {count} follow-ups")
        return {'success': True, 'follow_ups_sent': count}
    
    except Exception as e:
        logger.error(f"Follow-up processing failed: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(name='app.tasks.schedule_follow_up')
def schedule_follow_up(email_id: str, user_id: str, days_delay: int = 3):
    """
    Schedule a follow-up email.
    
    Args:
        email_id: Original email ID
        user_id: User ID
        days_delay: Days to wait before sending follow-up
    """
    logger.info(f"Scheduling follow-up for email {email_id}")
    
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        async def _schedule():
            async for conn in get_db():
                # Check if email was sent and not replied
                email = await conn.fetchrow(
                    """
                    SELECT * FROM outreach_emails
                    WHERE id = $1 AND user_id = $2
                    AND sent_status = 'sent'
                    AND replied_at IS NULL
                    """,
                    email_id,
                    user_id
                )
                
                if not email:
                    return {'success': False, 'reason': 'Email not eligible for follow-up'}
                
                # Check if follow-up already exists
                existing = await conn.fetchrow(
                    "SELECT id FROM followups WHERE outreach_email_id = $1",
                    email_id
                )
                
                if existing:
                    return {'success': False, 'reason': 'Follow-up already scheduled'}
                
                # Create follow-up
                scheduled_at = datetime.now() + timedelta(days=days_delay)
                
                follow_up = await conn.fetchrow(
                    """
                    INSERT INTO followups (
                        user_id,
                        outreach_email_id,
                        subject,
                        body,
                        scheduled_at,
                        sent_status
                    )
                    VALUES ($1, $2, $3, $4, $5, 'pending')
                    RETURNING *
                    """,
                    user_id,
                    email_id,
                    f"Re: {email['email_subject']}",
                    f"Hi,\n\nI wanted to follow up on my previous email. I'm still very interested in opportunities at your company.\n\nBest regards",
                    scheduled_at
                )
                
                return {'success': True, 'follow_up_id': str(follow_up['id'])}
        
        result = loop.run_until_complete(_schedule())
        logger.info(f"Follow-up scheduled for email {email_id}")
        return result
    
    except Exception as e:
        logger.error(f"Follow-up scheduling failed for {email_id}: {e}")
        return {'success': False, 'error': str(e)}

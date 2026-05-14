"""Email service for generating and managing outreach emails."""

import logging
from typing import Dict, Any, List, Optional

from app.db.connection import get_db
from app.services.ai_service import AIService
from app.services.recruiter_service import RecruiterService
from app.services.resume_service import ResumeService

logger = logging.getLogger(__name__)


class EmailService:
    """Service for email generation and management."""
    
    async def generate_cold_email(
        self,
        user_id: str,
        recruiter_id: str,
        resume_id: str,
        recruiter_post_id: Optional[str] = None,
        tone: str = "professional",
        custom_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a personalized cold email using AI.
        
        Args:
            user_id: User ID
            recruiter_id: Recruiter ID
            resume_id: Resume ID
            recruiter_post_id: Optional job post ID
            tone: Email tone (professional, casual, enthusiastic)
            custom_instructions: Optional custom instructions
        
        Returns:
            Generated email with subject, body, and match data
        """
        try:
            # Get recruiter data
            recruiter_service = RecruiterService()
            recruiter = await recruiter_service.get_recruiter(recruiter_id)
            
            if not recruiter:
                raise ValueError("Recruiter not found")
            
            # Get resume data
            resume_service = ResumeService()
            resume = await resume_service.get_resume(resume_id, user_id)
            
            if not resume:
                raise ValueError("Resume not found")
            
            # Get job post data if provided
            job_description = ""
            job_skills = []
            role = recruiter.get('designation', 'the role')
            
            if recruiter_post_id:
                post = await self._get_recruiter_post(recruiter_post_id)
                if post:
                    job_description = post.get('post_content', '')
                    job_skills = post.get('extracted_skills', [])
                    role = post.get('role', role)
            
            # Calculate ATS match if job skills available
            match_data = {}
            if job_skills:
                ai_service = AIService()
                match_data = await ai_service.calculate_ats_match(
                    job_skills=job_skills,
                    candidate_skills=resume.get('extracted_skills', [])
                )
            
            # Generate email
            ai_service = AIService()
            email_data = await ai_service.generate_cold_email(
                recruiter_name=recruiter.get('recruiter_name', 'Hiring Manager'),
                company=recruiter.get('company', 'your company'),
                role=role,
                job_description=job_description or f"Opportunities at {recruiter.get('company', 'your company')}",
                candidate_skills=resume.get('extracted_skills', []),
                candidate_experience=resume.get('extracted_experience', []),
                tone=tone
            )
            
            # Add custom instructions if provided
            if custom_instructions:
                email_data['body'] += f"\n\n{custom_instructions}"
            
            return {
                'success': True,
                'subject': email_data.get('subject'),
                'body': email_data.get('body'),
                'match_percentage': match_data.get('match_percentage', 0),
                'missing_skills': match_data.get('missing_skills', []),
                'match_summary': match_data.get('summary'),
            }
        
        except Exception as e:
            logger.error(f"Failed to generate email: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def create_email_draft(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an email draft in the database."""
        async for conn in get_db():
            result = await conn.fetchrow(
                """
                INSERT INTO outreach_emails (
                    user_id,
                    campaign_id,
                    recruiter_id,
                    recruiter_post_id,
                    resume_id,
                    email_subject,
                    email_body,
                    email_type,
                    match_percentage,
                    missing_skills,
                    match_summary,
                    sent_status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
                RETURNING *
                """,
                user_id,
                data.get('campaign_id'),
                data.get('recruiter_id'),
                data.get('recruiter_post_id'),
                data.get('resume_id'),
                data.get('email_subject'),
                data.get('email_body'),
                data.get('email_type', 'cold_email'),
                data.get('match_percentage', 0),
                data.get('missing_skills', []),
                data.get('match_summary')
            )
            return dict(result)
    
    async def list_emails(
        self,
        user_id: str,
        campaign_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List emails for a user."""
        async for conn in get_db():
            query = "SELECT * FROM outreach_emails WHERE user_id = $1"
            params = [user_id]
            param_idx = 2
            
            if campaign_id:
                query += f" AND campaign_id = ${param_idx}"
                params.append(campaign_id)
                param_idx += 1
            
            if status:
                query += f" AND sent_status = ${param_idx}"
                params.append(status)
                param_idx += 1
            
            query += f" ORDER BY created_at DESC LIMIT ${param_idx} OFFSET ${param_idx + 1}"
            params.extend([limit, offset])
            
            results = await conn.fetch(query, *params)
            return [dict(r) for r in results]
    
    async def get_email(
        self,
        email_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific email."""
        async for conn in get_db():
            result = await conn.fetchrow(
                "SELECT * FROM outreach_emails WHERE id = $1 AND user_id = $2",
                email_id,
                user_id
            )
            return dict(result) if result else None
    
    async def update_email(
        self,
        email_id: str,
        user_id: str,
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update an email draft."""
        if not data:
            return await self.get_email(email_id, user_id)
        
        # Build dynamic UPDATE query
        set_clauses = []
        params = []
        param_idx = 1
        
        for key, value in data.items():
            set_clauses.append(f"{key} = ${param_idx}")
            params.append(value)
            param_idx += 1
        
        params.extend([email_id, user_id])
        
        async for conn in get_db():
            result = await conn.fetchrow(
                f"""
                UPDATE outreach_emails
                SET {', '.join(set_clauses)}, updated_at = NOW()
                WHERE id = ${param_idx} AND user_id = ${param_idx + 1}
                RETURNING *
                """,
                *params
            )
            return dict(result) if result else None
    
    async def delete_email(
        self,
        email_id: str,
        user_id: str
    ) -> bool:
        """Delete an email draft."""
        async for conn in get_db():
            result = await conn.execute(
                "DELETE FROM outreach_emails WHERE id = $1 AND user_id = $2",
                email_id,
                user_id
            )
            return result == "DELETE 1"
    
    async def _get_recruiter_post(self, post_id: str) -> Optional[Dict[str, Any]]:
        """Get recruiter post by ID."""
        async for conn in get_db():
            result = await conn.fetchrow(
                "SELECT * FROM recruiter_posts WHERE id = $1",
                post_id
            )
            return dict(result) if result else None

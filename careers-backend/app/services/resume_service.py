"""Resume service for business logic."""

import logging
from typing import List, Dict, Any
import json

from app.db.connection import get_db
from app.services.pdf_parser import PDFParser
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class ResumeService:
    """Service for managing resumes."""
    
    async def create_resume(
        self,
        user_id: str,
        file_url: str,
        file_name: str,
        file_size: int,
        mime_type: str,
    ) -> Dict[str, Any]:
        """Create a new resume record."""
        async for conn in get_db():
            result = await conn.fetchrow(
                """
                INSERT INTO resumes (
                    user_id, file_url, file_name, file_size, mime_type
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                """,
                user_id, file_url, file_name, file_size, mime_type
            )
            return dict(result)
    
    async def list_resumes(
        self,
        user_id: str,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """List all resumes for a user."""
        async for conn in get_db():
            query = "SELECT * FROM resumes WHERE user_id = $1"
            params = [user_id]
            
            if active_only:
                query += " AND is_active = true"
            
            query += " ORDER BY created_at DESC"
            
            results = await conn.fetch(query, *params)
            return [dict(r) for r in results]
    
    async def get_resume(
        self,
        resume_id: str,
        user_id: str,
    ) -> Dict[str, Any] | None:
        """Get a specific resume."""
        async for conn in get_db():
            result = await conn.fetchrow(
                "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
                resume_id, user_id
            )
            return dict(result) if result else None
    
    async def update_resume(
        self,
        resume_id: str,
        user_id: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any] | None:
        """Update a resume."""
        if not data:
            return await self.get_resume(resume_id, user_id)
        
        # Build dynamic UPDATE query
        set_clauses = []
        params = []
        param_idx = 1
        
        for key, value in data.items():
            set_clauses.append(f"{key} = ${param_idx}")
            params.append(value)
            param_idx += 1
        
        params.extend([resume_id, user_id])
        
        async for conn in get_db():
            result = await conn.fetchrow(
                f"""
                UPDATE resumes
                SET {', '.join(set_clauses)}, updated_at = NOW()
                WHERE id = ${param_idx} AND user_id = ${param_idx + 1}
                RETURNING *
                """,
                *params
            )
            return dict(result) if result else None
    
    async def delete_resume(
        self,
        resume_id: str,
        user_id: str,
    ) -> bool:
        """Soft delete a resume."""
        async for conn in get_db():
            result = await conn.execute(
                """
                UPDATE resumes
                SET is_active = false, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                """,
                resume_id, user_id
            )
            return result == "UPDATE 1"
    
    async def parse_resume(self, resume_id: str) -> Dict[str, Any]:
        """
        Parse a resume and extract structured data.
        
        This uses PDF parsing + AI to extract:
        - Name
        - Skills
        - Projects
        - Education
        - Experience
        """
        # Get resume
        async for conn in get_db():
            resume = await conn.fetchrow(
                "SELECT * FROM resumes WHERE id = $1",
                resume_id
            )
            
            if not resume:
                raise ValueError("Resume not found")
            
            # Parse PDF
            parser = PDFParser()
            raw_text = await parser.extract_text(resume["file_url"])
            
            # Use AI to extract structured data
            ai_service = AIService()
            extracted_data = await ai_service.extract_resume_data(raw_text)
            
            # Update resume with extracted data
            result = await conn.fetchrow(
                """
                UPDATE resumes
                SET
                    raw_text = $1,
                    parsed_name = $2,
                    extracted_skills = $3,
                    extracted_projects = $4,
                    extracted_education = $5,
                    extracted_experience = $6,
                    updated_at = NOW()
                WHERE id = $7
                RETURNING *
                """,
                raw_text,
                extracted_data.get("name"),
                json.dumps(extracted_data.get("skills", [])),
                json.dumps(extracted_data.get("projects", [])),
                json.dumps(extracted_data.get("education", [])),
                json.dumps(extracted_data.get("experience", [])),
                resume_id
            )
            
            return dict(result)
    
    async def parse_resume_async(self, resume_id: str):
        """
        Trigger async resume parsing using Celery.
        
        This is called after upload to avoid blocking the request.
        """
        # TODO: Implement Celery task
        # For now, we'll just log
        logger.info(f"Async parsing triggered for resume {resume_id}")
        # celery_app.send_task("tasks.parse_resume", args=[resume_id])

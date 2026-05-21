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
        - Name, target job title, experience level
        - Skills (all + primary)
        - Projects, Education, Experience
        - ATS score
        """
        # Get resume
        async for conn in get_db():
            resume = await conn.fetchrow(
                "SELECT * FROM resumes WHERE id = $1",
                resume_id
            )

            if not resume:
                raise ValueError("Resume not found")

            # Parse PDF/DOCX
            parser = PDFParser()
            mime = resume.get("mime_type", "application/pdf")
            if "wordprocessingml" in (mime or "") or str(resume.get("file_name", "")).endswith(".docx"):
                raw_text = await parser.extract_text_from_docx(resume["file_url"])
            else:
                raw_text = await parser.extract_text(resume["file_url"])

            # Use AI to extract structured data
            ai_service = AIService()
            extracted_data = await ai_service.extract_resume_data(raw_text)

            # Compute ATS score
            skills = extracted_data.get("skills", [])
            ats_data = await ai_service.compute_ats_score(raw_text, skills)

            # Merge all skills (skills + primary_skills deduplicated)
            all_skills = list(dict.fromkeys(
                extracted_data.get("skills", []) +
                extracted_data.get("primary_skills", [])
            ))

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
                    ats_score = $7,
                    ats_data = $8,
                    target_job_title = $9,
                    experience_level = $10,
                    total_experience_years = $11,
                    updated_at = NOW()
                WHERE id = $12
                RETURNING *
                """,
                raw_text,
                extracted_data.get("name"),
                json.dumps(all_skills),
                json.dumps(extracted_data.get("projects", [])),
                json.dumps(extracted_data.get("education", [])),
                json.dumps(extracted_data.get("experience", [])),
                ats_data.get("ats_score", 0),
                json.dumps(ats_data),
                extracted_data.get("target_job_title", ""),
                extracted_data.get("experience_level", "fresher"),
                extracted_data.get("total_experience_years", 0),
                resume_id
            )

            return dict(result)
    
    async def parse_resume_async(self, resume_id: str):
        """
        Parse resume inline (no Celery on free tier).
        Called after upload.
        """
        try:
            logger.info(f"Starting inline parsing for resume {resume_id}")
            await self.parse_resume(resume_id)
            logger.info(f"Parsing completed for resume {resume_id}")
        except Exception as e:
            logger.error(f"Parsing failed for resume {resume_id}: {e}")

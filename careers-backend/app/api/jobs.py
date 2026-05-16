"""Jobs API routes - Search and match jobs against resume."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.middleware.auth import CurrentUser
from app.services.job_search_service import JobSearchService
from app.services.job_matcher_service import JobMatcherService
from app.db.connection import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


class JobSearchRequest(BaseModel):
    """Request body for job search."""
    resume_id: Optional[str] = None
    keywords: Optional[str] = None
    location: Optional[str] = ""
    experience_years: Optional[int] = 0
    top_n: Optional[int] = 10


class ManualSearchRequest(BaseModel):
    """Request body for manual keyword search."""
    keywords: str
    location: Optional[str] = ""
    experience_years: Optional[int] = 0


@router.post("/search")
async def search_jobs_with_resume(
    data: JobSearchRequest,
    current_user: CurrentUser = None,
):
    """
    Search jobs matched against a resume.
    If resume_id is provided, uses AI to score and rank.
    If only keywords provided, returns keyword-matched results.
    """
    try:
        job_search = JobSearchService()

        # Determine search keywords
        keywords = data.keywords or ""
        location = data.location or ""
        experience = data.experience_years or 0

        resume_data = None

        # If resume_id provided, extract keywords from resume
        if data.resume_id:
            async for conn in get_db():
                resume = await conn.fetchrow(
                    "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
                    data.resume_id,
                    current_user["id"],
                )

                if not resume:
                    raise HTTPException(status_code=404, detail="Resume not found")

                resume_data = {
                    "parsed_skills": resume.get("extracted_skills") or [],
                    "parsed_experience": resume.get("extracted_experience") or [],
                    "parsed_education": resume.get("extracted_education") or [],
                    "parsed_summary": resume.get("raw_text") or "",
                }

                # Parse JSON strings if needed
                import json as json_mod
                for key in ["parsed_skills", "parsed_experience", "parsed_education"]:
                    val = resume_data[key]
                    if isinstance(val, str):
                        try:
                            resume_data[key] = json_mod.loads(val)
                        except (json_mod.JSONDecodeError, TypeError):
                            resume_data[key] = []

                # Build keywords from resume if not provided
                if not keywords:
                    skills = resume_data.get("parsed_skills", [])
                    if isinstance(skills, list) and skills:
                        keywords = " ".join(skills[:5])
                    elif resume_data.get("parsed_summary"):
                        keywords = resume_data["parsed_summary"][:100]
                    else:
                        keywords = "software developer"

        if not keywords:
            raise HTTPException(
                status_code=400,
                detail="Provide either resume_id or keywords",
            )

        # Search all job sources
        all_jobs = await job_search.search_all(
            keywords=keywords,
            location=location,
            experience_years=experience,
            limit=30,
        )

        if not all_jobs:
            return {
                "jobs": [],
                "total_found": 0,
                "keywords_used": keywords,
                "message": "No jobs found. Try different keywords.",
            }

        # If we have resume data, use AI to score and rank
        if resume_data:
            matcher = JobMatcherService()
            matched_jobs = await matcher.match_and_rank(
                resume_data=resume_data,
                jobs=all_jobs,
                top_n=data.top_n or 10,
            )
            return {
                "jobs": matched_jobs,
                "total_found": len(all_jobs),
                "keywords_used": keywords,
                "ai_matched": True,
            }
        else:
            # Return top N without AI scoring
            for job in all_jobs[: data.top_n or 10]:
                job["match_score"] = None
                job["matching_skills"] = []
                job["missing_skills"] = []
                job["why_good_fit"] = ""

            return {
                "jobs": all_jobs[: data.top_n or 10],
                "total_found": len(all_jobs),
                "keywords_used": keywords,
                "ai_matched": False,
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")


@router.post("/save")
async def save_job(
    job_data: dict,
    current_user: CurrentUser = None,
):
    """Save a job to the user's saved jobs list."""
    try:
        async for conn in get_db():
            saved = await conn.fetchrow(
                """
                INSERT INTO saved_jobs (
                    user_id, source, source_job_id, title, company,
                    location, salary, skills, match_score,
                    matching_skills, missing_skills, apply_url, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'saved')
                ON CONFLICT (user_id, source_job_id) DO NOTHING
                RETURNING id
                """,
                current_user["id"],
                job_data.get("source", ""),
                job_data.get("id", ""),
                job_data.get("title", ""),
                job_data.get("company", ""),
                job_data.get("location", ""),
                job_data.get("salary", ""),
                job_data.get("skills"),
                job_data.get("match_score"),
                job_data.get("matching_skills"),
                job_data.get("missing_skills"),
                job_data.get("apply_url", ""),
            )

            if saved:
                return {"success": True, "id": str(saved["id"])}
            else:
                return {"success": True, "message": "Job already saved"}

    except Exception as e:
        logger.error(f"Failed to save job: {e}")
        raise HTTPException(status_code=500, detail="Failed to save job")


@router.get("/saved")
async def get_saved_jobs(
    current_user: CurrentUser = None,
):
    """Get user's saved jobs."""
    try:
        async for conn in get_db():
            jobs = await conn.fetch(
                """
                SELECT * FROM saved_jobs
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 50
                """,
                current_user["id"],
            )
            return [dict(job) for job in jobs]

    except Exception as e:
        logger.error(f"Failed to fetch saved jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch saved jobs")

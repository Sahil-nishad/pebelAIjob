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
    seen_job_ids: Optional[List[str]] = []  # IDs already shown — exclude from results


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
                    "target_job_title": resume.get("target_job_title") or "",
                    "experience_level": resume.get("experience_level") or "fresher",
                    "total_experience_years": float(resume.get("total_experience_years") or 0),
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

                # Use stored experience level (from AI parsing) — more accurate than counting entries
                experience_level = resume_data["experience_level"]
                total_years = resume_data["total_experience_years"]

                # Map to experience years for filtering
                if experience_level == "fresher" or total_years <= 1:
                    experience_level = "fresher"
                    experience = 0
                elif experience_level == "junior" or total_years <= 3:
                    experience_level = "junior"
                    experience = 2
                elif experience_level == "mid" or total_years <= 6:
                    experience_level = "mid"
                    experience = 4
                else:
                    experience_level = "senior"
                    experience = 6

                resume_data["experience_level"] = experience_level

                # Build keywords from resume — prefer stored target_job_title
                if not keywords:
                    target_title = resume_data.get("target_job_title", "").strip()
                    skills = resume_data.get("parsed_skills", [])
                    summary = resume_data.get("parsed_summary", "")

                    if target_title:
                        # Use the AI-extracted job title directly — most accurate
                        keywords = target_title
                    else:
                        # Fallback: scan summary for known job titles
                        job_titles = [
                            "data analyst", "data scientist", "software engineer", "web developer",
                            "frontend developer", "backend developer", "full stack", "devops",
                            "product manager", "ui designer", "ux designer", "machine learning",
                            "python developer", "java developer", "react developer", "analyst",
                            "business analyst", "cloud engineer", "qa engineer", "tester",
                            "android developer", "ios developer", "mobile developer",
                            "data engineer", "ml engineer", "ai engineer", "nlp engineer",
                        ]
                        for title in job_titles:
                            if title in summary.lower():
                                keywords = title
                                break

                        if not keywords and isinstance(skills, list) and skills:
                            # Use top 2 primary skills only
                            keywords = " ".join(skills[:2])
                        elif not keywords:
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

        # Filter out old jobs (>7 days) and mismatched experience levels
        from datetime import datetime, timedelta
        import dateutil.parser as date_parser

        filtered_jobs = []
        seven_days_ago = datetime.now() - timedelta(days=7)

        senior_keywords = ['senior', 'lead', 'principal', 'staff', 'director', 'manager', 'head', 'vp', 'architect', '8+', '10+', '7+', '6+']
        mid_keywords = ['3+', '4+', '5+', '3-5', '4-6']

        # Countries to exclude (non-India)
        india_keywords = ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'noida', 'gurgaon', 'gurugram', 'hyderabad', 'pune', 'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'indore', 'bhopal', 'kochi', 'coimbatore', 'thiruvananthapuram', 'nagpur', 'vadodara', 'surat', 'visakhapatnam', 'patna', 'ranchi', 'guwahati', 'bhubaneswar', 'mysore', 'mangalore', 'trivandrum', 'goa', 'remote']

        for job in all_jobs:
            # Filter by date — skip jobs older than 7 days
            posted = job.get("posted_date", "")
            if posted:
                try:
                    posted_dt = date_parser.parse(posted, ignoretz=True)
                    if posted_dt < seven_days_ago:
                        continue
                except (ValueError, TypeError):
                    pass

            # Only show India jobs or remote jobs
            job_location = job.get("location", "").lower()
            if not job.get("remote", False):
                # If location is empty or generic, keep it
                if job_location and job_location not in ['', 'not specified']:
                    if not any(city in job_location for city in india_keywords):
                        continue

            # Filter by experience level
            if resume_data and resume_data.get("experience_level") == "fresher":
                title_lower = job.get("title", "").lower()
                exp_req = job.get("experience_required", "").lower()
                combined = f"{title_lower} {exp_req}"

                if any(kw in combined for kw in senior_keywords):
                    continue
                if any(kw in combined for kw in mid_keywords):
                    continue

            filtered_jobs.append(job)

        all_jobs = filtered_jobs if filtered_jobs else all_jobs[:15]

        # Exclude already-seen jobs (client sends IDs it has already shown)
        seen_ids = set(data.seen_job_ids or [])
        if seen_ids:
            all_jobs = [j for j in all_jobs if j.get("id") not in seen_ids]
            logger.info(f"After excluding {len(seen_ids)} seen jobs: {len(all_jobs)} remaining")

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

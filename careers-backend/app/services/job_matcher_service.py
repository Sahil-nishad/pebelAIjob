"""AI Job Matcher Service - Scores and ranks jobs against a resume."""

import json
import logging
from typing import List, Dict, Any

from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class JobMatcherService:
    """Uses AI to score and rank jobs against a user's resume."""

    def __init__(self):
        self.ai_service = AIService()

    async def match_and_rank(
        self,
        resume_data: Dict[str, Any],
        jobs: List[Dict[str, Any]],
        top_n: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Score each job against the resume and return top N matches.

        Args:
            resume_data: Parsed resume with skills, experience, etc.
            jobs: List of job listings from aggregator
            top_n: Number of top matches to return

        Returns:
            List of jobs with match_score, matching_skills, missing_skills, why_good_fit
        """
        if not jobs:
            return []

        # Prepare resume summary for the prompt
        skills = resume_data.get("parsed_skills", [])
        experience = resume_data.get("parsed_experience", [])
        education = resume_data.get("parsed_education", [])
        summary = resume_data.get("parsed_summary", "")
        experience_level = resume_data.get("experience_level", "professional")

        # Limit to 30 jobs max for AI processing (cost/speed)
        jobs_to_score = jobs[:30]

        # Build compact job list for the prompt
        jobs_summary = []
        for i, job in enumerate(jobs_to_score):
            jobs_summary.append({
                "index": i,
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "skills": job.get("skills", [])[:10],
                "location": job.get("location", ""),
                "experience": job.get("experience_required", ""),
            })

        prompt = f"""You are a job matching AI. Score each job against this resume.

IMPORTANT: The candidate is a {experience_level} level candidate. Heavily penalize jobs that require significantly more experience than the candidate has. A fresher should NOT be matched with senior/lead roles.

RESUME:
- Skills: {json.dumps(skills[:20] if isinstance(skills, list) else [])}
- Summary: {summary[:500]}
- Experience: {json.dumps(experience[:3] if isinstance(experience, list) else [])}
- Education: {json.dumps(education[:2] if isinstance(education, list) else [])}

JOBS TO SCORE:
{json.dumps(jobs_summary, indent=1)}

For each job, return a JSON array with objects containing:
- "index": the job index number
- "score": 0-100 match score
- "matching_skills": list of skills that match
- "missing_skills": list of important skills the candidate lacks
- "why": one sentence explaining why it's a good/bad fit

Score based on:
- Skill overlap (40% weight)
- Experience level fit (25% weight)
- Role relevance (20% weight)
- Location compatibility (15% weight)

Return ONLY a valid JSON array, sorted by score descending. Top {top_n} only.
Example: [{{"index":0,"score":92,"matching_skills":["Python","SQL"],"missing_skills":["Tableau"],"why":"Strong analytics match"}}]"""

        try:
            response = await self.ai_service.generate_text(prompt)

            # Parse AI response
            # Try to extract JSON from the response
            response_text = response.strip()
            if response_text.startswith("```"):
                # Remove markdown code blocks
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            scored_jobs = json.loads(response_text)

            # Merge scores back into job data
            matched_jobs = []
            for scored in scored_jobs[:top_n]:
                idx = scored.get("index", 0)
                if idx < len(jobs_to_score):
                    job = jobs_to_score[idx].copy()
                    job["match_score"] = scored.get("score", 0)
                    job["matching_skills"] = scored.get("matching_skills", [])
                    job["missing_skills"] = scored.get("missing_skills", [])
                    job["why_good_fit"] = scored.get("why", "")
                    matched_jobs.append(job)

            # Sort by score descending
            matched_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
            return matched_jobs

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            # Fallback: return jobs without scoring
            for job in jobs_to_score[:top_n]:
                job["match_score"] = 50
                job["matching_skills"] = []
                job["missing_skills"] = []
                job["why_good_fit"] = "Unable to score - showing based on keyword match"
            return jobs_to_score[:top_n]

        except Exception as e:
            logger.error(f"Job matching failed: {e}")
            # Return unscored jobs as fallback
            for job in jobs_to_score[:top_n]:
                job["match_score"] = 50
                job["matching_skills"] = []
                job["missing_skills"] = []
                job["why_good_fit"] = "Unable to score"
            return jobs_to_score[:top_n]

"""AI service for resume parsing and job matching."""

import logging
import json
import httpx
from typing import Dict, Any, List

from app.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered features using Gemini or Groq."""

    def __init__(self):
        self.gemini_available = bool(settings.gemini_api_key)
        self.groq_available = bool(settings.groq_api_key)

        if self.gemini_available:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                logger.warning(f"Gemini init failed: {e}")
                self.gemini_available = False

    async def generate_text(self, prompt: str) -> str:
        """Generate text using available AI model (Gemini or Groq)."""
        if self.gemini_available:
            return await self._generate_gemini(prompt)
        elif self.groq_available:
            return await self._generate_groq(prompt)
        else:
            raise ValueError("No AI API key configured (set GEMINI_API_KEY or GROQ_API_KEY)")

    async def _generate_gemini(self, prompt: str) -> str:
        """Generate text using Gemini."""
        try:
            response = self.gemini_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            # Fallback to Groq if available
            if self.groq_available:
                return await self._generate_groq(prompt)
            raise

    async def _generate_groq(self, prompt: str) -> str:
        """Generate text using Groq API (free, fast)."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 4096,
                    },
                )

                if response.status_code != 200:
                    raise ValueError(f"Groq API error: {response.status_code} - {response.text}")

                data = response.json()
                return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise

    async def extract_resume_data(self, resume_text: str) -> Dict[str, Any]:
        """Extract structured data from resume text using AI."""
        prompt = f"""You are an expert resume parser. Extract ALL structured information from this resume with high accuracy.

Return ONLY valid JSON with this exact structure:

{{
  "name": "Full Name or null",
  "target_job_title": "The primary job role this person is targeting (e.g. 'Software Engineer', 'Data Analyst', 'Frontend Developer')",
  "experience_level": "fresher|junior|mid|senior (fresher=0-1yr, junior=1-3yr, mid=3-6yr, senior=6+yr)",
  "total_experience_years": 0,
  "skills": ["skill1", "skill2", "skill3"],
  "primary_skills": ["top 5 most prominent skills"],
  "location": "City, State if mentioned, else null",
  "projects": [{{"title": "Name", "description": "Brief description", "technologies": ["tech1", "tech2"]}}],
  "education": [{{"degree": "B.Tech/MBA/etc", "institution": "University Name", "year": "2020-2024", "gpa": "8.5 or null"}}],
  "experience": [{{"title": "Job Title", "company": "Company Name", "duration": "Jan 2020 - Dec 2022", "years": 2.0, "description": "Key responsibilities"}}],
  "certifications": ["cert1", "cert2"],
  "languages": ["English", "Hindi"],
  "summary": "2-3 sentence professional summary of this candidate"
}}

IMPORTANT RULES:
- Extract ALL skills mentioned anywhere in the resume (technical + soft skills)
- For experience_level: count total years across all jobs. 0 jobs or internships only = fresher
- target_job_title: infer from their most recent role or the overall pattern of their experience
- Be thorough — missing skills means worse job matching

Resume Text (full):
{resume_text[:8000]}

Return ONLY the JSON object. No markdown, no explanation."""

        try:
            result_text = await self.generate_text(prompt)

            # Clean markdown code blocks
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            parsed = json.loads(result_text.strip())

            # Ensure required fields exist with defaults
            parsed.setdefault("name", None)
            parsed.setdefault("target_job_title", "")
            parsed.setdefault("experience_level", "fresher")
            parsed.setdefault("total_experience_years", 0)
            parsed.setdefault("skills", [])
            parsed.setdefault("primary_skills", [])
            parsed.setdefault("location", None)
            parsed.setdefault("projects", [])
            parsed.setdefault("education", [])
            parsed.setdefault("experience", [])
            parsed.setdefault("certifications", [])
            parsed.setdefault("languages", [])
            parsed.setdefault("summary", "")

            return parsed

        except Exception as e:
            logger.error(f"Failed to extract resume data: {e}")
            return {
                "name": None,
                "target_job_title": "",
                "experience_level": "fresher",
                "total_experience_years": 0,
                "skills": [],
                "primary_skills": [],
                "location": None,
                "projects": [],
                "education": [],
                "experience": [],
                "certifications": [],
                "languages": [],
                "summary": "",
            }

    async def compute_ats_score(self, resume_text: str, skills: List[str]) -> Dict[str, Any]:
        """Compute ATS (Applicant Tracking System) score for a resume."""
        prompt = f"""You are an ATS (Applicant Tracking System) expert. Analyze this resume and give it an ATS compatibility score.

Evaluate these criteria:
1. Contact information completeness (name, email, phone, location)
2. Skills section clarity and keyword density
3. Work experience with quantifiable achievements
4. Education section completeness
5. Resume formatting (no tables/columns that confuse ATS, proper section headers)
6. Action verbs usage
7. Keyword optimization

Resume Text:
{resume_text[:5000]}

Return ONLY valid JSON:
{{
  "ats_score": 78,
  "grade": "B+",
  "breakdown": {{
    "contact_info": 90,
    "skills_keywords": 75,
    "experience_quality": 80,
    "education": 85,
    "formatting": 70,
    "action_verbs": 65
  }},
  "top_issues": ["Missing LinkedIn URL", "No quantifiable achievements in experience"],
  "quick_wins": ["Add numbers to achievements (e.g. 'improved performance by 30%')", "Add LinkedIn profile URL"]
}}"""

        try:
            result_text = await self.generate_text(prompt)
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            return json.loads(result_text.strip())
        except Exception as e:
            logger.error(f"ATS score computation failed: {e}")
            return {"ats_score": 0, "grade": "N/A", "breakdown": {}, "top_issues": [], "quick_wins": []}

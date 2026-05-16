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
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')

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
        prompt = f"""Extract structured information from this resume. Return ONLY valid JSON:

{{
  "name": "Full Name",
  "skills": ["skill1", "skill2"],
  "projects": [{{"title": "Name", "description": "Brief", "technologies": ["tech1"]}}],
  "education": [{{"degree": "Degree", "institution": "University", "year": "2020-2024"}}],
  "experience": [{{"title": "Job Title", "company": "Company", "duration": "Jan 2020 - Dec 2022", "description": "Brief"}}]
}}

Resume Text:
{resume_text[:5000]}

Return ONLY the JSON object, no markdown."""

        try:
            result_text = await self.generate_text(prompt)

            # Clean markdown code blocks
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            return json.loads(result_text.strip())

        except Exception as e:
            logger.error(f"Failed to extract resume data: {e}")
            return {
                "name": None,
                "skills": [],
                "projects": [],
                "education": [],
                "experience": [],
            }

"""AI service for resume parsing and email generation."""

import logging
import json
from typing import Dict, Any, List
import google.generativeai as genai
from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered features using Gemini or OpenAI."""
    
    def __init__(self):
        """Initialize AI service with available API keys."""
        self.gemini_available = bool(settings.gemini_api_key)
        self.openai_available = bool(settings.openai_api_key)
        
        if self.gemini_available:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        if self.openai_available:
            self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def extract_resume_data(self, resume_text: str) -> Dict[str, Any]:
        """
        Extract structured data from resume text using AI.
        
        Returns:
            {
                "name": str,
                "skills": List[str],
                "projects": List[Dict],
                "education": List[Dict],
                "experience": List[Dict]
            }
        """
        prompt = f"""
Extract structured information from this resume. Return ONLY valid JSON with this exact structure:

{{
  "name": "Full Name",
  "skills": ["skill1", "skill2", ...],
  "projects": [
    {{
      "title": "Project Name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }}
  ],
  "education": [
    {{
      "degree": "Degree Name",
      "institution": "University/College",
      "year": "2020-2024",
      "gpa": "3.8/4.0"
    }}
  ],
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Dec 2022",
      "description": "Brief description of responsibilities"
    }}
  ]
}}

Resume Text:
{resume_text}

Return ONLY the JSON object, no markdown formatting or explanations.
"""
        
        try:
            if self.gemini_available:
                response = self.gemini_model.generate_content(prompt)
                result_text = response.text.strip()
            elif self.openai_available:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a resume parser. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                )
                result_text = response.choices[0].message.content.strip()
            else:
                raise ValueError("No AI API key configured")
            
            # Clean up markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            
            result_text = result_text.strip()
            
            # Parse JSON
            extracted_data = json.loads(result_text)
            
            return extracted_data
        
        except Exception as e:
            logger.error(f"Failed to extract resume data: {e}")
            # Return empty structure on failure
            return {
                "name": None,
                "skills": [],
                "projects": [],
                "education": [],
                "experience": []
            }
    
    async def generate_cold_email(
        self,
        recruiter_name: str,
        company: str,
        role: str,
        job_description: str,
        candidate_skills: List[str],
        candidate_experience: List[Dict[str, Any]],
        tone: str = "professional",
    ) -> Dict[str, str]:
        """
        Generate a personalized cold email to a recruiter.
        
        Returns:
            {
                "subject": str,
                "body": str
            }
        """
        experience_summary = "\n".join([
            f"- {exp.get('title')} at {exp.get('company')} ({exp.get('duration')})"
            for exp in candidate_experience[:3]  # Top 3 experiences
        ])
        
        skills_str = ", ".join(candidate_skills[:10])  # Top 10 skills
        
        prompt = f"""
Generate a personalized cold email to a recruiter. The tone should be {tone}.

Recruiter: {recruiter_name}
Company: {company}
Role: {role}

Job Description:
{job_description}

Candidate Skills: {skills_str}

Candidate Experience:
{experience_summary}

Generate:
1. A compelling subject line (max 60 characters)
2. A personalized email body (3-4 short paragraphs, max 200 words)

The email should:
- Be concise and respectful of the recruiter's time
- Highlight relevant skills and experience
- Show genuine interest in the role
- Include a clear call-to-action
- Be personalized (not generic)

Return ONLY valid JSON:
{{
  "subject": "...",
  "body": "..."
}}
"""
        
        try:
            if self.gemini_available:
                response = self.gemini_model.generate_content(prompt)
                result_text = response.text.strip()
            elif self.openai_available:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an expert at writing professional cold emails."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                )
                result_text = response.choices[0].message.content.strip()
            else:
                raise ValueError("No AI API key configured")
            
            # Clean up markdown
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            
            result_text = result_text.strip()
            
            # Parse JSON
            email_data = json.loads(result_text)
            
            return {
                "subject": email_data.get("subject", "Interested in the role"),
                "body": email_data.get("body", "")
            }
        
        except Exception as e:
            logger.error(f"Failed to generate email: {e}")
            raise ValueError(f"Failed to generate email: {str(e)}")
    
    async def calculate_ats_match(
        self,
        job_skills: List[str],
        candidate_skills: List[str],
    ) -> Dict[str, Any]:
        """
        Calculate ATS match percentage between job requirements and candidate skills.
        
        Returns:
            {
                "match_percentage": int,
                "missing_skills": List[str],
                "matching_skills": List[str],
                "summary": str
            }
        """
        # Normalize skills (lowercase, strip whitespace)
        job_skills_normalized = [s.lower().strip() for s in job_skills]
        candidate_skills_normalized = [s.lower().strip() for s in candidate_skills]
        
        # Find matches
        matching_skills = []
        for skill in candidate_skills_normalized:
            if skill in job_skills_normalized:
                matching_skills.append(skill)
        
        # Find missing skills
        missing_skills = []
        for skill in job_skills_normalized:
            if skill not in candidate_skills_normalized:
                missing_skills.append(skill)
        
        # Calculate match percentage
        if len(job_skills_normalized) == 0:
            match_percentage = 100
        else:
            match_percentage = int((len(matching_skills) / len(job_skills_normalized)) * 100)
        
        # Generate summary
        if match_percentage >= 80:
            summary = "Excellent match! You have most of the required skills."
        elif match_percentage >= 60:
            summary = "Good match. You have many of the required skills."
        elif match_percentage >= 40:
            summary = "Moderate match. Consider highlighting transferable skills."
        else:
            summary = "Low match. This role may require significant upskilling."
        
        return {
            "match_percentage": match_percentage,
            "missing_skills": missing_skills,
            "matching_skills": matching_skills,
            "summary": summary
        }

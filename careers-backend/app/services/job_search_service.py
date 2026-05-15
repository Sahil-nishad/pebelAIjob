"""Job Search Service - Aggregates jobs from multiple free APIs."""

import asyncio
import httpx
import logging
from typing import List, Dict, Any
from urllib.parse import quote

from app.config import settings

logger = logging.getLogger(__name__)


class JobSearchService:
    """Aggregates job listings from multiple free APIs."""

    async def search_all(
        self,
        keywords: str,
        location: str = "",
        experience_years: int = 0,
        limit: int = 30,
    ) -> List[Dict[str, Any]]:
        """Search all job sources in parallel and return combined results."""
        tasks = [
            self._search_naukri(keywords, location, experience_years, limit),
            self._search_adzuna(keywords, location, limit),
            self._search_remotive(keywords, limit),
        ]

        # Add JSearch if API key is available
        if settings.jsearch_api_key:
            tasks.append(self._search_jsearch(keywords, location, limit))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_jobs = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Job search source failed: {result}")
                continue
            if result:
                all_jobs.extend(result)

        return all_jobs

    async def _search_naukri(
        self, keywords: str, location: str, experience: int, limit: int
    ) -> List[Dict[str, Any]]:
        """Search Naukri.com internal API."""
        try:
            url = "https://www.naukri.com/jobapi/v3/search"
            params = {
                "noOfResults": min(limit, 20),
                "urlType": "search_by_keyword",
                "searchType": "adv",
                "keyword": keywords,
                "pageNo": 1,
                "experience": experience,
            }
            if location:
                params["location"] = location

            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Referer": "https://www.naukri.com/",
                "systemId": "Naukri",
                "appid": "109",
                "gid": "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params, headers=headers)

                if response.status_code != 200:
                    logger.warning(f"Naukri API returned {response.status_code}")
                    return []

                data = response.json()
                jobs = []

                for item in data.get("jobDetails", []):
                    job = {
                        "id": f"naukri_{item.get('jobId', '')}",
                        "source": "naukri",
                        "title": item.get("title", ""),
                        "company": item.get("companyName", ""),
                        "location": item.get("placeholders", [{}])[1].get("label", "") if len(item.get("placeholders", [])) > 1 else "",
                        "salary": item.get("placeholders", [{}])[2].get("label", "") if len(item.get("placeholders", [])) > 2 else "Not disclosed",
                        "experience_required": item.get("placeholders", [{}])[0].get("label", "") if item.get("placeholders") else "",
                        "skills": [tag.get("value", "") for tag in item.get("tagsAndSkills", "").split(",") if tag] if isinstance(item.get("tagsAndSkills"), str) else [],
                        "description": item.get("jobDescription", ""),
                        "apply_url": f"https://www.naukri.com{item.get('jdURL', '')}",
                        "posted_date": item.get("footerPlaceholderLabel", ""),
                        "job_type": item.get("jobType", "full-time"),
                        "remote": "remote" in item.get("title", "").lower() or "remote" in item.get("placeholders", [{}])[1].get("label", "").lower() if len(item.get("placeholders", [])) > 1 else False,
                    }
                    jobs.append(job)

                logger.info(f"Naukri: found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"Naukri search failed: {e}")
            return []

    async def _search_adzuna(
        self, keywords: str, location: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search Adzuna API (free tier: 250 req/day)."""
        if not settings.adzuna_app_id or not settings.adzuna_app_key:
            return []

        try:
            # Default to India
            country = "in"
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            params = {
                "app_id": settings.adzuna_app_id,
                "app_key": settings.adzuna_app_key,
                "results_per_page": min(limit, 20),
                "what": keywords,
                "content-type": "application/json",
            }
            if location:
                params["where"] = location

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)

                if response.status_code != 200:
                    logger.warning(f"Adzuna API returned {response.status_code}")
                    return []

                data = response.json()
                jobs = []

                for item in data.get("results", []):
                    salary_min = item.get("salary_min")
                    salary_max = item.get("salary_max")
                    salary = ""
                    if salary_min and salary_max:
                        salary = f"₹{int(salary_min):,} - ₹{int(salary_max):,}"
                    elif salary_min:
                        salary = f"₹{int(salary_min):,}+"

                    job = {
                        "id": f"adzuna_{item.get('id', '')}",
                        "source": "adzuna",
                        "title": item.get("title", ""),
                        "company": item.get("company", {}).get("display_name", ""),
                        "location": item.get("location", {}).get("display_name", ""),
                        "salary": salary or "Not disclosed",
                        "experience_required": "",
                        "skills": [],
                        "description": item.get("description", ""),
                        "apply_url": item.get("redirect_url", ""),
                        "posted_date": item.get("created", ""),
                        "job_type": item.get("contract_time", "full-time"),
                        "remote": "remote" in item.get("title", "").lower() or "remote" in item.get("description", "").lower(),
                    }
                    jobs.append(job)

                logger.info(f"Adzuna: found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"Adzuna search failed: {e}")
            return []

    async def _search_remotive(
        self, keywords: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search Remotive API (free, unlimited, remote jobs only)."""
        try:
            url = "https://remotive.com/api/remote-jobs"
            params = {"search": keywords, "limit": min(limit, 20)}

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)

                if response.status_code != 200:
                    logger.warning(f"Remotive API returned {response.status_code}")
                    return []

                data = response.json()
                jobs = []

                for item in data.get("jobs", []):
                    job = {
                        "id": f"remotive_{item.get('id', '')}",
                        "source": "remotive",
                        "title": item.get("title", ""),
                        "company": item.get("company_name", ""),
                        "location": item.get("candidate_required_location", "Remote"),
                        "salary": item.get("salary", "Not disclosed") or "Not disclosed",
                        "experience_required": "",
                        "skills": [t.strip() for t in item.get("tags", [])],
                        "description": item.get("description", ""),
                        "apply_url": item.get("url", ""),
                        "posted_date": item.get("publication_date", ""),
                        "job_type": item.get("job_type", "full-time"),
                        "remote": True,
                    }
                    jobs.append(job)

                logger.info(f"Remotive: found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"Remotive search failed: {e}")
            return []

    async def _search_jsearch(
        self, keywords: str, location: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search JSearch API via RapidAPI (free: 500 req/month)."""
        try:
            url = "https://jsearch.p.rapidapi.com/search"
            query = keywords
            if location:
                query += f" in {location}"

            params = {
                "query": query,
                "page": "1",
                "num_pages": "1",
            }
            headers = {
                "X-RapidAPI-Key": settings.jsearch_api_key,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params, headers=headers)

                if response.status_code != 200:
                    logger.warning(f"JSearch API returned {response.status_code}")
                    return []

                data = response.json()
                jobs = []

                for item in data.get("data", []):
                    salary = ""
                    if item.get("job_min_salary") and item.get("job_max_salary"):
                        salary = f"₹{int(item['job_min_salary']):,} - ₹{int(item['job_max_salary']):,}"

                    job = {
                        "id": f"jsearch_{item.get('job_id', '')}",
                        "source": "jsearch",
                        "title": item.get("job_title", ""),
                        "company": item.get("employer_name", ""),
                        "location": f"{item.get('job_city', '')} {item.get('job_state', '')}".strip(),
                        "salary": salary or "Not disclosed",
                        "experience_required": item.get("job_required_experience", {}).get("required_experience_in_months", ""),
                        "skills": item.get("job_required_skills") or [],
                        "description": item.get("job_description", ""),
                        "apply_url": item.get("job_apply_link", ""),
                        "posted_date": item.get("job_posted_at_datetime_utc", ""),
                        "job_type": item.get("job_employment_type", "full-time"),
                        "remote": item.get("job_is_remote", False),
                    }
                    jobs.append(job)

                logger.info(f"JSearch: found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"JSearch search failed: {e}")
            return []

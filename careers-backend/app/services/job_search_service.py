"""Job Search Service - Hybrid approach using multiple free sources."""

import asyncio
import httpx
import logging
import re
from typing import List, Dict, Any
from xml.etree import ElementTree

from app.config import settings

logger = logging.getLogger(__name__)


class JobSearchService:
    """Aggregates job listings from multiple free sources."""

    async def search_all(
        self,
        keywords: str,
        location: str = "",
        experience_years: int = 0,
        limit: int = 30,
    ) -> List[Dict[str, Any]]:
        """Search all job sources in parallel and return combined results."""
        tasks = [
            self._search_indeed_rss(keywords, location, limit),
            self._search_linkedin_rss(keywords, location, limit),
            self._search_remoteok(keywords, limit),
        ]

        # Add Adzuna if keys available
        if settings.adzuna_app_id and settings.adzuna_app_key:
            tasks.append(self._search_adzuna(keywords, location, limit))

        # Add Serper.dev Google Jobs if key available (premium, use sparingly)
        if settings.serper_api_key:
            tasks.append(self._search_google_jobs(keywords, location, limit))

        # Add JSearch if key available
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

        # Deduplicate by title + company
        seen = set()
        unique_jobs = []
        for job in all_jobs:
            key = f"{job.get('title', '').lower().strip()}_{job.get('company', '').lower().strip()}"
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)

        return unique_jobs

    async def _search_indeed_rss(
        self, keywords: str, location: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search Indeed India via RSS feed (free, unlimited)."""
        try:
            query = keywords.replace(' ', '+')
            loc = location.replace(' ', '+') if location else ''
            url = f"https://www.indeed.co.in/rss?q={query}&l={loc}&limit={min(limit, 25)}&sort=date"

            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml',
                })

                if response.status_code != 200:
                    logger.warning(f"Indeed RSS returned {response.status_code}")
                    return []

                # Parse RSS XML
                root = ElementTree.fromstring(response.text)
                jobs = []

                for item in root.findall('.//item'):
                    title_el = item.find('title')
                    link_el = item.find('link')
                    desc_el = item.find('description')
                    pub_date_el = item.find('pubDate')

                    title = title_el.text if title_el is not None else ''
                    link = link_el.text if link_el is not None else ''
                    description = desc_el.text if desc_el is not None else ''
                    pub_date = pub_date_el.text if pub_date_el is not None else ''

                    # Extract company from title (Indeed format: "Job Title - Company")
                    company = ''
                    if ' - ' in title:
                        parts = title.rsplit(' - ', 1)
                        title = parts[0].strip()
                        company = parts[1].strip()

                    # Clean HTML from description
                    clean_desc = re.sub(r'<[^>]+>', '', description or '')

                    job = {
                        "id": f"indeed_{hash(link) % 100000}",
                        "source": "indeed",
                        "title": title,
                        "company": company,
                        "location": location or "India",
                        "salary": "Not disclosed",
                        "experience_required": "",
                        "skills": self._extract_skills(clean_desc),
                        "description": clean_desc[:500],
                        "apply_url": link,
                        "posted_date": pub_date,
                        "job_type": "full-time",
                        "remote": "remote" in title.lower() or "remote" in clean_desc.lower(),
                    }
                    jobs.append(job)

                logger.info(f"Indeed RSS: found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"Indeed RSS search failed: {e}")
            return []

    async def _search_linkedin_rss(
        self, keywords: str, location: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search LinkedIn Jobs via public search page scraping."""
        try:
            query = keywords.replace(' ', '%20')
            loc = location.replace(' ', '%20') if location else 'India'
            url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={query}&location={loc}&start=0&count={min(limit, 25)}"

            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html',
                })

                if response.status_code != 200:
                    logger.warning(f"LinkedIn returned {response.status_code}")
                    return []

                # Parse HTML response — LinkedIn guest API returns job card HTML
                html = response.text
                jobs = []

                # Extract job data using multiple regex patterns
                # Pattern 1: base-search-card format
                titles = re.findall(r'class="base-search-card__title[^"]*"[^>]*>\s*(.*?)\s*</', html, re.DOTALL)
                companies = re.findall(r'class="base-search-card__subtitle[^"]*"[^>]*>.*?>(.*?)</a>', html, re.DOTALL)
                locations = re.findall(r'class="job-search-card__location[^"]*"[^>]*>\s*(.*?)\s*</', html, re.DOTALL)
                links = re.findall(r'href="(https://[a-z]+\.linkedin\.com/jobs/view/[^"?]+)', html)
                dates = re.findall(r'<time[^>]*datetime="([^"]+)"', html)

                # Build jobs from extracted data
                for i in range(min(len(titles), len(links))):
                    title = re.sub(r'<[^>]+>', '', titles[i]).strip() if i < len(titles) else ''
                    company = re.sub(r'<[^>]+>', '', companies[i]).strip() if i < len(companies) else ''
                    job_loc = re.sub(r'<[^>]+>', '', locations[i]).strip() if i < len(locations) else location
                    link = links[i] if i < len(links) else ''
                    posted = dates[i] if i < len(dates) else ''

                    if title and link:
                        job = {
                            "id": f"linkedin_{hash(link) % 100000}",
                            "source": "linkedin",
                            "title": title,
                            "company": company,
                            "location": job_loc,
                            "salary": "Not disclosed",
                            "experience_required": "",
                            "skills": [],
                            "description": "",
                            "apply_url": link,
                            "posted_date": posted,
                            "job_type": "full-time",
                            "remote": "remote" in title.lower(),
                        }
                        jobs.append(job)

                logger.info(f"LinkedIn: found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"LinkedIn search failed: {e}")
            return []

    async def _search_remoteok(
        self, keywords: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search RemoteOK API (free, unlimited, remote jobs only)."""
        try:
            url = "https://remoteok.com/api"

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                })

                if response.status_code != 200:
                    logger.warning(f"RemoteOK API returned {response.status_code}")
                    return []

                data = response.json()
                jobs = []
                keywords_lower = keywords.lower().split()

                # First item is metadata, skip it
                for item in data[1:]:
                    # Filter by keywords
                    item_text = f"{item.get('position', '')} {item.get('company', '')} {' '.join(item.get('tags', []))}".lower()
                    if not any(kw in item_text for kw in keywords_lower):
                        continue

                    job = {
                        "id": f"remoteok_{item.get('id', '')}",
                        "source": "remoteok",
                        "title": item.get("position", ""),
                        "company": item.get("company", ""),
                        "location": item.get("location", "Remote"),
                        "salary": f"${item.get('salary_min', '')}–${item.get('salary_max', '')}" if item.get('salary_min') else "Not disclosed",
                        "experience_required": "",
                        "skills": item.get("tags", [])[:8],
                        "description": re.sub(r'<[^>]+>', '', item.get("description", ""))[:500],
                        "apply_url": item.get("url", f"https://remoteok.com/l/{item.get('id', '')}"),
                        "posted_date": item.get("date", ""),
                        "job_type": "full-time",
                        "remote": True,
                    }
                    jobs.append(job)

                    if len(jobs) >= limit:
                        break

                logger.info(f"RemoteOK: found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"RemoteOK search failed: {e}")
            return []

    async def _search_google_jobs(
        self, keywords: str, location: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search Google Jobs via Serper.dev (2500 free searches)."""
        try:
            url = "https://google.serper.dev/search"
            query = f"{keywords} jobs {location}".strip()

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    url,
                    headers={
                        "X-API-KEY": settings.serper_api_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "q": query,
                        "gl": "in",
                        "hl": "en",
                        "type": "search",
                        "num": min(limit, 20),
                    },
                )

                if response.status_code != 200:
                    logger.warning(f"Serper.dev returned {response.status_code}")
                    return []

                data = response.json()
                jobs = []

                for item in data.get("jobs", []):
                    job = {
                        "id": f"google_{hash(item.get('title', '') + item.get('companyName', '')) % 100000}",
                        "source": "google",
                        "title": item.get("title", ""),
                        "company": item.get("companyName", ""),
                        "location": item.get("location", ""),
                        "salary": item.get("salary", "Not disclosed") or "Not disclosed",
                        "experience_required": "",
                        "skills": item.get("highlights", [])[:8] if item.get("highlights") else [],
                        "description": item.get("snippet", ""),
                        "apply_url": item.get("link", ""),
                        "posted_date": item.get("date", ""),
                        "job_type": item.get("employmentType", "full-time"),
                        "remote": "remote" in item.get("title", "").lower() or "remote" in item.get("location", "").lower(),
                    }
                    jobs.append(job)

                logger.info(f"Google Jobs (Serper): found {len(jobs)} jobs")
                return jobs

        except Exception as e:
            logger.error(f"Google Jobs search failed: {e}")
            return []

    async def _search_adzuna(
        self, keywords: str, location: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search Adzuna API (free tier: 250 req/day)."""
        try:
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
                        "skills": self._extract_skills(item.get("description", "")),
                        "description": item.get("description", "")[:500],
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

    async def _search_jsearch(
        self, keywords: str, location: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search JSearch API via RapidAPI (free: 500 req/month)."""
        try:
            url = "https://jsearch.p.rapidapi.com/search"
            query = f"{keywords} in {location}" if location else keywords

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    url,
                    params={"query": query, "page": "1", "num_pages": "1"},
                    headers={
                        "X-RapidAPI-Key": settings.jsearch_api_key,
                        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
                    },
                )

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
                        "id": f"jsearch_{item.get('job_id', '')[:20]}",
                        "source": "jsearch",
                        "title": item.get("job_title", ""),
                        "company": item.get("employer_name", ""),
                        "location": f"{item.get('job_city', '')} {item.get('job_state', '')}".strip(),
                        "salary": salary or "Not disclosed",
                        "experience_required": "",
                        "skills": item.get("job_required_skills") or [],
                        "description": (item.get("job_description", "") or "")[:500],
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

    def _extract_skills(self, text: str) -> List[str]:
        """Extract common tech skills from job description text."""
        if not text:
            return []

        common_skills = [
            'python', 'java', 'javascript', 'react', 'node', 'sql', 'aws',
            'docker', 'kubernetes', 'git', 'linux', 'html', 'css', 'typescript',
            'mongodb', 'postgresql', 'redis', 'elasticsearch', 'kafka',
            'machine learning', 'deep learning', 'tensorflow', 'pytorch',
            'pandas', 'numpy', 'scikit-learn', 'tableau', 'power bi',
            'excel', 'spark', 'hadoop', 'airflow', 'dbt',
            'angular', 'vue', 'django', 'flask', 'fastapi', 'spring',
            'c++', 'c#', '.net', 'go', 'rust', 'kotlin', 'swift',
            'figma', 'sketch', 'adobe', 'photoshop',
            'agile', 'scrum', 'jira', 'confluence',
            'data analysis', 'data science', 'analytics',
        ]

        text_lower = text.lower()
        found = []
        for skill in common_skills:
            if skill in text_lower and skill not in found:
                found.append(skill)
            if len(found) >= 8:
                break

        return found

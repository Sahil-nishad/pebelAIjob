"""LinkedIn scraper service using Playwright."""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Page, Browser
import re

logger = logging.getLogger(__name__)


class LinkedInScraper:
    """Service for scraping LinkedIn recruiter profiles."""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
    
    async def __aenter__(self):
        """Context manager entry."""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        await self.close()
    
    async def start(self):
        """Start browser instance."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
            ]
        )
        
        # Create context with realistic user agent
        context = await self.browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
        )
        
        self.page = await context.new_page()
        logger.info("Browser started successfully")
    
    async def close(self):
        """Close browser instance."""
        if self.browser:
            await self.browser.close()
            logger.info("Browser closed")
    
    async def search_recruiters(
        self,
        keywords: str,
        location: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for recruiters on LinkedIn.
        
        Args:
            keywords: Search keywords (e.g., "Software Engineer recruiter")
            location: Location filter (optional)
            limit: Maximum number of results
        
        Returns:
            List of recruiter profiles
        """
        if not self.page:
            await self.start()
        
        try:
            # Build search URL
            search_query = f"{keywords} recruiter"
            if location:
                search_query += f" {location}"
            
            # LinkedIn search URL (public profiles)
            search_url = f"https://www.linkedin.com/search/results/people/?keywords={search_query.replace(' ', '%20')}"
            
            logger.info(f"Searching LinkedIn: {search_query}")
            
            # Navigate to search page
            await self.page.goto(search_url, wait_until='networkidle', timeout=30000)
            
            # Wait for results to load
            await asyncio.sleep(2)
            
            # Extract recruiter profiles
            recruiters = await self._extract_search_results(limit)
            
            logger.info(f"Found {len(recruiters)} recruiters")
            return recruiters
        
        except Exception as e:
            logger.error(f"LinkedIn search failed: {e}")
            return []
    
    async def _extract_search_results(self, limit: int) -> List[Dict[str, Any]]:
        """Extract recruiter data from search results."""
        recruiters = []
        
        try:
            # Wait for search results
            await self.page.wait_for_selector('.reusable-search__result-container', timeout=10000)
            
            # Get all result containers
            result_containers = await self.page.query_selector_all('.reusable-search__result-container')
            
            for container in result_containers[:limit]:
                try:
                    recruiter = await self._extract_recruiter_from_container(container)
                    if recruiter:
                        recruiters.append(recruiter)
                        
                        # Add delay to avoid rate limiting
                        await asyncio.sleep(0.5)
                
                except Exception as e:
                    logger.warning(f"Failed to extract recruiter: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Failed to extract search results: {e}")
        
        return recruiters
    
    async def _extract_recruiter_from_container(self, container) -> Optional[Dict[str, Any]]:
        """Extract recruiter data from a search result container."""
        try:
            # Extract name
            name_element = await container.query_selector('.entity-result__title-text a span[aria-hidden="true"]')
            name = await name_element.inner_text() if name_element else None
            
            # Extract LinkedIn URL
            link_element = await container.query_selector('.entity-result__title-text a')
            linkedin_url = await link_element.get_attribute('href') if link_element else None
            
            # Extract current position/title
            title_element = await container.query_selector('.entity-result__primary-subtitle')
            designation = await title_element.inner_text() if title_element else None
            
            # Extract company
            company_element = await container.query_selector('.entity-result__secondary-subtitle')
            company = await company_element.inner_text() if company_element else None
            
            # Extract location
            location_element = await container.query_selector('.entity-result__summary .entity-result__divider + span')
            location = await location_element.inner_text() if location_element else None
            
            # Extract profile image
            img_element = await container.query_selector('img.presence-entity__image')
            profile_image_url = await img_element.get_attribute('src') if img_element else None
            
            if not name or not linkedin_url:
                return None
            
            return {
                'recruiter_name': name.strip(),
                'linkedin_url': linkedin_url.split('?')[0],  # Remove query params
                'designation': designation.strip() if designation else None,
                'company': company.strip() if company else None,
                'location': location.strip() if location else None,
                'profile_image_url': profile_image_url,
                'email': None,  # Will be extracted separately
            }
        
        except Exception as e:
            logger.warning(f"Failed to extract recruiter data: {e}")
            return None
    
    async def extract_email_from_profile(self, linkedin_url: str) -> Optional[str]:
        """
        Extract email from LinkedIn profile (if publicly available).
        
        Note: Most LinkedIn profiles don't show emails publicly.
        This is a placeholder for future implementation.
        """
        try:
            if not self.page:
                await self.start()
            
            # Navigate to profile
            await self.page.goto(linkedin_url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)
            
            # Try to find email in contact info
            # Note: This requires being logged in and having connection
            contact_button = await self.page.query_selector('a[href*="contact-info"]')
            if contact_button:
                await contact_button.click()
                await asyncio.sleep(1)
                
                # Look for email
                email_element = await self.page.query_selector('a[href^="mailto:"]')
                if email_element:
                    email_href = await email_element.get_attribute('href')
                    email = email_href.replace('mailto:', '')
                    return email
            
            return None
        
        except Exception as e:
            logger.warning(f"Failed to extract email: {e}")
            return None
    
    def extract_email_from_text(self, text: str) -> Optional[str]:
        """Extract email address from text using regex."""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(email_pattern, text)
        return matches[0] if matches else None
    
    async def get_recruiter_details(self, linkedin_url: str) -> Dict[str, Any]:
        """
        Get detailed information about a recruiter.
        
        Args:
            linkedin_url: LinkedIn profile URL
        
        Returns:
            Detailed recruiter information
        """
        try:
            if not self.page:
                await self.start()
            
            logger.info(f"Fetching recruiter details: {linkedin_url}")
            
            # Navigate to profile
            await self.page.goto(linkedin_url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)
            
            # Extract name
            name_element = await self.page.query_selector('h1.text-heading-xlarge')
            name = await name_element.inner_text() if name_element else None
            
            # Extract headline/title
            headline_element = await self.page.query_selector('.text-body-medium.break-words')
            headline = await headline_element.inner_text() if headline_element else None
            
            # Extract about section
            about_element = await self.page.query_selector('#about ~ div .inline-show-more-text')
            about = await about_element.inner_text() if about_element else None
            
            # Extract location
            location_element = await self.page.query_selector('.text-body-small.inline.t-black--light.break-words')
            location = await location_element.inner_text() if location_element else None
            
            # Extract follower count
            followers_element = await self.page.query_selector('.pvs-header__subtitle .t-black--light span')
            followers_text = await followers_element.inner_text() if followers_element else None
            followers_count = self._parse_count(followers_text) if followers_text else None
            
            return {
                'recruiter_name': name.strip() if name else None,
                'designation': headline.strip() if headline else None,
                'about': about.strip() if about else None,
                'location': location.strip() if location else None,
                'followers_count': followers_count,
                'linkedin_url': linkedin_url,
            }
        
        except Exception as e:
            logger.error(f"Failed to get recruiter details: {e}")
            return {}
    
    def _parse_count(self, text: str) -> Optional[int]:
        """Parse follower/connection count from text."""
        try:
            # Remove commas and convert to int
            text = text.lower().replace(',', '').strip()
            
            if 'k' in text:
                return int(float(text.replace('k', '')) * 1000)
            elif 'm' in text:
                return int(float(text.replace('m', '')) * 1000000)
            else:
                # Extract first number
                numbers = re.findall(r'\d+', text)
                return int(numbers[0]) if numbers else None
        except:
            return None


# Singleton instance
_scraper_instance: Optional[LinkedInScraper] = None


async def get_scraper() -> LinkedInScraper:
    """Get or create scraper instance."""
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = LinkedInScraper()
        await _scraper_instance.start()
    return _scraper_instance

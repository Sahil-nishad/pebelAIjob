"""Recruiter service for business logic."""

import logging
from typing import List, Dict, Any, Optional
import json

from app.db.connection import get_db
from app.services.linkedin_scraper import LinkedInScraper

logger = logging.getLogger(__name__)


class RecruiterService:
    """Service for managing recruiters."""
    
    async def search_and_store_recruiters(
        self,
        user_id: str,
        keywords: str,
        location: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for recruiters on LinkedIn and store in database.
        
        Args:
            user_id: User ID for tracking
            keywords: Search keywords
            location: Location filter
            limit: Maximum results
        
        Returns:
            List of recruiter profiles
        """
        recruiters = []
        
        try:
            # Search LinkedIn
            async with LinkedInScraper() as scraper:
                search_results = await scraper.search_recruiters(
                    keywords=keywords,
                    location=location,
                    limit=limit
                )
            
            # Store in database
            for result in search_results:
                recruiter = await self.create_or_update_recruiter(result)
                if recruiter:
                    recruiters.append(recruiter)
            
            logger.info(f"Stored {len(recruiters)} recruiters for user {user_id}")
            return recruiters
        
        except Exception as e:
            logger.error(f"Failed to search and store recruiters: {e}")
            raise
    
    async def create_or_update_recruiter(
        self,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create or update a recruiter record.
        
        If a recruiter with the same LinkedIn URL exists, update it.
        Otherwise, create a new record.
        """
        async for conn in get_db():
            # Check if recruiter exists
            existing = await conn.fetchrow(
                "SELECT * FROM recruiters WHERE linkedin_url = $1",
                data.get('linkedin_url')
            )
            
            if existing:
                # Update existing
                result = await conn.fetchrow(
                    """
                    UPDATE recruiters
                    SET
                        recruiter_name = COALESCE($1, recruiter_name),
                        company = COALESCE($2, company),
                        designation = COALESCE($3, designation),
                        profile_image_url = COALESCE($4, profile_image_url),
                        about = COALESCE($5, about),
                        followers_count = COALESCE($6, followers_count),
                        last_scraped_at = NOW(),
                        updated_at = NOW()
                    WHERE linkedin_url = $7
                    RETURNING *
                    """,
                    data.get('recruiter_name'),
                    data.get('company'),
                    data.get('designation'),
                    data.get('profile_image_url'),
                    data.get('about'),
                    data.get('followers_count'),
                    data.get('linkedin_url')
                )
            else:
                # Create new
                result = await conn.fetchrow(
                    """
                    INSERT INTO recruiters (
                        recruiter_name,
                        company,
                        email,
                        linkedin_url,
                        designation,
                        profile_image_url,
                        about,
                        followers_count,
                        last_scraped_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                    RETURNING *
                    """,
                    data.get('recruiter_name'),
                    data.get('company'),
                    data.get('email'),
                    data.get('linkedin_url'),
                    data.get('designation'),
                    data.get('profile_image_url'),
                    data.get('about'),
                    data.get('followers_count')
                )
            
            return dict(result)
    
    async def list_recruiters(
        self,
        limit: int = 50,
        offset: int = 0,
        company: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all recruiters with optional filters."""
        async for conn in get_db():
            query = "SELECT * FROM recruiters WHERE 1=1"
            params = []
            param_idx = 1
            
            if company:
                query += f" AND company ILIKE ${param_idx}"
                params.append(f"%{company}%")
                param_idx += 1
            
            query += f" ORDER BY created_at DESC LIMIT ${param_idx} OFFSET ${param_idx + 1}"
            params.extend([limit, offset])
            
            results = await conn.fetch(query, *params)
            return [dict(r) for r in results]
    
    async def get_recruiter(self, recruiter_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific recruiter by ID."""
        async for conn in get_db():
            result = await conn.fetchrow(
                "SELECT * FROM recruiters WHERE id = $1",
                recruiter_id
            )
            return dict(result) if result else None
    
    async def update_recruiter_email(
        self,
        recruiter_id: str,
        email: str
    ) -> Optional[Dict[str, Any]]:
        """Update recruiter email address."""
        async for conn in get_db():
            result = await conn.fetchrow(
                """
                UPDATE recruiters
                SET email = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING *
                """,
                email,
                recruiter_id
            )
            return dict(result) if result else None
    
    async def get_recruiter_by_linkedin_url(
        self,
        linkedin_url: str
    ) -> Optional[Dict[str, Any]]:
        """Get recruiter by LinkedIn URL."""
        async for conn in get_db():
            result = await conn.fetchrow(
                "SELECT * FROM recruiters WHERE linkedin_url = $1",
                linkedin_url
            )
            return dict(result) if result else None
    
    async def search_recruiters_in_db(
        self,
        query: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search recruiters in database by name or company."""
        async for conn in get_db():
            results = await conn.fetch(
                """
                SELECT * FROM recruiters
                WHERE
                    recruiter_name ILIKE $1 OR
                    company ILIKE $1 OR
                    designation ILIKE $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                f"%{query}%",
                limit
            )
            return [dict(r) for r in results]

"""Database connection management."""

import asyncpg
from typing import AsyncGenerator
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Global connection pool
_pool: asyncpg.Pool | None = None


async def init_db():
    """Initialize database connection pool."""
    global _pool
    
    if _pool is None:
        try:
            _pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=5,
                max_size=20,
                command_timeout=60,
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise


async def close_db():
    """Close database connection pool."""
    global _pool
    
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed")


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """
    Get database connection from pool.
    
    Usage:
        async with get_db() as conn:
            result = await conn.fetch("SELECT * FROM users")
    """
    if _pool is None:
        await init_db()
    
    async with _pool.acquire() as connection:
        yield connection

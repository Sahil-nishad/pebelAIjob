"""Database connection management."""

import asyncpg
from urllib.parse import urlparse
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
            parsed = urlparse(settings.database_url)
            
            logger.info(f"Connecting to DB at {parsed.hostname}:{parsed.port}")

            _pool = await asyncpg.create_pool(
                host=parsed.hostname,
                port=parsed.port or 6543,
                user=parsed.username,
                password=parsed.password,
                database=parsed.path.lstrip('/') or 'postgres',
                min_size=1,
                max_size=5,
                command_timeout=60,
                ssl='require',
            )
            logger.info("Database connection pool initialized successfully")
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
    """Get database connection from pool."""
    if _pool is None:
        await init_db()

    async with _pool.acquire() as connection:
        yield connection

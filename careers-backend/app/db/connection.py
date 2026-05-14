"""Database connection management."""

import asyncpg
from urllib.parse import urlparse, quote
from typing import AsyncGenerator
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Global connection pool
_pool: asyncpg.Pool | None = None


def _build_dsn(database_url: str) -> str:
    """
    Convert a standard postgres:// URL to asyncpg-compatible DSN.

    Supabase pooler uses usernames like postgres.hbtoxufjvldkywlmorun
    which contain a dot. asyncpg requires the username to be percent-encoded
    when passed as a URL string, OR we pass individual kwargs instead.
    """
    parsed = urlparse(database_url)
    # Return as-is if no dot in username (local dev)
    if parsed.username and '.' not in parsed.username:
        return database_url
    # Re-encode the username with the dot percent-encoded
    username = quote(parsed.username or '', safe='')
    password = quote(parsed.password or '', safe='')
    host = parsed.hostname
    port = parsed.port or 5432
    dbname = parsed.path.lstrip('/')
    return f"postgresql://{username}:{password}@{host}:{port}/{dbname}"


async def init_db():
    """Initialize database connection pool."""
    global _pool

    if _pool is None:
        try:
            parsed = urlparse(settings.database_url)
            _pool = await asyncpg.create_pool(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,       # asyncpg accepts raw username with dots
                password=parsed.password,
                database=parsed.path.lstrip('/'),
                min_size=1,
                max_size=10,
                command_timeout=60,
                ssl='require',              # Supabase requires SSL
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
    """Get database connection from pool."""
    if _pool is None:
        await init_db()

    async with _pool.acquire() as connection:
        yield connection

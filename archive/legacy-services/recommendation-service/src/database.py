"""
Database connection and queries for recommendation engine
"""
import os
import asyncpg
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mnbara")


class Database:
    """Database connection manager"""
    
    _pool: Optional[asyncpg.Pool] = None
    
    @classmethod
    async def get_pool(cls) -> asyncpg.Pool:
        """Get or create connection pool"""
        if cls._pool is None:
            try:
                cls._pool = await asyncpg.create_pool(
                    DATABASE_URL,
                    min_size=2,
                    max_size=10,
                    command_timeout=60
                )
                logger.info("Database connection pool created")
            except Exception as e:
                logger.error(f"Failed to create database pool: {e}")
                raise
        return cls._pool
    
    @classmethod
    async def close_pool(cls):
        """Close connection pool"""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
            logger.info("Database connection pool closed")
    
    @classmethod
    @asynccontextmanager
    async def connection(cls):
        """Get a database connection from pool"""
        pool = await cls.get_pool()
        async with pool.acquire() as conn:
            yield conn


async def get_active_products(
    limit: int = 100,
    category_id: Optional[int] = None,
    exclude_ids: List[int] = None
) -> List[Dict[str, Any]]:
    """Fetch active products from database"""
    async with Database.connection() as conn:
        query = """
            SELECT 
                l.id, l.title, l."categoryId" as category_id, 
                c.name as category_name,
                l.price, l.condition, l."sellerId" as seller_id,
                u.rating as seller_rating, l."viewCount" as view_count,
                l.images, l.city, l.country
            FROM "Listing" l
            LEFT JOIN "Category" c ON l."categoryId" = c.id
            LEFT JOIN "User" u ON l."sellerId" = u.id
            WHERE l.status = 'ACTIVE' AND l."isActive" = true
        """
        params = []
        param_idx = 1
        
        if category_id:
            query += f" AND l.\"categoryId\" = ${param_idx}"
            params.append(category_id)
            param_idx += 1
        
        if exclude_ids:
            query += f" AND l.id != ALL(${param_idx})"
            params.append(exclude_ids)
            param_idx += 1
        
        query += f" ORDER BY l.\"viewCount\" DESC, l.\"createdAt\" DESC LIMIT ${param_idx}"
        params.append(limit)
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]


async def get_product_by_id(product_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a single product by ID"""
    async with Database.connection() as conn:
        row = await conn.fetchrow("""
            SELECT 
                l.id, l.title, l."categoryId" as category_id,
                c.name as category_name,
                l.price, l.condition, l."sellerId" as seller_id,
                u.rating as seller_rating, l."viewCount" as view_count,
                l.images, l.city, l.country, l.description
            FROM "Listing" l
            LEFT JOIN "Category" c ON l."categoryId" = c.id
            LEFT JOIN "User" u ON l."sellerId" = u.id
            WHERE l.id = $1
        """, product_id)
        return dict(row) if row else None


async def get_user_interactions(
    user_id: int,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Fetch user's interaction history"""
    async with Database.connection() as conn:
        # Get viewed/purchased products from orders and bids
        rows = await conn.fetch("""
            SELECT DISTINCT l.id as product_id, l."categoryId" as category_id,
                   l.price, 'purchase' as interaction_type
            FROM "Order" o
            JOIN "OrderItem" oi ON o.id = oi."orderId"
            JOIN "Listing" l ON l.title = oi."productName"
            WHERE o."buyerId" = $1
            UNION
            SELECT DISTINCT l.id as product_id, l."categoryId" as category_id,
                   l.price, 'bid' as interaction_type
            FROM "Bid" b
            JOIN "Listing" l ON b."listingId" = l.id
            WHERE b."bidderId" = $1
            LIMIT $2
        """, user_id, limit)
        return [dict(row) for row in rows]


async def get_user_profile(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch user profile for personalization"""
    async with Database.connection() as conn:
        row = await conn.fetchrow("""
            SELECT 
                id, "preferredCategories" as preferred_categories,
                rating
            FROM "User"
            WHERE id = $1
        """, user_id)
        return dict(row) if row else None


async def get_trending_products(
    hours: int = 24,
    category_id: Optional[int] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Get trending products based on recent activity"""
    async with Database.connection() as conn:
        query = """
            SELECT 
                l.id, l.title, l."categoryId" as category_id,
                c.name as category_name,
                l.price, l.condition, l."sellerId" as seller_id,
                l."viewCount" as view_count, l.images,
                COUNT(b.id) as bid_count
            FROM "Listing" l
            LEFT JOIN "Category" c ON l."categoryId" = c.id
            LEFT JOIN "Bid" b ON l.id = b."listingId" 
                AND b."createdAt" > NOW() - INTERVAL '%s hours'
            WHERE l.status = 'ACTIVE' AND l."isActive" = true
        """
        params = [hours]
        
        if category_id:
            query += " AND l.\"categoryId\" = $2"
            params.append(category_id)
        
        query += """
            GROUP BY l.id, c.name
            ORDER BY bid_count DESC, l."viewCount" DESC
            LIMIT $%d
        """ % (len(params) + 1)
        params.append(limit)
        
        # Use format for interval, positional for others
        formatted_query = query % hours
        rows = await conn.fetch(formatted_query.replace('%s hours', f'{hours} hours'), *params[1:])
        return [dict(row) for row in rows]


async def get_similar_products_by_category(
    product_id: int,
    category_id: int,
    price: float,
    limit: int = 10,
    include_same_seller: bool = False,
    seller_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Get similar products in same category with similar price"""
    async with Database.connection() as conn:
        query = """
            SELECT 
                l.id, l.title, l."categoryId" as category_id,
                c.name as category_name,
                l.price, l.condition, l."sellerId" as seller_id,
                u.rating as seller_rating, l."viewCount" as view_count,
                l.images,
                ABS(l.price - $2) as price_diff
            FROM "Listing" l
            LEFT JOIN "Category" c ON l."categoryId" = c.id
            LEFT JOIN "User" u ON l."sellerId" = u.id
            WHERE l.status = 'ACTIVE' 
              AND l."isActive" = true
              AND l."categoryId" = $1
              AND l.id != $3
        """
        params = [category_id, price, product_id]
        
        if not include_same_seller and seller_id:
            query += " AND l.\"sellerId\" != $4"
            params.append(seller_id)
        
        query += f" ORDER BY price_diff ASC, l.\"viewCount\" DESC LIMIT ${len(params) + 1}"
        params.append(limit)
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

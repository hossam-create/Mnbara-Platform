"""
API Routes for Recommendation Engine
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import logging

from src.models import (
    RecommendationRequest, RecommendationResponse, RecommendationType,
    SimilarProductsRequest, TrendingRequest, PersonalizedFeedRequest,
    RecommendedProduct
)
from src.recommendation_engine import recommendation_engine

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/personalized", response_model=RecommendationResponse)
async def get_personalized_recommendations(request: RecommendationRequest):
    """
    Get personalized product recommendations for a user.
    Uses hybrid approach combining collaborative and content-based filtering.
    """
    if not request.user_id:
        raise HTTPException(status_code=400, detail="user_id is required for personalized recommendations")
    
    try:
        recommendations = await recommendation_engine.get_personalized_recommendations(
            user_id=request.user_id,
            limit=request.limit,
            recommendation_type=request.recommendation_type
        )
        
        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=recommendations,
            recommendation_type=request.recommendation_type,
            metadata={"filters_applied": request.filters}
        )
    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")


@router.post("/similar", response_model=RecommendationResponse)
async def get_similar_products(request: SimilarProductsRequest):
    """
    Get products similar to a given product.
    Uses content-based filtering with TF-IDF similarity.
    """
    try:
        recommendations = await recommendation_engine.get_similar_products(
            product_id=request.product_id,
            limit=request.limit,
            include_same_seller=request.include_same_seller
        )
        
        return RecommendationResponse(
            recommendations=recommendations,
            recommendation_type=RecommendationType.SIMILAR,
            metadata={"source_product_id": request.product_id}
        )
    except Exception as e:
        logger.error(f"Error getting similar products: {e}")
        raise HTTPException(status_code=500, detail="Failed to find similar products")


@router.post("/trending", response_model=RecommendationResponse)
async def get_trending_products(request: TrendingRequest):
    """
    Get trending products based on recent activity (bids, views).
    """
    try:
        recommendations = await recommendation_engine.get_trending_products(
            category_id=request.category_id,
            hours=request.time_window_hours,
            limit=request.limit
        )
        
        return RecommendationResponse(
            recommendations=recommendations,
            recommendation_type=RecommendationType.TRENDING,
            metadata={
                "time_window_hours": request.time_window_hours,
                "category_id": request.category_id
            }
        )
    except Exception as e:
        logger.error(f"Error getting trending products: {e}")
        raise HTTPException(status_code=500, detail="Failed to get trending products")


@router.get("/homepage")
async def get_homepage_recommendations(
    user_id: Optional[int] = Query(None, description="User ID for personalized recommendations"),
    limit: int = Query(20, ge=1, le=50, description="Number of recommendations per section")
):
    """
    Get mixed recommendations for homepage display.
    Returns trending, featured, and personalized (if user_id provided) sections.
    """
    try:
        result = await recommendation_engine.get_homepage_recommendations(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "sections": {
                "trending": [r.model_dump() for r in result.get('trending', [])],
                "featured": [r.model_dump() for r in result.get('featured', [])],
                "personalized": [r.model_dump() for r in result.get('personalized', [])] if user_id else []
            }
        }
    except Exception as e:
        logger.error(f"Error getting homepage recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get homepage recommendations")


@router.get("/for-product/{product_id}")
async def get_recommendations_for_product(
    product_id: int,
    limit: int = Query(10, ge=1, le=50),
    include_same_seller: bool = Query(False)
):
    """
    Get product recommendations to show on a product detail page.
    Combines similar products and trending in same category.
    """
    try:
        similar = await recommendation_engine.get_similar_products(
            product_id=product_id,
            limit=limit,
            include_same_seller=include_same_seller
        )
        
        return {
            "status": "success",
            "product_id": product_id,
            "similar_products": [r.model_dump() for r in similar]
        }
    except Exception as e:
        logger.error(f"Error getting product recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get product recommendations")


@router.get("/for-user/{user_id}")
async def get_recommendations_for_user(
    user_id: int,
    limit: int = Query(10, ge=1, le=50),
    recommendation_type: RecommendationType = Query(RecommendationType.HYBRID)
):
    """
    Get personalized recommendations for a specific user.
    Shorthand endpoint for quick access.
    """
    try:
        recommendations = await recommendation_engine.get_personalized_recommendations(
            user_id=user_id,
            limit=limit,
            recommendation_type=recommendation_type
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "recommendation_type": recommendation_type.value,
            "recommendations": [r.model_dump() for r in recommendations]
        }
    except Exception as e:
        logger.error(f"Error getting user recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user recommendations")

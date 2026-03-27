"""
Data models for the recommendation engine
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class RecommendationType(str, Enum):
    COLLABORATIVE = "collaborative"
    CONTENT_BASED = "content_based"
    HYBRID = "hybrid"
    TRENDING = "trending"
    SIMILAR = "similar"


class ProductBase(BaseModel):
    """Base product model for recommendations"""
    id: int
    title: str
    category_id: int
    category_name: Optional[str] = None
    price: float
    condition: str
    seller_id: int
    seller_rating: Optional[float] = None
    view_count: int = 0
    images: List[str] = []
    attributes: Dict[str, Any] = {}


class UserInteraction(BaseModel):
    """User interaction with a product"""
    user_id: int
    product_id: int
    interaction_type: str  # view, click, purchase, bid, wishlist
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_seconds: Optional[int] = None
    metadata: Dict[str, Any] = {}


class UserProfile(BaseModel):
    """User profile for personalization"""
    user_id: int
    preferred_categories: List[int] = []
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    preferred_conditions: List[str] = []
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    interaction_history: List[UserInteraction] = []


class RecommendationRequest(BaseModel):
    """Request for product recommendations"""
    user_id: Optional[int] = None
    product_id: Optional[int] = None  # For similar products
    category_id: Optional[int] = None
    limit: int = Field(default=10, ge=1, le=50)
    recommendation_type: RecommendationType = RecommendationType.HYBRID
    include_reasons: bool = False
    filters: Dict[str, Any] = {}


class RecommendedProduct(BaseModel):
    """A recommended product with score and reason"""
    product: ProductBase
    score: float = Field(ge=0, le=1)
    recommendation_type: RecommendationType
    reason: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Response containing recommendations"""
    user_id: Optional[int] = None
    recommendations: List[RecommendedProduct]
    recommendation_type: RecommendationType
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}


class SimilarProductsRequest(BaseModel):
    """Request for similar products"""
    product_id: int
    limit: int = Field(default=10, ge=1, le=50)
    include_same_seller: bool = False


class TrendingRequest(BaseModel):
    """Request for trending products"""
    category_id: Optional[int] = None
    time_window_hours: int = Field(default=24, ge=1, le=168)
    limit: int = Field(default=10, ge=1, le=50)


class PersonalizedFeedRequest(BaseModel):
    """Request for personalized feed"""
    user_id: int
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)
    include_trending: bool = True
    include_new_arrivals: bool = True

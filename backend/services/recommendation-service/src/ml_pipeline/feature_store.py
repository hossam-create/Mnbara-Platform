"""
Feature Store for ML Features
Manages feature computation, storage, and retrieval for ML models
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import os
import logging
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
import json
import hashlib

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class FeatureDefinition:
    """Definition of a feature"""
    name: str
    dtype: str  # float, int, string, vector
    description: str
    entity_type: str  # user, product, category
    aggregation: Optional[str] = None  # sum, mean, count, last
    window_days: Optional[int] = None
    default_value: Any = None


@dataclass
class FeatureValue:
    """A computed feature value"""
    feature_name: str
    entity_id: str
    value: Any
    computed_at: datetime = field(default_factory=datetime.utcnow)
    version: str = "v1"


class FeatureStore:
    """
    Feature Store for ML model features
    Provides feature computation, caching, and retrieval
    """
    
    def __init__(
        self,
        redis_client=None,
        cache_ttl_hours: int = 24
    ):
        """
        Initialize Feature Store
        
        Args:
            redis_client: Redis client for caching
            cache_ttl_hours: Cache TTL in hours
        """
        self.redis = redis_client
        self.cache_ttl = timedelta(hours=cache_ttl_hours)
        
        # Feature definitions
        self.features: Dict[str, FeatureDefinition] = {}
        
        # In-memory cache (fallback if no Redis)
        self._cache: Dict[str, FeatureValue] = {}
        
        # Feature computation functions
        self._compute_functions: Dict[str, callable] = {}
        
        # Register default features
        self._register_default_features()
        
        logger.info("Feature Store initialized")
    
    def _register_default_features(self) -> None:
        """Register default feature definitions"""
        default_features = [
            FeatureDefinition(
                name="user_purchase_count_30d",
                dtype="int",
                description="Number of purchases in last 30 days",
                entity_type="user",
                aggregation="count",
                window_days=30,
                default_value=0
            ),
            FeatureDefinition(
                name="user_avg_order_value",
                dtype="float",
                description="Average order value",
                entity_type="user",
                aggregation="mean",
                default_value=0.0
            ),
            FeatureDefinition(
                name="user_category_preferences",
                dtype="vector",
                description="User's category preference vector",
                entity_type="user",
                default_value=[]
            ),
            FeatureDefinition(
                name="user_click_rate_7d",
                dtype="float",
                description="Click-through rate in last 7 days",
                entity_type="user",
                aggregation="mean",
                window_days=7,
                default_value=0.0
            ),
            FeatureDefinition(
                name="product_view_count_7d",
                dtype="int",
                description="Product views in last 7 days",
                entity_type="product",
                aggregation="count",
                window_days=7,
                default_value=0
            ),
            FeatureDefinition(
                name="product_conversion_rate",
                dtype="float",
                description="Product conversion rate",
                entity_type="product",
                aggregation="mean",
                default_value=0.0
            ),
            FeatureDefinition(
                name="product_avg_rating",
                dtype="float",
                description="Average product rating",
                entity_type="product",
                aggregation="mean",
                default_value=0.0
            ),
            FeatureDefinition(
                name="category_popularity_score",
                dtype="float",
                description="Category popularity score",
                entity_type="category",
                default_value=0.5
            ),
        ]
        
        for feature in default_features:
            self.register_feature(feature)
    
    def register_feature(self, definition: FeatureDefinition) -> None:
        """Register a feature definition"""
        self.features[definition.name] = definition
        logger.debug(f"Registered feature: {definition.name}")
    
    def register_compute_function(
        self,
        feature_name: str,
        compute_fn: callable
    ) -> None:
        """Register a computation function for a feature"""
        self._compute_functions[feature_name] = compute_fn
    
    def _get_cache_key(
        self,
        feature_name: str,
        entity_id: str
    ) -> str:
        """Generate cache key for a feature value"""
        return f"feature:{feature_name}:{entity_id}"
    
    async def get_feature(
        self,
        feature_name: str,
        entity_id: str,
        compute_if_missing: bool = True
    ) -> Optional[FeatureValue]:
        """
        Get a feature value
        
        Args:
            feature_name: Name of the feature
            entity_id: Entity ID (user_id, product_id, etc.)
            compute_if_missing: Whether to compute if not cached
        
        Returns:
            FeatureValue or None
        """
        cache_key = self._get_cache_key(feature_name, entity_id)
        
        # Check cache
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            if datetime.utcnow() - cached.computed_at < self.cache_ttl:
                return cached
        
        # Check Redis if available
        if self.redis:
            try:
                cached_data = await self.redis.get(cache_key)
                if cached_data:
                    data = json.loads(cached_data)
                    return FeatureValue(
                        feature_name=data["feature_name"],
                        entity_id=data["entity_id"],
                        value=data["value"],
                        computed_at=datetime.fromisoformat(data["computed_at"]),
                        version=data.get("version", "v1")
                    )
            except Exception as e:
                logger.warning(f"Redis get error: {e}")
        
        # Compute if missing
        if compute_if_missing and feature_name in self._compute_functions:
            value = await self._compute_functions[feature_name](entity_id)
            feature_value = FeatureValue(
                feature_name=feature_name,
                entity_id=entity_id,
                value=value
            )
            await self.set_feature(feature_value)
            return feature_value
        
        # Return default value
        definition = self.features.get(feature_name)
        if definition:
            return FeatureValue(
                feature_name=feature_name,
                entity_id=entity_id,
                value=definition.default_value
            )
        
        return None
    
    async def set_feature(self, feature_value: FeatureValue) -> None:
        """Set a feature value in the store"""
        cache_key = self._get_cache_key(
            feature_value.feature_name,
            feature_value.entity_id
        )
        
        # Update in-memory cache
        self._cache[cache_key] = feature_value
        
        # Update Redis if available
        if self.redis:
            try:
                data = {
                    "feature_name": feature_value.feature_name,
                    "entity_id": feature_value.entity_id,
                    "value": feature_value.value,
                    "computed_at": feature_value.computed_at.isoformat(),
                    "version": feature_value.version
                }
                await self.redis.setex(
                    cache_key,
                    int(self.cache_ttl.total_seconds()),
                    json.dumps(data)
                )
            except Exception as e:
                logger.warning(f"Redis set error: {e}")
    
    async def get_features_for_entity(
        self,
        entity_type: str,
        entity_id: str,
        feature_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get all features for an entity
        
        Args:
            entity_type: Type of entity (user, product, category)
            entity_id: Entity ID
            feature_names: Optional list of specific features
        
        Returns:
            Dict of feature name to value
        """
        if feature_names is None:
            feature_names = [
                name for name, defn in self.features.items()
                if defn.entity_type == entity_type
            ]
        
        result = {}
        for name in feature_names:
            feature_value = await self.get_feature(name, entity_id)
            if feature_value:
                result[name] = feature_value.value
        
        return result
    
    async def get_feature_vector(
        self,
        entity_type: str,
        entity_id: str,
        feature_names: List[str]
    ) -> np.ndarray:
        """
        Get features as a numpy vector
        
        Args:
            entity_type: Type of entity
            entity_id: Entity ID
            feature_names: Ordered list of feature names
        
        Returns:
            Numpy array of feature values
        """
        features = await self.get_features_for_entity(
            entity_type, entity_id, feature_names
        )
        
        vector = []
        for name in feature_names:
            value = features.get(name, 0.0)
            if isinstance(value, (list, np.ndarray)):
                vector.extend(value)
            else:
                vector.append(float(value) if value is not None else 0.0)
        
        return np.array(vector)
    
    async def batch_get_features(
        self,
        entity_type: str,
        entity_ids: List[str],
        feature_names: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Batch get features for multiple entities
        
        Args:
            entity_type: Type of entity
            entity_ids: List of entity IDs
            feature_names: List of feature names
        
        Returns:
            Dict of entity_id to feature dict
        """
        result = {}
        for entity_id in entity_ids:
            result[entity_id] = await self.get_features_for_entity(
                entity_type, entity_id, feature_names
            )
        return result
    
    def get_feature_schema(self) -> Dict[str, Any]:
        """Get schema of all registered features"""
        return {
            name: {
                "dtype": defn.dtype,
                "description": defn.description,
                "entity_type": defn.entity_type,
                "aggregation": defn.aggregation,
                "window_days": defn.window_days
            }
            for name, defn in self.features.items()
        }


# Global instance
feature_store = FeatureStore()

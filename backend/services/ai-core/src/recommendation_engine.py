"""
AI Recommendation Engine with Collaborative Filtering and Content-Based Recommendations
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import logging
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

from src.models import (
    ProductBase, RecommendedProduct, RecommendationType,
    UserInteraction, UserProfile
)
from src import database

logger = logging.getLogger(__name__)


class CollaborativeFilter:
    """
    Collaborative filtering using user-item interaction matrix
    Implements item-based collaborative filtering
    """
    
    def __init__(self):
        self.user_item_matrix: Dict[int, Dict[int, float]] = defaultdict(dict)
        self.item_similarity: Dict[int, Dict[int, float]] = {}
        self.item_users: Dict[int, set] = defaultdict(set)
    
    def add_interaction(self, user_id: int, item_id: int, weight: float = 1.0):
        """Add a user-item interaction"""
        self.user_item_matrix[user_id][item_id] = weight
        self.item_users[item_id].add(user_id)
    
    def build_from_interactions(self, interactions: List[Dict[str, Any]]):
        """Build matrix from interaction history"""
        # Weight by interaction type
        weights = {
            'purchase': 5.0,
            'bid': 4.0,
            'wishlist': 3.0,
            'click': 2.0,
            'view': 1.0
        }
        
        for interaction in interactions:
            user_id = interaction.get('user_id')
            product_id = interaction.get('product_id')
            interaction_type = interaction.get('interaction_type', 'view')
            weight = weights.get(interaction_type, 1.0)
            
            if user_id and product_id:
                self.add_interaction(user_id, product_id, weight)
    
    def compute_item_similarity(self, item_id: int, top_k: int = 20) -> Dict[int, float]:
        """Compute similarity between items using co-occurrence"""
        if item_id in self.item_similarity:
            return self.item_similarity[item_id]
        
        users_who_liked = self.item_users.get(item_id, set())
        if not users_who_liked:
            return {}
        
        similarity_scores = {}
        
        for other_item, other_users in self.item_users.items():
            if other_item == item_id:
                continue
            
            # Jaccard similarity
            intersection = len(users_who_liked & other_users)
            union = len(users_who_liked | other_users)
            
            if union > 0:
                similarity = intersection / union
                if similarity > 0:
                    similarity_scores[other_item] = similarity
        
        # Keep top K similar items
        sorted_items = sorted(similarity_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        self.item_similarity[item_id] = dict(sorted_items)
        
        return self.item_similarity[item_id]
    
    def recommend_for_user(self, user_id: int, limit: int = 10) -> List[Tuple[int, float]]:
        """Get recommendations for a user based on their history"""
        user_items = self.user_item_matrix.get(user_id, {})
        if not user_items:
            return []
        
        candidate_scores = defaultdict(float)
        
        for item_id, user_weight in user_items.items():
            similar_items = self.compute_item_similarity(item_id)
            
            for similar_id, similarity in similar_items.items():
                if similar_id not in user_items:  # Don't recommend already interacted items
                    candidate_scores[similar_id] += user_weight * similarity
        
        # Sort by score and return top items
        sorted_candidates = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_candidates[:limit]


class ContentBasedFilter:
    """
    Content-based filtering using product attributes
    Uses TF-IDF for text similarity
    """
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.product_vectors = None
        self.product_ids: List[int] = []
        self.product_data: Dict[int, Dict[str, Any]] = {}
    
    def _create_product_text(self, product: Dict[str, Any]) -> str:
        """Create text representation of product for TF-IDF"""
        parts = [
            product.get('title', ''),
            product.get('category_name', ''),
            product.get('condition', ''),
            product.get('description', ''),
        ]
        
        # Add attributes
        attributes = product.get('attributes', {})
        if isinstance(attributes, dict):
            parts.extend(str(v) for v in attributes.values())
        
        return ' '.join(filter(None, parts)).lower()
    
    def fit(self, products: List[Dict[str, Any]]):
        """Fit the vectorizer on product data"""
        if not products:
            return
        
        self.product_ids = [p['id'] for p in products]
        self.product_data = {p['id']: p for p in products}
        
        texts = [self._create_product_text(p) for p in products]
        
        try:
            self.product_vectors = self.vectorizer.fit_transform(texts)
            logger.info(f"Content-based filter fitted on {len(products)} products")
        except Exception as e:
            logger.error(f"Error fitting content-based filter: {e}")
            self.product_vectors = None
    
    def get_similar_products(
        self, 
        product_id: int, 
        limit: int = 10,
        exclude_same_seller: bool = True
    ) -> List[Tuple[int, float]]:
        """Find similar products based on content"""
        if self.product_vectors is None or product_id not in self.product_data:
            return []
        
        try:
            idx = self.product_ids.index(product_id)
        except ValueError:
            return []
        
        product_vector = self.product_vectors[idx]
        similarities = cosine_similarity(product_vector, self.product_vectors).flatten()
        
        # Get product's seller for exclusion
        source_seller = self.product_data[product_id].get('seller_id')
        
        # Create list of (product_id, similarity) excluding self
        results = []
        for i, sim in enumerate(similarities):
            pid = self.product_ids[i]
            if pid == product_id:
                continue
            
            if exclude_same_seller and source_seller:
                if self.product_data[pid].get('seller_id') == source_seller:
                    continue
            
            results.append((pid, float(sim)))
        
        # Sort by similarity
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:limit]
    
    def recommend_for_profile(
        self,
        preferred_categories: List[int],
        price_range: Tuple[Optional[float], Optional[float]] = (None, None),
        limit: int = 10
    ) -> List[Tuple[int, float]]:
        """Recommend products based on user profile preferences"""
        if not self.product_data:
            return []
        
        candidates = []
        min_price, max_price = price_range
        
        for pid, product in self.product_data.items():
            score = 0.0
            
            # Category match
            if product.get('category_id') in preferred_categories:
                score += 0.5
            
            # Price range match
            price = product.get('price', 0)
            if min_price is not None and max_price is not None:
                if min_price <= price <= max_price:
                    score += 0.3
            
            # Popularity boost
            view_count = product.get('view_count', 0)
            score += min(0.2, view_count / 10000)
            
            if score > 0:
                candidates.append((pid, score))
        
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:limit]


class RecommendationEngine:
    """
    Main recommendation engine combining collaborative and content-based filtering
    """
    
    def __init__(self):
        self.collaborative = CollaborativeFilter()
        self.content_based = ContentBasedFilter()
        self._initialized = False
    
    async def initialize(self):
        """Initialize the engine with data from database"""
        if self._initialized:
            return
        
        try:
            # Load products for content-based filtering
            products = await database.get_active_products(limit=1000)
            self.content_based.fit(products)
            
            self._initialized = True
            logger.info("Recommendation engine initialized")
        except Exception as e:
            logger.error(f"Failed to initialize recommendation engine: {e}")
    
    async def get_personalized_recommendations(
        self,
        user_id: int,
        limit: int = 10,
        recommendation_type: RecommendationType = RecommendationType.HYBRID
    ) -> List[RecommendedProduct]:
        """Get personalized recommendations for a user"""
        await self.initialize()
        
        recommendations = []
        
        # Get user profile and interactions
        user_profile = await database.get_user_profile(user_id)
        user_interactions = await database.get_user_interactions(user_id)
        
        # Build collaborative filter from user's interactions
        self.collaborative.build_from_interactions(user_interactions)
        
        if recommendation_type in [RecommendationType.COLLABORATIVE, RecommendationType.HYBRID]:
            # Get collaborative recommendations
            collab_recs = self.collaborative.recommend_for_user(user_id, limit)
            
            for product_id, score in collab_recs:
                product_data = await database.get_product_by_id(product_id)
                if product_data:
                    recommendations.append(
                        RecommendedProduct(
                            product=ProductBase(**self._normalize_product(product_data)),
                            score=min(1.0, score / 5.0),  # Normalize score
                            recommendation_type=RecommendationType.COLLABORATIVE,
                            reason="Based on your purchase and browsing history"
                        )
                    )
        
        if recommendation_type in [RecommendationType.CONTENT_BASED, RecommendationType.HYBRID]:
            # Get content-based recommendations from profile
            if user_profile:
                preferred_cats = user_profile.get('preferred_categories', []) or []
                content_recs = self.content_based.recommend_for_profile(
                    preferred_categories=preferred_cats,
                    limit=limit
                )
                
                for product_id, score in content_recs:
                    # Avoid duplicates
                    if any(r.product.id == product_id for r in recommendations):
                        continue
                    
                    product_data = await database.get_product_by_id(product_id)
                    if product_data:
                        recommendations.append(
                            RecommendedProduct(
                                product=ProductBase(**self._normalize_product(product_data)),
                                score=score,
                                recommendation_type=RecommendationType.CONTENT_BASED,
                                reason="Matches your preferences"
                            )
                        )
        
        # Sort by score and limit
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:limit]
    
    async def get_similar_products(
        self,
        product_id: int,
        limit: int = 10,
        include_same_seller: bool = False
    ) -> List[RecommendedProduct]:
        """Get products similar to a given product"""
        await self.initialize()
        
        recommendations = []
        
        # Get source product
        source_product = await database.get_product_by_id(product_id)
        if not source_product:
            return []
        
        # Content-based similarity
        content_similar = self.content_based.get_similar_products(
            product_id, 
            limit=limit,
            exclude_same_seller=not include_same_seller
        )
        
        for pid, score in content_similar:
            product_data = await database.get_product_by_id(pid)
            if product_data:
                recommendations.append(
                    RecommendedProduct(
                        product=ProductBase(**self._normalize_product(product_data)),
                        score=score,
                        recommendation_type=RecommendationType.SIMILAR,
                        reason=f"Similar to {source_product.get('title', 'this product')}"
                    )
                )
        
        # Also get category-based similar products from DB
        if len(recommendations) < limit:
            db_similar = await database.get_similar_products_by_category(
                product_id=product_id,
                category_id=source_product.get('category_id'),
                price=source_product.get('price', 0),
                limit=limit - len(recommendations),
                include_same_seller=include_same_seller,
                seller_id=source_product.get('seller_id')
            )
            
            existing_ids = {r.product.id for r in recommendations}
            for product_data in db_similar:
                if product_data['id'] not in existing_ids:
                    recommendations.append(
                        RecommendedProduct(
                            product=ProductBase(**self._normalize_product(product_data)),
                            score=0.5,  # Default score for DB-based
                            recommendation_type=RecommendationType.SIMILAR,
                            reason="Similar category and price range"
                        )
                    )
        
        return recommendations[:limit]
    
    async def get_trending_products(
        self,
        category_id: Optional[int] = None,
        hours: int = 24,
        limit: int = 10
    ) -> List[RecommendedProduct]:
        """Get trending products"""
        await self.initialize()
        
        trending = await database.get_trending_products(
            hours=hours,
            category_id=category_id,
            limit=limit
        )
        
        recommendations = []
        max_bids = max((p.get('bid_count', 0) for p in trending), default=1) or 1
        
        for product_data in trending:
            bid_count = product_data.get('bid_count', 0)
            score = min(1.0, bid_count / max_bids) if max_bids > 0 else 0.5
            
            recommendations.append(
                RecommendedProduct(
                    product=ProductBase(**self._normalize_product(product_data)),
                    score=score,
                    recommendation_type=RecommendationType.TRENDING,
                    reason=f"Trending with {bid_count} recent bids"
                )
            )
        
        return recommendations
    
    async def get_homepage_recommendations(
        self,
        user_id: Optional[int] = None,
        limit: int = 20
    ) -> Dict[str, List[RecommendedProduct]]:
        """Get mixed recommendations for homepage"""
        await self.initialize()
        
        result = {
            'trending': await self.get_trending_products(limit=limit // 2),
            'featured': []
        }
        
        if user_id:
            result['personalized'] = await self.get_personalized_recommendations(
                user_id=user_id,
                limit=limit // 2,
                recommendation_type=RecommendationType.HYBRID
            )
        
        # Get featured/new arrivals
        featured = await database.get_active_products(limit=limit // 2)
        for product_data in featured:
            result['featured'].append(
                RecommendedProduct(
                    product=ProductBase(**self._normalize_product(product_data)),
                    score=0.7,
                    recommendation_type=RecommendationType.CONTENT_BASED,
                    reason="Featured listing"
                )
            )
        
        return result
    
    def _normalize_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize product data to match ProductBase model"""
        return {
            'id': product_data.get('id', 0),
            'title': product_data.get('title', ''),
            'category_id': product_data.get('category_id', 0),
            'category_name': product_data.get('category_name'),
            'price': float(product_data.get('price', 0)),
            'condition': product_data.get('condition', 'unknown'),
            'seller_id': product_data.get('seller_id', 0),
            'seller_rating': product_data.get('seller_rating'),
            'view_count': product_data.get('view_count', 0),
            'images': product_data.get('images', []) or [],
            'attributes': product_data.get('attributes', {}) or {}
        }


# Global engine instance
recommendation_engine = RecommendationEngine()

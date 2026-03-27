"""
Logic module for traveler event processing
Requirements: 13.1, 13.2 - Camera/mic event handling and matching

This module provides:
- Geo-spatial matching using Haversine formula
- Object detection matching against travel requests
- Keyword extraction and matching
"""
import math
import re
from typing import List, Dict, Optional, Tuple
from datetime import datetime

# Sample Request Data (In-Memory Database for Demo)
# Distributed across key regions relevant to Mnbara (MENA + Global Hubs)
SAMPLE_REQUESTS = [
    {"id": "req_001", "item_name": "iPhone 15 Pro", "location_name": "Dubai Mall", "lat": 25.1972, "lon": 55.2744, "reward": 150, "category": "electronics", "keywords": ["iphone", "apple", "phone", "smartphone"]},
    {"id": "req_002", "item_name": "PlayStation 5", "location_name": "Riyadh Park", "lat": 24.7555, "lon": 46.6293, "reward": 120, "category": "electronics", "keywords": ["playstation", "ps5", "sony", "gaming", "console"]},
    {"id": "req_003", "item_name": "MacBook Air M3", "location_name": "Cairo Festival City", "lat": 30.0310, "lon": 31.4085, "reward": 200, "category": "electronics", "keywords": ["macbook", "apple", "laptop", "mac"]},
    {"id": "req_004", "item_name": "Zara Jacket", "location_name": "London Oxford Street", "lat": 51.5145, "lon": -0.1445, "reward": 50, "category": "fashion", "keywords": ["zara", "jacket", "coat", "clothing"]},
    {"id": "req_005", "item_name": "Sephora Makeup Kit", "location_name": "Paris Champs-Elysees", "lat": 48.8698, "lon": 2.3078, "reward": 60, "category": "beauty", "keywords": ["sephora", "makeup", "cosmetics", "beauty"]},
    {"id": "req_006", "item_name": "Nike Air Jordan", "location_name": "New York Times Square", "lat": 40.7580, "lon": -73.9855, "reward": 80, "category": "fashion", "keywords": ["nike", "jordan", "shoes", "sneakers", "footwear"]},
    {"id": "req_007", "item_name": "Turkish Coffee Set", "location_name": "Istanbul Grand Bazaar", "lat": 41.0102, "lon": 28.9680, "reward": 40, "category": "home", "keywords": ["coffee", "turkish", "set", "kitchenware"]},
    {"id": "req_008", "item_name": "Vitamins & Supplements", "location_name": "Los Angeles Santa Monica", "lat": 34.0195, "lon": -118.4912, "reward": 55, "category": "health", "keywords": ["vitamins", "supplements", "health", "nutrition"]},
    {"id": "req_009", "item_name": "Samsung Galaxy S24", "location_name": "Seoul Gangnam", "lat": 37.4979, "lon": 127.0276, "reward": 130, "category": "electronics", "keywords": ["samsung", "galaxy", "phone", "android"]},
    {"id": "req_010", "item_name": "Gucci Handbag", "location_name": "Milan Via Montenapoleone", "lat": 45.4685, "lon": 9.1954, "reward": 250, "category": "fashion", "keywords": ["gucci", "bag", "handbag", "luxury"]},
]

# Category synonyms for better matching
CATEGORY_SYNONYMS = {
    "electronics": ["tech", "gadgets", "devices", "electronic"],
    "fashion": ["clothing", "apparel", "clothes", "wear"],
    "beauty": ["cosmetics", "makeup", "skincare"],
    "health": ["wellness", "medical", "pharmacy"],
    "home": ["household", "kitchen", "decor"]
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers.
    """
    R = 6371  # Radius of earth in km
    
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(d_lat / 2) * math.sin(d_lat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) * math.sin(d_lon / 2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = R * c
    
    return d


def find_nearby_requests(
    lat: float, 
    lon: float, 
    radius_km: float = 50.0,
    category: Optional[str] = None,
    limit: int = 20
) -> List[Dict]:
    """
    Find requests within a certain radius of the traveler.
    
    Args:
        lat: Latitude of traveler
        lon: Longitude of traveler
        radius_km: Search radius in kilometers
        category: Optional category filter
        limit: Maximum number of results
    
    Returns:
        List of nearby requests sorted by distance
    """
    nearby = []
    for req in SAMPLE_REQUESTS:
        # Category filter
        if category and req.get("category") != category:
            continue
            
        dist = haversine_distance(lat, lon, req["lat"], req["lon"])
        if dist <= radius_km:
            req_with_dist = req.copy()
            req_with_dist["distance_km"] = round(dist, 2)
            nearby.append(req_with_dist)
    
    # Sort by distance
    nearby.sort(key=lambda x: x["distance_km"])
    return nearby[:limit]


def calculate_match_score(detected: str, request: Dict) -> Tuple[float, str]:
    """
    Calculate a match score between detected object and request.
    
    Returns:
        Tuple of (score, match_reason)
    """
    detected_lower = detected.lower()
    item_name_lower = request["item_name"].lower()
    keywords = request.get("keywords", [])
    
    # Exact match in item name
    if detected_lower == item_name_lower:
        return (1.0, "exact_match")
    
    # Detected is part of item name
    if detected_lower in item_name_lower:
        return (0.9, "partial_match")
    
    # Item name is part of detected
    if item_name_lower in detected_lower:
        return (0.85, "contains_match")
    
    # Keyword match
    for keyword in keywords:
        if keyword in detected_lower or detected_lower in keyword:
            return (0.7, f"keyword_match:{keyword}")
    
    # Word overlap
    detected_words = set(re.findall(r'\w+', detected_lower))
    item_words = set(re.findall(r'\w+', item_name_lower))
    overlap = detected_words & item_words
    if overlap:
        score = len(overlap) / max(len(detected_words), len(item_words))
        return (score * 0.6, f"word_overlap:{','.join(overlap)}")
    
    return (0.0, "no_match")


def match_detected_objects(
    detected_objects: List[str],
    min_score: float = 0.5,
    limit: int = 10
) -> List[Dict]:
    """
    Find requests that match objects detected by the traveler's camera.
    Uses fuzzy matching with scoring.
    
    Args:
        detected_objects: List of detected object names
        min_score: Minimum match score (0-1)
        limit: Maximum number of matches to return
    
    Returns:
        List of matching requests with scores
    """
    matches = []
    if not detected_objects:
        return matches
    
    matched_request_ids = set()
    
    for obj in detected_objects:
        obj_normalized = obj.strip()
        if not obj_normalized:
            continue
            
        for req in SAMPLE_REQUESTS:
            # Skip already matched requests
            if req["id"] in matched_request_ids:
                continue
                
            score, reason = calculate_match_score(obj_normalized, req)
            
            if score >= min_score:
                matched_request_ids.add(req["id"])
                matches.append({
                    "type": "camera_match",
                    "message": f"You found a '{obj}'! This matches a request for '{req['item_name']}' in {req['location_name']}.",
                    "request_id": req["id"],
                    "item_name": req["item_name"],
                    "location_name": req["location_name"],
                    "reward": req["reward"],
                    "category": req.get("category"),
                    "match_score": round(score, 2),
                    "match_reason": reason
                })
    
    # Sort by score descending
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches[:limit]


def extract_keywords_from_text(text: str) -> Dict[str, List[str]]:
    """
    Extract product and location keywords from text.
    
    Returns:
        Dict with 'products', 'locations', 'categories' lists
    """
    text_lower = text.lower()
    
    # Product keywords
    product_keywords = [
        "iphone", "macbook", "playstation", "xbox", "nike", "adidas",
        "samsung", "laptop", "phone", "shoes", "watch", "bag", "perfume",
        "gucci", "zara", "sephora", "apple", "sony", "jordan"
    ]
    
    # Location keywords
    location_keywords = [
        "mall", "store", "shop", "market", "airport", "station",
        "dubai", "riyadh", "cairo", "london", "paris", "new york",
        "istanbul", "seoul", "milan", "los angeles", "tokyo"
    ]
    
    # Category keywords
    category_keywords = list(CATEGORY_SYNONYMS.keys())
    for synonyms in CATEGORY_SYNONYMS.values():
        category_keywords.extend(synonyms)
    
    found_products = [kw for kw in product_keywords if kw in text_lower]
    found_locations = [kw for kw in location_keywords if kw in text_lower]
    found_categories = [kw for kw in category_keywords if kw in text_lower]
    
    return {
        "products": found_products,
        "locations": found_locations,
        "categories": found_categories
    }


def get_requests_by_category(category: str, limit: int = 10) -> List[Dict]:
    """
    Get requests filtered by category.
    """
    # Check for synonyms
    normalized_category = category.lower()
    for cat, synonyms in CATEGORY_SYNONYMS.items():
        if normalized_category in synonyms:
            normalized_category = cat
            break
    
    return [
        req for req in SAMPLE_REQUESTS 
        if req.get("category") == normalized_category
    ][:limit]

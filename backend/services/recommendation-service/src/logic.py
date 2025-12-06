import math
from typing import List, Dict

# Sample Request Data (In-Memory Database for Demo)
# Distributed across key regions relevant to Mnbara (MENA + Global Hubs)
SAMPLE_REQUESTS = [
    {"id": "req_001", "item_name": "iPhone 15 Pro", "location_name": "Dubai Mall", "lat": 25.1972, "lon": 55.2744, "reward": 150},
    {"id": "req_002", "item_name": "PlayStation 5", "location_name": "Riyadh Park", "lat": 24.7555, "lon": 46.6293, "reward": 120},
    {"id": "req_003", "item_name": "MacBook Air M3", "location_name": "Cairo Festival City", "lat": 30.0310, "lon": 31.4085, "reward": 200},
    {"id": "req_004", "item_name": "Zara Jacket", "location_name": "London Oxford Street", "lat": 51.5145, "lon": -0.1445, "reward": 50},
    {"id": "req_005", "item_name": "Sephora Makeup Kit", "location_name": "Paris Champs-Elysees", "lat": 48.8698, "lon": 2.3078, "reward": 60},
    {"id": "req_006", "item_name": "Nike Air Jordan", "location_name": "New York Times Square", "lat": 40.7580, "lon": -73.9855, "reward": 80},
    {"id": "req_007", "item_name": "Turkish Coffee Set", "location_name": "Istanbul Grand Bazaar", "lat": 41.0102, "lon": 28.9680, "reward": 40},
    {"id": "req_008", "item_name": "Vitamins & Supplements", "location_name": "Los Angeles Santa Monica", "lat": 34.0195, "lon": -118.4912, "reward": 55},
]

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

def find_nearby_requests(lat: float, lon: float, radius_km: float = 50.0) -> List[Dict]:
    """
    Find requests within a certain radius of the traveler.
    """
    nearby = []
    for req in SAMPLE_REQUESTS:
        dist = haversine_distance(lat, lon, req["lat"], req["lon"])
        if dist <= radius_km:
            req_with_dist = req.copy()
            req_with_dist["distance_km"] = round(dist, 2)
            nearby.append(req_with_dist)
    
    # Sort by distance
    nearby.sort(key=lambda x: x["distance_km"])
    return nearby

def match_detected_objects(detected_objects: List[str]) -> List[Dict]:
    """
    Find requests that match objects detected by the traveler's camera.
    """
    matches = []
    if not detected_objects:
        return matches
        
    detected_normalized = [obj.lower() for obj in detected_objects]
    
    for req in SAMPLE_REQUESTS:
        # Simple substring match
        for obj in detected_normalized:
            if obj in req["item_name"].lower() or req["item_name"].lower() in obj:
                matches.append({
                    "type": "camera_match",
                    "message": f"You found a '{obj}'! This matches a request for '{req['item_name']}' in {req['location_name']}.",
                    "request_id": req["id"],
                    "reward": req["reward"]
                })
                break # Avoid duplicate matches for same request
    
    return matches

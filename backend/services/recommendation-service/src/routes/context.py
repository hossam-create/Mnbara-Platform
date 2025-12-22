from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from src import logic

router = APIRouter()


class Location(BaseModel):
    lat: float
    lon: float
    accuracy: Optional[float] = None


class TravelerContext(BaseModel):
    traveler_id: str
    location: Location
    activity: Optional[str] = None  # e.g., "walking", "in_vehicle"
    detected_objects: Optional[List[str]] = []  # From camera, e.g., ["iphone 15", "nike shoes"]
    voice_transcript: Optional[str] = None  # From mic, e.g., "I am at Dubai Mall"


@router.post("/analyze")
async def analyze_context(context: TravelerContext):
    """
    Analyze traveler context (Location, Camera, Voice) to recommend actions.
    """
    recommendations = []  # Initialize recommendations list
    
    # 1. Location-Based Recommendations (Real Calc)
    nearby_reqs = logic.find_nearby_requests(context.location.lat, context.location.lon, radius_km=50.0)
    
    if nearby_reqs:
        for req in nearby_reqs:
            recommendations.append({
                "type": "opportunity",
                "message": f"You are {req['distance_km']}km away from '{req['location_name']}'. Someone needs '{req['item_name']}' there!",
                "potential_earnings": req['reward'],
                "location": {"lat": req['lat'], "lon": req['lon']}
            })
    else:
        # Fallback if no nearby requests (e.g. for testing anywhere else)
        recommendations.append({
            "type": "info",
            "message": "No specific requests found nearby. Try moving towards major hubs like Dubai or Riyadh.",
            "nearby_hubs": ["Dubai", "Riyadh", "Cairo", "London", "New York"]
        })

    # 2. Camera/Object Detection Matching
    if context.detected_objects:
        object_matches = logic.match_detected_objects(context.detected_objects)
        recommendations.extend(object_matches)

    return {
        "status": "success",
        "context_processed": {
            "traveler_id": context.traveler_id,
            "location_summary": f"{context.location.lat}, {context.location.lon}",
            "objects_detected": len(context.detected_objects) if context.detected_objects else 0
        },
        "recommendations": recommendations,
        "algo_version": "1.1-haversine"
    }

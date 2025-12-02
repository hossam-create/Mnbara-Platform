from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class Location(BaseModel):
    lat: float
    lon: float
    accuracy: Optional[float] = None

class TravelerContext(BaseModel):
    traveler_id: str
    location: Location
    activity: Optional[str] = None # e.g., "walking", "in_vehicle"
    detected_objects: Optional[List[str]] = [] # From camera, e.g., ["iphone 15", "nike shoes"]
    voice_transcript: Optional[str] = None # From mic, e.g., "I am at Dubai Mall"

@router.post("/analyze")
async def analyze_context(context: TravelerContext):
    """
    Analyze traveler context (Location, Camera, Voice) to recommend actions.
    """
    recommendations = []

    # Mock Logic for Demo
    if context.voice_transcript and "Dubai Mall" in context.voice_transcript:
        recommendations.append({
            "type": "opportunity",
            "message": "You are at Dubai Mall! 3 people want items from Apple Store here.",
            "potential_earnings": 150,
            "items": ["iPhone 15 Pro", "AirPods Max"]
        })
    
    if "iphone 15" in [obj.lower() for obj in context.detected_objects]:
         recommendations.append({
            "type": "match",
            "message": "We detected an iPhone 15. User 'Ahmed' in Cairo is looking for this!",
            "action": "Scan barcode to confirm price"
        })

    return {
        "status": "success",
        "context_processed": context,
        "recommendations": recommendations
    }

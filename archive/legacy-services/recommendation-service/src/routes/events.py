"""
API Routes for Event Submission
Requirements: 13.1, 13.2 - Camera/mic event handling

This module provides REST API endpoints for submitting traveler events
(camera detection, microphone transcripts, location updates, etc.)
Events can be processed synchronously or queued for async processing.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import logging
import uuid

from src import logic
from src.event_worker import (
    event_worker, 
    submit_event, 
    TravelerEvent, 
    EventType as WorkerEventType,
    EventPriority
)

logger = logging.getLogger(__name__)
router = APIRouter()


class EventType(str, Enum):
    CAMERA_DETECTION = "camera_detection"
    MIC_TRANSCRIPT = "mic_transcript"
    LOCATION_UPDATE = "location_update"


class Location(BaseModel):
    lat: float
    lon: float
    accuracy: Optional[float] = None


class CameraEventPayload(BaseModel):
    """Payload for camera detection events"""
    detected_objects: List[str]
    confidence_scores: Dict[str, float] = {}
    image_url: Optional[str] = None


class MicEventPayload(BaseModel):
    """Payload for microphone/voice events"""
    transcript: str
    language: str = "en"
    confidence: float = Field(default=1.0, ge=0, le=1)


class LocationEventPayload(BaseModel):
    """Payload for location update events"""
    speed: Optional[float] = None  # m/s
    heading: Optional[float] = None  # degrees
    altitude: Optional[float] = None


class EventSubmission(BaseModel):
    """Generic event submission"""
    traveler_id: str
    event_type: EventType
    location: Optional[Location] = None
    payload: Dict[str, Any]


class CameraEventSubmission(BaseModel):
    """Camera detection event submission"""
    traveler_id: str
    location: Location
    detected_objects: List[str]
    confidence_scores: Dict[str, float] = {}
    image_url: Optional[str] = None


class MicEventSubmission(BaseModel):
    """Microphone event submission"""
    traveler_id: str
    location: Optional[Location] = None
    transcript: str
    language: str = "en"


class LocationUpdateSubmission(BaseModel):
    """Location update submission"""
    traveler_id: str
    location: Location
    speed: Optional[float] = None
    heading: Optional[float] = None


class EventResponse(BaseModel):
    """Response after event processing"""
    event_id: str
    status: str
    matches: List[Dict[str, Any]] = []
    notifications_triggered: int = 0
    queued: bool = False


class ObjectMatchSubmission(BaseModel):
    """Object match confirmation submission"""
    traveler_id: str
    request_id: str
    item_name: str
    price: float
    store_name: Optional[str] = None
    image_url: Optional[str] = None
    buyer_id: Optional[str] = None
    location: Optional[Location] = None


class BarcodeEventSubmission(BaseModel):
    """Barcode scan event submission"""
    traveler_id: str
    barcode: str
    barcode_type: str = "unknown"
    product_info: Dict[str, Any] = {}
    location: Optional[Location] = None


class VoiceCommandSubmission(BaseModel):
    """Voice command event submission"""
    traveler_id: str
    command: str
    parameters: Dict[str, Any] = {}
    location: Optional[Location] = None


def process_camera_detection(
    traveler_id: str,
    location: Location,
    detected_objects: List[str],
    confidence_scores: Dict[str, float]
) -> Dict[str, Any]:
    """Process camera detection and find matches"""
    # Filter by confidence
    min_confidence = 0.7
    confident_objects = [
        obj for obj in detected_objects
        if confidence_scores.get(obj, 1.0) >= min_confidence
    ]
    
    if not confident_objects:
        return {"matches": [], "notifications": 0}
    
    # Find matching requests
    matches = logic.match_detected_objects(confident_objects)
    
    # Also find nearby opportunities
    nearby = logic.find_nearby_requests(location.lat, location.lon, radius_km=25.0)
    
    return {
        "matches": matches,
        "nearby_opportunities": nearby[:5],
        "notifications": len(matches)
    }


def process_mic_transcript(
    traveler_id: str,
    transcript: str,
    location: Optional[Location]
) -> Dict[str, Any]:
    """Process voice transcript for keywords and locations"""
    # Product keywords to look for
    product_keywords = [
        "iphone", "macbook", "playstation", "nike", "adidas",
        "samsung", "laptop", "phone", "shoes", "watch"
    ]
    
    # Location keywords
    location_keywords = [
        "mall", "store", "shop", "market", "airport",
        "dubai", "riyadh", "cairo", "london", "paris"
    ]
    
    transcript_lower = transcript.lower()
    
    found_products = [kw for kw in product_keywords if kw in transcript_lower]
    found_locations = [kw for kw in location_keywords if kw in transcript_lower]
    
    result = {
        "detected_products": found_products,
        "detected_locations": found_locations,
        "matches": [],
        "notifications": 0
    }
    
    # If products mentioned, try to match
    if found_products:
        matches = logic.match_detected_objects(found_products)
        result["matches"] = matches
        result["notifications"] = len(matches)
    
    # If location available, find nearby
    if location and found_locations:
        nearby = logic.find_nearby_requests(location.lat, location.lon, radius_km=25.0)
        result["nearby_opportunities"] = nearby[:5]
    
    return result


def process_location_update(
    traveler_id: str,
    location: Location
) -> Dict[str, Any]:
    """Process location update and find nearby opportunities"""
    nearby = logic.find_nearby_requests(location.lat, location.lon, radius_km=10.0)
    
    # Filter for close opportunities
    close_requests = [r for r in nearby if r.get("distance_km", 100) <= 2.0]
    
    return {
        "nearby_opportunities": nearby[:10],
        "close_alerts": close_requests,
        "notifications": len(close_requests)
    }


@router.post("/camera", response_model=EventResponse)
async def submit_camera_event(
    event: CameraEventSubmission,
    background_tasks: BackgroundTasks,
    async_processing: bool = Query(False, description="Queue for async processing")
):
    """
    Submit a camera detection event.
    Processes detected objects and matches against travel requests.
    
    Set async_processing=true to queue the event for background processing.
    """
    event_id = str(uuid.uuid4())
    
    try:
        if async_processing:
            # Queue for async processing
            worker_event = TravelerEvent(
                event_id=event_id,
                event_type=WorkerEventType.CAMERA_DETECTION,
                traveler_id=event.traveler_id,
                timestamp=datetime.utcnow(),
                payload={
                    "detected_objects": event.detected_objects,
                    "confidence_scores": event.confidence_scores,
                    "image_url": event.image_url
                },
                location={"lat": event.location.lat, "lon": event.location.lon} if event.location else None,
                priority=EventPriority.NORMAL
            )
            background_tasks.add_task(submit_event, worker_event)
            
            return EventResponse(
                event_id=event_id,
                status="queued",
                queued=True
            )
        
        # Synchronous processing
        result = process_camera_detection(
            traveler_id=event.traveler_id,
            location=event.location,
            detected_objects=event.detected_objects,
            confidence_scores=event.confidence_scores
        )
        
        return EventResponse(
            event_id=event_id,
            status="processed",
            matches=result.get("matches", []),
            notifications_triggered=result.get("notifications", 0)
        )
    except Exception as e:
        logger.error(f"Error processing camera event: {e}")
        raise HTTPException(status_code=500, detail="Failed to process camera event")


@router.post("/mic", response_model=EventResponse)
async def submit_mic_event(
    event: MicEventSubmission,
    background_tasks: BackgroundTasks,
    async_processing: bool = Query(False, description="Queue for async processing")
):
    """
    Submit a microphone/voice transcript event.
    Extracts product and location keywords from transcript.
    
    Set async_processing=true to queue the event for background processing.
    """
    event_id = str(uuid.uuid4())
    
    try:
        if async_processing:
            # Queue for async processing
            worker_event = TravelerEvent(
                event_id=event_id,
                event_type=WorkerEventType.MIC_TRANSCRIPT,
                traveler_id=event.traveler_id,
                timestamp=datetime.utcnow(),
                payload={
                    "transcript": event.transcript,
                    "language": event.language
                },
                location={"lat": event.location.lat, "lon": event.location.lon} if event.location else None,
                priority=EventPriority.NORMAL
            )
            background_tasks.add_task(submit_event, worker_event)
            
            return EventResponse(
                event_id=event_id,
                status="queued",
                queued=True
            )
        
        # Synchronous processing
        result = process_mic_transcript(
            traveler_id=event.traveler_id,
            transcript=event.transcript,
            location=event.location
        )
        
        return EventResponse(
            event_id=event_id,
            status="processed",
            matches=result.get("matches", []),
            notifications_triggered=result.get("notifications", 0)
        )
    except Exception as e:
        logger.error(f"Error processing mic event: {e}")
        raise HTTPException(status_code=500, detail="Failed to process mic event")


@router.post("/location", response_model=EventResponse)
async def submit_location_event(
    event: LocationUpdateSubmission,
    background_tasks: BackgroundTasks,
    async_processing: bool = Query(True, description="Queue for async processing (default: true for location)")
):
    """
    Submit a location update event.
    Finds nearby opportunities and triggers proximity alerts.
    
    Location events are queued by default for batch processing.
    """
    event_id = str(uuid.uuid4())
    
    try:
        if async_processing:
            # Queue for async processing (default for location events)
            worker_event = TravelerEvent(
                event_id=event_id,
                event_type=WorkerEventType.LOCATION_UPDATE,
                traveler_id=event.traveler_id,
                timestamp=datetime.utcnow(),
                payload={
                    "speed": event.speed,
                    "heading": event.heading
                },
                location={"lat": event.location.lat, "lon": event.location.lon},
                priority=EventPriority.LOW  # Location updates are low priority
            )
            background_tasks.add_task(submit_event, worker_event)
            
            return EventResponse(
                event_id=event_id,
                status="queued",
                queued=True
            )
        
        # Synchronous processing
        result = process_location_update(
            traveler_id=event.traveler_id,
            location=event.location
        )
        
        return EventResponse(
            event_id=event_id,
            status="processed",
            matches=result.get("close_alerts", []),
            notifications_triggered=result.get("notifications", 0)
        )
    except Exception as e:
        logger.error(f"Error processing location event: {e}")
        raise HTTPException(status_code=500, detail="Failed to process location event")


@router.post("/object-match", response_model=EventResponse)
async def submit_object_match_event(
    event: ObjectMatchSubmission,
    background_tasks: BackgroundTasks
):
    """
    Submit an object match confirmation event.
    High priority - notifies both traveler and buyer.
    
    Called when a traveler confirms finding a matching item for a travel request.
    """
    event_id = str(uuid.uuid4())
    
    try:
        # Always queue object matches for proper notification handling
        worker_event = TravelerEvent(
            event_id=event_id,
            event_type=WorkerEventType.OBJECT_MATCH,
            traveler_id=event.traveler_id,
            timestamp=datetime.utcnow(),
            payload={
                "request_id": event.request_id,
                "item_name": event.item_name,
                "price": event.price,
                "store_name": event.store_name,
                "image_url": event.image_url,
                "buyer_id": event.buyer_id
            },
            location={"lat": event.location.lat, "lon": event.location.lon} if event.location else None,
            priority=EventPriority.HIGH
        )
        background_tasks.add_task(submit_event, worker_event)
        
        return EventResponse(
            event_id=event_id,
            status="queued",
            queued=True,
            notifications_triggered=2 if event.buyer_id else 1  # Estimate
        )
    except Exception as e:
        logger.error(f"Error processing object match event: {e}")
        raise HTTPException(status_code=500, detail="Failed to process object match event")


@router.post("/barcode", response_model=EventResponse)
async def submit_barcode_event(
    event: BarcodeEventSubmission,
    background_tasks: BackgroundTasks,
    async_processing: bool = Query(False, description="Queue for async processing")
):
    """
    Submit a barcode/QR code scan event.
    Looks up product and matches against travel requests.
    """
    event_id = str(uuid.uuid4())
    
    try:
        if async_processing:
            worker_event = TravelerEvent(
                event_id=event_id,
                event_type=WorkerEventType.BARCODE_SCAN,
                traveler_id=event.traveler_id,
                timestamp=datetime.utcnow(),
                payload={
                    "barcode": event.barcode,
                    "barcode_type": event.barcode_type,
                    "product_info": event.product_info
                },
                location={"lat": event.location.lat, "lon": event.location.lon} if event.location else None,
                priority=EventPriority.NORMAL
            )
            background_tasks.add_task(submit_event, worker_event)
            
            return EventResponse(
                event_id=event_id,
                status="queued",
                queued=True
            )
        
        # Synchronous processing - try to match barcode product
        product_name = event.product_info.get("name", event.product_info.get("title", ""))
        matches = []
        if product_name:
            matches = logic.match_detected_objects([product_name])
        
        return EventResponse(
            event_id=event_id,
            status="processed",
            matches=matches,
            notifications_triggered=len(matches)
        )
    except Exception as e:
        logger.error(f"Error processing barcode event: {e}")
        raise HTTPException(status_code=500, detail="Failed to process barcode event")


@router.post("/voice-command", response_model=EventResponse)
async def submit_voice_command_event(
    event: VoiceCommandSubmission,
    background_tasks: BackgroundTasks,
    async_processing: bool = Query(False, description="Queue for async processing")
):
    """
    Submit a voice command event.
    Processes explicit commands like "find iphone" or "show nearby".
    """
    event_id = str(uuid.uuid4())
    
    try:
        if async_processing:
            worker_event = TravelerEvent(
                event_id=event_id,
                event_type=WorkerEventType.VOICE_COMMAND,
                traveler_id=event.traveler_id,
                timestamp=datetime.utcnow(),
                payload={
                    "command": event.command,
                    "parameters": event.parameters
                },
                location={"lat": event.location.lat, "lon": event.location.lon} if event.location else None,
                priority=EventPriority.NORMAL
            )
            background_tasks.add_task(submit_event, worker_event)
            
            return EventResponse(
                event_id=event_id,
                status="queued",
                queued=True
            )
        
        # Synchronous processing
        command = event.command.lower()
        matches = []
        
        if command.startswith("find ") or command.startswith("search "):
            search_term = command.replace("find ", "").replace("search ", "").strip()
            if search_term:
                matches = logic.match_detected_objects([search_term])
        elif command in ["show nearby", "nearby requests", "what's nearby"]:
            if event.location:
                matches = logic.find_nearby_requests(
                    event.location.lat,
                    event.location.lon,
                    radius_km=25.0
                )[:10]
        
        return EventResponse(
            event_id=event_id,
            status="processed",
            matches=matches,
            notifications_triggered=1 if matches else 0
        )
    except Exception as e:
        logger.error(f"Error processing voice command event: {e}")
        raise HTTPException(status_code=500, detail="Failed to process voice command event")


@router.get("/stats")
async def get_worker_stats():
    """Get event worker statistics"""
    return event_worker.get_stats()


@router.post("/batch")
async def submit_batch_events(
    events: List[EventSubmission],
    background_tasks: BackgroundTasks,
    async_processing: bool = Query(True, description="Queue all events for async processing (default: true)")
):
    """
    Submit multiple events in a batch.
    Useful for syncing offline events.
    
    By default, all events are queued for async processing.
    """
    results = []
    
    for event in events:
        event_id = str(uuid.uuid4())
        
        try:
            if async_processing:
                # Map to worker event type
                event_type_map = {
                    EventType.CAMERA_DETECTION: WorkerEventType.CAMERA_DETECTION,
                    EventType.MIC_TRANSCRIPT: WorkerEventType.MIC_TRANSCRIPT,
                    EventType.LOCATION_UPDATE: WorkerEventType.LOCATION_UPDATE,
                }
                
                worker_event_type = event_type_map.get(event.event_type)
                if worker_event_type:
                    worker_event = TravelerEvent(
                        event_id=event_id,
                        event_type=worker_event_type,
                        traveler_id=event.traveler_id,
                        timestamp=datetime.utcnow(),
                        payload=event.payload,
                        location={"lat": event.location.lat, "lon": event.location.lon} if event.location else None,
                        priority=EventPriority.LOW if event.event_type == EventType.LOCATION_UPDATE else EventPriority.NORMAL
                    )
                    background_tasks.add_task(submit_event, worker_event)
                    
                    results.append({
                        "event_id": event_id,
                        "event_type": event.event_type,
                        "status": "queued"
                    })
                else:
                    results.append({
                        "event_id": event_id,
                        "event_type": event.event_type,
                        "status": "error",
                        "error": "Unknown event type"
                    })
            else:
                # Synchronous processing
                if event.event_type == EventType.CAMERA_DETECTION:
                    location = event.location or Location(lat=0, lon=0)
                    result = process_camera_detection(
                        traveler_id=event.traveler_id,
                        location=location,
                        detected_objects=event.payload.get("detected_objects", []),
                        confidence_scores=event.payload.get("confidence_scores", {})
                    )
                elif event.event_type == EventType.MIC_TRANSCRIPT:
                    result = process_mic_transcript(
                        traveler_id=event.traveler_id,
                        transcript=event.payload.get("transcript", ""),
                        location=event.location
                    )
                elif event.event_type == EventType.LOCATION_UPDATE:
                    if event.location:
                        result = process_location_update(
                            traveler_id=event.traveler_id,
                            location=event.location
                        )
                    else:
                        result = {"error": "Location required for location update"}
                else:
                    result = {"error": "Unknown event type"}
                
                results.append({
                    "event_id": event_id,
                    "event_type": event.event_type,
                    "status": "processed",
                    "result": result
                })
        except Exception as e:
            results.append({
                "event_id": event_id,
                "event_type": event.event_type,
                "status": "error",
                "error": str(e)
            })
    
    queued_count = len([r for r in results if r["status"] == "queued"])
    processed_count = len([r for r in results if r["status"] == "processed"])
    error_count = len([r for r in results if r["status"] == "error"])
    
    return {
        "status": "completed",
        "total_events": len(events),
        "queued": queued_count,
        "processed": processed_count,
        "errors": error_count,
        "results": results
    }

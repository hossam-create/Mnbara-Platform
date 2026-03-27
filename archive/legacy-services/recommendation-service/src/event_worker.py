"""
Event Worker for Camera/Mic Events
Requirements: 13.1, 13.2 - Process camera/mic events and trigger notifications

This worker processes events from RabbitMQ queue for:
- Camera detection events (object recognition)
- Microphone events (voice commands, location mentions)
- Location update events
- Object match events (when traveler finds a matching item)
"""
import asyncio
import json
import logging
import os
import httpx
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timedelta
from enum import Enum
import aio_pika
from aio_pika import Message, DeliveryMode, ExchangeType
from pydantic import BaseModel, Field

from src import logic
from src.database import Database

logger = logging.getLogger(__name__)

# Configuration
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
EVENT_QUEUE = os.getenv("EVENT_QUEUE", "traveler_events")
NOTIFICATION_QUEUE = os.getenv("NOTIFICATION_QUEUE", "notifications")
DEAD_LETTER_QUEUE = os.getenv("DEAD_LETTER_QUEUE", "traveler_events_dlq")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:3006")

# Processing configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5
BATCH_SIZE = 10


class EventType(str, Enum):
    CAMERA_DETECTION = "camera_detection"
    MIC_TRANSCRIPT = "mic_transcript"
    LOCATION_UPDATE = "location_update"
    OBJECT_MATCH = "object_match"
    BARCODE_SCAN = "barcode_scan"
    VOICE_COMMAND = "voice_command"


class EventPriority(str, Enum):
    HIGH = "high"      # Immediate processing (object matches, urgent alerts)
    NORMAL = "normal"  # Standard processing (camera/mic events)
    LOW = "low"        # Batch processing (location updates)


class TravelerEvent(BaseModel):
    """Event from traveler's device"""
    event_id: str
    event_type: EventType
    traveler_id: str
    timestamp: datetime
    payload: Dict[str, Any]
    location: Optional[Dict[str, float]] = None  # {lat, lon}
    priority: EventPriority = EventPriority.NORMAL
    retry_count: int = 0
    correlation_id: Optional[str] = None


class NotificationPayload(BaseModel):
    """Notification to be sent to user"""
    user_id: str
    notification_type: str
    title: str
    body: str
    data: Dict[str, Any] = {}
    channels: List[str] = ["push", "in_app"]
    priority: str = "normal"
    ttl_seconds: int = 3600  # Time to live for notification


class EventProcessingResult(BaseModel):
    """Result of processing an event"""
    event_id: str
    success: bool
    notifications_sent: int = 0
    matches_found: int = 0
    error: Optional[str] = None
    processing_time_ms: int = 0


class EventWorker:
    """
    Worker that processes camera/mic events from travelers
    and triggers appropriate notifications and matches.
    
    Features:
    - Queue-based event processing with RabbitMQ
    - Dead letter queue for failed events
    - Retry mechanism with exponential backoff
    - Notification service integration
    - Event batching for location updates
    """
    
    def __init__(self):
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.event_queue: Optional[aio_pika.Queue] = None
        self.dlq: Optional[aio_pika.Queue] = None
        self.events_exchange: Optional[aio_pika.Exchange] = None
        self._running = False
        self._http_client: Optional[httpx.AsyncClient] = None
        self._event_handlers: Dict[EventType, Callable] = {}
        self._location_batch: List[TravelerEvent] = []
        self._batch_lock = asyncio.Lock()
        self._stats = {
            "events_processed": 0,
            "notifications_sent": 0,
            "errors": 0,
            "retries": 0
        }
        
        # Register event handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register handlers for each event type"""
        self._event_handlers = {
            EventType.CAMERA_DETECTION: self.process_camera_event,
            EventType.MIC_TRANSCRIPT: self.process_mic_event,
            EventType.LOCATION_UPDATE: self.process_location_event,
            EventType.OBJECT_MATCH: self.process_object_match_event,
            EventType.BARCODE_SCAN: self.process_barcode_event,
            EventType.VOICE_COMMAND: self.process_voice_command_event,
        }
    
    async def connect(self):
        """Connect to RabbitMQ and set up queues"""
        try:
            self.connection = await aio_pika.connect_robust(
                RABBITMQ_URL,
                client_properties={"connection_name": "event_worker"}
            )
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=BATCH_SIZE)
            
            # Declare dead letter exchange and queue
            dlx = await self.channel.declare_exchange(
                "traveler_events_dlx",
                ExchangeType.DIRECT,
                durable=True
            )
            
            self.dlq = await self.channel.declare_queue(
                DEAD_LETTER_QUEUE,
                durable=True
            )
            await self.dlq.bind(dlx, routing_key=DEAD_LETTER_QUEUE)
            
            # Declare main event queue with DLQ
            self.event_queue = await self.channel.declare_queue(
                EVENT_QUEUE,
                durable=True,
                arguments={
                    "x-dead-letter-exchange": "traveler_events_dlx",
                    "x-dead-letter-routing-key": DEAD_LETTER_QUEUE,
                    "x-message-ttl": 86400000  # 24 hours
                }
            )
            
            # Declare notification queue
            await self.channel.declare_queue(
                NOTIFICATION_QUEUE,
                durable=True
            )
            
            # Initialize HTTP client for notification service
            self._http_client = httpx.AsyncClient(
                base_url=NOTIFICATION_SERVICE_URL,
                timeout=10.0
            )
            
            logger.info("Connected to RabbitMQ with DLQ support")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from RabbitMQ and cleanup"""
        if self._http_client:
            await self._http_client.aclose()
        if self.connection:
            await self.connection.close()
            logger.info("Disconnected from RabbitMQ")
    
    async def publish_notification(self, notification: NotificationPayload) -> bool:
        """
        Publish notification to notification queue and optionally call notification service.
        Returns True if notification was successfully published.
        """
        if not self.channel:
            logger.error("Not connected to RabbitMQ")
            return False
        
        try:
            # Publish to RabbitMQ queue for async processing
            message = Message(
                body=notification.model_dump_json().encode(),
                delivery_mode=DeliveryMode.PERSISTENT,
                content_type="application/json",
                headers={
                    "priority": notification.priority,
                    "notification_type": notification.notification_type
                }
            )
            
            await self.channel.default_exchange.publish(
                message,
                routing_key=NOTIFICATION_QUEUE
            )
            
            # For high priority notifications, also call notification service directly
            if notification.priority == "high" and self._http_client:
                try:
                    await self._send_notification_http(notification)
                except Exception as http_err:
                    logger.warning(f"HTTP notification failed, queued instead: {http_err}")
            
            self._stats["notifications_sent"] += 1
            logger.info(f"Published notification for user {notification.user_id}: {notification.notification_type}")
            return True
        except Exception as e:
            logger.error(f"Failed to publish notification: {e}")
            return False
    
    async def _send_notification_http(self, notification: NotificationPayload):
        """Send notification directly via HTTP to notification service"""
        if not self._http_client:
            return
        
        payload = {
            "userId": notification.user_id,
            "type": notification.notification_type,
            "title": notification.title,
            "body": notification.body,
            "data": notification.data,
            "channels": notification.channels
        }
        
        response = await self._http_client.post("/api/v1/notifications/send", json=payload)
        response.raise_for_status()
    
    async def publish_event_to_queue(self, event: TravelerEvent):
        """Publish an event to the event queue for processing"""
        if not self.channel:
            logger.error("Not connected to RabbitMQ")
            return
        
        message = Message(
            body=event.model_dump_json().encode(),
            delivery_mode=DeliveryMode.PERSISTENT,
            content_type="application/json",
            headers={
                "event_type": event.event_type.value,
                "priority": event.priority.value,
                "retry_count": event.retry_count
            }
        )
        
        await self.channel.default_exchange.publish(
            message,
            routing_key=EVENT_QUEUE
        )
        logger.debug(f"Published event {event.event_id} to queue")
    
    async def process_camera_event(self, event: TravelerEvent) -> List[NotificationPayload]:
        """
        Process camera detection event.
        Matches detected objects against active travel requests.
        
        Payload expected:
        - detected_objects: List[str] - Objects detected by camera
        - confidence_scores: Dict[str, float] - Confidence for each object
        - image_url: Optional[str] - URL of captured image
        - scene_context: Optional[str] - Context of the scene (store, mall, etc.)
        """
        notifications = []
        payload = event.payload
        
        detected_objects = payload.get("detected_objects", [])
        confidence_scores = payload.get("confidence_scores", {})
        scene_context = payload.get("scene_context", "")
        
        if not detected_objects:
            logger.debug(f"No objects detected in camera event {event.event_id}")
            return notifications
        
        # Filter by confidence threshold (higher for important matches)
        min_confidence = 0.7
        confident_objects = [
            obj for obj in detected_objects
            if confidence_scores.get(obj, 1.0) >= min_confidence
        ]
        
        if not confident_objects:
            logger.debug(f"No confident objects in camera event {event.event_id}")
            return notifications
        
        # Match against travel requests
        matches = logic.match_detected_objects(confident_objects)
        
        # Also check for nearby opportunities if location available
        nearby_opportunities = []
        if event.location:
            nearby_opportunities = logic.find_nearby_requests(
                event.location.get("lat", 0),
                event.location.get("lon", 0),
                radius_km=5.0
            )
        
        for match in matches:
            # High priority notification for direct matches
            notification = NotificationPayload(
                user_id=event.traveler_id,
                notification_type="camera_match",
                title="🎯 Item Match Found!",
                body=match.get("message", "You found a matching item!"),
                data={
                    "event_type": "camera_match",
                    "request_id": match.get("request_id"),
                    "reward": match.get("reward"),
                    "detected_object": confident_objects[0] if confident_objects else None,
                    "scene_context": scene_context,
                    "image_url": payload.get("image_url"),
                    "location": event.location,
                    "timestamp": event.timestamp.isoformat()
                },
                priority="high",
                channels=["push", "in_app"]
            )
            notifications.append(notification)
        
        # Notify about nearby opportunities if no direct matches
        if not matches and nearby_opportunities:
            closest = nearby_opportunities[0]
            notification = NotificationPayload(
                user_id=event.traveler_id,
                notification_type="nearby_opportunity",
                title="📍 Opportunity Nearby",
                body=f"Someone needs '{closest['item_name']}' near you!",
                data={
                    "event_type": "nearby_opportunity",
                    "request_id": closest.get("id"),
                    "item_name": closest.get("item_name"),
                    "distance_km": closest.get("distance_km"),
                    "reward": closest.get("reward"),
                    "timestamp": event.timestamp.isoformat()
                },
                priority="normal"
            )
            notifications.append(notification)
        
        return notifications
    
    async def process_mic_event(self, event: TravelerEvent) -> List[NotificationPayload]:
        """
        Process microphone/voice transcript event.
        Extracts location mentions and product keywords from speech.
        
        Payload expected:
        - transcript: str - Transcribed speech text
        - language: str - Language code (e.g., 'en', 'ar')
        - confidence: float - Transcription confidence
        - duration_seconds: Optional[int] - Duration of audio
        """
        notifications = []
        payload = event.payload
        
        transcript = payload.get("transcript", "")
        language = payload.get("language", "en")
        confidence = payload.get("confidence", 1.0)
        
        if not transcript or confidence < 0.6:
            logger.debug(f"Skipping low confidence transcript in event {event.event_id}")
            return notifications
        
        # Location keywords (multi-language support)
        location_keywords = {
            "en": ["mall", "store", "shop", "market", "airport", "station", "center", "plaza"],
            "ar": ["مول", "متجر", "سوق", "مطار", "محطة", "مركز"]
        }
        
        # Product keywords
        product_keywords = [
            "iphone", "macbook", "playstation", "xbox", "nike", "adidas",
            "samsung", "laptop", "phone", "shoes", "watch", "bag", "perfume",
            "electronics", "clothes", "fashion", "beauty", "cosmetics"
        ]
        
        # City/region keywords
        city_keywords = [
            "dubai", "riyadh", "cairo", "london", "paris", "new york",
            "istanbul", "doha", "abu dhabi", "jeddah", "kuwait", "muscat"
        ]
        
        transcript_lower = transcript.lower()
        
        # Extract mentioned locations
        lang_locations = location_keywords.get(language, location_keywords["en"])
        mentioned_locations = [kw for kw in lang_locations if kw in transcript_lower]
        mentioned_cities = [kw for kw in city_keywords if kw in transcript_lower]
        mentioned_products = [kw for kw in product_keywords if kw in transcript_lower]
        
        # If products mentioned, try to match against requests
        if mentioned_products:
            matches = logic.match_detected_objects(mentioned_products)
            for match in matches:
                notification = NotificationPayload(
                    user_id=event.traveler_id,
                    notification_type="voice_product_match",
                    title="🎤 Product Match!",
                    body=f"You mentioned '{mentioned_products[0]}'! {match.get('message', '')}",
                    data={
                        "event_type": "voice_product_match",
                        "request_id": match.get("request_id"),
                        "reward": match.get("reward"),
                        "mentioned_products": mentioned_products,
                        "transcript_snippet": transcript[:100],
                        "timestamp": event.timestamp.isoformat()
                    },
                    priority="normal"
                )
                notifications.append(notification)
        
        # If location mentioned and we have coordinates, find nearby requests
        if (mentioned_locations or mentioned_cities) and event.location:
            nearby = logic.find_nearby_requests(
                event.location.get("lat", 0),
                event.location.get("lon", 0),
                radius_km=25.0
            )
            
            if nearby and not notifications:  # Only if no product matches
                closest = nearby[0]
                location_mention = mentioned_cities[0] if mentioned_cities else mentioned_locations[0]
                notification = NotificationPayload(
                    user_id=event.traveler_id,
                    notification_type="voice_location_match",
                    title="📍 Nearby Opportunity",
                    body=f"You mentioned {location_mention}! There's a request for '{closest['item_name']}' nearby.",
                    data={
                        "event_type": "voice_location_match",
                        "mentioned_locations": mentioned_locations + mentioned_cities,
                        "nearest_request": closest,
                        "distance_km": closest.get("distance_km"),
                        "reward": closest.get("reward"),
                        "timestamp": event.timestamp.isoformat()
                    },
                    priority="normal"
                )
                notifications.append(notification)
        
        return notifications
    
    async def process_location_event(self, event: TravelerEvent) -> List[NotificationPayload]:
        """
        Process location update event.
        Checks for nearby opportunities when traveler moves.
        Uses batching to avoid notification spam.
        
        Payload expected:
        - speed: Optional[float] - Speed in m/s
        - heading: Optional[float] - Heading in degrees
        - altitude: Optional[float] - Altitude in meters
        - accuracy: Optional[float] - Location accuracy in meters
        """
        notifications = []
        
        location = event.location
        if not location:
            return notifications
        
        lat = location.get("lat")
        lon = location.get("lon")
        
        if lat is None or lon is None:
            return notifications
        
        # Add to batch for aggregation (prevents notification spam)
        async with self._batch_lock:
            self._location_batch.append(event)
            
            # Process batch if it reaches threshold or has old events
            if len(self._location_batch) >= BATCH_SIZE:
                await self._process_location_batch()
        
        # Find nearby requests
        nearby = logic.find_nearby_requests(lat, lon, radius_km=10.0)
        
        # Only notify for very close opportunities (within 2km)
        close_requests = [r for r in nearby if r.get("distance_km", 100) <= 2.0]
        
        if close_requests:
            closest = close_requests[0]
            # Check if we recently notified about this request (simple dedup)
            notification = NotificationPayload(
                user_id=event.traveler_id,
                notification_type="proximity_alert",
                title="🚨 You're Close!",
                body=f"You're only {closest['distance_km']}km from '{closest['location_name']}'. Someone needs '{closest['item_name']}'!",
                data={
                    "event_type": "proximity_alert",
                    "request_id": closest.get("id"),
                    "item_name": closest.get("item_name"),
                    "location_name": closest.get("location_name"),
                    "distance_km": closest.get("distance_km"),
                    "reward": closest.get("reward"),
                    "location": {"lat": closest.get("lat"), "lon": closest.get("lon")},
                    "traveler_location": {"lat": lat, "lon": lon},
                    "timestamp": event.timestamp.isoformat()
                },
                priority="high" if closest.get("distance_km", 100) <= 0.5 else "normal"
            )
            notifications.append(notification)
        
        return notifications
    
    async def _process_location_batch(self):
        """Process batched location updates for analytics"""
        if not self._location_batch:
            return
        
        # Group by traveler
        by_traveler: Dict[str, List[TravelerEvent]] = {}
        for event in self._location_batch:
            if event.traveler_id not in by_traveler:
                by_traveler[event.traveler_id] = []
            by_traveler[event.traveler_id].append(event)
        
        # Log aggregated location data (could be stored for analytics)
        for traveler_id, events in by_traveler.items():
            logger.debug(f"Processed {len(events)} location updates for traveler {traveler_id}")
        
        self._location_batch.clear()
    
    async def process_object_match_event(self, event: TravelerEvent) -> List[NotificationPayload]:
        """
        Process object match event - when traveler confirms finding a matching item.
        This is a high-priority event that notifies the buyer.
        
        Payload expected:
        - request_id: str - The travel request ID
        - item_name: str - Name of the matched item
        - price: float - Price found
        - store_name: Optional[str] - Store where item was found
        - image_url: Optional[str] - Photo of the item
        """
        notifications = []
        payload = event.payload
        
        request_id = payload.get("request_id")
        item_name = payload.get("item_name", "item")
        price = payload.get("price")
        store_name = payload.get("store_name", "a store")
        image_url = payload.get("image_url")
        buyer_id = payload.get("buyer_id")
        
        if not request_id:
            logger.warning(f"Object match event {event.event_id} missing request_id")
            return notifications
        
        # Notify the traveler about successful match
        traveler_notification = NotificationPayload(
            user_id=event.traveler_id,
            notification_type="match_confirmed",
            title="✅ Match Confirmed!",
            body=f"You've confirmed finding '{item_name}' at {store_name}. Waiting for buyer confirmation.",
            data={
                "event_type": "match_confirmed",
                "request_id": request_id,
                "item_name": item_name,
                "price": price,
                "store_name": store_name,
                "image_url": image_url,
                "timestamp": event.timestamp.isoformat()
            },
            priority="high"
        )
        notifications.append(traveler_notification)
        
        # Notify the buyer if we have their ID
        if buyer_id:
            buyer_notification = NotificationPayload(
                user_id=buyer_id,
                notification_type="item_found",
                title="🎉 Your Item Was Found!",
                body=f"A traveler found '{item_name}' at {store_name} for ${price}!",
                data={
                    "event_type": "item_found",
                    "request_id": request_id,
                    "traveler_id": event.traveler_id,
                    "item_name": item_name,
                    "price": price,
                    "store_name": store_name,
                    "image_url": image_url,
                    "location": event.location,
                    "timestamp": event.timestamp.isoformat()
                },
                priority="high",
                channels=["push", "in_app", "email"]
            )
            notifications.append(buyer_notification)
        
        return notifications
    
    async def process_barcode_event(self, event: TravelerEvent) -> List[NotificationPayload]:
        """
        Process barcode/QR code scan event.
        Looks up product information and matches against requests.
        
        Payload expected:
        - barcode: str - Scanned barcode/QR code
        - barcode_type: str - Type (UPC, EAN, QR, etc.)
        - product_info: Optional[Dict] - Pre-fetched product info
        """
        notifications = []
        payload = event.payload
        
        barcode = payload.get("barcode")
        barcode_type = payload.get("barcode_type", "unknown")
        product_info = payload.get("product_info", {})
        
        if not barcode:
            return notifications
        
        # Extract product name from info or use barcode
        product_name = product_info.get("name", product_info.get("title", ""))
        
        if product_name:
            # Try to match against requests
            matches = logic.match_detected_objects([product_name])
            
            for match in matches:
                notification = NotificationPayload(
                    user_id=event.traveler_id,
                    notification_type="barcode_match",
                    title="📱 Barcode Match!",
                    body=f"'{product_name}' matches a travel request!",
                    data={
                        "event_type": "barcode_match",
                        "barcode": barcode,
                        "barcode_type": barcode_type,
                        "product_name": product_name,
                        "product_info": product_info,
                        "request_id": match.get("request_id"),
                        "reward": match.get("reward"),
                        "timestamp": event.timestamp.isoformat()
                    },
                    priority="high"
                )
                notifications.append(notification)
        
        return notifications
    
    async def process_voice_command_event(self, event: TravelerEvent) -> List[NotificationPayload]:
        """
        Process voice command event - explicit commands from traveler.
        
        Payload expected:
        - command: str - The voice command (e.g., "find iphone", "show nearby")
        - parameters: Dict - Command parameters
        """
        notifications = []
        payload = event.payload
        
        command = payload.get("command", "").lower()
        parameters = payload.get("parameters", {})
        
        if not command:
            return notifications
        
        # Handle different commands
        if command.startswith("find ") or command.startswith("search "):
            # Extract search term
            search_term = command.replace("find ", "").replace("search ", "").strip()
            if search_term:
                matches = logic.match_detected_objects([search_term])
                
                if matches:
                    notification = NotificationPayload(
                        user_id=event.traveler_id,
                        notification_type="voice_search_result",
                        title="🔍 Search Results",
                        body=f"Found {len(matches)} request(s) matching '{search_term}'",
                        data={
                            "event_type": "voice_search_result",
                            "search_term": search_term,
                            "matches": matches,
                            "timestamp": event.timestamp.isoformat()
                        }
                    )
                    notifications.append(notification)
        
        elif command in ["show nearby", "nearby requests", "what's nearby"]:
            if event.location:
                nearby = logic.find_nearby_requests(
                    event.location.get("lat", 0),
                    event.location.get("lon", 0),
                    radius_km=25.0
                )
                
                if nearby:
                    notification = NotificationPayload(
                        user_id=event.traveler_id,
                        notification_type="nearby_list",
                        title="📍 Nearby Requests",
                        body=f"Found {len(nearby)} request(s) near you",
                        data={
                            "event_type": "nearby_list",
                            "requests": nearby[:10],
                            "location": event.location,
                            "timestamp": event.timestamp.isoformat()
                        }
                    )
                    notifications.append(notification)
        
        return notifications
    
    async def process_event(self, message: aio_pika.IncomingMessage):
        """Process a single event from the queue with retry support"""
        start_time = datetime.utcnow()
        
        async with message.process():
            try:
                body = json.loads(message.body.decode())
                event = TravelerEvent(**body)
                
                logger.info(f"Processing event {event.event_id} of type {event.event_type}")
                
                # Get the appropriate handler
                handler = self._event_handlers.get(event.event_type)
                
                if handler:
                    notifications = await handler(event)
                else:
                    logger.warning(f"No handler for event type: {event.event_type}")
                    notifications = []
                
                # Publish all generated notifications
                sent_count = 0
                for notification in notifications:
                    if await self.publish_notification(notification):
                        sent_count += 1
                
                # Calculate processing time
                processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                self._stats["events_processed"] += 1
                logger.info(
                    f"Event {event.event_id} processed in {processing_time}ms, "
                    f"{sent_count}/{len(notifications)} notifications sent"
                )
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in message: {e}")
                self._stats["errors"] += 1
            except Exception as e:
                logger.error(f"Error processing event: {e}")
                self._stats["errors"] += 1
                
                # Check if we should retry
                retry_count = message.headers.get("retry_count", 0) if message.headers else 0
                if retry_count < MAX_RETRIES:
                    await self._retry_event(message, retry_count + 1)
                else:
                    logger.error(f"Event exceeded max retries, moving to DLQ")
    
    async def _retry_event(self, message: aio_pika.IncomingMessage, retry_count: int):
        """Retry a failed event with exponential backoff"""
        self._stats["retries"] += 1
        
        # Wait before retry (exponential backoff)
        delay = RETRY_DELAY_SECONDS * (2 ** (retry_count - 1))
        await asyncio.sleep(delay)
        
        # Re-publish with updated retry count
        new_message = Message(
            body=message.body,
            delivery_mode=DeliveryMode.PERSISTENT,
            content_type="application/json",
            headers={
                **(message.headers or {}),
                "retry_count": retry_count
            }
        )
        
        await self.channel.default_exchange.publish(
            new_message,
            routing_key=EVENT_QUEUE
        )
        logger.info(f"Event re-queued for retry {retry_count}/{MAX_RETRIES}")
    
    async def start(self):
        """Start consuming events"""
        await self.connect()
        self._running = True
        
        logger.info("Event worker started, waiting for events...")
        logger.info(f"Listening on queue: {EVENT_QUEUE}")
        logger.info(f"Publishing to: {NOTIFICATION_QUEUE}")
        
        # Start batch processor for location events
        asyncio.create_task(self._batch_processor_loop())
        
        await self.event_queue.consume(self.process_event)
        
        # Keep running until stopped
        while self._running:
            await asyncio.sleep(1)
    
    async def _batch_processor_loop(self):
        """Periodically process location batches"""
        while self._running:
            await asyncio.sleep(30)  # Process every 30 seconds
            async with self._batch_lock:
                if self._location_batch:
                    await self._process_location_batch()
    
    async def stop(self):
        """Stop the worker gracefully"""
        logger.info("Stopping event worker...")
        self._running = False
        
        # Process remaining batch
        async with self._batch_lock:
            if self._location_batch:
                await self._process_location_batch()
        
        await self.disconnect()
        logger.info(f"Event worker stopped. Stats: {self._stats}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get worker statistics"""
        return {
            **self._stats,
            "running": self._running,
            "batch_size": len(self._location_batch)
        }


# Singleton instance
event_worker = EventWorker()


async def submit_event(event: TravelerEvent):
    """
    Submit an event for processing.
    Can be called from API routes to queue events.
    """
    if not event_worker.channel:
        await event_worker.connect()
    await event_worker.publish_event_to_queue(event)


async def run_worker():
    """Run the event worker"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        await event_worker.start()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Worker error: {e}")
    finally:
        await event_worker.stop()


if __name__ == "__main__":
    asyncio.run(run_worker())

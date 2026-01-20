# Design Document - Live Location Tracking (تتبع الموقع المباشر)

## Overview

This document outlines the technical design for implementing Uber-style live location tracking in the MNBARA Flutter app. The feature enables buyers to track their traveler's real-time GPS location on a map during active deliveries.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Flutter App                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ LiveTracking    │    │ LocationTracking│                     │
│  │ Screen          │◄───│ Provider        │                     │
│  │ (Google Maps)   │    │ (Riverpod)      │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│                         ┌────────▼────────┐                     │
│                         │ WebSocket       │                     │
│                         │ Service         │                     │
│                         └────────┬────────┘                     │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                          WebSocket Connection
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│                        Backend Services                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Location        │    │ Trips           │                     │
│  │ Tracking Service│◄───│ Service         │                     │
│  │ (WebSocket)     │    │ (REST API)      │                     │
│  └─────────────────┘    └─────────────────┘                     │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Redis           │ (Location cache & pub/sub)                 │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### TravelerLocation Model
```dart
class TravelerLocation {
  final String deliveryId;
  final double latitude;
  final double longitude;
  final double? heading;        // Direction in degrees
  final double? speed;          // Speed in m/s
  final DateTime timestamp;
  final String? address;        // Reverse geocoded address
  
  // Traveler info
  final String travelerId;
  final String travelerName;
  final String? travelerPhoto;
  final String? travelerPhone;
  
  // Delivery info
  final String status;          // picked_up, in_transit, delivered
  final LatLng origin;
  final LatLng destination;
  final Duration? eta;
  final double? distanceRemaining; // in meters
}
```

### LocationTrackingState
```dart
class LocationTrackingState {
  final TravelerLocation? currentLocation;
  final List<LatLng> routePoints;
  final bool isConnected;
  final bool isLoading;
  final String? error;
  final DateTime? lastUpdate;
  final ConnectionStatus connectionStatus; // connected, connecting, disconnected, error
}

enum ConnectionStatus {
  connected,
  connecting,
  disconnected,
  reconnecting,
  error,
}
```

## Component Design

### 1. LiveTrackingScreen

Main screen displaying the map and delivery information.

```dart
class LiveTrackingScreen extends ConsumerStatefulWidget {
  final String deliveryId;
  
  // Features:
  // - Full-screen Google Map
  // - Custom markers (traveler, origin, destination)
  // - Polyline route
  // - Floating action buttons (center, zoom)
  // - Draggable bottom sheet with delivery details
  // - Connection status indicator
  // - ETA display
}
```

**UI Layout:**
```
┌─────────────────────────────────┐
│ ← Back    Track Delivery    ⋮  │  AppBar
├─────────────────────────────────┤
│                                 │
│         Google Map              │
│    [Traveler Marker 🚗]         │
│                                 │
│    [Origin 📍]───────[Dest 🏠]  │
│                                 │
│                    [📍 Center]  │  FAB
├─────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  Drag Handle
│ 🚗 Ahmed is on the way         │
│ ETA: 15 min • 3.2 km away      │
│                                 │
│ ┌─────────┐ ┌─────────┐        │
│ │📞 Call  │ │💬 Chat  │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ Timeline:                       │
│ ✓ Picked up at 2:30 PM         │
│ → In transit                    │
│ ○ Delivery                      │
└─────────────────────────────────┘
```

### 2. LocationTrackingProvider

Riverpod provider managing all tracking state.

```dart
@riverpod
class LocationTracking extends _$LocationTracking {
  WebSocketService? _wsService;
  
  @override
  LocationTrackingState build() => LocationTrackingState.initial();
  
  // Methods:
  Future<void> startTracking(String deliveryId);
  Future<void> stopTracking();
  void _onLocationUpdate(TravelerLocation location);
  void _onConnectionStatusChange(ConnectionStatus status);
  Future<void> refreshLocation();
  void centerOnTraveler();
}
```

### 3. WebSocketService

Handles WebSocket connection for real-time updates.

```dart
class LocationWebSocketService {
  WebSocketChannel? _channel;
  final StreamController<TravelerLocation> _locationController;
  final StreamController<ConnectionStatus> _statusController;
  
  // Connection URL: wss://api.mnbara.com/ws/tracking/{deliveryId}
  
  // Methods:
  Future<void> connect(String deliveryId, String authToken);
  void disconnect();
  void _handleMessage(dynamic message);
  void _reconnect();
  
  // Streams:
  Stream<TravelerLocation> get locationStream;
  Stream<ConnectionStatus> get statusStream;
}
```

### 4. TrackingBottomSheet

Draggable bottom sheet with delivery details.

```dart
class TrackingBottomSheet extends StatelessWidget {
  final TravelerLocation location;
  final VoidCallback onCall;
  final VoidCallback onChat;
  final VoidCallback onNavigate;
  
  // Sections:
  // - Traveler info (photo, name, rating)
  // - ETA and distance
  // - Quick actions (call, chat, navigate)
  // - Delivery timeline
  // - Product info (collapsible)
}
```

## WebSocket Protocol

### Connection
```
URL: wss://api.mnbara.com/ws/tracking/{deliveryId}
Headers:
  Authorization: Bearer {jwt_token}
```

### Message Types

**Server → Client: Location Update**
```json
{
  "type": "location_update",
  "data": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "heading": 45.0,
    "speed": 12.5,
    "timestamp": "2025-12-24T14:30:00Z",
    "eta_seconds": 900,
    "distance_meters": 3200
  }
}
```

**Server → Client: Status Update**
```json
{
  "type": "status_update",
  "data": {
    "status": "delivered",
    "timestamp": "2025-12-24T14:45:00Z"
  }
}
```

**Client → Server: Ping**
```json
{
  "type": "ping"
}
```

**Server → Client: Pong**
```json
{
  "type": "pong"
}
```

## Traveler Location Sharing (Background)

For the traveler side, location sharing when delivery is active:

```dart
class TravelerLocationService {
  // Uses geolocator package for GPS
  // Sends location to backend every 10 seconds
  // Runs in background using flutter_background_service
  
  Future<void> startSharing(String deliveryId);
  Future<void> stopSharing();
  
  // Location settings for battery optimization:
  // - Accuracy: LocationAccuracy.high when moving
  // - Accuracy: LocationAccuracy.balanced when stationary
  // - Distance filter: 10 meters
}
```

## Translations (Arabic/English)

Key translations to add to `app_localizations.dart`:

| Key | English | Arabic |
|-----|---------|--------|
| track_delivery | Track Delivery | تتبع التوصيل |
| live_tracking | Live Tracking | التتبع المباشر |
| traveler_on_way | {name} is on the way | {name} في الطريق |
| eta_minutes | ETA: {min} min | الوصول: {min} دقيقة |
| distance_away | {km} km away | على بعد {km} كم |
| call_traveler | Call Traveler | اتصل بالمسافر |
| message_traveler | Message Traveler | راسل المسافر |
| navigate_to_pickup | Navigate to Pickup | التنقل إلى نقطة الاستلام |
| connection_lost | Connection lost | انقطع الاتصال |
| reconnecting | Reconnecting... | جاري إعادة الاتصال... |
| last_known_location | Last known location | آخر موقع معروف |
| location_unavailable | Location unavailable | الموقع غير متاح |
| center_on_traveler | Center on traveler | التمركز على المسافر |
| share_location | Share Location | مشاركة الموقع |
| picked_up_at | Picked up at {time} | تم الاستلام في {time} |
| in_transit | In transit | في الطريق |
| arriving_soon | Arriving soon | سيصل قريباً |
| delivered | Delivered | تم التوصيل |

## Route Integration

Add to `app_router.dart`:

```dart
GoRoute(
  path: '/tracking/:deliveryId',
  builder: (context, state) {
    final deliveryId = state.pathParameters['deliveryId']!;
    return LiveTrackingScreen(deliveryId: deliveryId);
  },
),
```

## Error Handling Strategy

| Error | User Message (EN) | User Message (AR) | Action |
|-------|-------------------|-------------------|--------|
| WebSocket disconnect | Connection lost. Reconnecting... | انقطع الاتصال. جاري إعادة الاتصال... | Auto-reconnect with backoff |
| Location permission denied | Location permission required | مطلوب إذن الموقع | Show settings button |
| Traveler location unavailable | Traveler location unavailable | موقع المسافر غير متاح | Show last known + retry |
| Network offline | You're offline | أنت غير متصل | Show cached location |
| Delivery completed | Delivery completed! | تم التوصيل! | Show completion animation |

## Performance Considerations

1. **Map Optimization**
   - Use marker clustering if multiple deliveries
   - Limit polyline points to reduce memory
   - Dispose map controller properly

2. **WebSocket Efficiency**
   - Implement heartbeat (ping/pong) every 30 seconds
   - Reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
   - Buffer location updates if UI is not visible

3. **Battery Optimization (Traveler)**
   - Reduce accuracy when stationary
   - Batch location updates
   - Stop updates when app is killed

## Security Considerations

1. **Authentication**
   - WebSocket requires valid JWT token
   - Token refresh before expiry

2. **Privacy**
   - Location only shared during active delivery
   - Buyer can only track their own deliveries
   - Location history not persisted after delivery

3. **Data Validation**
   - Validate coordinates are within reasonable bounds
   - Sanitize all WebSocket messages

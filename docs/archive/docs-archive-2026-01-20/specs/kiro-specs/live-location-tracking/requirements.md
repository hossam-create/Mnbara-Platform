# Requirements Document - Live Location Tracking (تتبع الموقع المباشر)

## Introduction

This document defines the requirements for implementing live location tracking in the MNBARA Flutter mobile app. This feature allows buyers to track their traveler's real-time location during delivery, similar to Uber/Careem tracking experience. The feature enhances the crowdshipping experience by providing transparency and real-time visibility into delivery progress.

**Current State:** The app currently has status-based tracking (timeline showing: Pending → Picked Up → In Transit → Delivered). This spec adds GPS-based live tracking with map visualization.

## Glossary

- **Buyer (مشتري)**: User who requested the delivery and wants to track the traveler
- **Traveler (مسافر)**: User who is delivering the item and shares their location
- **Live Tracking**: Real-time GPS location updates displayed on a map
- **WebSocket**: Protocol for real-time bidirectional communication
- **Geolocation**: GPS coordinates (latitude, longitude) of the traveler
- **ETA**: Estimated Time of Arrival calculated based on current location and destination

## Requirements

### Requirement 1: Buyer Live Tracking Screen

**User Story:** As a buyer (مشتري), I want to see my traveler's live location on a map, so that I know exactly where my delivery is.

#### Acceptance Criteria

1. WHEN a buyer opens the tracking screen for an active delivery, THE Mobile_App SHALL display a Google Map with the traveler's current location marker.
2. THE Mobile_App SHALL show the pickup point (origin) and delivery point (destination) as distinct markers on the map.
3. THE Mobile_App SHALL draw a route line between the traveler's current location and the destination.
4. WHEN the traveler's location updates, THE Mobile_App SHALL animate the traveler marker to the new position smoothly.
5. THE Mobile_App SHALL display the traveler's name, photo, and contact button on the tracking screen.
6. THE Mobile_App SHALL show estimated time of arrival (ETA) based on current location and traffic conditions.
7. THE Mobile_App SHALL support both Arabic (العربية) and English languages for all UI elements.

### Requirement 2: Real-Time Location Updates via WebSocket

**User Story:** As a buyer, I want to receive location updates in real-time, so that I can see the traveler moving on the map without refreshing.

#### Acceptance Criteria

1. WHEN the tracking screen opens, THE Mobile_App SHALL establish a WebSocket connection to the location-tracking service.
2. THE Mobile_App SHALL receive location updates at least every 10 seconds when the traveler is actively moving.
3. WHEN the WebSocket connection is lost, THE Mobile_App SHALL attempt automatic reconnection with exponential backoff.
4. THE Mobile_App SHALL display a "Reconnecting..." indicator when the connection is interrupted.
5. WHEN the delivery status changes (picked_up, delivered, completed), THE Mobile_App SHALL receive the update via WebSocket and update the UI accordingly.

### Requirement 3: Traveler Location Sharing

**User Story:** As a traveler (مسافر), I want to share my location during active deliveries, so that buyers can track their orders.

#### Acceptance Criteria

1. WHEN a traveler marks a delivery as "picked_up", THE Mobile_App SHALL start background location sharing automatically.
2. THE Mobile_App SHALL request location permissions with clear explanation in Arabic and English.
3. THE Mobile_App SHALL share location updates to the backend every 10 seconds during active delivery.
4. WHEN the delivery is marked as "delivered" or "completed", THE Mobile_App SHALL stop location sharing.
5. THE Mobile_App SHALL optimize battery usage by using appropriate location accuracy settings.
6. THE Mobile_App SHALL continue location sharing even when the app is in background (with user permission).

### Requirement 4: Location Tracking Provider (State Management)

**User Story:** As a developer, I want a clean state management solution for location tracking, so that the feature is maintainable and testable.

#### Acceptance Criteria

1. THE Mobile_App SHALL implement a LocationTrackingProvider using Riverpod for state management.
2. THE Provider SHALL manage WebSocket connection lifecycle (connect, disconnect, reconnect).
3. THE Provider SHALL store and update traveler location, ETA, and delivery status.
4. THE Provider SHALL handle error states (connection failed, location unavailable, permission denied).
5. THE Provider SHALL expose methods: startTracking(deliveryId), stopTracking(), refreshLocation().

### Requirement 5: Map Integration

**User Story:** As a buyer, I want a smooth map experience, so that tracking feels professional and reliable.

#### Acceptance Criteria

1. THE Mobile_App SHALL use Google Maps Flutter plugin for map display.
2. THE Mobile_App SHALL display custom markers for: traveler (car/person icon), pickup point (blue), destination (green).
3. THE Mobile_App SHALL auto-zoom the map to fit all markers (traveler, origin, destination) in view.
4. THE Mobile_App SHALL support map gestures (zoom, pan, rotate) for user interaction.
5. THE Mobile_App SHALL center on traveler location when user taps "Center" button.
6. THE Mobile_App SHALL display traffic layer option for route visualization.

### Requirement 6: Delivery Status Integration

**User Story:** As a buyer, I want to see delivery status alongside the map, so that I have complete visibility.

#### Acceptance Criteria

1. THE Mobile_App SHALL display a collapsible bottom sheet with delivery details below the map.
2. THE Bottom_Sheet SHALL show: product info, traveler info, current status, ETA, and timeline.
3. WHEN the delivery status changes, THE Mobile_App SHALL update the timeline and show a notification.
4. THE Mobile_App SHALL provide quick actions: Call Traveler, Message Traveler, Report Issue.
5. THE Mobile_App SHALL show delivery completion animation when status becomes "delivered".

### Requirement 7: Offline and Error Handling

**User Story:** As a buyer, I want the app to handle connectivity issues gracefully, so that I don't lose track of my delivery.

#### Acceptance Criteria

1. WHEN the device loses internet connection, THE Mobile_App SHALL display "Offline - Last known location" with timestamp.
2. THE Mobile_App SHALL cache the last known traveler location locally.
3. WHEN location permission is denied, THE Mobile_App SHALL show a clear message explaining why permission is needed.
4. WHEN the traveler's location is unavailable, THE Mobile_App SHALL display "Location unavailable" with retry option.
5. THE Mobile_App SHALL handle API errors gracefully with user-friendly error messages in Arabic and English.

### Requirement 8: Navigation Integration

**User Story:** As a buyer, I want to navigate to the delivery location, so that I can meet the traveler if needed.

#### Acceptance Criteria

1. THE Mobile_App SHALL provide "Navigate to Pickup" button that opens Google Maps/Apple Maps with directions.
2. THE Mobile_App SHALL provide "Share Location" option to share the delivery destination with others.
3. THE Mobile_App SHALL display distance remaining to destination in kilometers.

## Technical Implementation Notes

### Files to Create
- `mobile/flutter_app/lib/features/buyer/screens/live_tracking_screen.dart` - Main tracking screen with map
- `mobile/flutter_app/lib/features/buyer/providers/location_tracking_provider.dart` - Riverpod state management
- `mobile/flutter_app/lib/features/buyer/services/location_websocket_service.dart` - WebSocket connection handler
- `mobile/flutter_app/lib/features/buyer/models/traveler_location_model.dart` - Location data model
- `mobile/flutter_app/lib/features/buyer/widgets/tracking_bottom_sheet.dart` - Bottom sheet with delivery info
- `mobile/flutter_app/lib/features/buyer/widgets/traveler_marker.dart` - Custom map marker widget

### Files to Modify
- `mobile/flutter_app/lib/core/router/app_router.dart` - Add tracking route
- `mobile/flutter_app/lib/core/l10n/app_localizations.dart` - Add Arabic/English translations
- `mobile/flutter_app/lib/features/orders/screens/order_details_screen.dart` - Add "Track Delivery" button
- `mobile/flutter_app/pubspec.yaml` - Already has google_maps_flutter and geolocator

### Dependencies (Already in pubspec.yaml)
- `google_maps_flutter: ^2.5.3` ✓
- `geolocator: ^10.1.0` ✓

### Backend Requirements
- WebSocket endpoint for location updates: `wss://api.mnbara.com/ws/tracking/{deliveryId}`
- REST endpoint for initial location: `GET /api/deliveries/{id}/location`
- Traveler location update endpoint: `POST /api/deliveries/{id}/location`

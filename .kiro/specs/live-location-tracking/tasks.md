# Implementation Tasks - Live Location Tracking

## Phase 1: Core Infrastructure

### Task 1.1: Create Location Data Models
- [x] Create `mobile/flutter_app/lib/features/buyer/models/traveler_location_model.dart`
  - TravelerLocation class with all fields
  - LocationTrackingState class
  - ConnectionStatus enum
  - JSON serialization methods
- **Estimate:** 30 min ✅ DONE

### Task 1.2: Create WebSocket Service
- [x] Create `mobile/flutter_app/lib/features/buyer/services/location_websocket_service.dart`
  - WebSocket connection management
  - Message parsing (location_update, status_update)
  - Reconnection logic with exponential backoff
  - Ping/pong heartbeat
  - Stream controllers for location and status
- **Estimate:** 1 hour ✅ DONE

### Task 1.3: Create Location Tracking Provider
- [x] Create `mobile/flutter_app/lib/features/buyer/providers/location_tracking_provider.dart`
  - Riverpod StateNotifier for LocationTrackingState
  - startTracking(deliveryId) method
  - stopTracking() method
  - WebSocket integration
  - Error handling
- **Estimate:** 45 min ✅ DONE

## Phase 2: UI Components

### Task 2.1: Create Tracking Bottom Sheet Widget
- [x] Create `mobile/flutter_app/lib/features/buyer/widgets/tracking_bottom_sheet.dart`
  - Draggable bottom sheet
  - Traveler info section (photo, name, rating)
  - ETA and distance display
  - Quick action buttons (call, chat, navigate)
  - Delivery timeline
  - Bilingual support (AR/EN)
- **Estimate:** 1 hour ✅ DONE

### Task 2.2: Create Custom Map Markers
- [x] Create `mobile/flutter_app/lib/features/buyer/widgets/traveler_marker.dart`
  - Custom traveler marker (car icon with direction)
  - Origin marker (blue pin)
  - Destination marker (green pin)
  - Marker animation helper
- **Estimate:** 30 min ✅ DONE

### Task 2.3: Create Live Tracking Screen
- [x] Create `mobile/flutter_app/lib/features/buyer/screens/live_tracking_screen.dart`
  - Full-screen Google Map
  - Marker placement (traveler, origin, destination)
  - Polyline route drawing
  - Connection status indicator
  - Center on traveler FAB
  - Integration with bottom sheet
  - Loading and error states
- **Estimate:** 2 hours ✅ DONE

## Phase 3: Integration

### Task 3.1: Add Translations
- [x] Update `mobile/flutter_app/lib/core/l10n/app_localizations.dart`
  - Add 20+ new translation keys for tracking feature
  - Arabic translations
  - English translations
- **Estimate:** 20 min ✅ DONE

### Task 3.2: Add Route to Router
- [x] Update `mobile/flutter_app/lib/core/router/app_router.dart`
  - Add `/tracking/:deliveryId` route
  - Import LiveTrackingScreen
- **Estimate:** 10 min ✅ DONE

### Task 3.3: Add Track Button to Order Details
- [x] Update `mobile/flutter_app/lib/features/orders/screens/order_details_screen.dart`
  - Add "Track Delivery" button for active deliveries
  - Navigate to tracking screen
- **Estimate:** 20 min ✅ DONE

### Task 3.4: Add Track Button to Delivery Detail (Buyer View)
- [x] Create buyer-specific delivery tracking entry point
  - Link from order details to tracking
  - Show tracking option only for in-transit deliveries
- **Estimate:** 15 min ✅ DONE

## Phase 4: Traveler Location Sharing

### Task 4.1: Create Traveler Location Service
- [x] Create `mobile/flutter_app/lib/features/traveler/services/traveler_location_service.dart`
  - GPS location acquisition using geolocator
  - Location update posting to backend
  - Battery-optimized settings
  - Start/stop sharing methods
- **Estimate:** 45 min ✅ DONE

### Task 4.2: Integrate Location Sharing in Traveler Flow
- [x] Update `mobile/flutter_app/lib/features/traveler/providers/traveler_provider.dart`
  - Start location sharing when delivery picked up
  - Stop location sharing when delivered
- [x] Update `mobile/flutter_app/lib/features/traveler/screens/delivery_detail_screen.dart`
  - Show location sharing status indicator
- **Estimate:** 30 min ✅ DONE

## Phase 5: Polish & Testing

### Task 5.1: Error Handling & Edge Cases
- [x] Handle WebSocket disconnection gracefully
- [x] Handle location permission denied
- [x] Handle traveler location unavailable
- [x] Handle network offline mode
- [x] Add retry mechanisms
- **Estimate:** 45 min ✅ DONE

### Task 5.2: Animations & UX Polish
- [x] Smooth marker animation on location update
- [x] Map camera animation to follow traveler
- [x] Delivery completion celebration animation
- [x] Loading shimmer effects
- **Estimate:** 30 min ✅ DONE

### Task 5.3: Testing
- [ ] Test WebSocket connection/reconnection
- [ ] Test map rendering with markers
- [ ] Test bottom sheet interactions
- [ ] Test bilingual UI (Arabic RTL, English LTR)
- [ ] Test on Android and iOS
- **Estimate:** 1 hour

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Core Infrastructure | 3 | ✅ Complete |
| Phase 2: UI Components | 3 | ✅ Complete |
| Phase 3: Integration | 4 | ✅ Complete |
| Phase 4: Traveler Location | 2 | ✅ Complete |
| Phase 5: Polish & Testing | 3 | 🔄 Testing Pending |
| **Total** | **15** | **14/15 Complete** |

## Dependencies

- Google Maps API key configured in Android/iOS
- Backend WebSocket endpoint ready
- Backend REST endpoint for initial location

## Files to Create (7 new files)

1. `mobile/flutter_app/lib/features/buyer/models/traveler_location_model.dart`
2. `mobile/flutter_app/lib/features/buyer/services/location_websocket_service.dart`
3. `mobile/flutter_app/lib/features/buyer/providers/location_tracking_provider.dart`
4. `mobile/flutter_app/lib/features/buyer/widgets/tracking_bottom_sheet.dart`
5. `mobile/flutter_app/lib/features/buyer/widgets/traveler_marker.dart`
6. `mobile/flutter_app/lib/features/buyer/screens/live_tracking_screen.dart`
7. `mobile/flutter_app/lib/features/traveler/services/traveler_location_service.dart`

## Files to Modify (4 files)

1. `mobile/flutter_app/lib/core/l10n/app_localizations.dart` - Add translations
2. `mobile/flutter_app/lib/core/router/app_router.dart` - Add route
3. `mobile/flutter_app/lib/features/orders/screens/order_details_screen.dart` - Add track button
4. `mobile/flutter_app/lib/features/traveler/providers/traveler_provider.dart` - Location sharing

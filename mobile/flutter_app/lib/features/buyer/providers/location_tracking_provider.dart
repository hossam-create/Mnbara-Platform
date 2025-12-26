import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/network/api_client.dart';
import '../models/traveler_location_model.dart';
import '../services/location_websocket_service.dart';

final locationTrackingProvider = StateNotifierProvider.autoDispose<
    LocationTrackingNotifier, LocationTrackingState>((ref) {
  final notifier = LocationTrackingNotifier(ref);
  ref.onDispose(() => notifier.dispose());
  return notifier;
});

class LocationTrackingNotifier extends StateNotifier<LocationTrackingState> {
  final Ref _ref;
  final LocationWebSocketService _wsService = LocationWebSocketService();
  StreamSubscription<TravelerLocation>? _locationSub;
  StreamSubscription<ConnectionStatus>? _statusSub;
  String? _currentDeliveryId;

  LocationTrackingNotifier(this._ref) : super(LocationTrackingState.initial()) {
    _setupStreams();
  }

  void _setupStreams() {
    _locationSub = _wsService.locationStream.listen(_onLocationUpdate);
    _statusSub = _wsService.statusStream.listen(_onConnectionStatusChange);
  }

  /// Start tracking a delivery
  Future<void> startTracking(String deliveryId) async {
    if (_currentDeliveryId == deliveryId && state.isConnected) return;
    
    _currentDeliveryId = deliveryId;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      // Fetch initial location data from REST API
      final initialLocation = await _fetchInitialLocation(deliveryId);
      
      if (initialLocation != null) {
        state = state.copyWith(
          currentLocation: initialLocation,
          isLoading: false,
          lastUpdate: DateTime.now(),
        );
      }

      // Connect to WebSocket for real-time updates
      await _wsService.connect(deliveryId);
      
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        connectionStatus: ConnectionStatus.error,
      );
    }
  }

  Future<TravelerLocation?> _fetchInitialLocation(String deliveryId) async {
    try {
      final apiClient = _ref.read(apiClientProvider);
      final response = await apiClient.get('/api/deliveries/$deliveryId/tracking');
      
      if (response.statusCode == 200 && response.data != null) {
        return TravelerLocation.fromJson(response.data);
      }
    } catch (e) {
      // Will rely on WebSocket for data
    }
    return null;
  }

  void _onLocationUpdate(TravelerLocation location) {
    final currentLoc = state.currentLocation;
    
    // Merge new location data with existing data
    final updatedLocation = currentLoc != null
        ? currentLoc.copyWith(
            latitude: location.latitude,
            longitude: location.longitude,
            heading: location.heading,
            speed: location.speed,
            timestamp: location.timestamp,
            address: location.address,
            status: location.status,
            eta: location.eta,
            distanceRemaining: location.distanceRemaining,
          )
        : location;

    // Add to route history
    final newRoutePoints = [...state.routePoints, updatedLocation.currentLatLng];
    // Keep last 100 points to avoid memory issues
    final trimmedRoute = newRoutePoints.length > 100 
        ? newRoutePoints.sublist(newRoutePoints.length - 100)
        : newRoutePoints;

    state = state.copyWith(
      currentLocation: updatedLocation,
      routePoints: trimmedRoute,
      lastUpdate: DateTime.now(),
      clearError: true,
    );
  }

  void _onConnectionStatusChange(ConnectionStatus status) {
    state = state.copyWith(connectionStatus: status);
    
    if (status == ConnectionStatus.error) {
      state = state.copyWith(error: 'connection_lost');
    }
  }

  /// Stop tracking
  void stopTracking() {
    _wsService.disconnect();
    _currentDeliveryId = null;
    state = LocationTrackingState.initial();
  }

  /// Refresh location manually
  Future<void> refreshLocation() async {
    if (_currentDeliveryId == null) return;
    
    state = state.copyWith(isLoading: true);
    
    try {
      final location = await _fetchInitialLocation(_currentDeliveryId!);
      if (location != null) {
        state = state.copyWith(
          currentLocation: location,
          isLoading: false,
          lastUpdate: DateTime.now(),
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  /// Get bounds that fit all markers
  LatLngBounds? getBounds() {
    final loc = state.currentLocation;
    if (loc == null) return null;

    final points = [loc.currentLatLng, loc.origin, loc.destination];
    
    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;

    for (final point in points) {
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
    }

    // Add padding
    const padding = 0.01;
    return LatLngBounds(
      southwest: LatLng(minLat - padding, minLng - padding),
      northeast: LatLng(maxLat + padding, maxLng + padding),
    );
  }

  void dispose() {
    _locationSub?.cancel();
    _statusSub?.cancel();
    _wsService.dispose();
  }
}

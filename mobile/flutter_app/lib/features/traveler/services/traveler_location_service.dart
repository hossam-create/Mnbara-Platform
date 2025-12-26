import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';

/// Service for sharing traveler's location during active deliveries
class TravelerLocationService {
  static final TravelerLocationService _instance = TravelerLocationService._internal();
  factory TravelerLocationService() => _instance;
  TravelerLocationService._internal();

  Timer? _locationTimer;
  StreamSubscription<Position>? _positionStream;
  String? _activeDeliveryId;
  final _storage = const FlutterSecureStorage();
  
  bool _isSharing = false;
  static const int _updateIntervalSeconds = 10;
  static const String _baseUrl = 'https://api.mnbara.com';

  bool get isSharing => _isSharing;
  String? get activeDeliveryId => _activeDeliveryId;

  /// Start sharing location for a delivery
  Future<bool> startSharing(String deliveryId) async {
    if (_isSharing && _activeDeliveryId == deliveryId) return true;

    // Check and request permissions
    final hasPermission = await _checkPermissions();
    if (!hasPermission) return false;

    _activeDeliveryId = deliveryId;
    _isSharing = true;

    // Start location updates
    await _startLocationUpdates();
    
    return true;
  }

  /// Stop sharing location
  void stopSharing() {
    _locationTimer?.cancel();
    _positionStream?.cancel();
    _locationTimer = null;
    _positionStream = null;
    _activeDeliveryId = null;
    _isSharing = false;
  }

  Future<bool> _checkPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  Future<void> _startLocationUpdates() async {
    // Get initial position
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      await _sendLocationUpdate(position);
    } catch (e) {
      // Continue anyway, will retry
    }

    // Set up periodic updates
    _locationTimer = Timer.periodic(
      const Duration(seconds: _updateIntervalSeconds),
      (_) => _getAndSendLocation(),
    );

    // Also listen to position stream for more accurate updates when moving
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // Update every 10 meters
    );

    _positionStream = Geolocator.getPositionStream(locationSettings: locationSettings)
        .listen((Position position) {
      _sendLocationUpdate(position);
    });
  }

  Future<void> _getAndSendLocation() async {
    if (!_isSharing || _activeDeliveryId == null) return;

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 5),
      );
      await _sendLocationUpdate(position);
    } catch (e) {
      // Silently fail, will retry on next interval
    }
  }

  Future<void> _sendLocationUpdate(Position position) async {
    if (_activeDeliveryId == null) return;

    try {
      final token = await _storage.read(key: 'auth_token');
      if (token == null) return;

      final dio = Dio(BaseOptions(
        baseUrl: _baseUrl,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ));

      await dio.post(
        '/api/deliveries/$_activeDeliveryId/location',
        data: {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'heading': position.heading,
          'speed': position.speed,
          'accuracy': position.accuracy,
          'timestamp': position.timestamp?.toIso8601String() ?? DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      // Silently fail, will retry
    }
  }

  /// Get current position once
  Future<Position?> getCurrentPosition() async {
    final hasPermission = await _checkPermissions();
    if (!hasPermission) return null;

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      return null;
    }
  }

  /// Check if location services are available
  Future<bool> isLocationAvailable() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Open location settings
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }

  /// Open app settings for permissions
  Future<bool> openAppSettings() async {
    return await Geolocator.openAppSettings();
  }
}

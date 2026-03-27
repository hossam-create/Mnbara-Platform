import 'package:equatable/equatable.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Connection status for WebSocket
enum ConnectionStatus {
  connected,
  connecting,
  disconnected,
  reconnecting,
  error,
}

/// Traveler's real-time location data
class TravelerLocation extends Equatable {
  final String deliveryId;
  final double latitude;
  final double longitude;
  final double? heading;
  final double? speed;
  final DateTime timestamp;
  final String? address;
  
  // Traveler info
  final String travelerId;
  final String travelerName;
  final String? travelerPhoto;
  final String? travelerPhone;
  final double? travelerRating;
  
  // Delivery info
  final String status;
  final LatLng origin;
  final LatLng destination;
  final String originAddress;
  final String destinationAddress;
  final Duration? eta;
  final double? distanceRemaining;
  
  // Product info
  final String? productTitle;
  final String? productImage;

  const TravelerLocation({
    required this.deliveryId,
    required this.latitude,
    required this.longitude,
    this.heading,
    this.speed,
    required this.timestamp,
    this.address,
    required this.travelerId,
    required this.travelerName,
    this.travelerPhoto,
    this.travelerPhone,
    this.travelerRating,
    required this.status,
    required this.origin,
    required this.destination,
    required this.originAddress,
    required this.destinationAddress,
    this.eta,
    this.distanceRemaining,
    this.productTitle,
    this.productImage,
  });

  LatLng get currentLatLng => LatLng(latitude, longitude);

  factory TravelerLocation.fromJson(Map<String, dynamic> json) {
    return TravelerLocation(
      deliveryId: json['delivery_id'] ?? json['deliveryId'] ?? '',
      latitude: (json['latitude'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? 0).toDouble(),
      heading: json['heading']?.toDouble(),
      speed: json['speed']?.toDouble(),
      timestamp: json['timestamp'] != null 
          ? DateTime.parse(json['timestamp']) 
          : DateTime.now(),
      address: json['address'],
      travelerId: json['traveler_id'] ?? json['travelerId'] ?? '',
      travelerName: json['traveler_name'] ?? json['travelerName'] ?? '',
      travelerPhoto: json['traveler_photo'] ?? json['travelerPhoto'],
      travelerPhone: json['traveler_phone'] ?? json['travelerPhone'],
      travelerRating: json['traveler_rating']?.toDouble(),
      status: json['status'] ?? 'in_transit',
      origin: LatLng(
        (json['origin']?['latitude'] ?? json['origin_lat'] ?? 0).toDouble(),
        (json['origin']?['longitude'] ?? json['origin_lng'] ?? 0).toDouble(),
      ),
      destination: LatLng(
        (json['destination']?['latitude'] ?? json['destination_lat'] ?? 0).toDouble(),
        (json['destination']?['longitude'] ?? json['destination_lng'] ?? 0).toDouble(),
      ),
      originAddress: json['origin_address'] ?? json['originAddress'] ?? '',
      destinationAddress: json['destination_address'] ?? json['destinationAddress'] ?? '',
      eta: json['eta_seconds'] != null 
          ? Duration(seconds: json['eta_seconds']) 
          : null,
      distanceRemaining: json['distance_meters']?.toDouble(),
      productTitle: json['product_title'] ?? json['productTitle'],
      productImage: json['product_image'] ?? json['productImage'],
    );
  }

  TravelerLocation copyWith({
    double? latitude,
    double? longitude,
    double? heading,
    double? speed,
    DateTime? timestamp,
    String? address,
    String? status,
    Duration? eta,
    double? distanceRemaining,
  }) {
    return TravelerLocation(
      deliveryId: deliveryId,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      heading: heading ?? this.heading,
      speed: speed ?? this.speed,
      timestamp: timestamp ?? this.timestamp,
      address: address ?? this.address,
      travelerId: travelerId,
      travelerName: travelerName,
      travelerPhoto: travelerPhoto,
      travelerPhone: travelerPhone,
      travelerRating: travelerRating,
      status: status ?? this.status,
      origin: origin,
      destination: destination,
      originAddress: originAddress,
      destinationAddress: destinationAddress,
      eta: eta ?? this.eta,
      distanceRemaining: distanceRemaining ?? this.distanceRemaining,
      productTitle: productTitle,
      productImage: productImage,
    );
  }

  @override
  List<Object?> get props => [
    deliveryId, latitude, longitude, heading, speed, timestamp,
    travelerId, status, eta, distanceRemaining,
  ];
}

/// State for location tracking
class LocationTrackingState extends Equatable {
  final TravelerLocation? currentLocation;
  final List<LatLng> routePoints;
  final bool isLoading;
  final String? error;
  final DateTime? lastUpdate;
  final ConnectionStatus connectionStatus;

  const LocationTrackingState({
    this.currentLocation,
    this.routePoints = const [],
    this.isLoading = false,
    this.error,
    this.lastUpdate,
    this.connectionStatus = ConnectionStatus.disconnected,
  });

  factory LocationTrackingState.initial() => const LocationTrackingState();

  bool get isConnected => connectionStatus == ConnectionStatus.connected;
  bool get isReconnecting => connectionStatus == ConnectionStatus.reconnecting;
  bool get hasError => error != null;

  LocationTrackingState copyWith({
    TravelerLocation? currentLocation,
    List<LatLng>? routePoints,
    bool? isLoading,
    String? error,
    DateTime? lastUpdate,
    ConnectionStatus? connectionStatus,
    bool clearError = false,
  }) {
    return LocationTrackingState(
      currentLocation: currentLocation ?? this.currentLocation,
      routePoints: routePoints ?? this.routePoints,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      lastUpdate: lastUpdate ?? this.lastUpdate,
      connectionStatus: connectionStatus ?? this.connectionStatus,
    );
  }

  @override
  List<Object?> get props => [
    currentLocation, routePoints, isLoading, error, lastUpdate, connectionStatus,
  ];
}

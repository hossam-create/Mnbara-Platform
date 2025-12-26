import 'package:equatable/equatable.dart';

class Trip extends Equatable {
  final String id;
  final String travelerId;
  final String origin;
  final String destination;
  final DateTime departureDate;
  final DateTime arrivalDate;
  final double availableCapacity;
  final double usedCapacity;
  final String status;
  final double potentialEarnings;
  final List<Map<String, dynamic>> matchedRequests;
  final DateTime createdAt;

  const Trip({
    required this.id,
    required this.travelerId,
    required this.origin,
    required this.destination,
    required this.departureDate,
    required this.arrivalDate,
    required this.availableCapacity,
    this.usedCapacity = 0,
    required this.status,
    this.potentialEarnings = 0,
    this.matchedRequests = const [],
    required this.createdAt,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['id'],
      travelerId: json['travelerId'] ?? '',
      origin: json['origin'],
      destination: json['destination'],
      departureDate: DateTime.parse(json['departAt'] ?? json['departureDate']),
      arrivalDate: DateTime.parse(json['arriveAt'] ?? json['arrivalDate']),
      availableCapacity: (json['capacityKg'] ?? json['availableCapacity'] as num).toDouble(),
      usedCapacity: (json['usedCapacity'] as num?)?.toDouble() ?? 0,
      status: json['status'] ?? 'active',
      potentialEarnings: (json['potentialEarnings'] as num?)?.toDouble() ?? 0,
      matchedRequests: List<Map<String, dynamic>>.from(json['matchedRequests'] ?? []),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'travelerId': travelerId,
    'origin': origin,
    'destination': destination,
    'departAt': departureDate.toIso8601String(),
    'arriveAt': arrivalDate.toIso8601String(),
    'capacityKg': availableCapacity,
    'status': status,
    'createdAt': createdAt.toIso8601String(),
  };

  @override
  List<Object?> get props => [id, origin, destination, status];
}

class Delivery extends Equatable {
  final String id;
  final String tripId;
  final String requestId;
  final String status;
  final String productTitle;
  final String? productDescription;
  final String? productImage;
  final String origin;
  final String destination;
  final double earnings;
  final DateTime? deadline;
  final String? buyerName;
  final DateTime createdAt;

  const Delivery({
    required this.id,
    required this.tripId,
    required this.requestId,
    required this.status,
    required this.productTitle,
    this.productDescription,
    this.productImage,
    required this.origin,
    required this.destination,
    required this.earnings,
    this.deadline,
    this.buyerName,
    required this.createdAt,
  });

  factory Delivery.fromJson(Map<String, dynamic> json) {
    return Delivery(
      id: json['id'],
      tripId: json['tripId'] ?? '',
      requestId: json['requestId'] ?? '',
      status: json['status'] ?? 'proposed',
      productTitle: json['request']?['product']?['title'] ?? json['productTitle'] ?? 'Product',
      productDescription: json['request']?['product']?['description'] ?? json['productDescription'],
      productImage: json['request']?['product']?['images']?[0] ?? json['productImage'],
      origin: json['trip']?['origin'] ?? json['origin'] ?? '',
      destination: json['request']?['destination'] ?? json['destination'] ?? '',
      earnings: (json['request']?['budget'] ?? json['earnings'] as num?)?.toDouble() ?? 0,
      deadline: json['request']?['deadline'] != null ? DateTime.parse(json['request']['deadline']) : null,
      buyerName: json['request']?['buyer']?['name'] ?? json['buyerName'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [id, tripId, requestId, status];
}

class TravelerStats {
  final int activeTrips;
  final int activeDeliveries;
  final double monthlyEarnings;
  final double totalEarnings;
  final int pendingRequests;
  final int completedDeliveries;
  final double rating;

  TravelerStats({
    this.activeTrips = 0,
    this.activeDeliveries = 0,
    this.monthlyEarnings = 0,
    this.totalEarnings = 0,
    this.pendingRequests = 0,
    this.completedDeliveries = 0,
    this.rating = 0,
  });

  factory TravelerStats.fromJson(Map<String, dynamic> json) {
    return TravelerStats(
      activeTrips: json['activeTrips'] ?? 0,
      activeDeliveries: json['activeDeliveries'] ?? 0,
      monthlyEarnings: (json['monthlyEarnings'] as num?)?.toDouble() ?? 0,
      totalEarnings: (json['totalEarnings'] as num?)?.toDouble() ?? 0,
      pendingRequests: json['pendingRequests'] ?? 0,
      completedDeliveries: json['completedDeliveries'] ?? 0,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
    );
  }
}

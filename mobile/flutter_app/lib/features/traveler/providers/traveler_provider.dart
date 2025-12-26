import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/trip_model.dart';
import '../services/traveler_location_service.dart';

final travelerProvider = StateNotifierProvider<TravelerNotifier, TravelerState>((ref) {
  return TravelerNotifier(ref.read(apiClientProvider));
});

class TravelerState {
  final List<Trip> trips;
  final List<Delivery> deliveries;
  final TravelerStats? stats;
  final Trip? selectedTrip;
  final Delivery? selectedDelivery;
  final bool isLoading;
  final String? error;

  TravelerState({
    this.trips = const [],
    this.deliveries = const [],
    this.stats,
    this.selectedTrip,
    this.selectedDelivery,
    this.isLoading = false,
    this.error,
  });

  List<Trip> get activeTrips => trips.where((t) => t.status == 'active' || t.status == 'scheduled').toList();
  List<Delivery> get activeDeliveries => deliveries.where((d) => d.status != 'completed' && d.status != 'cancelled').toList();

  TravelerState copyWith({
    List<Trip>? trips,
    List<Delivery>? deliveries,
    TravelerStats? stats,
    Trip? selectedTrip,
    Delivery? selectedDelivery,
    bool? isLoading,
    String? error,
  }) {
    return TravelerState(
      trips: trips ?? this.trips,
      deliveries: deliveries ?? this.deliveries,
      stats: stats ?? this.stats,
      selectedTrip: selectedTrip ?? this.selectedTrip,
      selectedDelivery: selectedDelivery ?? this.selectedDelivery,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class TravelerNotifier extends StateNotifier<TravelerState> {
  final ApiClient _apiClient;
  final TravelerLocationService _locationService = TravelerLocationService();

  TravelerNotifier(this._apiClient) : super(TravelerState());

  Future<void> fetchStats() async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiClient.get('/traveler/stats');
      final stats = TravelerStats.fromJson(response.data);
      
      final tripsResponse = await _apiClient.get('/traveler/trips');
      final trips = (tripsResponse.data['trips'] as List).map((e) => Trip.fromJson(e)).toList();
      
      final deliveriesResponse = await _apiClient.get('/traveler/deliveries');
      final deliveries = (deliveriesResponse.data['deliveries'] as List).map((e) => Delivery.fromJson(e)).toList();
      
      state = state.copyWith(stats: stats, trips: trips, deliveries: deliveries, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<void> loadDeliveries() async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiClient.get('/traveler/deliveries');
      final deliveries = (response.data['deliveries'] as List).map((e) => Delivery.fromJson(e)).toList();
      state = state.copyWith(deliveries: deliveries, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<void> loadDeliveryDetail(String deliveryId) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiClient.get('/traveler/deliveries/$deliveryId');
      final delivery = Delivery.fromJson(response.data);
      state = state.copyWith(selectedDelivery: delivery, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<void> loadTripDetail(String tripId) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiClient.get('/traveler/trips/$tripId');
      final trip = Trip.fromJson(response.data);
      state = state.copyWith(selectedTrip: trip, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<Trip> createTrip({
    required String origin,
    required String destination,
    required DateTime departAt,
    required DateTime arriveAt,
    required double capacityKg,
  }) async {
    final response = await _apiClient.post('/traveler/trips', data: {
      'origin': origin,
      'destination': destination,
      'departAt': departAt.toIso8601String(),
      'arriveAt': arriveAt.toIso8601String(),
      'capacityKg': capacityKg,
    });
    final trip = Trip.fromJson(response.data);
    state = state.copyWith(trips: [trip, ...state.trips]);
    return trip;
  }

  Future<void> cancelTrip(String tripId) async {
    await _apiClient.delete('/traveler/trips/$tripId');
    state = state.copyWith(trips: state.trips.where((t) => t.id != tripId).toList());
  }

  Future<void> cancelDelivery(String deliveryId) async {
    // Stop location sharing if this delivery was being tracked
    if (_locationService.activeDeliveryId == deliveryId) {
      _locationService.stopSharing();
    }
    await _apiClient.patch('/traveler/deliveries/$deliveryId', data: {'status': 'cancelled'});
    await loadDeliveries();
  }

  Future<void> submitEvidence(String deliveryId, String type, String imagePath) async {
    // In production, upload image first then submit
    final newStatus = type == 'pickup' ? 'picked_up' : 'delivered';
    
    await _apiClient.patch('/traveler/deliveries/$deliveryId', data: {
      'status': newStatus,
      'evidence': imagePath,
    });
    
    // Start location sharing when picked up
    if (newStatus == 'picked_up') {
      await _locationService.startSharing(deliveryId);
    }
    // Stop location sharing when delivered
    else if (newStatus == 'delivered') {
      _locationService.stopSharing();
    }
    
    await loadDeliveryDetail(deliveryId);
  }

  Future<void> acceptDelivery(String matchId) async {
    await _apiClient.post('/traveler/deliveries/$matchId/accept');
    await fetchStats();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final nearbyRequestsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get('/traveler/nearby-requests');
  return List<Map<String, dynamic>>.from(response.data['requests']);
});

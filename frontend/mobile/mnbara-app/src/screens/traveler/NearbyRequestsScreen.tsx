/**
 * NearbyRequestsScreen - Display nearby delivery requests using device location
 * Fetches requests from matching-service with radius filter, sorted by distance
 * Requirements: 9.2, 9.3, 12.1, 12.2, 12.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TravelerStackParamList } from '../../types/navigation';
import { useTravelerStore } from '../../store/travelerStore';
import { TravelRequest, Trip } from '../../types';

type NavigationProp = NativeStackNavigationProp<TravelerStackParamList, 'NearbyRequests'>;

// Radius options in km
const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

// Request Card Component
const RequestCard: React.FC<{
  request: TravelRequest;
  onAccept: () => void;
  isAccepting: boolean;
}> = ({ request, onAccept, isAccepting }) => {
  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUrgencyColor = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 2) return '#FF3B30';
    if (diffDays <= 5) return '#FF9500';
    return '#34C759';
  };

  return (
    <View style={styles.requestCard}>
      {/* Product Image */}
      <View style={styles.productImageContainer}>
        {request.product?.images?.[0] ? (
          <Image
            source={{ uri: request.product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImagePlaceholderText}>📦</Text>
          </View>
        )}
      </View>

      {/* Request Details */}
      <View style={styles.requestDetails}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {request.product?.title || 'Product Request'}
        </Text>
        
        <View style={styles.requestMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>{request.destination}</Text>
          </View>
          
          {request.distanceKm !== undefined && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🚗</Text>
              <Text style={styles.metaText}>
                {request.distanceKm < 1
                  ? `${Math.round(request.distanceKm * 1000)}m`
                  : `${request.distanceKm.toFixed(1)}km`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.requestFooter}>
          <View style={styles.budgetContainer}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budgetValue}>${request.budget.toFixed(2)}</Text>
          </View>

          <View style={styles.deadlineContainer}>
            <Text style={styles.deadlineLabel}>Deadline</Text>
            <Text style={[styles.deadlineValue, { color: getUrgencyColor(request.deadline) }]}>
              {formatDeadline(request.deadline)}
            </Text>
          </View>
        </View>
      </View>

      {/* Accept Button */}
      <TouchableOpacity
        style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
        onPress={onAccept}
        disabled={isAccepting}
      >
        {isAccepting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.acceptButtonText}>Accept</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Trip Selection Modal
const TripSelectionModal: React.FC<{
  visible: boolean;
  trips: Trip[];
  onSelect: (tripId: string) => void;
  onClose: () => void;
}> = ({ visible, trips, onSelect, onClose }) => {
  const activeTrips = trips.filter(
    (t) => t.status === 'scheduled' || t.status === 'in_progress'
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.tripModal}>
          <View style={styles.tripModalHeader}>
            <Text style={styles.tripModalTitle}>Select Trip</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {activeTrips.length === 0 ? (
            <View style={styles.noTripsContainer}>
              <Text style={styles.noTripsText}>No active trips available</Text>
              <Text style={styles.noTripsSubtext}>
                Create a trip first to accept delivery requests
              </Text>
            </View>
          ) : (
            <FlatList
              data={activeTrips}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tripItem}
                  onPress={() => onSelect(item.id)}
                >
                  <View style={styles.tripItemRoute}>
                    <Text style={styles.tripItemOrigin}>{item.origin}</Text>
                    <Text style={styles.tripItemArrow}>→</Text>
                    <Text style={styles.tripItemDestination}>{item.destination}</Text>
                  </View>
                  <Text style={styles.tripItemCapacity}>
                    {item.availableKg} kg available
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export const NearbyRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    nearbyRequests,
    trips,
    isLoadingRequests,
    error,
    fetchNearbyRequests,
    fetchTrips,
    acceptRequest,
    setCurrentLocation,
    clearError,
  } = useTravelerStore();

  const [selectedRadius, setSelectedRadius] = useState(50);
  const [currentLocation, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Request location permission and get current location
  const requestLocationPermission = useCallback(async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'MNBARA needs access to your location to show nearby delivery requests.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLocationError('Location permission denied');
          setIsGettingLocation(false);
          return;
        }
      }

      // Get current position
      // Note: In a real app, use @react-native-community/geolocation or expo-location
      // For now, we'll simulate with a mock location
      const mockLocation = {
        lat: 40.7128, // New York coordinates
        lon: -74.0060,
      };
      
      setLocation(mockLocation);
      setCurrentLocation(mockLocation);
      setIsGettingLocation(false);
      
      // Fetch nearby requests
      await fetchNearbyRequests(mockLocation.lat, mockLocation.lon, selectedRadius);
    } catch (err: any) {
      setLocationError(err.message || 'Failed to get location');
      setIsGettingLocation(false);
    }
  }, [selectedRadius, fetchNearbyRequests, setCurrentLocation]);

  // Initial load
  useEffect(() => {
    requestLocationPermission();
    fetchTrips();
  }, []);

  // Refetch when radius changes
  useEffect(() => {
    if (currentLocation) {
      fetchNearbyRequests(currentLocation.lat, currentLocation.lon, selectedRadius);
    }
  }, [selectedRadius, currentLocation, fetchNearbyRequests]);

  const handleRefresh = useCallback(() => {
    if (currentLocation) {
      fetchNearbyRequests(currentLocation.lat, currentLocation.lon, selectedRadius);
    } else {
      requestLocationPermission();
    }
  }, [currentLocation, selectedRadius, fetchNearbyRequests, requestLocationPermission]);

  const handleAcceptRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowTripModal(true);
  };

  const handleTripSelected = async (tripId: string) => {
    if (!selectedRequestId) return;

    setShowTripModal(false);
    setAcceptingRequestId(selectedRequestId);

    try {
      await acceptRequest(selectedRequestId, tripId);
      Alert.alert('Success', 'Request accepted! Check your deliveries.', [
        { text: 'View Deliveries', onPress: () => navigation.navigate('Deliveries') },
        { text: 'Stay Here', style: 'cancel' },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    } finally {
      setAcceptingRequestId(null);
      setSelectedRequestId(null);
    }
  };

  // Sort requests by distance
  const sortedRequests = [...nearbyRequests].sort((a, b) => {
    const distA = a.distanceKm ?? Infinity;
    const distB = b.distanceKm ?? Infinity;
    return distA - distB;
  });

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Location Status */}
      <View style={styles.locationStatus}>
        {isGettingLocation ? (
          <View style={styles.locationLoading}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.locationLoadingText}>Getting your location...</Text>
          </View>
        ) : locationError ? (
          <TouchableOpacity style={styles.locationError} onPress={requestLocationPermission}>
            <Text style={styles.locationErrorText}>⚠️ {locationError}</Text>
            <Text style={styles.locationRetryText}>Tap to retry</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.locationSuccess}>
            <Text style={styles.locationSuccessText}>📍 Location enabled</Text>
          </View>
        )}
      </View>

      {/* Radius Filter */}
      <View style={styles.radiusFilter}>
        <Text style={styles.radiusLabel}>Search Radius:</Text>
        <View style={styles.radiusOptions}>
          {RADIUS_OPTIONS.map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.radiusOption,
                selectedRadius === radius && styles.radiusOptionSelected,
              ]}
              onPress={() => setSelectedRadius(radius)}
            >
              <Text
                style={[
                  styles.radiusOptionText,
                  selectedRadius === radius && styles.radiusOptionTextSelected,
                ]}
              >
                {radius}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {sortedRequests.length} request{sortedRequests.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔍</Text>
      <Text style={styles.emptyStateTitle}>No requests nearby</Text>
      <Text style={styles.emptyStateText}>
        {locationError
          ? 'Enable location to see nearby requests'
          : `No delivery requests within ${selectedRadius}km of your location`}
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleRefresh}>
        <Text style={styles.emptyStateButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Error Banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={sortedRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onAccept={() => handleAcceptRequest(item.id)}
            isAccepting={acceptingRequestId === item.id}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoadingRequests ? renderEmptyState : null}
        refreshControl={
          <RefreshControl refreshing={isLoadingRequests} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Trip Selection Modal */}
      <TripSelectionModal
        visible={showTripModal}
        trips={trips}
        onSelect={handleTripSelected}
        onClose={() => {
          setShowTripModal(false);
          setSelectedRequestId(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 16,
    gap: 16,
  },
  locationStatus: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  locationError: {
    alignItems: 'center',
  },
  locationErrorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  locationRetryText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  locationSuccess: {
    alignItems: 'center',
  },
  locationSuccessText: {
    fontSize: 14,
    color: '#34C759',
  },
  radiusFilter: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  radiusOptionSelected: {
    backgroundColor: '#007AFF',
  },
  radiusOptionText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  radiusOptionTextSelected: {
    color: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  requestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 32,
  },
  requestDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  requestFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  budgetContainer: {},
  budgetLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  deadlineContainer: {},
  deadlineLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  deadlineValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    marginLeft: 8,
  },
  acceptButtonDisabled: {
    backgroundColor: '#007AFF80',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  tripModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    padding: 20,
  },
  tripModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    color: '#8E8E93',
    padding: 4,
  },
  noTripsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noTripsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  noTripsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  tripItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tripItemRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripItemOrigin: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  tripItemArrow: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 8,
  },
  tripItemDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  tripItemCapacity: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

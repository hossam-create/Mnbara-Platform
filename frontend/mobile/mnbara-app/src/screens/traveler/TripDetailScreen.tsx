/**
 * TripDetailScreen - Detailed view of a trip with location tracking
 * Shows trip info, current location on map, and tracking controls
 * Requirements: 9.4, 11.3
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TravelerStackParamList } from '../../types/navigation';
import { useTravelerStore } from '../../store/travelerStore';
import { useLocationTracking, LocationData } from '../../hooks/useLocationTracking';
import { Trip } from '../../types';

type Props = NativeStackScreenProps<TravelerStackParamList, 'TripDetail'>;

const MAP_HEIGHT = 250;

// Location Status Badge Component
const LocationStatusBadge: React.FC<{
  isTracking: boolean;
  hasPermission: boolean | null;
  error: string | null;
}> = ({ isTracking, hasPermission, error }) => {
  if (error) {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeError]}>
        <Text style={styles.statusBadgeIcon}>⚠️</Text>
        <Text style={styles.statusBadgeText}>Location Error</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
        <Text style={styles.statusBadgeIcon}>🔒</Text>
        <Text style={styles.statusBadgeText}>Permission Denied</Text>
      </View>
    );
  }

  if (isTracking) {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeActive]}>
        <Text style={styles.statusBadgeIcon}>📍</Text>
        <Text style={styles.statusBadgeText}>Tracking Active</Text>
      </View>
    );
  }

  return (
    <View style={[styles.statusBadge, styles.statusBadgeInactive]}>
      <Text style={styles.statusBadgeIcon}>⏸️</Text>
      <Text style={styles.statusBadgeText}>Tracking Paused</Text>
    </View>
  );
};

// Map Placeholder Component (shows current location)
const MapView: React.FC<{
  location: LocationData | null;
  origin: string;
  destination: string;
  isTracking: boolean;
}> = ({ location, origin, destination, isTracking }) => {
  return (
    <View style={styles.mapContainer}>
      {/* Map placeholder - in production, use react-native-maps */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          {/* Route visualization */}
          <View style={styles.routeVisualization}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.routeDotOrigin]} />
              <Text style={styles.routeLabel} numberOfLines={1}>{origin}</Text>
            </View>
            <View style={styles.routeLine}>
              {isTracking && location && (
                <View style={styles.currentLocationMarker}>
                  <Text style={styles.currentLocationIcon}>📍</Text>
                </View>
              )}
            </View>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.routeDotDestination]} />
              <Text style={styles.routeLabel} numberOfLines={1}>{destination}</Text>
            </View>
          </View>

          {/* Current location info */}
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoTitle}>Current Location</Text>
              <Text style={styles.locationCoords}>
                {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
              </Text>
              {location.accuracy && (
                <Text style={styles.locationAccuracy}>
                  Accuracy: ±{location.accuracy.toFixed(0)}m
                </Text>
              )}
              <Text style={styles.locationTimestamp}>
                Updated: {new Date(location.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}

          {!location && (
            <View style={styles.noLocationInfo}>
              <Text style={styles.noLocationText}>
                {isTracking ? 'Getting location...' : 'Start tracking to see location'}
              </Text>
            </View>
          )}
        </View>

        {/* Map attribution placeholder */}
        <View style={styles.mapAttribution}>
          <Text style={styles.mapAttributionText}>
            🗺️ Map view (react-native-maps integration required)
          </Text>
        </View>
      </View>
    </View>
  );
};

export const TripDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { tripId } = route.params;
  const { trips, fetchTrips, updateTripStatus } = useTravelerStore();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Location tracking hook with background enabled for active trips
  const {
    location,
    isTracking,
    hasPermission,
    error: locationError,
    startTracking,
    stopTracking,
    requestPermission,
    getCurrentLocation,
  } = useLocationTracking({
    updateInterval: 30000, // 30 seconds
    minDistance: 100, // 100 meters
    enableBackground: trip?.status === 'in_progress',
    autoStart: false,
  });

  // Find trip from store
  useEffect(() => {
    const found = trips.find((t) => t.id === tripId);
    if (found) {
      setTrip(found);
      setIsLoading(false);
    } else {
      // Fetch if not in store
      fetchTrips().then(() => {
        setIsLoading(false);
      });
    }
  }, [tripId, trips, fetchTrips]);

  // Update trip when store changes
  useEffect(() => {
    const found = trips.find((t) => t.id === tripId);
    if (found) {
      setTrip(found);
    }
  }, [trips, tripId]);

  // Auto-start tracking for in-progress trips
  useEffect(() => {
    if (trip?.status === 'in_progress' && hasPermission && !isTracking) {
      startTracking();
    }
  }, [trip?.status, hasPermission, isTracking, startTracking]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      // Don't stop tracking on unmount if trip is in progress
      // Background tracking should continue
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchTrips();
    if (isTracking) {
      await getCurrentLocation();
    }
  }, [fetchTrips, isTracking, getCurrentLocation]);

  const handleToggleTracking = async () => {
    if (isTracking) {
      stopTracking();
    } else {
      if (hasPermission === null || hasPermission === false) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Location permission is required to track your trip. Please enable it in settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      await startTracking();
    }
  };

  const handleStartTrip = async () => {
    if (!trip) return;

    Alert.alert(
      'Start Trip',
      'Are you ready to start this trip? Location tracking will be enabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              await updateTripStatus(tripId, 'in_progress');
              // Request permission and start tracking
              const granted = await requestPermission();
              if (granted) {
                await startTracking();
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to start trip');
            } finally {
              setIsUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteTrip = async () => {
    if (!trip) return;

    Alert.alert(
      'Complete Trip',
      'Are you sure you want to mark this trip as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              stopTracking();
              await updateTripStatus(tripId, 'completed');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to complete trip');
            } finally {
              setIsUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelTrip = async () => {
    if (!trip) return;

    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              stopTracking();
              await updateTripStatus(tripId, 'cancelled');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel trip');
            } finally {
              setIsUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'scheduled':
        return '#007AFF';
      case 'in_progress':
        return '#34C759';
      case 'completed':
        return '#8E8E93';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorText}>
            This trip may have been removed or is no longer available.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = trip.status === 'scheduled' || trip.status === 'in_progress';
  const canStartTrip = trip.status === 'scheduled';
  const canCompleteTrip = trip.status === 'in_progress';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      >
        {/* Map Section */}
        <MapView
          location={location}
          origin={trip.origin}
          destination={trip.destination}
          isTracking={isTracking}
        />

        {/* Location Tracking Controls */}
        {isActive && (
          <View style={styles.trackingSection}>
            <View style={styles.trackingHeader}>
              <Text style={styles.trackingSectionTitle}>Location Tracking</Text>
              <LocationStatusBadge
                isTracking={isTracking}
                hasPermission={hasPermission}
                error={locationError}
              />
            </View>

            {locationError && (
              <View style={styles.locationErrorBanner}>
                <Text style={styles.locationErrorText}>{locationError}</Text>
                <TouchableOpacity onPress={requestPermission}>
                  <Text style={styles.locationErrorRetry}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.trackingButton,
                isTracking ? styles.trackingButtonStop : styles.trackingButtonStart,
              ]}
              onPress={handleToggleTracking}
            >
              <Text style={styles.trackingButtonText}>
                {isTracking ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.trackingNote}>
              {isTracking
                ? 'Your location is being shared with buyers for delivery tracking.'
                : 'Enable tracking to share your location with buyers.'}
            </Text>
          </View>
        )}

        {/* Trip Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.infoCard}>
            {/* Status */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.tripStatusBadge, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
                <Text style={[styles.tripStatusText, { color: getStatusColor(trip.status) }]}>
                  {trip.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {/* Route */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Route</Text>
              <Text style={styles.infoValue}>
                {trip.origin} → {trip.destination}
              </Text>
            </View>

            {/* Departure */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Departure</Text>
              <Text style={styles.infoValue}>{formatDate(trip.departAt)}</Text>
            </View>

            {/* Arrival */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Arrival</Text>
              <Text style={styles.infoValue}>{formatDate(trip.arriveAt)}</Text>
            </View>

            {/* Capacity */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>
                {trip.availableKg} / {trip.capacityKg} kg available
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        {isActive && (
          <View style={styles.actionsSection}>
            {canStartTrip && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartTrip}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>🚀 Start Trip</Text>
                )}
              </TouchableOpacity>
            )}

            {canCompleteTrip && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCompleteTrip}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>✅ Complete Trip</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('NearbyRequests')}
            >
              <Text style={styles.secondaryButtonText}>📍 View Nearby Requests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleCancelTrip}
              disabled={isUpdatingStatus}
            >
              <Text style={styles.dangerButtonText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Map styles
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: '#E5E5EA',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F4E8',
  },
  mapContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  routeVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  routePoint: {
    alignItems: 'center',
    maxWidth: 100,
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  routeDotOrigin: {
    backgroundColor: '#007AFF',
  },
  routeDotDestination: {
    backgroundColor: '#34C759',
  },
  routeLabel: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    textAlign: 'center',
  },
  routeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 8,
    position: 'relative',
  },
  currentLocationMarker: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -12,
  },
  currentLocationIcon: {
    fontSize: 24,
  },
  locationInfo: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  locationInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'monospace',
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  locationTimestamp: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  noLocationInfo: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noLocationText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  mapAttribution: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    alignItems: 'center',
  },
  mapAttributionText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  // Tracking section styles
  trackingSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#34C75920',
  },
  statusBadgeInactive: {
    backgroundColor: '#8E8E9320',
  },
  statusBadgeWarning: {
    backgroundColor: '#FF950020',
  },
  statusBadgeError: {
    backgroundColor: '#FF3B3020',
  },
  statusBadgeIcon: {
    fontSize: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  locationErrorBanner: {
    backgroundColor: '#FF3B3010',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationErrorText: {
    fontSize: 13,
    color: '#FF3B30',
    flex: 1,
  },
  locationErrorRetry: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  trackingButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingButtonStart: {
    backgroundColor: '#34C759',
  },
  trackingButtonStop: {
    backgroundColor: '#FF3B30',
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Info section styles
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  tripStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tripStatusText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Actions section styles
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});

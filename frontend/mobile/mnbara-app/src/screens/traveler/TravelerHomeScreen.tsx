/**
 * TravelerHomeScreen - Dashboard for travelers
 * Displays active trips, deliveries, earnings summary, and pending requests count
 * Requirements: 9.1, 11.1
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TravelerStackParamList } from '../../types/navigation';
import { useTravelerStore } from '../../store/travelerStore';
import { Trip, TravelMatch } from '../../types';

type NavigationProp = NativeStackNavigationProp<TravelerStackParamList, 'TravelerHome'>;

// Stat Card Component
const StatCard: React.FC<{
  value: string | number;
  label: string;
  color?: string;
  onPress?: () => void;
}> = ({ value, label, color = '#007AFF', onPress }) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// Trip Card Component
const TripCard: React.FC<{
  trip: Trip;
  onPress: () => void;
}> = ({ trip, onPress }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress}>
      <View style={styles.tripHeader}>
        <View style={styles.tripRoute}>
          <Text style={styles.tripOrigin}>{trip.origin}</Text>
          <Text style={styles.tripArrow}>→</Text>
          <Text style={styles.tripDestination}>{trip.destination}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
            {trip.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.tripDetails}>
        <Text style={styles.tripDate}>
          {formatDate(trip.departAt)} - {formatDate(trip.arriveAt)}
        </Text>
        <Text style={styles.tripCapacity}>
          {trip.availableKg}/{trip.capacityKg} kg available
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Delivery Card Component
const DeliveryCard: React.FC<{
  delivery: TravelMatch;
  onPress: () => void;
}> = ({ delivery, onPress }) => {
  const getStatusColor = (status: TravelMatch['status']) => {
    switch (status) {
      case 'proposed':
        return '#FF9500';
      case 'accepted':
        return '#007AFF';
      case 'picked_up':
        return '#5856D6';
      case 'delivered':
        return '#34C759';
      case 'completed':
        return '#8E8E93';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: TravelMatch['status']) => {
    switch (status) {
      case 'proposed':
        return 'Pending Acceptance';
      case 'accepted':
        return 'Ready for Pickup';
      case 'picked_up':
        return 'In Transit';
      case 'delivered':
        return 'Awaiting Confirmation';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity style={styles.deliveryCard} onPress={onPress}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryProduct} numberOfLines={1}>
          {delivery.request?.product?.title || 'Product'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(delivery.status) }]}>
            {getStatusLabel(delivery.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.deliveryDestination}>
        To: {delivery.request?.destination || 'Unknown'}
      </Text>
      <Text style={styles.deliveryBudget}>
        Budget: ${delivery.request?.budget?.toFixed(2) || '0.00'}
      </Text>
    </TouchableOpacity>
  );
};

export const TravelerHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    trips,
    activeDeliveries,
    stats,
    isLoadingStats,
    error,
    fetchStats,
    clearError,
  } = useTravelerStore();

  // Fetch data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const handleRefresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  // Filter active trips
  const activeTrips = trips.filter(
    (t) => t.status === 'scheduled' || t.status === 'in_progress'
  );

  // Filter pending deliveries (not completed or cancelled)
  const pendingDeliveries = activeDeliveries.filter(
    (d) => d.status !== 'completed' && d.status !== 'cancelled'
  );

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoadingStats} onRefresh={handleRefresh} />
        }
      >
        {/* Error Banner */}
        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorDismiss}>Tap to dismiss</Text>
          </TouchableOpacity>
        )}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <StatCard
            value={stats?.activeTrips || activeTrips.length}
            label="Active Trips"
            color="#007AFF"
          />
          <StatCard
            value={stats?.activeDeliveries || pendingDeliveries.length}
            label="Deliveries"
            color="#34C759"
          />
          <StatCard
            value={formatCurrency(stats?.monthlyEarnings || 0)}
            label="This Month"
            color="#FF9500"
            onPress={() => navigation.navigate('Earnings')}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('CreateTrip')}
          >
            <Text style={styles.primaryButtonText}>+ Create New Trip</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('NearbyRequests')}
            >
              <Text style={styles.secondaryButtonText}>📍 Nearby Requests</Text>
              {(stats?.pendingRequests || 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats?.pendingRequests}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Text style={styles.secondaryButtonText}>💰 Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Trips Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Trips</Text>
            {activeTrips.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('CreateTrip')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingStats && activeTrips.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : activeTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active trips</Text>
              <Text style={styles.emptyStateSubtext}>
                Create a trip to start accepting delivery requests
              </Text>
            </View>
          ) : (
            activeTrips.slice(0, 3).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
              />
            ))
          )}
        </View>

        {/* Active Deliveries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Deliveries</Text>
            {pendingDeliveries.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Deliveries')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingStats && pendingDeliveries.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : pendingDeliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active deliveries</Text>
              <Text style={styles.emptyStateSubtext}>
                Accept requests from nearby buyers to start delivering
              </Text>
            </View>
          ) : (
            pendingDeliveries.slice(0, 3).map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onPress={() => navigation.navigate('DeliveryDetail', { matchId: delivery.id })}
              />
            ))
          )}
        </View>

        {/* Bottom Padding */}
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
  errorBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorDismiss: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 16,
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
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripOrigin: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  tripArrow: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 8,
  },
  tripDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tripCapacity: {
    fontSize: 14,
    color: '#8E8E93',
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  deliveryDestination: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  deliveryBudget: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 32,
  },
});

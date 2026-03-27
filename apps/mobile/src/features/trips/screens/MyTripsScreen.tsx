// My Trips Screen
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchTrips } from '../store/trip.slice';
import { Trip } from '../../domain/entities/trip.entity';
import colors from '../../theme/colors';

// Simple Text component
const Text: React.FC<{ style?: any; children?: React.ReactNode }> = ({ style, children }) => (
  <>{children}</>
);

export const MyTripsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { trips, loading, error, hasMore } = useSelector((state: RootState) => state.trip);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const handleRefresh = () => dispatch(fetchTrips());

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('TripDetails', { tripId: trip.id });
  };

  const handleCreateTrip = () => {
    navigation.navigate('CreateTrip');
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity onPress={() => handleTripPress(item)}>
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <View style={styles.routeRow}>
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{item.origin.city}</Text>
              <Text style={styles.countryName}>{item.origin.country}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{item.destination.city}</Text>
              <Text style={styles.countryName}>{item.destination.country}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tripInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Departure</Text>
            <Text style={styles.infoValue}>
              {new Date(item.departureDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Available</Text>
            <Text style={styles.infoValue}>{item.availableWeight} kg</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Price/kg</Text>
            <Text style={styles.priceValue}>
              {item.pricing.currency} {item.pricing.pricePerKg}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTrip}>
          <Text style={styles.createButtonText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      {loading && trips.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyMessage}>
            Create your first trip to start earning
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleCreateTrip}>
            <Text style={styles.emptyButtonText}>Create Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeader: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityContainer: {
    flex: 1,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  countryName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  arrowContainer: {
    paddingHorizontal: 16,
  },
  arrow: {
    fontSize: 20,
    color: colors.primary.main,
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  infoItem: {},
  infoLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.error.main,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

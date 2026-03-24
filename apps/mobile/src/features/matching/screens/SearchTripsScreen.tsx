// Search Trips Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchSuggestedMatches } from '../store/matching.slice';
import { Match } from '../../domain/entities/matching.entity';
import colors from '../../theme/colors';

// Simple Text component
const Text: React.FC<{ style?: any; children?: React.ReactNode }> = ({ style, children }) => (
  <>{children}</>
);

export const SearchTripsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { suggestedMatches, loading, error } = useSelector(
    (state: RootState) => state.matching
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  useEffect(() => {
    dispatch(fetchSuggestedMatches());
  }, [dispatch]);

  const handleSearch = () => {
    // Trigger search with filters
    dispatch(fetchSuggestedMatches());
  };

  const handleTripPress = (match: Match) => {
    navigation.navigate('MatchDetails', { matchId: match.id });
  };

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity onPress={() => handleTripPress(item)}>
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(item.score.overall * 100)}%</Text>
            <Text style={styles.scoreLabel}>Match</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.cityInfo}>
            <Text style={styles.cityLabel}>From</Text>
            <Text style={styles.cityName}>{item.trip.origin.city}</Text>
            <Text style={styles.country}>{item.trip.origin.country}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
          <View style={styles.cityInfo}>
            <Text style={styles.cityLabel}>To</Text>
            <Text style={styles.cityName}>{item.trip.destination.city}</Text>
            <Text style={styles.country}>{item.trip.destination.country}</Text>
          </View>
        </View>

        <View style={styles.matchDivider} />

        <View style={styles.tripDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>
              {new Date(item.trip.departureDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={styles.detailValue}>{item.trip.availableWeight} kg</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price/kg</Text>
            <Text style={styles.priceValue}>
              ${item.trip.pricePerKg.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.travelerInfo}>
          <Text style={styles.travelerLabel}>Traveler</Text>
          <Text style={styles.travelerName}>{item.trip.travelerName}</Text>
          <Text style={styles.rating}>⭐ {item.trip.travelerRating.toFixed(1)}</Text>
        </View>

        <View style={styles.earningsInfo}>
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsValue}>
            ${item.netEarnings.toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterRow}>
          <TextInput
            style={styles.filterInput}
            placeholder="From"
            value={origin}
            onChangeText={setOrigin}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="To"
            value={destination}
            onChangeText={setDestination}
          />
          <TextInput
            style={[styles.filterInput, { width: 120 }]}
            placeholder="Date"
            value={dateFrom}
            onChangeText={setDateFrom}
          />
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search Trips</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading && suggestedMatches.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text>Searching for trips...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : suggestedMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No trips found</Text>
          <Text style={styles.emptyMessage}>
            Try adjusting your search criteria
          </Text>
        </View>
      ) : (
        <FlatList
          data={suggestedMatches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => dispatch(fetchSuggestedMatches())}
            />
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
  searchHeader: {
    backgroundColor: colors.background.primary,
    padding: 16,
  },
  searchBar: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    padding: 14,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterInput: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: colors.primary.main,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  scoreBadge: {
    backgroundColor: colors.success.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success.dark,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.success.dark,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityInfo: {
    flex: 1,
  },
  cityLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  country: {
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
  matchDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 12,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {},
  detailLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  travelerLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginRight: 8,
  },
  travelerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  rating: {
    fontSize: 14,
    color: colors.rating.filled,
  },
  earningsInfo: {
    backgroundColor: colors.success.light,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: colors.success.dark,
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success.dark,
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  },
});

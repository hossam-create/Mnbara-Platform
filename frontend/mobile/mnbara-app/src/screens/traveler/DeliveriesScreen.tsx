/**
 * DeliveriesScreen - List of active deliveries for travelers
 * Shows all deliveries with status filters
 * Requirements: 9.4, 9.5, 13.1
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TravelerStackParamList } from '../../types/navigation';
import { useTravelerStore } from '../../store/travelerStore';
import { TravelMatch } from '../../types';

type NavigationProp = NativeStackNavigationProp<TravelerStackParamList, 'Deliveries'>;

type FilterStatus = 'all' | 'active' | 'completed';

// Status configuration
const STATUS_CONFIG: Record<TravelMatch['status'], { label: string; color: string; bgColor: string }> = {
  proposed: { label: 'Pending', color: '#FF9500', bgColor: '#FF950020' },
  accepted: { label: 'Ready for Pickup', color: '#007AFF', bgColor: '#007AFF20' },
  picked_up: { label: 'In Transit', color: '#5856D6', bgColor: '#5856D620' },
  delivered: { label: 'Awaiting Confirmation', color: '#34C759', bgColor: '#34C75920' },
  completed: { label: 'Completed', color: '#8E8E93', bgColor: '#8E8E9320' },
  cancelled: { label: 'Cancelled', color: '#FF3B30', bgColor: '#FF3B3020' },
};

// Delivery Card Component
const DeliveryCard: React.FC<{
  delivery: TravelMatch;
  onPress: () => void;
}> = ({ delivery, onPress }) => {
  const statusConfig = STATUS_CONFIG[delivery.status];

  const getNextAction = () => {
    switch (delivery.status) {
      case 'accepted':
        return 'Mark as Picked Up';
      case 'picked_up':
        return 'Mark as Delivered';
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <TouchableOpacity style={styles.deliveryCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {delivery.request?.product?.images?.[0] ? (
            <Image
              source={{ uri: delivery.request.product.images[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImagePlaceholderText}>📦</Text>
            </View>
          )}
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {delivery.request?.product?.title || 'Product'}
          </Text>
          
          <View style={styles.routeContainer}>
            <Text style={styles.routeText}>
              {delivery.trip?.origin || 'Origin'} → {delivery.request?.destination || 'Destination'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Budget and Action */}
      <View style={styles.cardFooter}>
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetLabel}>Earnings</Text>
          <Text style={styles.budgetValue}>
            ${delivery.request?.budget?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {nextAction && (
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>{nextAction} →</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Filter Tab Component
const FilterTabs: React.FC<{
  selected: FilterStatus;
  onSelect: (filter: FilterStatus) => void;
  counts: { all: number; active: number; completed: number };
}> = ({ selected, onSelect, counts }) => (
  <View style={styles.filterTabs}>
    {(['all', 'active', 'completed'] as FilterStatus[]).map((filter) => (
      <TouchableOpacity
        key={filter}
        style={[styles.filterTab, selected === filter && styles.filterTabSelected]}
        onPress={() => onSelect(filter)}
      >
        <Text style={[styles.filterTabText, selected === filter && styles.filterTabTextSelected]}>
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </Text>
        <View style={[styles.filterBadge, selected === filter && styles.filterBadgeSelected]}>
          <Text style={[styles.filterBadgeText, selected === filter && styles.filterBadgeTextSelected]}>
            {counts[filter]}
          </Text>
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

export const DeliveriesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    activeDeliveries,
    isLoadingDeliveries,
    error,
    fetchDeliveries,
    clearError,
  } = useTravelerStore();

  const [filter, setFilter] = useState<FilterStatus>('all');

  // Fetch deliveries on mount and focus
  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
    }, [fetchDeliveries])
  );

  const handleRefresh = useCallback(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Filter deliveries
  const filteredDeliveries = activeDeliveries.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return !['completed', 'cancelled'].includes(d.status);
    }
    if (filter === 'completed') {
      return ['completed', 'cancelled'].includes(d.status);
    }
    return true;
  });

  // Calculate counts
  const counts = {
    all: activeDeliveries.length,
    active: activeDeliveries.filter((d) => !['completed', 'cancelled'].includes(d.status)).length,
    completed: activeDeliveries.filter((d) => ['completed', 'cancelled'].includes(d.status)).length,
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📦</Text>
      <Text style={styles.emptyStateTitle}>No deliveries yet</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'all'
          ? 'Accept delivery requests to start earning'
          : filter === 'active'
          ? 'No active deliveries at the moment'
          : 'No completed deliveries yet'}
      </Text>
      {filter === 'all' && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('NearbyRequests')}
        >
          <Text style={styles.emptyStateButtonText}>Find Requests</Text>
        </TouchableOpacity>
      )}
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

      {/* Filter Tabs */}
      <FilterTabs selected={filter} onSelect={setFilter} counts={counts} />

      {/* Deliveries List */}
      <FlatList
        data={filteredDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeliveryCard
            delivery={item}
            onPress={() => navigation.navigate('DeliveryDetail', { matchId: item.id })}
          />
        )}
        ListEmptyComponent={!isLoadingDeliveries ? renderEmptyState : null}
        refreshControl={
          <RefreshControl refreshing={isLoadingDeliveries} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  filterTabSelected: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  filterTabTextSelected: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterBadgeTextSelected: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImageContainer: {
    width: 70,
    height: 70,
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
    fontSize: 28,
  },
  deliveryInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  routeContainer: {
    marginBottom: 8,
  },
  routeText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  budgetInfo: {},
  budgetLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
  },
  actionHint: {
    backgroundColor: '#007AFF10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionHintText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
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
});

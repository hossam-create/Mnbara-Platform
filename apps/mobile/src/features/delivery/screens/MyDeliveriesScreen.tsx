// My Deliveries Screen
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
import { fetchDeliveries } from '../store/delivery.slice';
import { Delivery } from '../../domain/entities/delivery.entity';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { EmptyDeliveries } from '../../components/ui/EmptyState';
import colors from '../../theme/colors';

export const MyDeliveriesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const dispatch = useDispatch();
  const { deliveries, loading, error, hasMore } = useSelector(
    (state: RootState) => state.delivery
  );

  useEffect(() => {
    dispatch(fetchDeliveries());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDeliveries());
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      dispatch(fetchDeliveries());
    }
  };

  const handleDeliveryPress = (delivery: Delivery) => {
    navigation.navigate('DeliveryDetails', { deliveryId: delivery.id });
  };

  const handleCreateDelivery = () => {
    navigation.navigate('CreateDelivery');
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity onPress={() => handleDeliveryPress(item)}>
      <Card style={styles.deliveryCard}>
        <View style={styles.deliveryHeader}>
          <Avatar
            source={item.shopperAvatar ? { uri: item.shopperAvatar } : undefined}
            name={item.shopperName}
            size="small"
          />
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryId}>#{item.id.slice(0, 8)}</Text>
            <Text style={styles.shopperName}>{item.shopperName}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: colors.map.pickup }]} />
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.pickup.address}, {item.pickup.city}
              </Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: colors.map.dropoff }]} />
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.dropoff.address}, {item.dropoff.city}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.deliveryFooter}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Delivery Date</Text>
            <Text style={styles.dateValue}>
              {new Date(item.deliveryDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.priceValue}>
              {item.pricing.currency} {item.pricing.totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Deliveries</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateDelivery}>
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading && deliveries.length === 0 ? (
        <Loading />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : deliveries.length === 0 ? (
        <EmptyDeliveries onCreate={handleCreateDelivery} />
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && hasMore ? <Loading size="small" /> : null
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
  deliveryCard: {
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deliveryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryId: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  shopperName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  routeInfo: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.text.primary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.gray[300],
    marginLeft: 5,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  dateInfo: {},
  dateLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.main,
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
});

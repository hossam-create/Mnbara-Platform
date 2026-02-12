// Delivery Details Screen
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchDeliveryById, clearSelectedDelivery } from '../store/delivery.slice';
import { Delivery } from '../../domain/entities/delivery.entity';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import colors from '../../theme/colors';

interface DeliveryDetailsScreenProps {
  route: { params: { deliveryId: string } };
  navigation: any;
}

export const DeliveryDetailsScreen: React.FC<DeliveryDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const dispatch = useDispatch();
  const { selectedDelivery: delivery, loading, error } = useSelector(
    (state: RootState) => state.delivery
  );

  useEffect(() => {
    const deliveryId = route.params?.deliveryId;
    if (deliveryId) {
      dispatch(fetchDeliveryById(deliveryId));
    }

    return () => {
      dispatch(clearSelectedDelivery());
    };
  }, [dispatch, route.params]);

  const handleContactTraveler = () => {
    if (delivery?.travelerId) {
      navigation.navigate('Chat', { conversationId: delivery.id });
    }
  };

  const handleCancelDelivery = () => {
    // Show confirmation modal
  };

  const handleDispute = () => {
    navigation.navigate('Dispute', { deliveryId: delivery?.id });
  };

  if (loading && !delivery) {
    return <Loading />;
  }

  if (error && !delivery) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Delivery not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => dispatch(fetchDeliveryById(route.params?.deliveryId))}
        />
      }
    >
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <StatusBadge status={delivery.status} />
        <Text style={styles.deliveryId}>#{delivery.id}</Text>
      </View>

      {/* Route Card */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Route</Text>
        
        {/* Pickup */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: colors.map.pickup }]} />
            <Text style={styles.locationType}>Pickup</Text>
          </View>
          <Text style={styles.locationAddress}>{delivery.pickup.address}</Text>
          <Text style={styles.locationCity}>
            {delivery.pickup.city}, {delivery.pickup.country}
          </Text>
          <Text style={styles.postalCode}>{delivery.pickup.postalCode}</Text>
          
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Date:</Text>
            <Text style={styles.timeValue}>
              {new Date(delivery.pickupDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time:</Text>
            <Text style={styles.timeValue}>
              {delivery.pickupTimeWindow.start} - {delivery.pickupTimeWindow.end}
            </Text>
          </View>
        </View>

        {/* Dropoff */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: colors.map.dropoff }]} />
            <Text style={styles.locationType}>Dropoff</Text>
          </View>
          <Text style={styles.locationAddress}>{delivery.dropoff.address}</Text>
          <Text style={styles.locationCity}>
            {delivery.dropoff.city}, {delivery.dropoff.country}
          </Text>
          <Text style={styles.postalCode}>{delivery.dropoff.postalCode}</Text>
          
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Date:</Text>
            <Text style={styles.timeValue}>
              {new Date(delivery.deliveryDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time:</Text>
            <Text style={styles.timeValue}>
              {delivery.deliveryTimeWindow.start} - {delivery.deliveryTimeWindow.end}
            </Text>
          </View>
        </View>
      </Card>

      {/* Package Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Package Details</Text>
        
        <View style={styles.packageInfo}>
          <View style={styles.packageRow}>
            <Text style={styles.packageLabel}>Description:</Text>
            <Text style={styles.packageValue}>{delivery.package.description}</Text>
          </View>
          <View style={styles.packageRow}>
            <Text style={styles.packageLabel}>Size:</Text>
            <Badge
              label={delivery.package.size.toUpperCase()}
              variant="info"
              size="small"
            />
          </View>
          <View style={styles.packageRow}>
            <Text style={styles.packageLabel}>Weight:</Text>
            <Text style={styles.packageValue}>{delivery.package.weight} kg</Text>
          </View>
          <View style={styles.packageRow}>
            <Text style={styles.packageLabel}>Fragile:</Text>
            <Text style={styles.packageValue}>
              {delivery.package.fragile ? 'Yes' : 'No'}
            </Text>
          </View>
          {delivery.package.handlingInstructions && (
            <View style={styles.packageRow}>
              <Text style={styles.packageLabel}>Instructions:</Text>
              <Text style={styles.packageValue}>
                {delivery.package.handlingInstructions}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Pricing */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Base Price</Text>
          <Text style={styles.pricingValue}>
            {delivery.pricing.currency} {delivery.pricing.basePrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Service Fee</Text>
          <Text style={styles.pricingValue}>
            {delivery.pricing.currency} {delivery.pricing.serviceFee.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.pricingRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {delivery.pricing.currency} {delivery.pricing.totalPrice.toFixed(2)}
          </Text>
        </View>
      </Card>

      {/* Traveler Info (if assigned) */}
      {delivery.travelerId && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Traveler</Text>
          
          <View style={styles.travelerInfo}>
            <Avatar
              source={
                delivery.travelerAvatar
                  ? { uri: delivery.travelerAvatar }
                  : undefined
              }
              name={delivery.travelerName}
              size="large"
            />
            <View style={styles.travelerDetails}>
              <Text style={styles.travelerName}>{delivery.travelerName}</Text>
              <TouchableOpacity onPress={handleContactTraveler}>
                <Text style={styles.contactButton}>Contact Traveler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {delivery.status === 'pending' && (
          <Button
            title="Cancel Delivery"
            variant="danger"
            onPress={handleCancelDelivery}
            style={styles.actionButton}
          />
        )}
        {(delivery.status === 'delivered' || delivery.status === 'cancelled') &&
          !delivery.hasChat && (
            <Button
              title="Report an Issue"
              variant="outline"
              onPress={handleDispute}
              style={styles.actionButton}
            />
          )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background.primary,
  },
  deliveryId: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  section: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  locationCard: {
    paddingVertical: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  locationType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.text.primary,
  },
  locationCity: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  postalCode: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    width: 60,
  },
  timeValue: {
    fontSize: 12,
    color: colors.text.primary,
  },
  packageInfo: {},
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  packageValue: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  pricingValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.main,
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  travelerDetails: {
    flex: 1,
    marginLeft: 16,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  contactButton: {
    fontSize: 14,
    color: colors.primary.main,
    marginTop: 4,
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 12,
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

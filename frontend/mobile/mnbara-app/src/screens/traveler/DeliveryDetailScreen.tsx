/**
 * DeliveryDetailScreen - Detailed view of a delivery with status timeline
 * Shows delivery info, status progression, and action buttons
 * Requirements: 9.4, 9.5, 13.1, 13.2, 13.3
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TravelerStackParamList } from '../../types/navigation';
import { useTravelerStore } from '../../store/travelerStore';
import { TravelMatch } from '../../types';

type Props = NativeStackScreenProps<TravelerStackParamList, 'DeliveryDetail'>;

// Status timeline steps
const TIMELINE_STEPS = [
  { status: 'proposed', label: 'Request Accepted', icon: '✓' },
  { status: 'accepted', label: 'Ready for Pickup', icon: '📍' },
  { status: 'picked_up', label: 'Picked Up', icon: '📦' },
  { status: 'delivered', label: 'Delivered', icon: '🚚' },
  { status: 'completed', label: 'Completed', icon: '✅' },
];

// Status order for comparison
const STATUS_ORDER: Record<string, number> = {
  proposed: 0,
  accepted: 1,
  picked_up: 2,
  delivered: 3,
  completed: 4,
  cancelled: -1,
};

// Timeline Step Component
const TimelineStep: React.FC<{
  step: typeof TIMELINE_STEPS[0];
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
  evidence?: { photoUrl: string; timestamp: string };
}> = ({ step, isCompleted, isCurrent, isLast, evidence }) => (
  <View style={styles.timelineStep}>
    {/* Connector Line */}
    {!isLast && (
      <View
        style={[
          styles.timelineConnector,
          isCompleted && styles.timelineConnectorCompleted,
        ]}
      />
    )}

    {/* Step Indicator */}
    <View
      style={[
        styles.timelineIndicator,
        isCompleted && styles.timelineIndicatorCompleted,
        isCurrent && styles.timelineIndicatorCurrent,
      ]}
    >
      <Text style={styles.timelineIcon}>{step.icon}</Text>
    </View>

    {/* Step Content */}
    <View style={styles.timelineContent}>
      <Text
        style={[
          styles.timelineLabel,
          isCompleted && styles.timelineLabelCompleted,
          isCurrent && styles.timelineLabelCurrent,
        ]}
      >
        {step.label}
      </Text>
      
      {evidence && (
        <View style={styles.evidencePreview}>
          <Image
            source={{ uri: evidence.photoUrl }}
            style={styles.evidenceImage}
            resizeMode="cover"
          />
          <Text style={styles.evidenceTimestamp}>
            {new Date(evidence.timestamp).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  </View>
);

export const DeliveryDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId } = route.params;
  const { activeDeliveries, fetchDeliveries, isLoadingDeliveries } = useTravelerStore();
  
  const [delivery, setDelivery] = useState<TravelMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find delivery from store
  useEffect(() => {
    const found = activeDeliveries.find((d) => d.id === matchId);
    if (found) {
      setDelivery(found);
      setIsLoading(false);
    } else {
      // Fetch if not in store
      fetchDeliveries().then(() => {
        setIsLoading(false);
      });
    }
  }, [matchId, activeDeliveries, fetchDeliveries]);

  // Update delivery when store changes
  useEffect(() => {
    const found = activeDeliveries.find((d) => d.id === matchId);
    if (found) {
      setDelivery(found);
    }
  }, [activeDeliveries, matchId]);

  const handleRefresh = useCallback(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handlePickup = () => {
    navigation.navigate('EvidenceCapture', { matchId, type: 'pickup' });
  };

  const handleDelivery = () => {
    navigation.navigate('EvidenceCapture', { matchId, type: 'delivery' });
  };

  const handleContactBuyer = () => {
    Alert.alert('Contact Buyer', 'Messaging feature coming soon!');
  };

  const handleCancelDelivery = () => {
    Alert.alert(
      'Cancel Delivery',
      'Are you sure you want to cancel this delivery? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cancel delivery
            Alert.alert('Cancelled', 'Delivery has been cancelled');
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading delivery details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Delivery Not Found</Text>
          <Text style={styles.errorText}>
            This delivery may have been removed or is no longer available.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusOrder = STATUS_ORDER[delivery.status] ?? -1;
  const isCancelled = delivery.status === 'cancelled';
  const isCompleted = delivery.status === 'completed';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoadingDeliveries} onRefresh={handleRefresh} />
        }
      >
        {/* Product Info */}
        <View style={styles.productSection}>
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
          
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>
              {delivery.request?.product?.title || 'Product'}
            </Text>
            <Text style={styles.productDescription} numberOfLines={2}>
              {delivery.request?.product?.description || 'No description available'}
            </Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeCard}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#007AFF' }]} />
              <View>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeValue}>{delivery.trip?.origin || 'Origin'}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#34C759' }]} />
              <View>
                <Text style={styles.routeLabel}>Delivery</Text>
                <Text style={styles.routeValue}>
                  {delivery.request?.destination || 'Destination'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Delivery Fee</Text>
              <Text style={styles.earningsValue}>
                ${delivery.request?.budget?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsTotalLabel}>Total Earnings</Text>
              <Text style={styles.earningsTotalValue}>
                ${delivery.request?.budget?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <View style={styles.timelineCard}>
            {isCancelled ? (
              <View style={styles.cancelledBanner}>
                <Text style={styles.cancelledIcon}>❌</Text>
                <Text style={styles.cancelledText}>This delivery was cancelled</Text>
              </View>
            ) : (
              TIMELINE_STEPS.map((step, index) => {
                const stepOrder = STATUS_ORDER[step.status];
                const isStepCompleted = stepOrder < currentStatusOrder;
                const isStepCurrent = stepOrder === currentStatusOrder;
                
                // Get evidence for pickup/delivery steps
                let evidence;
                if (step.status === 'picked_up' && delivery.pickupEvidence) {
                  evidence = delivery.pickupEvidence;
                } else if (step.status === 'delivered' && delivery.deliveryEvidence) {
                  evidence = delivery.deliveryEvidence;
                }

                return (
                  <TimelineStep
                    key={step.status}
                    step={step}
                    isCompleted={isStepCompleted}
                    isCurrent={isStepCurrent}
                    isLast={index === TIMELINE_STEPS.length - 1}
                    evidence={evidence}
                  />
                );
              })
            )}
          </View>
        </View>

        {/* Deadline */}
        {delivery.request?.deadline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deadline</Text>
            <View style={styles.deadlineCard}>
              <Text style={styles.deadlineIcon}>⏰</Text>
              <Text style={styles.deadlineText}>
                Deliver by {new Date(delivery.request.deadline).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {!isCancelled && !isCompleted && (
          <View style={styles.actionsSection}>
            {delivery.status === 'accepted' && (
              <TouchableOpacity style={styles.primaryButton} onPress={handlePickup}>
                <Text style={styles.primaryButtonText}>📷 Mark as Picked Up</Text>
              </TouchableOpacity>
            )}

            {delivery.status === 'picked_up' && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleDelivery}>
                <Text style={styles.primaryButtonText}>📷 Mark as Delivered</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryButton} onPress={handleContactBuyer}>
              <Text style={styles.secondaryButtonText}>💬 Contact Buyer</Text>
            </TouchableOpacity>

            {['proposed', 'accepted'].includes(delivery.status) && (
              <TouchableOpacity style={styles.dangerButton} onPress={handleCancelDelivery}>
                <Text style={styles.dangerButtonText}>Cancel Delivery</Text>
              </TouchableOpacity>
            )}
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
  productSection: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  productImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
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
    fontSize: 40,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
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
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E5EA',
    marginLeft: 5,
    marginVertical: 4,
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  earningsValue: {
    fontSize: 14,
    color: '#000',
  },
  earningsDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  earningsTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  earningsTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
  },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingBottom: 24,
  },
  timelineConnector: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: '100%',
    backgroundColor: '#E5E5EA',
  },
  timelineConnectorCompleted: {
    backgroundColor: '#34C759',
  },
  timelineIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  timelineIndicatorCompleted: {
    backgroundColor: '#34C759',
  },
  timelineIndicatorCurrent: {
    backgroundColor: '#007AFF',
  },
  timelineIcon: {
    fontSize: 14,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  timelineLabelCompleted: {
    color: '#34C759',
    fontWeight: '500',
  },
  timelineLabelCurrent: {
    color: '#007AFF',
    fontWeight: '600',
  },
  evidencePreview: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  evidenceImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  evidenceTimestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  cancelledIcon: {
    fontSize: 24,
  },
  cancelledText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  deadlineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deadlineIcon: {
    fontSize: 24,
  },
  deadlineText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
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

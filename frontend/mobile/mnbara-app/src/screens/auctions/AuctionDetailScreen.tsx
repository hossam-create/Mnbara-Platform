/**
 * AuctionDetailScreen - Real-time auction detail with WebSocket bidding
 * Requirements: 8.1, 8.2 - WebSocket connection for real-time updates, bid history
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Auction, Bid } from '../../types';
import { auctionsService } from '../../services/api';
import {
  wsService,
  auctionEvents,
  AuctionState,
  BidPlacedEvent,
  BidRejectedEvent,
  AuctionEndedEvent,
  OutbidEvent,
  AuctionEndingSoonEvent,
} from '../../services/websocket';
import { useAuthStore } from '../../store/authStore';
import { BidPanel, AuctionTimer } from './components';

type Props = NativeStackScreenProps<RootStackParamList, 'Auction'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AuctionDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { auctionId } = route.params;
  const { user } = useAuthStore();

  // State
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  // Live state from WebSocket
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveBids, setLiveBids] = useState<Bid[]>([]);
  const [totalBids, setTotalBids] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [endingSoon, setEndingSoon] = useState(false);

  // Refs for cleanup
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Fetch auction data
  const fetchAuction = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const data = await auctionsService.getAuction(auctionId);
      setAuction(data);
      setLivePrice(data.currentPrice);
      setLiveBids(data.bids || []);
      setTotalBids(data.bidsCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load auction');
      console.error('Failed to fetch auction:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [auctionId]);

  // Setup WebSocket connection and subscriptions
  const setupWebSocket = useCallback(async () => {
    try {
      await wsService.connect();
      setIsConnected(true);
      wsService.subscribeToAuction(auctionId);

      // Subscribe to auction state updates
      const unsubState = auctionEvents.onState((data: AuctionState) => {
        if (data.auctionId === auctionId) {
          setLivePrice(data.currentPrice);
          setTotalBids(data.totalBids);
        }
      });

      // Subscribe to bid placed events
      const unsubBidPlaced = auctionEvents.onBidPlaced((data: BidPlacedEvent) => {
        if (data.auctionId === auctionId) {
          setLivePrice(data.newHighest);
          setTotalBids(data.totalBids);
          setLiveBids(prev => [data.bid as Bid, ...prev]);
        }
      });

      // Subscribe to bid rejected events
      const unsubBidRejected = auctionEvents.onBidRejected((data: BidRejectedEvent) => {
        if (data.auctionId === auctionId) {
          Alert.alert('Bid Rejected', getBidRejectionMessage(data.reason));
        }
      });

      // Subscribe to ending soon events
      const unsubEndingSoon = auctionEvents.onEndingSoon((data: AuctionEndingSoonEvent) => {
        if (data.auctionId === auctionId) {
          setEndingSoon(true);
          if (data.secondsRemaining <= 120) {
            Alert.alert('⏰ Ending Soon!', `This auction ends in ${Math.ceil(data.secondsRemaining / 60)} minutes!`);
          }
        }
      });

      // Subscribe to auction ended events
      const unsubEnded = auctionEvents.onEnded((data: AuctionEndedEvent) => {
        if (data.auctionId === auctionId) {
          setAuction(prev => prev ? { ...prev, status: 'ended' } : null);
          const isWinner = data.winner?.id === user?.id;
          Alert.alert(
            'Auction Ended',
            isWinner
              ? `Congratulations! You won with a bid of $${data.finalPrice}`
              : data.winner
                ? `Auction ended. Final price: $${data.finalPrice}`
                : 'Auction ended without a winner'
          );
        }
      });

      // Subscribe to outbid events
      const unsubOutbid = auctionEvents.onOutbid((data: OutbidEvent) => {
        if (data.auctionId === auctionId) {
          Alert.alert(
            'You\'ve Been Outbid!',
            `${data.outbidBy.name} placed a higher bid of $${data.newHighest}`
          );
        }
      });

      unsubscribeRefs.current = [
        unsubState,
        unsubBidPlaced,
        unsubBidRejected,
        unsubEndingSoon,
        unsubEnded,
        unsubOutbid,
      ];
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setIsConnected(false);
    }
  }, [auctionId, user?.id]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    fetchAuction();
    setupWebSocket();

    return () => {
      // Unsubscribe from all events
      unsubscribeRefs.current.forEach(unsub => unsub());
      wsService.unsubscribeFromAuction(auctionId);
    };
  }, [fetchAuction, setupWebSocket, auctionId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAuction(false);
  };

  // Handle bid placement via WebSocket
  const handlePlaceBid = async (amount: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isConnected) {
        // Fallback to REST API if WebSocket not connected
        auctionsService.placeBid(auctionId, amount)
          .then(() => resolve())
          .catch(reject);
        return;
      }

      // Set up one-time listener for bid response
      const timeout = setTimeout(() => {
        reject(new Error('Bid timeout - please try again'));
      }, 5000);

      const unsubSuccess = auctionEvents.onBidPlaced((data: BidPlacedEvent) => {
        if (data.auctionId === auctionId && data.bid.bidderId === user?.id) {
          clearTimeout(timeout);
          unsubSuccess();
          resolve();
        }
      });

      const unsubReject = auctionEvents.onBidRejected((data: BidRejectedEvent) => {
        if (data.auctionId === auctionId) {
          clearTimeout(timeout);
          unsubReject();
          reject(new Error(getBidRejectionMessage(data.reason)));
        }
      });

      wsService.placeBid(auctionId, amount);
    });
  };

  // Handle proxy bid via WebSocket
  const handleSetProxyBid = async (maxAmount: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isConnected) {
        auctionsService.setProxyBid(auctionId, maxAmount)
          .then(() => resolve())
          .catch(reject);
        return;
      }

      wsService.setProxyBid(auctionId, maxAmount);
      // Proxy bids don't have immediate confirmation, resolve after sending
      setTimeout(resolve, 500);
    });
  };

  // Handle watch/unwatch
  const handleToggleWatch = async () => {
    try {
      if (isWatching) {
        await auctionsService.unwatchAuction(auctionId);
      } else {
        await auctionsService.watchAuction(auctionId);
      }
      setIsWatching(!isWatching);
    } catch (err) {
      console.error('Failed to toggle watch:', err);
    }
  };

  // Get bid rejection message
  const getBidRejectionMessage = (reason: string): string => {
    const messages: Record<string, string> = {
      'bid_too_low': 'Your bid must be higher than the current bid',
      'auction_ended': 'This auction has ended',
      'insufficient_funds': 'Insufficient wallet balance',
      'user_blocked': 'You are not allowed to bid on this auction',
      'reserve_not_met': 'Your bid does not meet the reserve price',
    };
    return messages[reason] || reason;
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: auction?.product.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Check if current user is highest bidder
  const isHighestBidder = liveBids.length > 0 && liveBids[0].bidderId === user?.id;

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading auction...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error || !auction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorText}>{error || 'Auction not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchAuction()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentPrice = livePrice ?? auction.currentPrice;
  const isEnded = auction.status === 'ended' || auction.status === 'sold';
  const minIncrement = Math.max(1, Math.floor(currentPrice * 0.05)); // 5% increment

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
          >
            {auction.product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image Indicators */}
          {auction.product.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {auction.product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Connection Status */}
          <View style={[styles.connectionBadge, isConnected ? styles.connected : styles.disconnected]}>
            <View style={[styles.connectionDot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
            <Text style={styles.connectionText}>{isConnected ? 'Live' : 'Offline'}</Text>
          </View>

          {/* Watch Button */}
          <TouchableOpacity style={styles.watchButton} onPress={handleToggleWatch}>
            <Text style={styles.watchIcon}>{isWatching ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{auction.product.title}</Text>
          <Text style={styles.productCondition}>
            Condition: {auction.product.condition.replace('_', ' ')}
          </Text>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.sectionLabel}>
            {isEnded ? 'Auction Ended' : endingSoon ? '⚡ Ending Soon!' : 'Time Remaining'}
          </Text>
          <AuctionTimer
            endTime={auction.endAt}
            size="large"
            onEnd={() => setAuction(prev => prev ? { ...prev, status: 'ended' } : null)}
          />
        </View>

        {/* Bid Panel */}
        <View style={styles.bidSection}>
          <BidPanel
            auctionId={auctionId}
            currentBid={currentPrice}
            minIncrement={minIncrement}
            currency={auction.product.currency}
            isEnded={isEnded}
            isHighestBidder={isHighestBidder}
            onPlaceBid={handlePlaceBid}
            onSetProxyBid={handleSetProxyBid}
          />
        </View>

        {/* Bid History */}
        <View style={styles.bidHistorySection}>
          <View style={styles.bidHistoryHeader}>
            <Text style={styles.sectionTitle}>Bid History</Text>
            <Text style={styles.bidCount}>{totalBids} bids</Text>
          </View>

          {liveBids.length === 0 ? (
            <View style={styles.noBidsContainer}>
              <Text style={styles.noBidsText}>No bids yet. Be the first!</Text>
            </View>
          ) : (
            <View style={styles.bidsList}>
              {liveBids.slice(0, 10).map((bid, index) => (
                <View
                  key={bid.id}
                  style={[styles.bidItem, index === 0 && styles.bidItemHighest]}
                >
                  <View style={styles.bidderInfo}>
                    <Text style={styles.bidderName}>
                      {bid.bidder.name}
                      {bid.bidderId === user?.id && ' (You)'}
                    </Text>
                    <Text style={styles.bidTime}>
                      {new Date(bid.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.bidAmountContainer}>
                    <Text style={[styles.bidAmount, index === 0 && styles.bidAmountHighest]}>
                      {formatPrice(bid.amount)}
                    </Text>
                    {bid.isProxy && (
                      <Text style={styles.proxyBadge}>Auto</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>
                {auction.product.sellerId.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>Seller #{auction.product.sellerId.slice(-6)}</Text>
              <Text style={styles.sellerRating}>⭐ 4.8 (120 reviews)</Text>
            </View>
          </View>
        </View>

        {/* Product Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{auction.product.description}</Text>
        </View>
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
    fontSize: 16,
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
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
  },
  connectionBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  connected: {
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
  },
  disconnected: {
    backgroundColor: 'rgba(142, 142, 147, 0.9)',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: '#fff',
  },
  dotDisconnected: {
    backgroundColor: '#ccc',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  watchButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchIcon: {
    fontSize: 24,
  },
  productInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  productCondition: {
    fontSize: 14,
    color: '#8E8E93',
  },
  timerSection: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  bidSection: {
    padding: 16,
  },
  bidHistorySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  bidHistoryHeader: {
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
  bidCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  noBidsContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noBidsText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  bidsList: {
    gap: 8,
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  bidItemHighest: {
    backgroundColor: '#E8F5E9',
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  bidTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  bidAmountContainer: {
    alignItems: 'flex-end',
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  bidAmountHighest: {
    color: '#34C759',
  },
  proxyBadge: {
    fontSize: 10,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  sellerSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerInfo: {
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sellerRating: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  descriptionSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginTop: 8,
  },
});

export default AuctionDetailScreen;

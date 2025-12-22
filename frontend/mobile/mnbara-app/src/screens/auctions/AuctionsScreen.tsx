/**
 * AuctionsScreen - Mobile auction list with countdown timers and filters
 * Requirements: 8.1 - Real-time auction list with filters
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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Auction } from '../../types';
import { auctionsService } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'active' | 'ending_soon';

interface AuctionCardProps {
  auction: Auction;
  onPress: () => void;
}

// Countdown Timer Hook
const useCountdown = (endTime: string) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
};

// Format time display
const formatTimeDisplay = (timeLeft: ReturnType<typeof useCountdown>): string => {
  if (!timeLeft || timeLeft.total <= 0) return 'Ended';
  
  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h`;
  }
  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m`;
  }
  return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
};

// Auction Card Component
const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onPress }) => {
  const timeLeft = useCountdown(auction.endAt);
  const isEndingSoon = timeLeft && timeLeft.total > 0 && timeLeft.total <= 2 * 60 * 60 * 1000; // 2 hours
  const isEnded = !timeLeft || timeLeft.total <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: auction.product.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: auction.product.images[0] || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          isEnded ? styles.endedBadge : isEndingSoon ? styles.endingSoonBadge : styles.activeBadge
        ]}>
          <Text style={styles.statusText}>
            {isEnded ? 'Ended' : isEndingSoon ? '⚡ Ending Soon' : '🔴 Live'}
          </Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {auction.product.title}
        </Text>

        {/* Price and Bids */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Current Bid</Text>
            <Text style={styles.priceValue}>{formatPrice(auction.currentPrice)}</Text>
          </View>
          <View style={styles.bidsContainer}>
            <Text style={styles.bidsCount}>{auction.bidsCount}</Text>
            <Text style={styles.bidsLabel}>bids</Text>
          </View>
        </View>

        {/* Timer */}
        <View style={[
          styles.timerContainer,
          isEndingSoon && !isEnded && styles.timerUrgent
        ]}>
          <Text style={styles.timerIcon}>{isEnded ? '✅' : '⏱️'}</Text>
          <Text style={[
            styles.timerText,
            isEndingSoon && !isEnded && styles.timerTextUrgent
          ]}>
            {formatTimeDisplay(timeLeft)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Filter Button Component
const FilterButton: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.filterButton, isActive && styles.filterButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const AuctionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchAuctions = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: { page: number; limit: number; status?: 'active' | 'ending_soon' | 'ended' } = {
        page: pageNum,
        limit: 10,
      };

      if (filter === 'active') {
        params.status = 'active';
      } else if (filter === 'ending_soon') {
        params.status = 'ending_soon';
      }

      const response = await auctionsService.getAuctions(params);
      const newAuctions = response.data || [];

      if (pageNum === 1) {
        setAuctions(newAuctions);
      } else {
        setAuctions(prev => [...prev, ...newAuctions]);
      }

      setHasMore(newAuctions.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAuctions(1);
  }, [fetchAuctions]);

  const handleRefresh = () => {
    fetchAuctions(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchAuctions(page + 1);
    }
  };

  const handleAuctionPress = (auctionId: string) => {
    navigation.navigate('Auction', { auctionId });
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
    setHasMore(true);
  };

  const renderAuctionCard = ({ item }: { item: Auction }) => (
    <AuctionCard
      auction={item}
      onPress={() => handleAuctionPress(item.id)}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔨</Text>
        <Text style={styles.emptyTitle}>No Auctions Found</Text>
        <Text style={styles.emptySubtitle}>
          {filter === 'ending_soon'
            ? 'No auctions ending soon right now'
            : 'Check back later for new auctions'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Auctions</Text>
        <Text style={styles.subtitle}>Bid on exclusive items</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterButton
          label="All"
          isActive={filter === 'all'}
          onPress={() => handleFilterChange('all')}
        />
        <FilterButton
          label="Active"
          isActive={filter === 'active'}
          onPress={() => handleFilterChange('active')}
        />
        <FilterButton
          label="Ending Soon"
          isActive={filter === 'ending_soon'}
          onPress={() => handleFilterChange('ending_soon')}
        />
      </View>

      {/* Auction List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading auctions...</Text>
        </View>
      ) : (
        <FlatList
          data={auctions}
          renderItem={renderAuctionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 8,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
  },
  endingSoonBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
  },
  endedBadge: {
    backgroundColor: 'rgba(142, 142, 147, 0.9)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  bidsContainer: {
    alignItems: 'center',
  },
  bidsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bidsLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  timerUrgent: {
    backgroundColor: '#FFF3E0',
  },
  timerIcon: {
    fontSize: 12,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  timerTextUrgent: {
    color: '#FF9500',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default AuctionsScreen;

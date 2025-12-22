import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';

// Types
interface RewardsAccount {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetimePoints: number;
  pointsExpiringSoon: number;
  expirationDate?: string;
}

interface RewardsTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'cashback' | 'free_shipping' | 'gift_card';
  value: number;
  icon: string;
  available: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  isCurrentUser?: boolean;
}

type TabType = 'overview' | 'history' | 'redeem' | 'leaderboard';

export const RewardsScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  // Data states
  const [account, setAccount] = useState<RewardsAccount | null>(null);
  const [transactions, setTransactions] = useState<RewardsTransaction[]>([]);
  const [redemptionOptions, setRedemptionOptions] = useState<RedemptionOption[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const loadData = useCallback(async () => {
    try {
      // Mock data - replace with actual API calls
      setAccount({
        points: 8540,
        tier: 'gold',
        lifetimePoints: 25000,
        pointsExpiringSoon: 500,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setTransactions([
        { id: 't1', type: 'earn', points: 250, description: 'Purchase: iPhone Case', orderId: 'ORD-001', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 't2', type: 'earn', points: 100, description: 'Daily check-in bonus', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 't3', type: 'redeem', points: -500, description: 'Redeemed: 5% Discount', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 't4', type: 'earn', points: 500, description: 'Completed delivery as traveler', orderId: 'ORD-002', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 't5', type: 'earn', points: 50, description: 'Left a review', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 't6', type: 'expire', points: -100, description: 'Points expired', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      ]);

      setRedemptionOptions([
        { id: 'r1', name: '5% Off Next Order', description: 'Get 5% discount on your next purchase', pointsCost: 500, type: 'discount', value: 5, icon: '🎟️', available: true },
        { id: 'r2', name: '10% Off Next Order', description: 'Get 10% discount on your next purchase', pointsCost: 1000, type: 'discount', value: 10, icon: '🎫', available: true },
        { id: 'r3', name: 'Free Shipping', description: 'Free standard shipping on your next order', pointsCost: 750, type: 'free_shipping', value: 0, icon: '🚚', available: true },
        { id: 'r4', name: '$10 Gift Card', description: 'Redeem for a $10 store credit', pointsCost: 2000, type: 'gift_card', value: 10, icon: '💳', available: true },
        { id: 'r5', name: '$25 Gift Card', description: 'Redeem for a $25 store credit', pointsCost: 4500, type: 'gift_card', value: 25, icon: '💳', available: true },
      ]);

      setLeaderboard([
        { rank: 1, userId: 'u1', name: 'Sarah Connor', score: 12500, isCurrentUser: false },
        { rank: 2, userId: 'u2', name: 'John Wick', score: 11200, isCurrentUser: false },
        { rank: 3, userId: 'u3', name: 'Bruce Wayne', score: 10800, isCurrentUser: false },
        { rank: 4, userId: 'me', name: 'You', score: 8540, isCurrentUser: true },
        { rank: 5, userId: 'u4', name: 'Tony Stark', score: 7200, isCurrentUser: false },
      ]);
    } catch (error) {
      console.error('Failed to load rewards data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleRedeem = async (option: RedemptionOption) => {
    if (!account || account.points < option.pointsCost) {
      Alert.alert('Insufficient Points', 'You don\'t have enough points for this reward.');
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem ${option.pointsCost.toLocaleString()} points for "${option.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setRedeeming(option.id);
            try {
              // Mock redemption - replace with actual API call
              await new Promise<void>(resolve => setTimeout(resolve, 1000));
              const newBalance = account.points - option.pointsCost;
              setAccount({ ...account, points: newBalance });
              Alert.alert(
                'Success! 🎉',
                `You've redeemed "${option.name}"! Your code has been applied to your account.`
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to redeem. Please try again.');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#6B7280';
      case 'gold': return '#F59E0B';
      case 'silver': return '#9CA3AF';
      default: return '#EA580C';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: getTierColor(account?.tier || 'bronze') }]}>
          <Text style={styles.balanceLabel}>Your Points</Text>
          <Text style={styles.balanceAmount}>{account?.points.toLocaleString()}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierIcon}>{getTierBadge(account?.tier || 'bronze')}</Text>
            <Text style={styles.tierText}>{account?.tier?.toUpperCase()} MEMBER</Text>
          </View>
          {account?.pointsExpiringSoon && account.pointsExpiringSoon > 0 && (
            <View style={styles.expiringBadge}>
              <Text style={styles.expiringText}>
                ⚠️ {account.pointsExpiringSoon} pts expiring soon
              </Text>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['overview', 'history', 'redeem', 'leaderboard'] as TabType[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'overview' ? '📊' : tab === 'history' ? '📜' : tab === 'redeem' ? '🎁' : '🏆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Earn</Text>
            <View style={styles.earnCard}>
              {[
                { icon: '🛒', label: 'Make a Purchase', points: '+10 pts/$' },
                { icon: '✈️', label: 'Complete Delivery', points: '+50 pts' },
                { icon: '⭐', label: 'Leave a Review', points: '+5 pts' },
                { icon: '📅', label: 'Daily Check-in', points: '+10 pts' },
                { icon: '👥', label: 'Refer a Friend', points: '+100 pts' },
              ].map((item, index) => (
                <View key={index} style={[styles.earnItem, index < 4 && styles.earnItemBorder]}>
                  <Text style={styles.earnIcon}>{item.icon}</Text>
                  <Text style={styles.earnLabel}>{item.label}</Text>
                  <Text style={styles.earnPoints}>{item.points}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{account?.lifetimePoints.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Lifetime Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{leaderboard.find(e => e.isCurrentUser)?.rank || '-'}</Text>
                <Text style={styles.statLabel}>Your Rank</Text>
              </View>
            </View>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.historyCard}>
                {transactions.map((tx, index) => (
                  <View key={tx.id} style={[styles.historyItem, index < transactions.length - 1 && styles.historyItemBorder]}>
                    <View style={[
                      styles.historyIcon,
                      tx.type === 'earn' ? styles.earnBg : tx.type === 'redeem' ? styles.redeemBg : styles.expireBg
                    ]}>
                      <Text style={styles.historyIconText}>
                        {tx.type === 'earn' ? '↑' : tx.type === 'redeem' ? '↓' : '⏱'}
                      </Text>
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyDesc}>{tx.description}</Text>
                      <Text style={styles.historyDate}>{formatDate(tx.createdAt)}</Text>
                    </View>
                    <Text style={[
                      styles.historyPoints,
                      tx.type === 'earn' ? styles.earnText : styles.redeemText
                    ]}>
                      {tx.type === 'earn' ? '+' : ''}{tx.points.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Redeem Tab */}
        {activeTab === 'redeem' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Redeem Points</Text>
            <Text style={styles.redeemSubtitle}>
              You have <Text style={styles.pointsHighlight}>{account?.points.toLocaleString()}</Text> points
            </Text>
            {redemptionOptions.map(option => {
              const canAfford = (account?.points || 0) >= option.pointsCost;
              return (
                <View key={option.id} style={[styles.redeemCard, !canAfford && styles.redeemCardDisabled]}>
                  <Text style={styles.redeemIcon}>{option.icon}</Text>
                  <View style={styles.redeemContent}>
                    <Text style={styles.redeemName}>{option.name}</Text>
                    <Text style={styles.redeemDesc}>{option.description}</Text>
                    <Text style={styles.redeemCost}>{option.pointsCost.toLocaleString()} pts</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
                    onPress={() => handleRedeem(option)}
                    disabled={!canAfford || redeeming === option.id}
                  >
                    {redeeming === option.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.redeemButtonText, !canAfford && styles.redeemButtonTextDisabled]}>
                        Redeem
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Earners</Text>
            <View style={styles.leaderboardCard}>
              {leaderboard.map((entry, index) => (
                <View
                  key={entry.userId}
                  style={[
                    styles.leaderboardItem,
                    entry.isCurrentUser && styles.leaderboardItemHighlight,
                    index < leaderboard.length - 1 && styles.leaderboardItemBorder,
                  ]}
                >
                  <Text style={styles.leaderboardRank}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </Text>
                  <View style={styles.leaderboardAvatar}>
                    <Text style={styles.leaderboardAvatarText}>
                      {entry.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.leaderboardContent}>
                    <Text style={styles.leaderboardName}>
                      {entry.name}
                      {entry.isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
                    </Text>
                  </View>
                  <Text style={styles.leaderboardScore}>{entry.score.toLocaleString()}</Text>
                </View>
              ))}
            </View>
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
  balanceCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  expiringBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  expiringText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF9500',
  },
  tabText: {
    fontSize: 18,
  },
  activeTabText: {
    color: '#fff',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  earnCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  earnItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  earnIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  earnLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  earnPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earnBg: {
    backgroundColor: '#D1FAE5',
  },
  redeemBg: {
    backgroundColor: '#FCE7F3',
  },
  expireBg: {
    backgroundColor: '#E5E5EA',
  },
  historyIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContent: {
    flex: 1,
  },
  historyDesc: {
    fontSize: 15,
    color: '#000',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '600',
  },
  earnText: {
    color: '#10B981',
  },
  redeemText: {
    color: '#EF4444',
  },
  redeemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  pointsHighlight: {
    fontWeight: 'bold',
    color: '#FF9500',
  },
  redeemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  redeemCardDisabled: {
    opacity: 0.5,
  },
  redeemIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  redeemContent: {
    flex: 1,
  },
  redeemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  redeemDesc: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  redeemCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  redeemButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  redeemButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  redeemButtonTextDisabled: {
    color: '#8E8E93',
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  leaderboardItemHighlight: {
    backgroundColor: '#FEF3C7',
  },
  leaderboardItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  leaderboardRank: {
    width: 32,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E8E93',
    textAlign: 'center',
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderboardAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  leaderboardContent: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  youBadge: {
    fontSize: 12,
    color: '#8E8E93',
  },
  leaderboardScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  bottomPadding: {
    height: 32,
  },
});

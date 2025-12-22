import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ProfileStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface RewardsBalance {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [rewardsBalance, setRewardsBalance] = useState<RewardsBalance | null>(null);

  useEffect(() => {
    fetchNotifications();
    // Fetch rewards balance
    // Mock data - replace with actual API call
    setRewardsBalance({ points: 8540, tier: 'gold' });
  }, [fetchNotifications]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  type MenuScreen = keyof Omit<ProfileStackParamList, 'ProfileMain' | 'Traveler'>;
  
  const menuItems: Array<{ label: string; icon: string; screen: MenuScreen; badge?: number }> = [
    { label: 'Wallet', icon: '💳', screen: 'Wallet' },
    { label: 'Rewards', icon: '🎁', screen: 'Rewards' },
    { label: 'Identity Verification', icon: '🪪', screen: 'KYC' },
    { label: 'Notifications', icon: '🔔', screen: 'Notifications', badge: unreadCount },
    { label: 'Notification Settings', icon: '⚙️', screen: 'NotificationPreferences' },
    { label: 'Settings', icon: '⚙️', screen: 'Settings' },
  ];

  const handleTravelerPress = () => {
    navigation.navigate('Traveler', { screen: 'TravelerHome' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          
          {/* Rewards Balance Card */}
          {rewardsBalance && (
            <TouchableOpacity 
              style={styles.rewardsCard}
              onPress={() => navigation.navigate('Rewards')}
            >
              <View style={styles.rewardsContent}>
                <Text style={styles.rewardsIcon}>🎁</Text>
                <View>
                  <Text style={styles.rewardsLabel}>Rewards Points</Text>
                  <Text style={styles.rewardsPoints}>
                    {rewardsBalance.points.toLocaleString()} pts
                  </Text>
                </View>
              </View>
              <View style={styles.tierBadge}>
                <Text style={styles.tierIcon}>{getTierBadge(rewardsBalance.tier)}</Text>
                <Text style={styles.tierText}>{rewardsBalance.tier.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge && item.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTravelerPress}
          >
            <Text style={styles.menuIcon}>✈️</Text>
            <Text style={styles.menuLabel}>Traveler Dashboard</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  rewardsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginHorizontal: 16,
    width: '90%',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  rewardsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardsIcon: {
    fontSize: 24,
  },
  rewardsLabel: {
    fontSize: 12,
    color: '#9A3412',
  },
  rewardsPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tierIcon: {
    fontSize: 14,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9A3412',
  },
  menuContainer: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  menuArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

/**
 * Notification List Screen
 * Displays all notifications with read/unread status
 * Requirements: 10.2 - Handle notifications with navigation
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore, Notification } from '../../store/notificationStore';
import { RootStackParamList } from '../../types/navigation';

export const NotificationListScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Navigate based on notification type
      const { type, data } = notification;

      if (['outbid', 'ending_soon', 'auction_won', 'auction_ended'].includes(type)) {
        const auctionId = (data as any)?.auctionId;
        if (auctionId) {
          navigation.navigate('Auction', { auctionId });
        }
      } else if (['order_status', 'delivery_update', 'payment_received'].includes(type)) {
        const orderId = (data as any)?.orderId;
        if (orderId) {
          navigation.navigate('Order', { orderId });
        }
      }
    },
    [navigation, markAsRead]
  );

  const getIconForType = (type: string): string => {
    switch (type) {
      case 'outbid':
        return '🔔';
      case 'ending_soon':
        return '⏰';
      case 'auction_won':
        return '🎉';
      case 'auction_ended':
        return '🏁';
      case 'order_status':
        return '📦';
      case 'delivery_update':
        return '🚚';
      case 'payment_received':
        return '💰';
      case 'new_request':
        return '📍';
      default:
        return '📬';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getIconForType(item.type)}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderHeader = () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount === 0) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>{unreadCount} unread</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptyText}>
        You'll see notifications about your orders, auctions, and more here.
      </Text>
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  markAllRead: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  unreadItem: {
    backgroundColor: '#F0F8FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: '#000',
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationListScreen;

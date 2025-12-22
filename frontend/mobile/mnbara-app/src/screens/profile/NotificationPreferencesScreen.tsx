/**
 * Notification Preferences Screen
 * Allows users to configure notification settings
 * Requirements: 10.2, 10.4 - Notification preferences configuration
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useNotificationStore, NotificationPreferences } from '../../store/notificationStore';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export const NotificationPreferencesScreen = () => {
  const {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreferences,
    clearError,
  } = useNotificationStore();

  const { permissionStatus, requestPermission } = usePushNotifications();

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleToggle = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      updatePreferences({ [key]: value });
    },
    [updatePreferences]
  );

  const handlePushToggle = useCallback(
    async (value: boolean) => {
      if (value && permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive push notifications.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
          return;
        }
      }
      handleToggle('pushEnabled', value);
    },
    [permissionStatus, requestPermission, handleToggle]
  );

  const renderPermissionBanner = () => {
    if (permissionStatus === 'denied') {
      return (
        <TouchableOpacity
          style={styles.permissionBanner}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
        >
          <Text style={styles.permissionBannerText}>
            Push notifications are disabled. Tap to open settings.
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (isLoading && !preferences) {
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
      <ScrollView style={styles.scrollView}>
        {renderPermissionBanner()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={preferences.pushEnabled && permissionStatus === 'granted'}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              disabled={isLoading}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive updates via email
              </Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={(value) => handleToggle('emailEnabled', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              disabled={isLoading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Order Updates</Text>
              <Text style={styles.settingDescription}>
                Shipping and delivery notifications
              </Text>
            </View>
            <Switch
              value={preferences.orderUpdates}
              onValueChange={(value) => handleToggle('orderUpdates', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              disabled={isLoading || !preferences.pushEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auction Alerts</Text>
              <Text style={styles.settingDescription}>
                Outbid and ending soon alerts
              </Text>
            </View>
            <Switch
              value={preferences.auctionAlerts}
              onValueChange={(value) => handleToggle('auctionAlerts', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              disabled={isLoading || !preferences.pushEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Traveler Requests</Text>
              <Text style={styles.settingDescription}>
                New delivery requests nearby
              </Text>
            </View>
            <Switch
              value={preferences.travelerRequests}
              onValueChange={(value) => handleToggle('travelerRequests', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              disabled={isLoading || !preferences.pushEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Promotions</Text>
              <Text style={styles.settingDescription}>
                Deals and special offers
              </Text>
            </View>
            <Switch
              value={preferences.promotions}
              onValueChange={(value) => handleToggle('promotions', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              disabled={isLoading || !preferences.pushEnabled}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            You can change these settings at any time. Some notifications may
            still be sent for important account and security updates.
          </Text>
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
  permissionBanner: {
    backgroundColor: '#FF9500',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  permissionBannerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  infoSection: {
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationPreferencesScreen;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';

// Profile screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { WalletScreen } from '../screens/profile/WalletScreen';
import { KYCScreen } from '../screens/profile/KYCScreen';
import { RewardsScreen } from '../screens/profile/RewardsScreen';
import { NotificationPreferencesScreen } from '../screens/profile/NotificationPreferencesScreen';
import { NotificationListScreen } from '../screens/notifications/NotificationListScreen';

// Traveler navigator
import { TravelerNavigator } from './TravelerNavigator';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: '#007AFF',
      }}
      initialRouteName="ProfileMain"
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerTitle: 'Profile' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: 'Settings' }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerTitle: 'Wallet' }}
      />
      <Stack.Screen
        name="KYC"
        component={KYCScreen}
        options={{ headerTitle: 'Identity Verification' }}
      />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ headerTitle: 'Rewards' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationListScreen}
        options={{ headerTitle: 'Notifications' }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ headerTitle: 'Notification Settings' }}
      />
      <Stack.Screen
        name="Traveler"
        component={TravelerNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

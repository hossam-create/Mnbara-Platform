import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAuthStore } from '../store/authStore';
import { useConsentStore } from '../store/consentStore';
import { RootStackParamList } from '../types/navigation';

// Modal screens
import { AuctionDetailScreen } from '../screens/auctions/AuctionDetailScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { TripDetailScreen } from '../screens/traveler/TripDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, checkAuthState } = useAuthStore();
  const { hasCompletedOnboarding } = useConsentStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuthState();
      } finally {
        setIsInitializing(false);
      }
    };
    initializeAuth();
  }, [checkAuthState]);

  // Show loading screen while checking auth state
  if (isInitializing || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          {/* Modal screens accessible from anywhere when authenticated */}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen
              name="Auction"
              component={AuctionDetailScreen}
              options={{ headerShown: true, title: 'Auction' }}
            />
            <Stack.Screen
              name="Product"
              component={ProductDetailScreen}
              options={{ headerShown: true, title: 'Product' }}
            />
            <Stack.Screen
              name="Order"
              component={OrderDetailScreen}
              options={{ headerShown: true, title: 'Order Details' }}
            />
            <Stack.Screen
              name="Trip"
              component={TripDetailScreen}
              options={{ headerShown: true, title: 'Trip Details' }}
            />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

/**
 * MNBARA Mobile App Entry Point
 * Requirements: 10.1, 10.2 - Push notification infrastructure and handlers
 * Requirements: 20.3 - Configure alerts for payment failures, auction timer drift, and service health
 */

import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { NotificationProvider } from './src/components/notifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { pushNotificationService } from './src/services/pushNotifications';
import { RootStackParamList } from './src/types/navigation';
import { initSentry, Sentry } from './src/config/sentry';

// Initialize Sentry before app renders
// Requirements: 20.3 - Configure alerts for payment failures, auction timer drift, and service health
initSentry();

/**
 * Background message handler - must be registered outside of component
 * Requirements: 10.2 - Handle background notifications
 */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[App] Background message received:', remoteMessage.messageId);
  // Background messages are handled by the system notification tray
  // The pushNotificationService will handle navigation when user taps
});

const App = () => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    // Set navigation ref for push notification service
    if (navigationRef.current) {
      pushNotificationService.setNavigationRef(navigationRef);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <NavigationContainer 
            ref={navigationRef}
            onStateChange={(state) => {
              // Track navigation for Sentry breadcrumbs
              const currentRoute = state?.routes[state.index];
              if (currentRoute) {
                Sentry.addBreadcrumb({
                  category: 'navigation',
                  message: `Navigated to ${currentRoute.name}`,
                  level: 'info',
                });
              }
            }}
          >
            <NotificationProvider>
              <RootNavigator />
            </NotificationProvider>
          </NavigationContainer>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

// Wrap with Sentry for automatic error boundary at root level
export default Sentry.wrap(App);

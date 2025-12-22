/**
 * In-App Notification Component
 * Displays notifications as a toast/banner when app is in foreground
 * Requirements: 10.2 - Handle foreground notifications with in-app alerts
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NOTIFICATION_HEIGHT = 80;
const SWIPE_THRESHOLD = 50;

export interface InAppNotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

interface InAppNotificationProps {
  notification: InAppNotificationData | null;
  onPress?: (notification: InAppNotificationData) => void;
  onDismiss?: (notification: InAppNotificationData) => void;
  duration?: number;
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onPress,
  onDismiss,
  duration = 4000,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-NOTIFICATION_HEIGHT - insets.top)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [currentNotification, setCurrentNotification] = useState<InAppNotificationData | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          dismissNotification();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const showNotification = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    timeoutRef.current = setTimeout(() => {
      dismissNotification();
    }, duration);
  };

  const dismissNotification = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -NOTIFICATION_HEIGHT - insets.top,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentNotification) {
        onDismiss?.(currentNotification);
      }
      setCurrentNotification(null);
    });
  };

  const handlePress = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    dismissNotification();
    if (currentNotification) {
      onPress?.(currentNotification);
    }
  };

  useEffect(() => {
    if (notification && notification.id !== currentNotification?.id) {
      setCurrentNotification(notification);
      showNotification();
    }
  }, [notification]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
      case 'new_request':
        return '📍';
      default:
        return '📬';
    }
  };

  const getBackgroundColor = (type: string): string => {
    switch (type) {
      case 'outbid':
      case 'ending_soon':
        return '#FF9500';
      case 'auction_won':
        return '#34C759';
      case 'auction_ended':
        return '#8E8E93';
      case 'order_status':
      case 'delivery_update':
        return '#007AFF';
      case 'new_request':
        return '#5856D6';
      default:
        return '#1C1C1E';
    }
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top,
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBackgroundColor(currentNotification.type),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{getIconForType(currentNotification.type)}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentNotification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {currentNotification.body}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.swipeIndicator} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: NOTIFICATION_HEIGHT,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  swipeIndicator: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
});

export default InAppNotification;

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Button } from './Button';
import colors from '../../theme/colors';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: { uri: string } | number;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  style,
  titleStyle,
  messageStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <Image source={icon} style={styles.icon} resizeMode="contain" />
      )}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {message && (
        <Text style={[styles.message, messageStyle]}>{message}</Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

// Predefined empty states for common scenarios
interface EmptyCartProps {
  onContinueShopping?: () => void;
}

export const EmptyCart: React.FC<EmptyCartProps> = ({ onContinueShopping }) => (
  <EmptyState
    title="Your cart is empty"
    message="Looks like you haven't added anything to your cart yet."
    icon={require('../../assets/images/empty-cart.png')}
    actionLabel="Continue Shopping"
    onAction={onContinueShopping}
  />
);

interface EmptyOrdersProps {
  onBrowse?: () => void;
}

export const EmptyOrders: React.FC<EmptyOrdersProps> = ({ onBrowse }) => (
  <EmptyState
    title="No orders yet"
    message="You haven't placed any orders yet. Start shopping to see your orders here."
    icon={require('../../assets/images/empty-orders.png')}
    actionLabel="Browse Products"
    onAction={onBrowse}
  />
);

interface EmptyNotificationsProps {
  onRefresh?: () => void;
}

export const EmptyNotifications: React.FC<EmptyNotificationsProps> = ({
  onRefresh,
}) => (
  <EmptyState
    title="No notifications"
    message="You're all caught up! We'll notify you when something important happens."
    icon={require('../../assets/images/empty-notifications.png')}
    actionLabel="Refresh"
    onAction={onRefresh}
  />
);

interface EmptySearchProps {
  query: string;
  onClear?: () => void;
}

export const EmptySearch: React.FC<EmptySearchProps> = ({ query, onClear }) => (
  <EmptyState
    title="No results found"
    message={`We couldn't find any matches for "${query}". Try checking for typos or using different keywords.`}
    icon={require('../../assets/images/empty-search.png')}
    actionLabel="Clear Search"
    onAction={onClear}
  />
);

interface EmptyDeliveriesProps {
  onCreate?: () => void;
}

export const EmptyDeliveries: React.FC<EmptyDeliveriesProps> = ({ onCreate }) => (
  <EmptyState
    title="No deliveries"
    message="You don't have any active deliveries. Create a new delivery request to get started."
    icon={require('../../assets/images/empty-deliveries.png')}
    actionLabel="Create Delivery"
    onAction={onCreate}
  />
);

interface EmptyTripsProps {
  onCreate?: () => void;
}

export const EmptyTrips: React.FC<EmptyTripsProps> = ({ onCreate }) => (
  <EmptyState
    title="No trips"
    message="You haven't listed any trips yet. Share your travel plans and earn money by carrying packages."
    icon={require('../../assets/images/empty-trips.png')}
    actionLabel="Create Trip"
    onAction={onCreate}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  actionButton: {
    minWidth: 160,
  },
});

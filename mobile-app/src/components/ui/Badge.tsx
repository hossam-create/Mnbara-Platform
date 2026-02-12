import React from 'react';
import { View, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import colors from '../../theme/colors';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<BadgeVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary.main },
  success: { backgroundColor: colors.success.main },
  warning: { backgroundColor: colors.warning.main },
  error: { backgroundColor: colors.error.main },
  info: { backgroundColor: colors.info.main },
  neutral: { backgroundColor: colors.gray[400] },
};

const textColors: Record<BadgeVariant, string> = {
  primary: colors.white,
  success: colors.white,
  warning: colors.black,
  error: colors.white,
  info: colors.white,
  neutral: colors.white,
};

const sizeStyles: Record<BadgeSize, ViewStyle> = {
  small: { paddingVertical: 4, paddingHorizontal: 8 },
  medium: { paddingVertical: 6, paddingHorizontal: 12 },
};

const textSizeStyles: Record<BadgeSize, TextStyle> = {
  small: { fontSize: 10, fontWeight: '600' },
  medium: { fontSize: 12, fontWeight: '600' },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  return (
    <View
      style={[
        styles.badge,
        variantStyles[variant],
        sizeStyles[size],
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          textSizeStyles[size],
          { color: textColors[variant] },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: string;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    accepted: { variant: 'info', label: 'Accepted' },
    in_progress: { variant: 'info', label: 'In Progress' },
    in_transit: { variant: 'info', label: 'In Transit' },
    completed: { variant: 'success', label: 'Completed' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    disputed: { variant: 'warning', label: 'Disputed' },
    verified: { variant: 'success', label: 'Verified' },
    unverified: { variant: 'neutral', label: 'Unverified' },
  };

  const config = statusConfig[status] || { variant: 'neutral', label: status };

  return <Badge label={config.label} variant={config.variant} style={style} />;
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

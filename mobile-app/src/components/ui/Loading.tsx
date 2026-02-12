import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import colors from '../../theme/colors';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color,
  text,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator
        size={size}
        color={color || colors.primary.main}
      />
      {text && (
        <Text style={[styles.text, textStyle]}>{text}</Text>
      )}
    </View>
  );
};

interface FullScreenLoadingProps {
  text?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  text = 'Loading...',
}) => {
  return (
    <View style={styles.fullScreen}>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={styles.fullScreenText}>{text}</Text>
    </View>
  );
};

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        {text && <Text style={styles.overlayText}>{text}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  fullScreenText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    backgroundColor: colors.background.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
});

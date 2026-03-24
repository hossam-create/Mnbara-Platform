import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Button } from './Button';
import colors from '../../theme/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onReset,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>
        We're sorry, but something unexpected happened. Please try again.
      </Text>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error details:</Text>
          <Text style={styles.errorText}>
            {error.message || 'Unknown error'}
          </Text>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Try Again" onPress={onReset} />
      </View>
    </View>
  );
};

interface AsyncErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  title?: string;
  message?: string;
  retryLabel?: string;
  style?: ViewStyle;
}

export const AsyncErrorFallback: React.FC<AsyncErrorFallbackProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  message = 'We encountered an error while loading data.',
  retryLabel = 'Retry',
  style,
}) => {
  return (
    <View style={[styles.asyncContainer, style]}>
      <Text style={styles.asyncTitle}>{title}</Text>
      <Text style={styles.asyncMessage}>{message}</Text>
      {error && process.env.NODE_ENV === 'development' && (
        <Text style={styles.debugError}>{error.message}</Text>
      )}
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

interface NetworkErrorFallbackProps {
  onRetry: () => void;
  message?: string;
}

export const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({
  onRetry,
  message = 'Please check your internet connection and try again.',
}) => {
  return (
    <View style={styles.networkContainer}>
      <Text style={styles.networkIcon}>📡</Text>
      <Text style={styles.networkTitle}>No Internet Connection</Text>
      <Text style={styles.networkMessage}>{message}</Text>
      <Button title="Try Again" onPress={onRetry} style={styles.networkButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: colors.error.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error.dark,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.error.dark,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  },
  asyncContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  asyncTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  asyncMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  debugError: {
    fontSize: 12,
    color: colors.error.main,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  networkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  networkIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  networkTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  networkMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  networkButton: {
    minWidth: 140,
  },
});

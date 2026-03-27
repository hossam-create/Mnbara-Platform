import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../theme';

const ForgotPasswordScreen: React.FC = () => {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendResetLink = () => {
    if (!email) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleBackToLogin = () => {
    // Navigate back to login
    console.log('Navigate to login');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.gray }]}>
              No worries, we'll send you reset instructions
            </Text>
          </View>

          {/* Success message */}
          {isSuccess ? (
            <View style={[styles.successContainer, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={[styles.successTitle, { color: '#166534' }]}>
                Reset Link Sent!
              </Text>
              <Text style={[styles.successMessage, { color: theme.colors.text }]}>
                We've sent a password reset link to your email address.
                Please check your inbox and follow the instructions.
              </Text>
            </View>
          ) : (
            <>
              {/* Email input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Email Address
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.input, { color: theme.colors.text }]}>
                    {email || 'Enter your email'}
                  </Text>
                </View>
              </View>

              {/* Send reset link button */}
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSendResetLink}
                disabled={isLoading}
              >
                <Text style={[styles.sendButtonText, { color: theme.colors.white }]}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Back to login */}
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={[styles.backLink, { color: theme.colors.primary }]}>
              ← Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;

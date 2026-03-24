import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { register, clearError } from '../store/auth.slice';
import { UserRole } from '../../../domain/entities/user.entity';

const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('shopper');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleRegister = () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    if (!agreeToTerms) {
      return;
    }

    dispatch(register({
      fullName,
      email,
      phone,
      password,
      role,
    }) as any);
  };

  const handleLogin = () => {
    // Navigate to login screen
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
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.gray }]}>
              Join Mnbara and start shopping or earning
            </Text>
          </View>

          {/* Error message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Role selector */}
          <View style={styles.roleContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              I want to:
            </Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'shopper' && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setRole('shopper')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'shopper' && { color: theme.colors.white },
                    { color: theme.colors.text },
                  ]}
                >
                  Shop
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'traveler' && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setRole('traveler')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'traveler' && { color: theme.colors.white },
                    { color: theme.colors.text },
                  ]}
                >
                  Travel
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Full name input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Full Name
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <Text style={[styles.input, { color: theme.colors.text }]}>
                {fullName || 'Enter your full name'}
              </Text>
            </View>
          </View>

          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Email
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <Text style={[styles.input, { color: theme.colors.text }]}>
                {email || 'Enter your email'}
              </Text>
            </View>
          </View>

          {/* Phone input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Phone Number
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <Text style={[styles.input, { color: theme.colors.text }]}>
                {phone || '+1 (555) 000-0000'}
              </Text>
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Password
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <Text style={[styles.input, { color: theme.colors.text }]}>
                {showPassword ? password : '•'.repeat(password.length)}
              </Text>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={[styles.showPassword, { color: theme.colors.primary }]}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Confirm Password
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <Text style={[styles.input, { color: theme.colors.text }]}>
                {showConfirmPassword ? confirmPassword : '•'.repeat(confirmPassword.length)}
              </Text>
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={[styles.showPassword, { color: theme.colors.primary }]}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View style={[styles.checkbox, { borderColor: theme.colors.border }]}>
              {agreeToTerms && (
                <View style={[styles.checkboxChecked, { backgroundColor: theme.colors.primary }]} />
              )}
            </View>
            <Text style={[styles.termsText, { color: theme.colors.text }]}>
              I agree to the{' '}
              <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={[styles.registerButtonText, { color: theme.colors.white }]}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.gray }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 24,
  },
  content: {
    width: '100%',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  roleContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  showPassword: {
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;

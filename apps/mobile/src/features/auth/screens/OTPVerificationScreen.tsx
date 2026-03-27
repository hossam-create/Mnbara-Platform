import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../theme';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/RootStackParamList';

interface OTPVerificationScreenProps {
  route: RouteProp<RootStackParamList, 'OTPVerification'>;
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ route }) => {
  const theme = useTheme();
  const { email, phone, type } = route.params || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResendEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) {
      return;
    }

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      // Focus next input (implementation depends on ref)
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log('OTP verified:', otpValue);
      // Navigate to profile setup
    }, 1500);
  };

  const handleResend = () => {
    if (!isResendEnabled) {
      return;
    }

    setIsResendEnabled(false);
    setCountdown(60);

    // Simulate resend
    console.log('Resend OTP to:', type === 'email' ? email : phone);
  };

  const handleBack = () => {
    // Navigate back
    console.log('Navigate back');
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
              Verify Your {type === 'email' ? 'Email' : 'Phone'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.gray }]}>
              Enter the 6-digit code sent to{' '}
              {type === 'email' ? email : phone}
            </Text>
          </View>

          {/* OTP inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[styles.otpInput, { borderColor: theme.colors.border }]}
              >
                <Text
                  style={[
                    styles.otpDigit,
                    { color: theme.colors.text },
                  ]}
                >
                  {digit}
                </Text>
              </View>
            ))}
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: theme.colors.gray }]}>
              {countdown > 0 ? (
                <>
                  Resend code in{' '}
                  <Text style={[styles.timerValue, { color: theme.colors.primary }]}>
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </Text>
                </>
              ) : (
                <Text style={[styles.resendLink, { color: theme.colors.primary }]}>
                  Didn't receive code?
                </Text>
              )}
            </Text>
          </View>

          {/* Resend button */}
          {isResendEnabled && (
            <TouchableOpacity
              style={[styles.resendButton, { borderColor: theme.colors.primary }]}
              onPress={handleResend}
            >
              <Text style={[styles.resendButtonText, { color: theme.colors.primary }]}>
                Resend Code
              </Text>
            </TouchableOpacity>
          )}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            <Text style={[styles.verifyButtonText, { color: theme.colors.white }]}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity onPress={handleBack}>
            <Text style={[styles.backLink, { color: theme.colors.gray }]}>
              ← Back
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
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
  },
  timerValue: {
    fontWeight: '600',
  },
  resendLink: {
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 24,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default OTPVerificationScreen;

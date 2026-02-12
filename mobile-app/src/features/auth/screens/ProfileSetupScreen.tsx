import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme } from '../../../theme';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/RootStackParamList';
import { UserRole } from '../../../domain/entities/user.entity';

interface ProfileSetupScreenProps {
  route: RouteProp<RootStackParamList, 'ProfileSetup'>;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ route }) => {
  const theme = useTheme();
  const { role } = route.params || { role: 'shopper' };

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [bio, setBio] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isTraveler = role === 'traveler';

  const handleCompleteSetup = () => {
    if (!fullName || !dateOfBirth) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isTraveler && !vehicleType) {
      Alert.alert('Error', 'Please provide vehicle information');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log('Profile setup complete:', {
        fullName,
        dateOfBirth,
        gender,
        bio,
        vehicleType,
        vehiclePlate,
      });
      // Navigate to home screen
    }, 1500);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup',
      'You can complete your profile later in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => console.log('Skip') },
      ]
    );
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
              Complete Your Profile
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.gray }]}>
              Tell us a bit about yourself
            </Text>
          </View>

          {/* Profile photo */}
          <View style={styles.photoContainer}>
            <View style={[styles.photoPlaceholder, { borderColor: theme.colors.border }]}>
              <Text style={styles.photoIcon}>📷</Text>
            </View>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.uploadButtonText, { color: theme.colors.white }]}>
                Upload Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full name */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Full Name *
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <Text style={[styles.input, { color: theme.colors.text }]}>
                {fullName || 'Enter your full name'}
              </Text>
            </View>
          </View>

          {/* Date of birth */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Date of Birth *
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <Text style={[styles.input, { color: theme.colors.text }]}>
                {dateOfBirth || 'YYYY-MM-DD'}
              </Text>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Gender
            </Text>
            <View style={styles.genderButtons}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === g && { color: theme.colors.white },
                      { color: theme.colors.text },
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Bio
            </Text>
            <View style={[styles.textAreaWrapper, { borderColor: theme.colors.border }]}>
              <Text
                style={[styles.textArea, { color: theme.colors.text }]}
                numberOfLines={4}
              >
                {bio || 'Tell us about yourself...'}
              </Text>
            </View>
          </View>

          {/* Vehicle information (travelers only) */}
          {isTraveler && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Vehicle Information
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Vehicle Type *
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.input, { color: theme.colors.text }]}>
                    {vehicleType || 'Car, Motorcycle, etc.'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  License Plate
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.input, { color: theme.colors.text }]}>
                    {vehiclePlate || 'ABC-1234'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Complete button */}
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCompleteSetup}
            disabled={isLoading}
          >
            <Text style={[styles.completeButtonText, { color: theme.colors.white }]}>
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>

          {/* Skip button */}
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipLink, { color: theme.colors.gray }]}>
              Skip for now
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  photoIcon: {
    fontSize: 32,
  },
  uploadButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
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
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 100,
  },
  textArea: {
    fontSize: 16,
    textAlignVertical: 'top',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionDivider: {
    marginTop: 24,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipLink: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ProfileSetupScreen;

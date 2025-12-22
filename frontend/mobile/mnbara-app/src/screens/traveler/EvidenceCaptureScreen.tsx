/**
 * EvidenceCaptureScreen - Capture photo evidence for pickup/delivery confirmation
 * Captures photo with location data for proof of pickup/delivery
 * Requirements: 9.4, 9.5, 13.1, 13.2, 13.3
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TravelerStackParamList } from '../../types/navigation';
import { useTravelerStore } from '../../store/travelerStore';
import { Evidence } from '../../types';

type Props = NativeStackScreenProps<TravelerStackParamList, 'EvidenceCapture'>;

// Note: In a real app, you would use react-native-camera or expo-camera
// This is a simplified implementation that simulates camera functionality

export const EvidenceCaptureScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, type } = route.params;
  const { updateDeliveryStatus, error, clearError } = useTravelerStore();

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'MNBARA needs camera access to capture evidence photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'MNBARA needs location access to verify delivery location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        setCameraPermission(cameraGranted === PermissionsAndroid.RESULTS.GRANTED);
        
        if (locationGranted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          setLocationError('Location permission denied');
        }
      } else {
        // iOS - permissions handled by native modules
        setCameraPermission(true);
        getCurrentLocation();
      }
    } catch (err) {
      console.error('Permission error:', err);
      setCameraPermission(false);
    }
  };

  const getCurrentLocation = () => {
    // Note: In a real app, use @react-native-community/geolocation or expo-location
    // Simulating location for demo purposes
    setCurrentLocation({
      lat: 40.7128 + (Math.random() - 0.5) * 0.01,
      lon: -74.0060 + (Math.random() - 0.5) * 0.01,
    });
  };

  const handleCapture = async () => {
    if (!cameraPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCapturing(true);

    // Simulate camera capture delay
    // In a real app, this would open the camera and capture a photo
    setTimeout(() => {
      // Generate a mock photo URL (in production, this would be the actual captured image)
      const mockPhotoUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      setCapturedPhoto(mockPhotoUrl);
      setIsCapturing(false);
      
      // Refresh location when photo is captured
      getCurrentLocation();
    }, 1000);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) {
      Alert.alert('Error', 'Please capture a photo first');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const evidence: Evidence = {
        photoUrl: capturedPhoto,
        timestamp: new Date().toISOString(),
        location: currentLocation || undefined,
      };

      const status = type === 'pickup' ? 'picked_up' : 'delivered';
      await updateDeliveryStatus(matchId, status, evidence);

      Alert.alert(
        'Success',
        type === 'pickup'
          ? 'Pickup confirmed! The item is now in transit.'
          : 'Delivery confirmed! Waiting for buyer confirmation.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('DeliveryDetail', { matchId }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCameraView = () => {
    if (cameraPermission === false) {
      return (
        <View style={styles.permissionDenied}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable camera access in your device settings to capture evidence photos.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestPermissions}>
            <Text style={styles.retryButtonText}>Request Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (capturedPhoto) {
      return (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedPhoto }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeButtonText}>🔄 Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          {isCapturing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.cameraText}>Camera Preview</Text>
              <Text style={styles.cameraSubtext}>
                Position the {type === 'pickup' ? 'item' : 'delivered package'} in frame
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'pickup' ? 'Pickup Confirmation' : 'Delivery Confirmation'}
        </Text>
        <Text style={styles.subtitle}>
          {type === 'pickup'
            ? 'Take a photo of the item you are picking up'
            : 'Take a photo showing the delivered package'}
        </Text>
      </View>

      {/* Camera/Preview Area */}
      {renderCameraView()}

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <Text style={styles.locationIcon}>📍</Text>
        {currentLocation ? (
          <View>
            <Text style={styles.locationLabel}>Location captured</Text>
            <Text style={styles.locationCoords}>
              {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
            </Text>
          </View>
        ) : locationError ? (
          <View>
            <Text style={styles.locationError}>{locationError}</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Text style={styles.locationRetry}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.locationLoading}>Getting location...</Text>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 Guidelines</Text>
        <Text style={styles.instructionItem}>
          • Ensure the {type === 'pickup' ? 'item' : 'package'} is clearly visible
        </Text>
        <Text style={styles.instructionItem}>
          • Include any identifying labels or markings
        </Text>
        {type === 'delivery' && (
          <Text style={styles.instructionItem}>
            • Show the delivery location (door, mailbox, etc.)
          </Text>
        )}
        <Text style={styles.instructionItem}>
          • Make sure the photo is well-lit and in focus
        </Text>
      </View>

      {/* Submit Button */}
      {capturedPhoto && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                Confirm {type === 'pickup' ? 'Pickup' : 'Delivery'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  cameraText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 8,
  },
  cameraSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: 12,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationLabel: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  locationCoords: {
    fontSize: 12,
    color: '#8E8E93',
  },
  locationError: {
    fontSize: 14,
    color: '#FF3B30',
  },
  locationRetry: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  locationLoading: {
    fontSize: 14,
    color: '#8E8E93',
  },
  instructions: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  submitContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#34C75980',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

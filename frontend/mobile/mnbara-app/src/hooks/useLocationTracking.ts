/**
 * useLocationTracking - Custom hook for background location tracking
 * Handles location permissions, tracking, and updates to trips-service
 * Requirements: 9.4, 11.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, AppState, AppStateStatus } from 'react-native';
import { useTravelerStore } from '../store/travelerStore';

export interface LocationData {
  lat: number;
  lon: number;
  accuracy?: number;
  timestamp: number;
}

export interface UseLocationTrackingOptions {
  /** Update interval in milliseconds (default: 30000 = 30 seconds) */
  updateInterval?: number;
  /** Minimum distance in meters to trigger update (default: 100) */
  minDistance?: number;
  /** Whether to track in background (default: false) */
  enableBackground?: boolean;
  /** Whether to auto-start tracking (default: false) */
  autoStart?: boolean;
}

export interface UseLocationTrackingResult {
  /** Current location */
  location: LocationData | null;
  /** Whether tracking is active */
  isTracking: boolean;
  /** Whether location permission is granted */
  hasPermission: boolean | null;
  /** Error message if any */
  error: string | null;
  /** Start location tracking */
  startTracking: () => Promise<void>;
  /** Stop location tracking */
  stopTracking: () => void;
  /** Request location permission */
  requestPermission: () => Promise<boolean>;
  /** Get current location once */
  getCurrentLocation: () => Promise<LocationData | null>;
}

const DEFAULT_OPTIONS: UseLocationTrackingOptions = {
  updateInterval: 30000, // 30 seconds
  minDistance: 100, // 100 meters
  enableBackground: false,
  autoStart: false,
};

export const useLocationTracking = (
  options: UseLocationTrackingOptions = {}
): UseLocationTrackingResult => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { updateLocation, setCurrentLocation } = useTravelerStore();
  
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    },
    []
  );

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'MNBARA needs access to your location to track deliveries and show nearby requests.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const granted = fineLocation === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(granted);

        if (!granted) {
          setError('Location permission denied');
        }

        // Request background location if needed (Android 10+)
        if (granted && mergedOptions.enableBackground && Platform.Version >= 29) {
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Permission',
              message:
                'MNBARA needs background location access to track deliveries while the app is in the background.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (backgroundLocation !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Background location permission not granted');
          }
        }

        return granted;
      } else {
        // iOS - permissions handled by native modules
        // In a real app, use @react-native-community/geolocation or expo-location
        setHasPermission(true);
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request location permission');
      setHasPermission(false);
      return false;
    }
  }, [mergedOptions.enableBackground]);

  // Get current location (simulated for demo)
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      // Note: In a real app, use @react-native-community/geolocation or expo-location
      // This is a simulation for demo purposes
      
      // Simulate getting location with some randomness
      const baseLocation = lastLocationRef.current || {
        lat: 40.7128,
        lon: -74.0060,
      };

      // Add small random movement to simulate real tracking
      const newLocation: LocationData = {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.001,
        lon: baseLocation.lon + (Math.random() - 0.5) * 0.001,
        accuracy: 10 + Math.random() * 20,
        timestamp: Date.now(),
      };

      setLocation(newLocation);
      setCurrentLocation({ lat: newLocation.lat, lon: newLocation.lon });
      setError(null);

      return newLocation;
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      return null;
    }
  }, [setCurrentLocation]);

  // Update location to server
  const sendLocationUpdate = useCallback(
    async (locationData: LocationData) => {
      try {
        // Check if we've moved enough to warrant an update
        if (lastLocationRef.current) {
          const distance = calculateDistance(
            lastLocationRef.current.lat,
            lastLocationRef.current.lon,
            locationData.lat,
            locationData.lon
          );

          if (distance < mergedOptions.minDistance!) {
            return; // Haven't moved enough
          }
        }

        // Send update to server
        await updateLocation(locationData.lat, locationData.lon);
        lastLocationRef.current = locationData;
      } catch (err) {
        console.warn('Failed to send location update:', err);
      }
    },
    [calculateDistance, mergedOptions.minDistance, updateLocation]
  );

  // Start tracking
  const startTracking = useCallback(async () => {
    if (isTracking) return;

    // Check/request permission
    let permitted = hasPermission;
    if (permitted === null) {
      permitted = await requestPermission();
    }

    if (!permitted) {
      setError('Location permission required');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Get initial location
    const initialLocation = await getCurrentLocation();
    if (initialLocation) {
      await sendLocationUpdate(initialLocation);
    }

    // Set up interval for periodic updates
    trackingIntervalRef.current = setInterval(async () => {
      const newLocation = await getCurrentLocation();
      if (newLocation) {
        await sendLocationUpdate(newLocation);
      }
    }, mergedOptions.updateInterval);
  }, [
    isTracking,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    sendLocationUpdate,
    mergedOptions.updateInterval,
  ]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground
        if (isTracking) {
          getCurrentLocation();
        }
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to background
        if (!mergedOptions.enableBackground && isTracking) {
          // Optionally pause tracking when in background
          // For now, we continue tracking
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isTracking, getCurrentLocation, mergedOptions.enableBackground]);

  // Auto-start if enabled
  useEffect(() => {
    if (mergedOptions.autoStart) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [mergedOptions.autoStart, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  return {
    location,
    isTracking,
    hasPermission,
    error,
    startTracking,
    stopTracking,
    requestPermission,
    getCurrentLocation,
  };
};

export default useLocationTracking;

// Jest setup file for MNBARA mobile app

// Import jest-native matchers
import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock StyleSheet
  RN.StyleSheet = {
    create: (styles) => styles,
    flatten: (style) => style,
    hairlineWidth: 1,
  };
  
  // Mock Dimensions
  RN.Dimensions = {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  
  // Mock PixelRatio
  RN.PixelRatio = {
    get: jest.fn().mockReturnValue(2),
    getFontScale: jest.fn().mockReturnValue(1),
    getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
    roundToNearestPixel: jest.fn((size) => size),
  };
  
  // Mock Platform
  RN.Platform = {
    OS: 'android',
    select: jest.fn((obj) => obj.android || obj.default),
  };
  
  return RN;
});

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve(null)),
  setInternetCredentials: jest.fn(() => Promise.resolve(true)),
  getInternetCredentials: jest.fn(() => Promise.resolve(false)),
  resetInternetCredentials: jest.fn(() => Promise.resolve(true)),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase Messaging
jest.mock('@react-native-firebase/messaging', () => {
  const mockMessaging = {
    requestPermission: jest.fn(() => Promise.resolve(1)),
    hasPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    getAPNSToken: jest.fn(() => Promise.resolve('mock-apns-token')),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onTokenRefresh: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    AuthorizationStatus: {
      NOT_DETERMINED: -1,
      DENIED: 0,
      AUTHORIZED: 1,
      PROVISIONAL: 2,
    },
  };
  
  return () => mockMessaging;
});

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve('channel-id')),
  displayNotification: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  getBadgeCount: jest.fn(() => Promise.resolve(0)),
  setBadgeCount: jest.fn(() => Promise.resolve()),
  onForegroundEvent: jest.fn(() => jest.fn()),
  onBackgroundEvent: jest.fn(),
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    LOW: 2,
    MIN: 1,
    NONE: 0,
  },
  AndroidStyle: {
    BIGPICTURE: 0,
    BIGTEXT: 1,
    INBOX: 2,
    MESSAGING: 3,
  },
  EventType: {
    DISMISSED: 0,
    PRESS: 1,
    ACTION_PRESS: 2,
    DELIVERED: 3,
    APP_BLOCKED: 4,
    CHANNEL_BLOCKED: 5,
    CHANNEL_GROUP_BLOCKED: 6,
    TRIGGER_NOTIFICATION_CREATED: 7,
  },
}));

// Mock react-native Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Global fetch mock
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

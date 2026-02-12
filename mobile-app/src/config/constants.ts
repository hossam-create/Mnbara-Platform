// Environment variables will be loaded at runtime via react-native-config
// This file provides default values for development
import { Platform } from 'react-native';

const isDev = process.env.NODE_ENV === 'development';

export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'https://api.dev.mnbara.com/v1' 
    : 'https://api.mnbara.com/v1',
  SOCKET_URL: isDev
    ? 'wss://socket.dev.mnbara.com'
    : 'wss://socket.mnbara.com',
  TIMEOUT: 30000,
};

export const STORAGE_KEYS = {
  USER: '@mnbara/user',
  ACCESS_TOKEN: '@mnbara/accessToken',
  REFRESH_TOKEN: '@mnbara/refreshToken',
  ONBOARDING_COMPLETED: '@mnbara/onboardingCompleted',
  FCM_TOKEN: '@mnbara/fcmToken',
  LANGUAGE: '@mnbara/language',
  THEME: '@mnbara/theme',
};

export const REGEX_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  NUMERIC: /^\d+$/,
};

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email',
  PHONE_REQUIRED: 'Phone number is required',
  PHONE_INVALID: 'Please enter a valid phone number',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number and special character',
  NAME_REQUIRED: 'Name is required',
  NAME_INVALID: 'Name must be between 2-50 characters',
  CONFIRM_PASSWORD_MISMATCH: 'Passwords do not match',
  TERMS_REQUIRED: 'You must accept the terms and conditions',
};

export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
  API_DATE: 'yyyy-MM-dd',
  API_TIME: 'HH:mm:ss',
  API_DATETIME: 'yyyy-MM-ddTHH:mm:ss.sssZ',
  RELATIVE: 'relative',
};

export const CURRENCY = {
  CODE: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
};

export const MAP_CONFIG = {
  DEFAULT_LATITUDE: 25.2048, // Dubai coordinates
  DEFAULT_LONGITUDE: 55.2708,
  DEFAULT_ZOOM: 12,
  MAX_ZOOM: 20,
  MIN_ZOOM: 3,
};

export const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Shop Globally',
    description: 'Order products from anywhere in the world with trusted travelers',
    image: 'onboarding_shop',
  },
  {
    id: '2',
    title: 'Earn While Traveling',
    description: 'Turn your trips into income by delivering packages',
    image: 'onboarding_earn',
  },
  {
    id: '3',
    title: 'Safe & Secure',
    description: 'Verified community with escrow protection and insurance',
    image: 'onboarding_safe',
  },
];

export const USER_ROLES = {
  SHOPPER: 'shopper',
  TRAVELER: 'traveler',
} as const;

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const;

export const TRIP_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export default {
  API_CONFIG,
  STORAGE_KEYS,
  REGEX_PATTERNS,
  VALIDATION_MESSAGES,
  DATE_FORMATS,
  CURRENCY,
  MAP_CONFIG,
  ONBOARDING_SLIDES,
  USER_ROLES,
  DELIVERY_STATUS,
  TRIP_STATUS,
};

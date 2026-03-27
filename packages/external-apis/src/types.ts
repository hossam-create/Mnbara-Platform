/**
 * External APIs Types
 * Shared types for all external API integrations
 */

export interface ApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  cacheTTL?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  cached?: boolean;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

// Maps & Geocoding Types
export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline?: string;
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: GeoLocation;
  endLocation: GeoLocation;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

// Notification Types
export interface SmsMessage {
  to: string;
  body: string;
  from?: string;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface PushNotification {
  token: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

// Validation Types
export interface EmailValidationResult {
  email: string;
  valid: boolean;
  disposable: boolean;
  role: boolean;
  reason?: string;
}

export interface PhoneValidationResult {
  phone: string;
  valid: boolean;
  country: string;
  carrier?: string;
  type?: 'mobile' | 'landline' | 'voip';
}

export interface AddressValidationResult {
  address: string;
  valid: boolean;
  normalized?: string;
  components?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

// Data Types
export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  location: GeoLocation;
  timestamp: Date;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

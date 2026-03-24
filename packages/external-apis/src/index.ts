/**
 * External APIs Package
 * Centralized integration for all external API services
 */

// Services
export { MapsService } from './maps.service';
export { PaymentService, CurrencyService } from './payment.service';
export { SmsService, EmailService, PushNotificationService } from './notification.service';
export { 
  EmailValidationService, 
  PhoneValidationService, 
  AddressValidationService 
} from './validation.service';
export { WeatherService } from './data.service';

// Configuration
export { config, ConfigManager } from './config';
export type { ExternalApisConfig } from './config';

// Cache
export { cache, ApiCache } from './cache';

// Errors
export {
  ExternalApiError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  TimeoutError,
  ServiceUnavailableError,
  handleApiError,
} from './errors';

// Types
export type {
  ApiConfig,
  ApiResponse,
  ApiError,
  GeoLocation,
  RouteInfo,
  RouteStep,
  PaymentIntent,
  ExchangeRate,
  SmsMessage,
  EmailMessage,
  EmailAttachment,
  PushNotification,
  EmailValidationResult,
  PhoneValidationResult,
  AddressValidationResult,
  WeatherData,
  CurrencyInfo,
} from './types';

// Base client for custom integrations
export { BaseApiClient } from './base-client';

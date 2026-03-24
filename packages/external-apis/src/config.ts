/**
 * External APIs Configuration
 * Centralized configuration for all external API services
 */

import { ApiConfig } from './types';

export interface ExternalApisConfig {
  // Maps & Geocoding
  googleMaps?: ApiConfig;
  mapbox?: ApiConfig;
  hereMaps?: ApiConfig;
  openStreetMap?: ApiConfig;

  // Payments & Currency
  stripe?: ApiConfig;
  paypal?: ApiConfig;
  wise?: ApiConfig;
  exchangeRate?: ApiConfig;

  // Notifications
  twilio?: ApiConfig;
  sendgrid?: ApiConfig;
  firebase?: ApiConfig;
  vonage?: ApiConfig;

  // Validation
  emailValidation?: ApiConfig;
  phoneValidation?: ApiConfig;
  addressValidation?: ApiConfig;

  // Data & Information
  weather?: ApiConfig;
  geocoding?: ApiConfig;
  currency?: ApiConfig;

  // Global settings
  defaultTimeout?: number;
  defaultRetryAttempts?: number;
  defaultCacheTTL?: number;
  enableCache?: boolean;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: ExternalApisConfig;

  private constructor() {
    this.config = this.loadFromEnv();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadFromEnv(): ExternalApisConfig {
    return {
      // Maps
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        timeout: 10000,
        retryAttempts: 3,
      },
      mapbox: {
        apiKey: process.env.MAPBOX_API_KEY || '',
        baseUrl: 'https://api.mapbox.com',
        timeout: 10000,
      },
      hereMaps: {
        apiKey: process.env.HERE_MAPS_API_KEY || '',
        baseUrl: 'https://api.here.com',
        timeout: 10000,
      },

      // Payments
      stripe: {
        apiKey: process.env.STRIPE_SECRET_KEY || '',
        baseUrl: 'https://api.stripe.com/v1',
        timeout: 15000,
      },
      paypal: {
        apiKey: process.env.PAYPAL_CLIENT_ID || '',
        baseUrl: process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com',
        timeout: 15000,
      },
      wise: {
        apiKey: process.env.WISE_API_KEY || '',
        baseUrl: 'https://api.transferwise.com',
        timeout: 15000,
      },
      exchangeRate: {
        apiKey: process.env.EXCHANGE_RATE_API_KEY || '',
        baseUrl: 'https://api.exchangerate-api.com/v4',
        timeout: 5000,
        cacheTTL: 3600, // 1 hour
      },

      // Notifications
      twilio: {
        apiKey: process.env.TWILIO_AUTH_TOKEN || '',
        baseUrl: 'https://api.twilio.com/2010-04-01',
        timeout: 10000,
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        baseUrl: 'https://api.sendgrid.com/v3',
        timeout: 10000,
      },
      firebase: {
        apiKey: process.env.FIREBASE_SERVER_KEY || '',
        baseUrl: 'https://fcm.googleapis.com/fcm',
        timeout: 10000,
      },
      vonage: {
        apiKey: process.env.VONAGE_API_KEY || '',
        baseUrl: 'https://rest.nexmo.com',
        timeout: 10000,
      },

      // Validation
      emailValidation: {
        apiKey: process.env.EMAIL_VALIDATION_API_KEY || '',
        baseUrl: 'https://api.emailvalidation.io/v1',
        timeout: 5000,
        cacheTTL: 86400, // 24 hours
      },
      phoneValidation: {
        apiKey: process.env.PHONE_VALIDATION_API_KEY || '',
        baseUrl: 'https://api.numverify.com/v1',
        timeout: 5000,
        cacheTTL: 86400,
      },
      addressValidation: {
        apiKey: process.env.ADDRESS_VALIDATION_API_KEY || '',
        baseUrl: 'https://api.address-validator.net/api',
        timeout: 5000,
      },

      // Data
      weather: {
        apiKey: process.env.WEATHER_API_KEY || '',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        timeout: 5000,
        cacheTTL: 1800, // 30 minutes
      },

      // Global settings
      defaultTimeout: 10000,
      defaultRetryAttempts: 3,
      defaultCacheTTL: 3600,
      enableCache: process.env.ENABLE_API_CACHE !== 'false',
    };
  }

  getConfig(): ExternalApisConfig {
    return this.config;
  }

  updateConfig(updates: Partial<ExternalApisConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getServiceConfig(service: keyof ExternalApisConfig): ApiConfig | undefined {
    return this.config[service] as ApiConfig;
  }
}

export const config = ConfigManager.getInstance();

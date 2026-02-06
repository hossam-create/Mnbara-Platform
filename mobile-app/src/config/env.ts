import Config from 'react-native-config';

const ENV = {
  development: 'development',
  staging: 'staging',
  production: 'production',
} as const;

type EnvType = typeof ENV[keyof typeof ENV];

const getEnv = (): EnvType => {
  const env = __DEV__ ? ENV.development : ENV.production;
  return (Config.APP_ENV as EnvType) || env;
};

export const ENVIRONMENT = getEnv();

export const IS_DEV = ENVIRONMENT === ENV.development;
export const IS_STAGING = ENVIRONMENT === ENV.staging;
export const IS_PROD = ENVIRONMENT === ENV.production;

export const API_CONFIG = {
  BASE_URL: Config.API_BASE_URL || 'https://api.mnbara.com/v1',
  SOCKET_URL: Config.SOCKET_URL || 'wss://socket.mnbara.com',
  TIMEOUT: 30000,
};

export const FIREBASE_CONFIG = {
  API_KEY: Config.FIREBASE_API_KEY,
  AUTH_DOMAIN: Config.FIREBASE_AUTH_DOMAIN,
  PROJECT_ID: Config.FIREBASE_PROJECT_ID,
  STORAGE_BUCKET: Config.FIREBASE_STORAGE_BUCKET,
  MESSAGING_SENDER_ID: Config.FIREBASE_MESSAGING_SENDER_ID,
  APP_ID: Config.FIREBASE_APP_ID,
};

export const GOOGLE_MAPS_CONFIG = {
  IOS_API_KEY: Config.GOOGLE_MAPS_IOS_API_KEY,
  ANDROID_API_KEY: Config.GOOGLE_MAPS_ANDROID_API_KEY,
};

export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: Config.STRIPE_PUBLISHABLE_KEY || 'pk_test_xxx',
};

export const APP_CONFIG = {
  NAME: Config.APP_NAME || 'Mnbara',
  ENV: ENVIRONMENT,
};

export default {
  ENVIRONMENT,
  IS_DEV,
  IS_STAGING,
  IS_PROD,
  API_CONFIG,
  FIREBASE_CONFIG,
  GOOGLE_MAPS_CONFIG,
  STRIPE_CONFIG,
  APP_CONFIG,
};

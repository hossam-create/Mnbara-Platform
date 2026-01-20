import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import arCommon from './ar/common.json';
import arAuth from './ar/auth.json';
import arMarketplace from './ar/marketplace.json';
import arAuction from './ar/auction.json';
import arWallet from './ar/wallet.json';
import arTrustSafety from './ar/trust_safety.json';
import arErrors from './ar/errors.json';

import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enMarketplace from './en/marketplace.json';
import enAuction from './en/auction.json';
import enWallet from './en/wallet.json';
import enTrustSafety from './en/trust_safety.json';
import enErrors from './en/errors.json';

// Resources object
const resources = {
  ar: {
    common: arCommon,
    auth: arAuth,
    marketplace: arMarketplace,
    auction: arAuction,
    wallet: arWallet,
    trust_safety: arTrustSafety,
    errors: arErrors
  },
  en: {
    common: enCommon,
    auth: enAuth,
    marketplace: enMarketplace,
    auction: enAuction,
    wallet: enWallet,
    trust_safety: enTrustSafety,
    errors: enErrors
  }
};

// Initialize i18n
i18n
  .use(Backend) // Load translations using http backend
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    fallbackLng: 'en', // Use English if detected language is not available
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'], // Detection order
      caches: ['localStorage'], // Cache language preference
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to translation files
    },
    
    resources: resources, // Use imported resources directly
    
    // Default namespace
    defaultNS: 'common',
    
    // Available namespaces
    ns: ['common', 'auth', 'marketplace', 'auction', 'wallet', 'trust_safety', 'errors'],
    
    // React options
    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
    },
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Key separator
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
    
    // Return empty string if key doesn't exist instead of key
    returnEmptyString: false,
    
    // Return objects instead of joining with key separator
    returnObjects: false,
    
    // Save missing keys
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng} in namespace: ${ns}`);
      }
    },
  });

// Export i18n instance
export default i18n;

// Export language direction helper
export const getLanguageDirection = (lng: string): 'rtl' | 'ltr' => {
  return lng === 'ar' ? 'rtl' : 'ltr';
};

// Export available languages
export const availableLanguages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' }
];

// Export current language direction
export const currentLanguageDirection = (): 'rtl' | 'ltr' => {
  return getLanguageDirection(i18n.language);
};

// Export language change helper
export const changeLanguage = async (lng: string): Promise<void> => {
  await i18n.changeLanguage(lng);
  // Update document direction
  document.documentElement.dir = getLanguageDirection(lng);
  document.documentElement.lang = lng;
};

// Export translation helper with namespace
export const t = (key: string, options?: any) => {
  return i18n.t(key, options);
};

// Export namespace-specific translation helpers
export const tCommon = (key: string, options?: any) => i18n.t(`common:${key}`, options);
export const tAuth = (key: string, options?: any) => i18n.t(`auth:${key}`, options);
export const tMarketplace = (key: string, options?: any) => i18n.t(`marketplace:${key}`, options);
export const tAuction = (key: string, options?: any) => i18n.t(`auction:${key}`, options);
export const tWallet = (key: string, options?: any) => i18n.t(`wallet:${key}`, options);
export const tTrustSafety = (key: string, options?: any) => i18n.t(`trust_safety:${key}`, options);
export const tErrors = (key: string, options?: any) => i18n.t(`errors:${key}`, options);

// Export pluralization helper
export const tPlural = (key: string, count: number, options?: any) => {
  return i18n.t(key, { count, ...options });
};

// Export context helper
export const tContext = (key: string, context: string, options?: any) => {
  return i18n.t(`${key}_${context}`, options);
};

// Export format helpers
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(i18n.language, options).format(num);
};

export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
  }).format(amount);
};

// Export validation helpers
export const validateTranslationKey = (key: string): boolean => {
  return i18n.exists(key);
};

export const getMissingKeys = (ns: string): string[] => {
  const missingKeys: string[] = [];
  const resourceKeys = Object.keys(resources[i18n.language]?.[ns] || {});
  
  // This would need to be implemented based on your key structure
  // For now, return empty array
  return missingKeys;
};

// Export initialization status
export const isInitialized = (): boolean => {
  return i18n.isInitialized;
};

// Export current language
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

// Export supported languages
export const getSupportedLanguages = (): string[] => {
  return Object.keys(resources);
};

// Export language detection result
export const getDetectedLanguage = (): string => {
  return i18n.language;
};

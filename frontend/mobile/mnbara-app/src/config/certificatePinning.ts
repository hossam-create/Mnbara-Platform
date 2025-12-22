/**
 * Certificate Pinning Configuration for Mobile App
 * Requirements: 19.1 - Implement certificate pinning for mobile apps
 * 
 * This module provides SSL/TLS certificate pinning to prevent
 * man-in-the-middle attacks on API communications.
 */

import { Platform } from 'react-native';

/**
 * Certificate pin configuration
 * Pins are SHA-256 hashes of the Subject Public Key Info (SPKI)
 */
export interface CertificatePin {
  /** Domain pattern to match */
  pattern: string;
  /** SHA-256 hash of the certificate's SPKI (base64 encoded) */
  pins: string[];
  /** Whether to include subdomains */
  includeSubdomains: boolean;
  /** Expiration date for the pin (ISO 8601) */
  expiresAt?: string;
}

/**
 * Certificate pinning configuration
 * 
 * IMPORTANT: Update these pins when rotating certificates!
 * Include at least 2 pins (current + backup) for rotation safety.
 */
export const CERTIFICATE_PINS: CertificatePin[] = [
  {
    // Production API
    pattern: 'api.mnbara.com',
    pins: [
      // Current certificate pin (Let's Encrypt)
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      // Backup pin (next certificate)
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
      // Let's Encrypt ISRG Root X1 (backup)
      'sha256/C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=',
    ],
    includeSubdomains: true,
    expiresAt: '2025-12-31T23:59:59Z',
  },
  {
    // WebSocket endpoint
    pattern: 'ws.mnbara.com',
    pins: [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
      'sha256/C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=',
    ],
    includeSubdomains: true,
    expiresAt: '2025-12-31T23:59:59Z',
  },
  {
    // CDN for static assets
    pattern: 'cdn.mnbara.com',
    pins: [
      'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
      'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=',
    ],
    includeSubdomains: true,
  },
];

/**
 * Development/staging pins (less strict for testing)
 */
export const DEV_CERTIFICATE_PINS: CertificatePin[] = [
  {
    pattern: 'api.dev.mnbara.com',
    pins: [
      // Self-signed development certificate
      'sha256/DEVDEVDEVDEVDEVDEVDEVDEVDEVDEVDEVDEVDEVDEV=',
    ],
    includeSubdomains: true,
  },
  {
    pattern: 'api.staging.mnbara.com',
    pins: [
      'sha256/STAGINGSTAGINGSTAGINGSTAGINGSTAGINGSTAGING=',
      'sha256/C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=',
    ],
    includeSubdomains: true,
  },
];

/**
 * Get certificate pins based on environment
 */
export function getCertificatePins(): CertificatePin[] {
  // @ts-ignore - __DEV__ is a React Native global
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  const isStaging = false; // Set via build configuration
  
  if (isDev) {
    return DEV_CERTIFICATE_PINS;
  }
  
  if (isStaging) {
    return [...DEV_CERTIFICATE_PINS, ...CERTIFICATE_PINS];
  }
  
  return CERTIFICATE_PINS;
}

/**
 * Validate if a pin has expired
 */
export function isPinExpired(pin: CertificatePin): boolean {
  if (!pin.expiresAt) {
    return false;
  }
  return new Date(pin.expiresAt) < new Date();
}

/**
 * Get valid (non-expired) pins
 */
export function getValidPins(): CertificatePin[] {
  return getCertificatePins().filter(pin => !isPinExpired(pin));
}

/**
 * SSL Pinning configuration for react-native-ssl-pinning
 * or similar libraries
 */
export function getSSLPinningConfig() {
  const pins = getValidPins();
  
  // Format for react-native-ssl-pinning
  const sslPinning: Record<string, string[]> = {};
  
  pins.forEach(pin => {
    sslPinning[pin.pattern] = pin.pins;
  });
  
  return {
    sslPinning: {
      certs: Object.keys(sslPinning),
    },
    // Additional options
    timeoutInterval: 30000,
    disableAllSecurity: false,
  };
}

/**
 * Axios SSL pinning interceptor configuration
 * For use with axios and react-native-ssl-pinning
 */
export function createSSLPinningInterceptor() {
  const pins = getValidPins();
  
  return {
    request: (config: any) => {
      // Add SSL pinning headers for native module
      const url = new URL(config.url || config.baseURL);
      const hostname = url.hostname;
      
      const matchingPin = pins.find(pin => {
        if (pin.includeSubdomains) {
          return hostname === pin.pattern || hostname.endsWith(`.${pin.pattern}`);
        }
        return hostname === pin.pattern;
      });
      
      if (matchingPin) {
        config.sslPinning = {
          certs: matchingPin.pins,
        };
      }
      
      return config;
    },
    responseError: (error: any) => {
      // Handle SSL pinning failures
      if (error.message?.includes('SSL') || error.message?.includes('certificate')) {
        console.error('SSL Pinning validation failed:', error.message);
        // Log to analytics for monitoring
        // analytics.track('ssl_pinning_failure', { error: error.message });
      }
      return Promise.reject(error);
    },
  };
}

/**
 * TrustKit configuration for iOS
 * Used with react-native-trustkit or similar
 */
export function getTrustKitConfig() {
  const pins = getValidPins();
  
  const pinnedDomains: Record<string, any> = {};
  
  pins.forEach(pin => {
    pinnedDomains[pin.pattern] = {
      TSKIncludeSubdomains: pin.includeSubdomains,
      TSKEnforcePinning: true,
      TSKPublicKeyHashes: pin.pins.map(p => p.replace('sha256/', '')),
      // Report URI for pin validation failures
      TSKReportUris: ['https://api.mnbara.com/security/pin-report'],
    };
  });
  
  return {
    TSKSwizzleNetworkDelegates: true,
    TSKPinnedDomains: pinnedDomains,
  };
}

/**
 * OkHttp CertificatePinner configuration for Android
 * Used with native Android SSL pinning
 */
export function getOkHttpPinnerConfig() {
  const pins = getValidPins();
  
  return pins.map(pin => ({
    hostname: pin.pattern,
    pins: pin.pins,
    includeSubdomains: pin.includeSubdomains,
  }));
}

/**
 * Verify SSL certificate against pins
 * This is a fallback verification for platforms without native support
 */
export async function verifyCertificate(
  hostname: string,
  certificateChain: string[]
): Promise<boolean> {
  const pins = getValidPins();
  
  const matchingPin = pins.find(pin => {
    if (pin.includeSubdomains) {
      return hostname === pin.pattern || hostname.endsWith(`.${pin.pattern}`);
    }
    return hostname === pin.pattern;
  });
  
  if (!matchingPin) {
    // No pin configured for this hostname
    console.warn(`No certificate pin configured for hostname: ${hostname}`);
    return true; // Allow connection (or return false for strict mode)
  }
  
  // Check if any certificate in the chain matches a pin
  for (const cert of certificateChain) {
    const certHash = await computeSPKIHash(cert);
    if (matchingPin.pins.includes(`sha256/${certHash}`)) {
      return true;
    }
  }
  
  console.error(`Certificate pinning failed for hostname: ${hostname}`);
  return false;
}

/**
 * Compute SHA-256 hash of certificate's SPKI
 * Note: This requires a native module for actual implementation
 */
async function computeSPKIHash(certificate: string): Promise<string> {
  // This would be implemented using a native crypto module
  // For React Native, use react-native-crypto or similar
  
  // Placeholder - actual implementation depends on crypto library
  throw new Error('computeSPKIHash requires native crypto implementation');
}

/**
 * Certificate pinning error types
 */
export enum CertificatePinningError {
  PIN_MISMATCH = 'PIN_MISMATCH',
  EXPIRED_PIN = 'EXPIRED_PIN',
  NO_PIN_CONFIGURED = 'NO_PIN_CONFIGURED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * Handle certificate pinning errors
 */
export function handlePinningError(error: CertificatePinningError, hostname: string): void {
  switch (error) {
    case CertificatePinningError.PIN_MISMATCH:
      console.error(`Certificate pin mismatch for ${hostname}. Possible MITM attack!`);
      // Alert security team
      break;
    case CertificatePinningError.EXPIRED_PIN:
      console.warn(`Certificate pin expired for ${hostname}. Update pins!`);
      break;
    case CertificatePinningError.NO_PIN_CONFIGURED:
      console.warn(`No certificate pin configured for ${hostname}`);
      break;
    default:
      console.error(`Certificate pinning error for ${hostname}:`, error);
  }
}

/**
 * Instructions for generating certificate pins:
 * 
 * 1. Get the certificate:
 *    openssl s_client -connect api.mnbara.com:443 -servername api.mnbara.com < /dev/null 2>/dev/null | openssl x509 -outform PEM > cert.pem
 * 
 * 2. Extract the public key:
 *    openssl x509 -in cert.pem -pubkey -noout > pubkey.pem
 * 
 * 3. Compute the SHA-256 hash:
 *    openssl pkey -in pubkey.pem -pubin -outform DER | openssl dgst -sha256 -binary | openssl enc -base64
 * 
 * 4. Add the hash to the pins array with 'sha256/' prefix
 * 
 * IMPORTANT: Always include backup pins for certificate rotation!
 */

export default {
  getCertificatePins,
  getValidPins,
  getSSLPinningConfig,
  createSSLPinningInterceptor,
  getTrustKitConfig,
  getOkHttpPinnerConfig,
  verifyCertificate,
  handlePinningError,
  CertificatePinningError,
};

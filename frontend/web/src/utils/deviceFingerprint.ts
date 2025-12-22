// ============================================
// 🌍 Mnbara Platform - Device Fingerprint Utility
// Requirements: GDPR-compliant device identification for consent tracking
// ============================================

import { v4 as uuidv4 } from 'uuid';

export async function getDeviceFingerprint(): Promise<string> {
  try {
    // Create a stable device identifier using available browser features
    // This is GDPR-compliant as it doesn't use biometrics or PII
    
    const components: string[] = [];
    
    // User agent (anonymized)
    if (navigator.userAgent) {
      components.push(navigator.userAgent.length.toString());
    }
    
    // Screen properties (generalized)
    if (screen) {
      components.push(screen.width.toString());
      components.push(screen.height.toString());
      components.push(screen.colorDepth.toString());
    }
    
    // Timezone
    if (Intl) {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    
    // Language
    components.push(navigator.language || 'unknown');
    
    // Hardware concurrency (if available)
    if (navigator.hardwareConcurrency) {
      components.push(navigator.hardwareConcurrency.toString());
    }
    
    // Generate a hash from the components
    const fingerprintString = components.join('|');
    
    // Use a simple hash function (SHA-256 would be better but requires crypto)
    const hash = await simpleHash(fingerprintString);
    
    // Combine with a UUID for additional uniqueness
    const deviceId = `${hash}-${uuidv4().substring(0, 8)}`;
    
    // Store in session storage for consistency during session
    if (typeof sessionStorage !== 'undefined') {
      const storedId = sessionStorage.getItem('device_fingerprint');
      if (storedId) {
        return storedId;
      }
      sessionStorage.setItem('device_fingerprint', deviceId);
    }
    
    return deviceId;
    
  } catch (error) {
    console.warn('Failed to generate device fingerprint:', error);
    
    // Fallback to session-based UUID
    if (typeof sessionStorage !== 'undefined') {
      const fallbackId = sessionStorage.getItem('device_fingerprint') || `fallback-${uuidv4().substring(0, 12)}`;
      sessionStorage.setItem('device_fingerprint', fallbackId);
      return fallbackId;
    }
    
    return `fallback-${uuidv4().substring(0, 12)}`;
  }
}

async function simpleHash(str: string): Promise<string> {
  try {
    // Use Web Crypto API if available
    if (window.crypto && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }
    
    // Fallback simple hash for browsers without crypto
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
    
  } catch (error) {
    console.warn('Hash function failed:', error);
    // Ultimate fallback
    return Math.random().toString(36).substring(2, 10);
  }
}

// GDPR compliance: Provide method to clear device fingerprint
export function clearDeviceFingerprint(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('device_fingerprint');
  }
}
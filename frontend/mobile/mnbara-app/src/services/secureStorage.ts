/**
 * Secure Storage Service
 * Uses react-native-keychain for secure token storage
 * Falls back to in-memory storage for development/testing
 */

// Token storage keys
const TOKEN_KEY = 'mnbara_auth_token';
const REFRESH_TOKEN_KEY = 'mnbara_refresh_token';
const USER_KEY = 'mnbara_user';
const BIOMETRIC_KEY = 'mnbara_biometric_enabled';

// In-memory fallback for development
let memoryStorage: Record<string, string> = {};

// Type for Keychain module (will be dynamically imported)
interface KeychainModule {
  setGenericPassword: (username: string, password: string, options?: any) => Promise<boolean>;
  getGenericPassword: (options?: any) => Promise<false | { username: string; password: string }>;
  resetGenericPassword: (options?: any) => Promise<boolean>;
  getSupportedBiometryType: () => Promise<string | null>;
  setInternetCredentials: (server: string, username: string, password: string, options?: any) => Promise<boolean>;
  getInternetCredentials: (server: string, options?: any) => Promise<false | { username: string; password: string }>;
  resetInternetCredentials: (server: string) => Promise<boolean>;
}

let Keychain: KeychainModule | null = null;

// Try to import Keychain, fall back to memory storage if not available
const initKeychain = async (): Promise<boolean> => {
  if (Keychain !== null) return true;
  
  try {
    Keychain = require('react-native-keychain');
    return true;
  } catch (error) {
    console.warn('react-native-keychain not available, using memory storage');
    return false;
  }
};

/**
 * Store authentication tokens securely
 */
export const storeTokens = async (
  accessToken: string,
  refreshToken?: string
): Promise<void> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      await Keychain.setInternetCredentials(
        TOKEN_KEY,
        'token',
        accessToken
      );
      
      if (refreshToken) {
        await Keychain.setInternetCredentials(
          REFRESH_TOKEN_KEY,
          'refresh',
          refreshToken
        );
      }
    } catch (error) {
      console.error('Error storing tokens in keychain:', error);
      // Fallback to memory
      memoryStorage[TOKEN_KEY] = accessToken;
      if (refreshToken) {
        memoryStorage[REFRESH_TOKEN_KEY] = refreshToken;
      }
    }
  } else {
    memoryStorage[TOKEN_KEY] = accessToken;
    if (refreshToken) {
      memoryStorage[REFRESH_TOKEN_KEY] = refreshToken;
    }
  }
};

/**
 * Retrieve stored access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      const credentials = await Keychain.getInternetCredentials(TOKEN_KEY);
      if (credentials) {
        return credentials.password;
      }
    } catch (error) {
      console.error('Error retrieving access token:', error);
    }
  }
  
  return memoryStorage[TOKEN_KEY] || null;
};

/**
 * Retrieve stored refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      const credentials = await Keychain.getInternetCredentials(REFRESH_TOKEN_KEY);
      if (credentials) {
        return credentials.password;
      }
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
    }
  }
  
  return memoryStorage[REFRESH_TOKEN_KEY] || null;
};

/**
 * Clear all stored tokens
 */
export const clearTokens = async (): Promise<void> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      await Keychain.resetInternetCredentials(TOKEN_KEY);
      await Keychain.resetInternetCredentials(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
  
  delete memoryStorage[TOKEN_KEY];
  delete memoryStorage[REFRESH_TOKEN_KEY];
};

/**
 * Store user data securely
 */
export const storeUser = async (user: object): Promise<void> => {
  const keychainAvailable = await initKeychain();
  const userJson = JSON.stringify(user);
  
  if (keychainAvailable && Keychain) {
    try {
      await Keychain.setInternetCredentials(USER_KEY, 'user', userJson);
    } catch (error) {
      console.error('Error storing user:', error);
      memoryStorage[USER_KEY] = userJson;
    }
  } else {
    memoryStorage[USER_KEY] = userJson;
  }
};

/**
 * Retrieve stored user data
 */
export const getUser = async (): Promise<object | null> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      const credentials = await Keychain.getInternetCredentials(USER_KEY);
      if (credentials) {
        return JSON.parse(credentials.password);
      }
    } catch (error) {
      console.error('Error retrieving user:', error);
    }
  }
  
  const userJson = memoryStorage[USER_KEY];
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Clear stored user data
 */
export const clearUser = async (): Promise<void> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      await Keychain.resetInternetCredentials(USER_KEY);
    } catch (error) {
      console.error('Error clearing user:', error);
    }
  }
  
  delete memoryStorage[USER_KEY];
};

/**
 * Check if biometric authentication is available
 */
export const isBiometricAvailable = async (): Promise<{
  available: boolean;
  biometryType: string | null;
}> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return {
        available: biometryType !== null,
        biometryType,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  }
  
  return { available: false, biometryType: null };
};

/**
 * Store biometric preference
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      await Keychain.setInternetCredentials(
        BIOMETRIC_KEY,
        'biometric',
        enabled ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Error storing biometric preference:', error);
      memoryStorage[BIOMETRIC_KEY] = enabled ? 'true' : 'false';
    }
  } else {
    memoryStorage[BIOMETRIC_KEY] = enabled ? 'true' : 'false';
  }
};

/**
 * Get biometric preference
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  const keychainAvailable = await initKeychain();
  
  if (keychainAvailable && Keychain) {
    try {
      const credentials = await Keychain.getInternetCredentials(BIOMETRIC_KEY);
      if (credentials) {
        return credentials.password === 'true';
      }
    } catch (error) {
      console.error('Error retrieving biometric preference:', error);
    }
  }
  
  return memoryStorage[BIOMETRIC_KEY] === 'true';
};

/**
 * Authenticate with biometrics
 */
export const authenticateWithBiometrics = async (): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> => {
  const keychainAvailable = await initKeychain();
  
  if (!keychainAvailable || !Keychain) {
    return { success: false, error: 'Biometric authentication not available' };
  }
  
  try {
    const credentials = await Keychain.getGenericPassword({
      accessControl: 'BiometryAny',
      authenticationPrompt: {
        title: 'Authenticate',
        subtitle: 'Use biometrics to sign in',
        cancel: 'Cancel',
      },
    });
    
    if (credentials) {
      return { success: true, token: credentials.password };
    }
    
    return { success: false, error: 'No stored credentials' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Biometric authentication failed' };
  }
};

/**
 * Store credentials for biometric authentication
 */
export const storeBiometricCredentials = async (
  email: string,
  token: string
): Promise<boolean> => {
  const keychainAvailable = await initKeychain();
  
  if (!keychainAvailable || !Keychain) {
    return false;
  }
  
  try {
    await Keychain.setGenericPassword(email, token, {
      accessControl: 'BiometryAny',
      accessible: 'WhenPasscodeSetThisDeviceOnly',
    });
    return true;
  } catch (error) {
    console.error('Error storing biometric credentials:', error);
    return false;
  }
};

/**
 * Clear all secure storage
 */
export const clearAllSecureStorage = async (): Promise<void> => {
  await clearTokens();
  await clearUser();
  
  const keychainAvailable = await initKeychain();
  if (keychainAvailable && Keychain) {
    try {
      await Keychain.resetGenericPassword();
      await Keychain.resetInternetCredentials(BIOMETRIC_KEY);
    } catch (error) {
      console.error('Error clearing all secure storage:', error);
    }
  }
  
  memoryStorage = {};
};

/**
 * PostgreSQL Encryption Configuration
 * 
 * This module provides utilities for field-level encryption using pgcrypto
 * and configuration for Transparent Data Encryption (TDE).
 * 
 * Requirements: 19.1 - Enable Postgres encryption (TDE/PG Crypto)
 */

import crypto from 'crypto';

/**
 * Encryption configuration
 */
export const ENCRYPTION_CONFIG = {
  // Algorithm for application-level encryption
  algorithm: 'aes-256-gcm' as const,
  
  // Key derivation
  keyDerivation: {
    algorithm: 'pbkdf2',
    iterations: 100000,
    keyLength: 32,
    digest: 'sha256',
  },
  
  // Sensitive fields that require encryption
  sensitiveFields: {
    User: ['password'],
    KycUpload: ['documentNumber', 'fileUrl'],
    KycVerification: ['fullLegalName', 'dateOfBirth', 'address'],
    Consent: ['ipAddress'],
    RefreshToken: ['token'],
  },
} as const;

/**
 * Get encryption key from environment
 */
export function getEncryptionKey(): Buffer {
  const key = process.env.DB_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('DB_ENCRYPTION_KEY environment variable is required for database encryption');
  }
  
  // Ensure key is 32 bytes for AES-256
  if (Buffer.from(key, 'hex').length !== 32) {
    throw new Error('DB_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Generate a new encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptField(plaintext: string, key?: Buffer): string {
  const encryptionKey = key || getEncryptionKey();
  
  // Generate random IV for each encryption
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, encryptionKey, iv);
  
  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Return IV + authTag + encrypted data (all hex encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptField(ciphertext: string, key?: Buffer): string {
  const encryptionKey = key || getEncryptionKey();
  
  // Parse the encrypted data
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, encryptionKey, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash sensitive data (one-way, for passwords)
 */
export function hashField(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(
    data,
    actualSalt,
    ENCRYPTION_CONFIG.keyDerivation.iterations,
    ENCRYPTION_CONFIG.keyDerivation.keyLength,
    ENCRYPTION_CONFIG.keyDerivation.digest
  );
  
  return `${actualSalt}:${hash.toString('hex')}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  const [salt] = hashedData.split(':');
  const newHash = hashField(data, salt);
  return crypto.timingSafeEqual(Buffer.from(hashedData), Buffer.from(newHash));
}

/**
 * SQL helper functions for pgcrypto
 */
export const PG_CRYPTO_SQL = {
  /**
   * Encrypt a field using pgcrypto
   */
  encrypt: (field: string, key: string = 'current_setting(\'app.encryption_key\')') => 
    `pgp_sym_encrypt(${field}::text, ${key})`,
  
  /**
   * Decrypt a field using pgcrypto
   */
  decrypt: (field: string, key: string = 'current_setting(\'app.encryption_key\')') => 
    `pgp_sym_decrypt(${field}, ${key})`,
  
  /**
   * Create encrypted column
   */
  createEncryptedColumn: (tableName: string, columnName: string) => `
    ALTER TABLE ${tableName} 
    ADD COLUMN ${columnName}_encrypted BYTEA;
  `,
  
  /**
   * Migrate existing data to encrypted column
   */
  migrateToEncrypted: (tableName: string, columnName: string, key: string = 'current_setting(\'app.encryption_key\')') => `
    UPDATE ${tableName}
    SET ${columnName}_encrypted = pgp_sym_encrypt(${columnName}::text, ${key})
    WHERE ${columnName} IS NOT NULL;
  `,
  
  /**
   * Drop unencrypted column after migration
   */
  dropUnencryptedColumn: (tableName: string, columnName: string) => `
    ALTER TABLE ${tableName} DROP COLUMN ${columnName};
    ALTER TABLE ${tableName} RENAME COLUMN ${columnName}_encrypted TO ${columnName};
  `,
};

/**
 * Prisma middleware for automatic encryption/decryption
 */
export function createEncryptionMiddleware() {
  return async (params: any, next: any) => {
    const model = params.model;
    const action = params.action;
    
    // Get sensitive fields for this model
    const sensitiveFields = ENCRYPTION_CONFIG.sensitiveFields[model as keyof typeof ENCRYPTION_CONFIG.sensitiveFields];
    
    if (!sensitiveFields) {
      return next(params);
    }
    
    // Encrypt on create/update
    if (action === 'create' || action === 'update' || action === 'upsert') {
      const data = params.args.data;
      
      if (data) {
        for (const field of sensitiveFields) {
          if (data[field] && typeof data[field] === 'string') {
            // Skip if already encrypted (contains colons)
            if (!data[field].includes(':')) {
              data[field] = encryptField(data[field]);
            }
          }
        }
      }
    }
    
    // Execute query
    const result = await next(params);
    
    // Decrypt on read
    if (result && (action === 'findUnique' || action === 'findFirst' || action === 'findMany')) {
      const decrypt = (obj: any) => {
        if (!obj) return obj;
        
        for (const field of sensitiveFields) {
          if (obj[field] && typeof obj[field] === 'string' && obj[field].includes(':')) {
            try {
              obj[field] = decryptField(obj[field]);
            } catch (error) {
              console.error(`Failed to decrypt field ${field}:`, error);
            }
          }
        }
        
        return obj;
      };
      
      if (Array.isArray(result)) {
        return result.map(decrypt);
      } else {
        return decrypt(result);
      }
    }
    
    return result;
  };
}

/**
 * Validate encryption setup
 */
export function validateEncryptionSetup(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check encryption key
  try {
    getEncryptionKey();
  } catch (error) {
    errors.push('DB_ENCRYPTION_KEY not configured or invalid');
  }
  
  // Check pgcrypto extension (would need database connection)
  // This should be checked at runtime
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

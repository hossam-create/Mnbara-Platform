/**
 * Encryption Service
 * AES-256 encryption for sensitive documents
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
}

export interface DecryptionResult {
  decrypted: Buffer;
  success: boolean;
  error?: string;
}

export class EncryptionService {
  private readonly secretKey: string;

  constructor() {
    // Use a strong secret key from environment
    this.secretKey = process.env.KYC_ENCRYPTION_KEY || 
      'default-kyc-encryption-key-change-in-production';
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext: Buffer): EncryptionResult {
    // Generate random salt
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from password using PBKDF2
    const key = crypto.pbkdf2Sync(
      this.secretKey,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);

    // Get auth tag for integrity verification
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: string, iv: string, authTag: string, salt: string): DecryptionResult {
    try {
      // Derive key from password using PBKDF2
      const key = crypto.pbkdf2Sync(
        this.secretKey,
        Buffer.from(salt, 'base64'),
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        'sha512'
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(iv, 'base64')
      );

      // Set auth tag
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));

      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, 'base64')),
        decipher.final(),
      ]);

      return {
        decrypted,
        success: true,
      };
    } catch (error) {
      return {
        decrypted: Buffer.alloc(0),
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  /**
   * Encrypt a string value
   */
  encryptString(plaintext: string): string {
    const result = this.encrypt(Buffer.from(plaintext, 'utf8'));
    return JSON.stringify(result);
  }

  /**
   * Decrypt a string value
   */
  decryptString(encryptedJson: string): DecryptionResult {
    try {
      const result = JSON.parse(encryptedJson);
      return this.decrypt(result.encrypted, result.iv, result.authTag, result.salt);
    } catch (error) {
      return {
        decrypted: Buffer.alloc(0),
        success: false,
        error: 'Invalid encrypted data format',
      };
    }
  }

  /**
   * Generate a secure hash
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export const encryptionService = new EncryptionService();

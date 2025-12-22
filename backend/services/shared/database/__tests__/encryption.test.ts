/**
 * Tests for PostgreSQL Encryption
 * Requirements: 19.1 - Enable Postgres encryption (TDE/PG Crypto)
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import crypto from 'crypto';
import {
  encryptField,
  decryptField,
  hashField,
  verifyHash,
  generateEncryptionKey,
  validateEncryptionSetup,
  ENCRYPTION_CONFIG,
} from '../encryption.config';

describe('Database Encryption', () => {
  let testKey: Buffer;

  beforeAll(() => {
    // Generate a test key
    testKey = Buffer.from(generateEncryptionKey(), 'hex');
  });

  describe('Key Generation', () => {
    it('should generate a valid 32-byte encryption key', () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(Buffer.from(key, 'hex')).toHaveLength(32);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('Field Encryption', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'sensitive data';
      const encrypted = encryptField(plaintext, testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(':'); // Should have IV:authTag:data format
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'test data';
      const encrypted1 = encryptField(plaintext, testKey);
      const encrypted2 = encryptField(plaintext, testKey);

      expect(encrypted1).not.toBe(encrypted2); // Different IVs
      expect(decryptField(encrypted1, testKey)).toBe(plaintext);
      expect(decryptField(encrypted2, testKey)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = encryptField(plaintext, testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encryptField(plaintext, testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 مرحبا بالعالم';
      const encrypted = encryptField(plaintext, testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid ciphertext format', () => {
      expect(() => decryptField('invalid', testKey)).toThrow();
    });

    it('should throw error for tampered ciphertext', () => {
      const plaintext = 'test data';
      const encrypted = encryptField(plaintext, testKey);
      const tampered = encrypted.replace(/.$/, '0'); // Change last character

      expect(() => decryptField(tampered, testKey)).toThrow();
    });

    it('should throw error with wrong key', () => {
      const plaintext = 'test data';
      const encrypted = encryptField(plaintext, testKey);
      const wrongKey = Buffer.from(generateEncryptionKey(), 'hex');

      expect(() => decryptField(encrypted, wrongKey)).toThrow();
    });
  });

  describe('Field Hashing', () => {
    it('should hash data consistently with same salt', () => {
      const data = 'password123';
      const hashed = hashField(data);
      const [salt] = hashed.split(':');
      const hashed2 = hashField(data, salt);

      expect(hashed).toBe(hashed2);
    });

    it('should produce different hashes with different salts', () => {
      const data = 'password123';
      const hashed1 = hashField(data);
      const hashed2 = hashField(data);

      expect(hashed1).not.toBe(hashed2);
    });

    it('should verify correct hash', () => {
      const data = 'password123';
      const hashed = hashField(data);

      expect(verifyHash(data, hashed)).toBe(true);
    });

    it('should reject incorrect hash', () => {
      const data = 'password123';
      const hashed = hashField(data);

      expect(verifyHash('wrongpassword', hashed)).toBe(false);
    });

    it('should handle empty strings in hashing', () => {
      const data = '';
      const hashed = hashField(data);

      expect(verifyHash(data, hashed)).toBe(true);
    });
  });

  describe('Encryption Configuration', () => {
    it('should have correct algorithm', () => {
      expect(ENCRYPTION_CONFIG.algorithm).toBe('aes-256-gcm');
    });

    it('should have sensitive fields defined', () => {
      expect(ENCRYPTION_CONFIG.sensitiveFields).toBeDefined();
      expect(ENCRYPTION_CONFIG.sensitiveFields.User).toContain('password');
      expect(ENCRYPTION_CONFIG.sensitiveFields.KycUpload).toContain('documentNumber');
      expect(ENCRYPTION_CONFIG.sensitiveFields.KycVerification).toContain('fullLegalName');
    });

    it('should have key derivation config', () => {
      expect(ENCRYPTION_CONFIG.keyDerivation.iterations).toBeGreaterThan(10000);
      expect(ENCRYPTION_CONFIG.keyDerivation.keyLength).toBe(32);
    });
  });

  describe('Validation', () => {
    it('should validate encryption setup without key', () => {
      const originalKey = process.env.DB_ENCRYPTION_KEY;
      delete process.env.DB_ENCRYPTION_KEY;

      const result = validateEncryptionSetup();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('DB_ENCRYPTION_KEY not configured or invalid');

      // Restore
      if (originalKey) {
        process.env.DB_ENCRYPTION_KEY = originalKey;
      }
    });

    it('should validate encryption setup with valid key', () => {
      const originalKey = process.env.DB_ENCRYPTION_KEY;
      process.env.DB_ENCRYPTION_KEY = generateEncryptionKey();

      const result = validateEncryptionSetup();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Restore
      if (originalKey) {
        process.env.DB_ENCRYPTION_KEY = originalKey;
      } else {
        delete process.env.DB_ENCRYPTION_KEY;
      }
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt within reasonable time', () => {
      const plaintext = 'test data '.repeat(100); // ~1KB
      const iterations = 100;

      const startEncrypt = Date.now();
      for (let i = 0; i < iterations; i++) {
        encryptField(plaintext, testKey);
      }
      const encryptTime = Date.now() - startEncrypt;

      const encrypted = encryptField(plaintext, testKey);
      const startDecrypt = Date.now();
      for (let i = 0; i < iterations; i++) {
        decryptField(encrypted, testKey);
      }
      const decryptTime = Date.now() - startDecrypt;

      // Should complete 100 operations in under 1 second
      expect(encryptTime).toBeLessThan(1000);
      expect(decryptTime).toBeLessThan(1000);
    });
  });
});

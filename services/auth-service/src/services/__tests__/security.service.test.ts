import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TwoFactorAuthService } from '../two-factor-auth.service';
import { PhoneVerificationService } from '../phone-verification.service';
import { DeviceFingerprintService } from '../device-fingerprint.service';

/**
 * Unit tests for security services
 * Requirements: SEC-001, SEC-002, SEC-003, SEC-006, SEC-007
 */

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;

  beforeEach(() => {
    service = new TwoFactorAuthService();
  });

  describe('enableSMS2FA', () => {
    it('should enable SMS 2FA for user', async () => {
      const result = await service.enableSMS2FA('user-123', '+1234567890');
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const result = await service.enableSMS2FA('', '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('enableTOTP2FA', () => {
    it('should generate TOTP secret and QR code', async () => {
      const result = await service.enableTOTP2FA('user-123');
      expect(result.success).toBe(true);
      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes?.length).toBe(10);
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA for user', async () => {
      const result = await service.disable2FA('user-123');
      expect(result.success).toBe(true);
    });
  });
});

describe('PhoneVerificationService', () => {
  let service: PhoneVerificationService;

  beforeEach(() => {
    service = new PhoneVerificationService();
  });

  describe('sendVerificationCode', () => {
    it('should send verification code to valid phone number', async () => {
      const result = await service.sendVerificationCode('+1234567890');
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number format', async () => {
      const result = await service.sendVerificationCode('1234567890');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
    });
  });

  describe('isPhoneVerified', () => {
    it('should check if phone is verified', async () => {
      const result = await service.isPhoneVerified('+1234567890');
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('DeviceFingerprintService', () => {
  let service: DeviceFingerprintService;

  beforeEach(() => {
    service = new DeviceFingerprintService();
  });

  describe('generateFingerprint', () => {
    it('should generate consistent fingerprint for same device data', () => {
      const deviceData = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        acceptLanguage: 'en-US',
        acceptEncoding: 'gzip',
        timezone: 'UTC',
      };

      const fingerprint1 = service.generateFingerprint(deviceData);
      const fingerprint2 = service.generateFingerprint(deviceData);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate different fingerprints for different device data', () => {
      const device1 = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      const device2 = {
        userAgent: 'Chrome/90',
        ipAddress: '192.168.1.2',
      };

      const fingerprint1 = service.generateFingerprint(device1);
      const fingerprint2 = service.generateFingerprint(device2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });

  describe('registerDevice', () => {
    it('should register new device', async () => {
      const deviceData = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      const result = await service.registerDevice('user-123', deviceData, 'My Device');
      expect(result.success).toBe(true);
      expect(result.fingerprint).toBeDefined();
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should detect suspicious activity', async () => {
      const deviceData = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      const result = await service.detectSuspiciousActivity('user-123', deviceData);
      expect(typeof result.suspicious).toBe('boolean');
    });
  });
});

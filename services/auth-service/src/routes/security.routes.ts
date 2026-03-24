import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { twoFactorAuthService } from '../services/two-factor-auth.service';
import { phoneVerificationService } from '../services/phone-verification.service';
import { deviceFingerprintService, DeviceFingerprint } from '../services/device-fingerprint.service';
import { logger } from '../utils/logger';

const router = Router();

// ============ 2FA Routes ============

/**
 * Enable SMS 2FA
 * POST /security/2fa/sms/enable
 * Requirements: SEC-002
 */
router.post('/2fa/sms/enable', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user?.id;

    if (!phoneNumber || !userId) {
      return res.status(400).json({ error: 'Phone number and user ID required' });
    }

    const result = await twoFactorAuthService.enableSMS2FA(userId, phoneNumber);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Verification code sent to phone number' });
  } catch (error) {
    logger.error(`Error enabling SMS 2FA: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify SMS 2FA setup
 * POST /security/2fa/sms/verify
 * Requirements: SEC-002
 */
router.post('/2fa/sms/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and user ID required' });
    }

    const result = await twoFactorAuthService.verifySMS2FA(userId, code);

    if (!result.verified) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: '2FA enabled successfully', backupCodes: result.backupCodes });
  } catch (error) {
    logger.error(`Error verifying SMS 2FA: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Enable TOTP 2FA
 * POST /security/2fa/totp/enable
 * Requirements: SEC-003
 */
router.post('/2fa/totp/enable', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await twoFactorAuthService.enableTOTP2FA(userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      secret: result.secret,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    logger.error(`Error enabling TOTP 2FA: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify TOTP 2FA setup
 * POST /security/2fa/totp/verify
 * Requirements: SEC-003
 */
router.post('/2fa/totp/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and user ID required' });
    }

    const result = await twoFactorAuthService.verifyTOTP(userId, code);

    if (!result.verified) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'TOTP 2FA enabled successfully' });
  } catch (error) {
    logger.error(`Error verifying TOTP 2FA: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Disable 2FA
 * POST /security/2fa/disable
 * Requirements: SEC-002, SEC-003
 */
router.post('/2fa/disable', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await twoFactorAuthService.disable2FA(userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    logger.error(`Error disabling 2FA: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ Phone Verification Routes ============

/**
 * Send phone verification code
 * POST /security/phone/send-code
 * Requirements: SEC-006
 */
router.post('/phone/send-code', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const result = await phoneVerificationService.sendVerificationCode(phoneNumber);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    logger.error(`Error sending phone verification code: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify phone number
 * POST /security/phone/verify
 * Requirements: SEC-006
 */
router.post('/security/phone/verify', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code required' });
    }

    const result = await phoneVerificationService.verifyPhoneNumber(phoneNumber, code);

    if (!result.verified) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Phone number verified successfully' });
  } catch (error) {
    logger.error(`Error verifying phone number: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ Device Fingerprint Routes ============

/**
 * Register device
 * POST /security/device/register
 * Requirements: SEC-007
 */
router.post('/device/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { deviceName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const deviceData: DeviceFingerprint = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
      acceptLanguage: req.headers['accept-language'] as string,
      acceptEncoding: req.headers['accept-encoding'] as string,
      timezone: req.body.timezone,
    };

    const result = await deviceFingerprintService.registerDevice(userId, deviceData, deviceName);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'Device registered',
      isNewDevice: result.isNewDevice,
      fingerprint: result.fingerprint,
    });
  } catch (error) {
    logger.error(`Error registering device: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get trusted devices
 * GET /security/devices
 * Requirements: SEC-007
 */
router.get('/devices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const devices = await deviceFingerprintService.getTrustedDevices(userId);

    res.json({ devices });
  } catch (error) {
    logger.error(`Error getting trusted devices: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Remove trusted device
 * DELETE /security/device/:deviceId
 * Requirements: SEC-007
 */
router.delete('/device/:deviceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { deviceId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await deviceFingerprintService.removeTrustedDevice(userId, deviceId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Device removed successfully' });
  } catch (error) {
    logger.error(`Error removing device: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

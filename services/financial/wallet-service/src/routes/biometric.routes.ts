import { Router, Request, Response } from 'express';
import { biometricAuthService, BiometricType } from '../services/biometric.service';

const router = Router();

/**
 * Biometric Authentication Routes
 * مسارات المصادقة البيومترية
 */

// Enroll a new biometric credential
router.post('/enroll', async (req: Request, res: Response) => {
  try {
    const { userId, type, publicKey, deviceId } = req.body;

    if (!userId || !type || !publicKey || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, publicKey, deviceId',
        messageAr: 'حقول مطلوبة مفقودة: userId, type, publicKey, deviceId'
      });
    }

    if (!Object.values(BiometricType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid biometric type. Valid types: ${Object.values(BiometricType).join(', ')}`,
        messageAr: `نوع بيومتري غير صالح`
      });
    }

    const enrollment = await biometricAuthService.enrollBiometric(
      userId,
      type as BiometricType,
      publicKey,
      deviceId
    );

    res.status(201).json({
      success: true,
      enrollment,
      message: 'Biometric enrolled successfully',
      messageAr: 'تم تسجيل البيانات البيومترية بنجاح'
    });
  } catch (error) {
    console.error('Biometric enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll biometric',
      messageAr: 'فشل تسجيل البيانات البيومترية'
    });
  }
});

// Generate a challenge for verification
router.post('/challenge', async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type',
        messageAr: 'حقول مطلوبة مفقودة: userId, type'
      });
    }

    const challenge = biometricAuthService.generateChallenge(userId, type as BiometricType);

    res.json({
      success: true,
      challengeId: challenge.challengeId,
      challenge: challenge.challenge,
      expiresAt: challenge.expiresAt,
      message: 'Challenge generated successfully',
      messageAr: 'تم إنشاء التحدي بنجاح'
    });
  } catch (error) {
    console.error('Challenge generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate challenge',
      messageAr: 'فشل إنشاء التحدي'
    });
  }
});

// Verify biometric signature
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { challengeId, signature, deviceId } = req.body;

    if (!challengeId || !signature || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: challengeId, signature, deviceId',
        messageAr: 'حقول مطلوبة مفقودة: challengeId, signature, deviceId'
      });
    }

    const result = await biometricAuthService.verifySignature(challengeId, signature, deviceId);

    if (result.success) {
      res.json({
        success: true,
        userId: result.userId,
        type: result.type,
        confidence: result.confidence,
        message: result.message,
        messageAr: result.messageAr
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message,
        messageAr: result.messageAr
      });
    }
  } catch (error) {
    console.error('Biometric verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify biometric',
      messageAr: 'فشل التحقق البيومتري'
    });
  }
});

// Get user's biometric enrollments
router.get('/enrollments/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const enrollments = await biometricAuthService.getUserEnrollments(userId);

    res.json({
      success: true,
      enrollments,
      count: enrollments.length
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enrollments',
      messageAr: 'فشل الحصول على التسجيلات'
    });
  }
});

// Revoke a specific biometric enrollment
router.delete('/enrollments/:userId/:enrollmentId', async (req: Request, res: Response) => {
  try {
    const { userId, enrollmentId } = req.params;

    const success = await biometricAuthService.revokeEnrollment(userId, enrollmentId);

    if (success) {
      res.json({
        success: true,
        message: 'Enrollment revoked successfully',
        messageAr: 'تم إلغاء التسجيل بنجاح'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found',
        messageAr: 'التسجيل غير موجود'
      });
    }
  } catch (error) {
    console.error('Revoke enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke enrollment',
      messageAr: 'فشل إلغاء التسجيل'
    });
  }
});

// Revoke all biometric enrollments for a user
router.delete('/enrollments/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const count = await biometricAuthService.revokeAllEnrollments(userId);

    res.json({
      success: true,
      revokedCount: count,
      message: `Revoked ${count} enrollment(s)`,
      messageAr: `تم إلغاء ${count} تسجيل(ات)`
    });
  } catch (error) {
    console.error('Revoke all enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke enrollments',
      messageAr: 'فشل إلغاء التسجيلات'
    });
  }
});

export default router;

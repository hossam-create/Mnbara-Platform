import * as crypto from 'crypto';

/**
 * Biometric Authentication Service
 * خدمة المصادقة البيومترية - Supports Face ID, Fingerprint, and other biometric methods
 */

export enum BiometricType {
  FACE_ID = 'FACE_ID',
  FINGERPRINT = 'FINGERPRINT',
  IRIS = 'IRIS',
  VOICE = 'VOICE'
}

export interface BiometricEnrollment {
  id: string;
  userId: string;
  type: BiometricType;
  publicKey: string;
  deviceId: string;
  enrolledAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
}

export interface BiometricChallenge {
  challengeId: string;
  challenge: string;
  userId: string;
  type: BiometricType;
  expiresAt: Date;
  createdAt: Date;
}

export interface BiometricVerificationResult {
  success: boolean;
  userId?: string;
  type?: BiometricType;
  confidence?: number;
  message: string;
  messageAr: string;
}

export class BiometricAuthService {
  private encryptionKey: string;
  private challengeExpiryMs: number;
  private enrollments: Map<string, BiometricEnrollment[]>;
  private pendingChallenges: Map<string, BiometricChallenge>;

  constructor() {
    this.encryptionKey = process.env.BIOMETRIC_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.challengeExpiryMs = 5 * 60 * 1000; // 5 minutes
    this.enrollments = new Map();
    this.pendingChallenges = new Map();
  }

  /**
   * Enroll a new biometric credential for a user
   * تسجيل بيانات بيومترية جديدة للمستخدم
   */
  async enrollBiometric(
    userId: string,
    type: BiometricType,
    publicKey: string,
    deviceId: string
  ): Promise<BiometricEnrollment> {
    const enrollment: BiometricEnrollment = {
      id: crypto.randomUUID(),
      userId,
      type,
      publicKey: this.encryptPublicKey(publicKey),
      deviceId,
      enrolledAt: new Date(),
      lastUsedAt: null,
      isActive: true
    };

    const userEnrollments = this.enrollments.get(userId) || [];
    
    // Check if device already enrolled for this type
    const existingIndex = userEnrollments.findIndex(
      e => e.deviceId === deviceId && e.type === type
    );

    if (existingIndex >= 0) {
      // Update existing enrollment
      userEnrollments[existingIndex] = enrollment;
    } else {
      userEnrollments.push(enrollment);
    }

    this.enrollments.set(userId, userEnrollments);

    console.log(`[Biometric] Enrolled ${type} for user ${userId} on device ${deviceId}`);

    return {
      ...enrollment,
      publicKey: '[ENCRYPTED]' // Don't return actual key
    };
  }

  /**
   * Generate a challenge for biometric verification
   * إنشاء تحدي للتحقق البيومتري
   */
  generateChallenge(userId: string, type: BiometricType): BiometricChallenge {
    const challengeId = crypto.randomUUID();
    const challenge = crypto.randomBytes(32).toString('base64');

    const biometricChallenge: BiometricChallenge = {
      challengeId,
      challenge,
      userId,
      type,
      expiresAt: new Date(Date.now() + this.challengeExpiryMs),
      createdAt: new Date()
    };

    this.pendingChallenges.set(challengeId, biometricChallenge);

    // Auto-cleanup expired challenges
    setTimeout(() => {
      this.pendingChallenges.delete(challengeId);
    }, this.challengeExpiryMs);

    console.log(`[Biometric] Challenge generated for user ${userId}: ${challengeId}`);

    return biometricChallenge;
  }

  /**
   * Verify a biometric signature against a challenge
   * التحقق من التوقيع البيومتري
   */
  async verifySignature(
    challengeId: string,
    signature: string,
    deviceId: string
  ): Promise<BiometricVerificationResult> {
    const challenge = this.pendingChallenges.get(challengeId);

    if (!challenge) {
      return {
        success: false,
        message: 'Challenge not found or expired',
        messageAr: 'التحدي غير موجود أو منتهي الصلاحية'
      };
    }

    if (new Date() > challenge.expiresAt) {
      this.pendingChallenges.delete(challengeId);
      return {
        success: false,
        message: 'Challenge expired',
        messageAr: 'انتهت صلاحية التحدي'
      };
    }

    const userEnrollments = this.enrollments.get(challenge.userId) || [];
    const enrollment = userEnrollments.find(
      e => e.deviceId === deviceId && e.type === challenge.type && e.isActive
    );

    if (!enrollment) {
      return {
        success: false,
        message: 'No active biometric enrollment found for this device',
        messageAr: 'لم يتم العثور على تسجيل بيومتري نشط لهذا الجهاز'
      };
    }

    // Verify the signature using the stored public key
    const isValid = this.verifyWithPublicKey(
      challenge.challenge,
      signature,
      this.decryptPublicKey(enrollment.publicKey)
    );

    if (isValid) {
      // Update last used
      enrollment.lastUsedAt = new Date();
      this.pendingChallenges.delete(challengeId);

      console.log(`[Biometric] Verification successful for user ${challenge.userId}`);

      return {
        success: true,
        userId: challenge.userId,
        type: challenge.type,
        confidence: 0.99,
        message: 'Biometric verification successful',
        messageAr: 'تم التحقق البيومتري بنجاح'
      };
    }

    console.log(`[Biometric] Verification failed for user ${challenge.userId}`);

    return {
      success: false,
      message: 'Biometric verification failed',
      messageAr: 'فشل التحقق البيومتري'
    };
  }

  /**
   * Get all biometric enrollments for a user
   * الحصول على جميع التسجيلات البيومترية للمستخدم
   */
  async getUserEnrollments(userId: string): Promise<Omit<BiometricEnrollment, 'publicKey'>[]> {
    const enrollments = this.enrollments.get(userId) || [];
    return enrollments.map(e => ({
      ...e,
      publicKey: undefined as any
    }));
  }

  /**
   * Revoke a biometric enrollment
   * إلغاء تسجيل بيومتري
   */
  async revokeEnrollment(userId: string, enrollmentId: string): Promise<boolean> {
    const userEnrollments = this.enrollments.get(userId) || [];
    const enrollmentIndex = userEnrollments.findIndex(e => e.id === enrollmentId);

    if (enrollmentIndex >= 0) {
      userEnrollments[enrollmentIndex].isActive = false;
      console.log(`[Biometric] Revoked enrollment ${enrollmentId} for user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Revoke all biometric enrollments for a user
   * إلغاء جميع التسجيلات البيومترية للمستخدم
   */
  async revokeAllEnrollments(userId: string): Promise<number> {
    const userEnrollments = this.enrollments.get(userId) || [];
    let count = 0;

    userEnrollments.forEach(e => {
      if (e.isActive) {
        e.isActive = false;
        count++;
      }
    });

    console.log(`[Biometric] Revoked ${count} enrollments for user ${userId}`);
    return count;
  }

  // Private helper methods

  private encryptPublicKey(publicKey: string): string {
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(this.encryptionKey.substring(0, 32), 'utf8');
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(publicKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptPublicKey(encryptedKey: string): string {
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const keyBuffer = Buffer.from(this.encryptionKey.substring(0, 32), 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private verifyWithPublicKey(challenge: string, signature: string, publicKey: string): boolean {
    try {
      // For WebAuthn/FIDO2 compatible verification
      const verify = crypto.createVerify('SHA256');
      verify.update(challenge);
      verify.end();
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      // Fallback to HMAC verification for simpler implementations
      const expectedSignature = crypto
        .createHmac('sha256', publicKey)
        .update(challenge)
        .digest('base64');
      return expectedSignature === signature;
    }
  }
}

// Singleton instance
export const biometricAuthService = new BiometricAuthService();

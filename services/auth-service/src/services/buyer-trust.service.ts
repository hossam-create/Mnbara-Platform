/**
 * Buyer Trust Verification Service (Lightweight)
 *
 * Purpose: Fraud prevention, dispute resolution, buyer accountability
 * NOT financial verification
 *
 * Constraints:
 * - Deterministic logic
 * - No scoring mutation
 * - No automation decisions
 * - Read-only trust indicators
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  BuyerVerificationStatus,
  BuyerTrustAuditAction,
  BuyerTrustProfile,
  BuyerDeliveryAddress,
  BuyerDeviceLog,
  CreateBuyerProfileRequest,
  UpdateBuyerProfileRequest,
  AddAddressRequest,
  SendBuyerOtpRequest,
  VerifyBuyerOtpRequest,
  ApplyRestrictionRequest,
  BuyerProfileResponse,
  BuyerAccessStatus,
  BuyerTrustIndicator,
  isValidBuyerStatusTransition,
  isReadyForVerification,
  validateAddressFormat,
} from '../types/buyer-trust.types';

const prisma = new PrismaClient();

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RATE_LIMIT_MINUTES = 1;
const MAX_OTP_SENDS_PER_HOUR = 5;

/**
 * Generate OTP
 */
function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP for storage
 */
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Calculate completion progress
 */
function calculateProgress(profile: BuyerTrustProfile): number {
  let completed = 0;
  const total = 5;

  if (profile.fullName) completed++;
  if (profile.phoneVerified) completed++;
  if (profile.emailVerified) completed++;
  if (profile.addresses && profile.addresses.length > 0) completed++;
  if (profile.emergencyContactName && profile.emergencyContactPhone) completed++;

  return Math.round((completed / total) * 100);
}

export class BuyerTrustService {
  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  /**
   * Create or get buyer trust profile
   */
  async createProfile(
    userId: number,
    data: CreateBuyerProfileRequest
  ): Promise<BuyerTrustProfile> {
    // Check if profile exists
    const existing = await prisma.$queryRaw<BuyerTrustProfile[]>`
      SELECT * FROM "BuyerTrustProfile" WHERE "userId" = ${userId}
    `;

    if (existing.length > 0) {
      // Update last activity
      await this.logDevice(userId, existing[0].id, {
        ipAddress: data.ipAddress,
        deviceFingerprint: data.deviceFingerprint,
        userAgent: data.userAgent,
        activityType: 'PROFILE_ACCESS',
      });
      return this.getProfile(userId);
    }

    // Create new profile
    await prisma.$executeRaw`
      INSERT INTO "BuyerTrustProfile" (
        "userId", "email", "fullName", "status",
        "lastIpAddress", "lastDeviceFingerprint", "lastUserAgent",
        "lastActivityAt", "createdAt", "updatedAt"
      ) VALUES (
        ${userId}, ${data.email}, ${data.fullName || null}, 'UNVERIFIED',
        ${data.ipAddress}, ${data.deviceFingerprint || null}, ${data.userAgent || null},
        NOW(), NOW(), NOW()
      )
    `;

    const profile = await this.getProfile(userId);

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.PROFILE_CREATED,
      description: 'Buyer trust profile created',
      actorId: userId,
      actorIp: data.ipAddress,
      actorUserAgent: data.userAgent,
    });

    return profile;
  }

  /**
   * Get profile by user ID
   */
  async getProfile(userId: number): Promise<BuyerTrustProfile> {
    const results = await prisma.$queryRaw<BuyerTrustProfile[]>`
      SELECT * FROM "BuyerTrustProfile" WHERE "userId" = ${userId}
    `;

    if (results.length === 0) {
      throw new Error('Buyer profile not found');
    }

    const profile = results[0];

    // Get addresses
    const addresses = await prisma.$queryRaw<BuyerDeliveryAddress[]>`
      SELECT * FROM "BuyerDeliveryAddress"
      WHERE "profileId" = ${profile.id} AND "isActive" = true
      ORDER BY "isDefault" DESC, "createdAt" DESC
    `;

    return { ...profile, addresses };
  }


  /**
   * Update profile
   */
  async updateProfile(
    userId: number,
    data: UpdateBuyerProfileRequest,
    actorIp?: string
  ): Promise<BuyerTrustProfile> {
    const profile = await this.getProfile(userId);

    // Cannot update if restricted
    if (profile.status === BuyerVerificationStatus.RESTRICTED) {
      throw new Error('Cannot update restricted profile');
    }

    const previousState = {
      fullName: profile.fullName,
      emergencyContactName: profile.emergencyContactName,
    };

    await prisma.$executeRaw`
      UPDATE "BuyerTrustProfile" SET
        "fullName" = COALESCE(${data.fullName}, "fullName"),
        "emergencyContactName" = COALESCE(${data.emergencyContactName}, "emergencyContactName"),
        "emergencyContactPhone" = COALESCE(${data.emergencyContactPhone}, "emergencyContactPhone"),
        "emergencyContactRelation" = COALESCE(${data.emergencyContactRelation}, "emergencyContactRelation"),
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;

    // Log emergency contact addition
    if (data.emergencyContactName && !profile.emergencyContactName) {
      await this.logAudit({
        profileId: profile.id,
        userId,
        action: BuyerTrustAuditAction.EMERGENCY_CONTACT_ADDED,
        description: 'Emergency contact added',
        actorId: userId,
        actorIp,
        previousState,
        newState: data as unknown as Record<string, unknown>,
      });
    } else {
      await this.logAudit({
        profileId: profile.id,
        userId,
        action: BuyerTrustAuditAction.PROFILE_UPDATED,
        description: 'Profile updated',
        actorId: userId,
        actorIp,
        previousState,
        newState: data as unknown as Record<string, unknown>,
      });
    }

    return this.getProfile(userId);
  }

  // ============================================
  // ADDRESS MANAGEMENT
  // ============================================

  /**
   * Add delivery address
   */
  async addAddress(
    userId: number,
    data: AddAddressRequest,
    actorIp?: string
  ): Promise<BuyerDeliveryAddress> {
    const profile = await this.getProfile(userId);

    // Validate address format
    const validation = validateAddressFormat(data);
    if (!validation.valid) {
      throw new Error(`Invalid address: ${validation.errors.join(', ')}`);
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.$executeRaw`
        UPDATE "BuyerDeliveryAddress" SET "isDefault" = false
        WHERE "profileId" = ${profile.id}
      `;
    }

    // Insert address
    await prisma.$executeRaw`
      INSERT INTO "BuyerDeliveryAddress" (
        "profileId", "userId", "label", "fullName", "phoneNumber",
        "addressLine1", "addressLine2", "city", "stateProvince",
        "postalCode", "country", "isDefault", "isActive",
        "createdAt", "updatedAt"
      ) VALUES (
        ${profile.id}, ${userId}, ${data.label || null}, ${data.fullName},
        ${data.phoneNumber || null}, ${data.addressLine1}, ${data.addressLine2 || null},
        ${data.city}, ${data.stateProvince || null}, ${data.postalCode || null},
        ${data.country.toUpperCase()}, ${data.isDefault || false}, true,
        NOW(), NOW()
      )
    `;

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.ADDRESS_ADDED,
      description: `Address added: ${data.city}, ${data.country}`,
      actorId: userId,
      actorIp,
      metadata: { city: data.city, country: data.country },
    });

    // Return the new address
    const addresses = await prisma.$queryRaw<BuyerDeliveryAddress[]>`
      SELECT * FROM "BuyerDeliveryAddress"
      WHERE "profileId" = ${profile.id}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return addresses[0];
  }

  /**
   * Update address
   */
  async updateAddress(
    userId: number,
    addressId: number,
    data: Partial<AddAddressRequest>,
    actorIp?: string
  ): Promise<BuyerDeliveryAddress> {
    const profile = await this.getProfile(userId);

    // Verify address belongs to user
    const existing = await prisma.$queryRaw<BuyerDeliveryAddress[]>`
      SELECT * FROM "BuyerDeliveryAddress"
      WHERE "id" = ${addressId} AND "profileId" = ${profile.id}
    `;

    if (existing.length === 0) {
      throw new Error('Address not found');
    }

    // If setting as default, unset others
    if (data.isDefault) {
      await prisma.$executeRaw`
        UPDATE "BuyerDeliveryAddress" SET "isDefault" = false
        WHERE "profileId" = ${profile.id} AND "id" != ${addressId}
      `;
    }

    await prisma.$executeRaw`
      UPDATE "BuyerDeliveryAddress" SET
        "label" = COALESCE(${data.label}, "label"),
        "fullName" = COALESCE(${data.fullName}, "fullName"),
        "phoneNumber" = COALESCE(${data.phoneNumber}, "phoneNumber"),
        "addressLine1" = COALESCE(${data.addressLine1}, "addressLine1"),
        "addressLine2" = COALESCE(${data.addressLine2}, "addressLine2"),
        "city" = COALESCE(${data.city}, "city"),
        "stateProvince" = COALESCE(${data.stateProvince}, "stateProvince"),
        "postalCode" = COALESCE(${data.postalCode}, "postalCode"),
        "country" = COALESCE(${data.country?.toUpperCase()}, "country"),
        "isDefault" = COALESCE(${data.isDefault}, "isDefault"),
        "isValidated" = false,
        "updatedAt" = NOW()
      WHERE "id" = ${addressId}
    `;

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.ADDRESS_UPDATED,
      description: 'Address updated',
      actorId: userId,
      actorIp,
      metadata: { addressId },
    });

    const updated = await prisma.$queryRaw<BuyerDeliveryAddress[]>`
      SELECT * FROM "BuyerDeliveryAddress" WHERE "id" = ${addressId}
    `;

    return updated[0];
  }

  /**
   * Delete address (soft delete)
   */
  async deleteAddress(userId: number, addressId: number): Promise<void> {
    const profile = await this.getProfile(userId);

    await prisma.$executeRaw`
      UPDATE "BuyerDeliveryAddress" SET
        "isActive" = false,
        "updatedAt" = NOW()
      WHERE "id" = ${addressId} AND "profileId" = ${profile.id}
    `;
  }

  /**
   * Validate address (basic format validation - no external API)
   */
  async validateAddress(
    userId: number,
    addressId: number,
    adminId?: number,
    adminIp?: string
  ): Promise<BuyerDeliveryAddress> {
    const profile = await this.getProfile(userId);

    const addresses = await prisma.$queryRaw<BuyerDeliveryAddress[]>`
      SELECT * FROM "BuyerDeliveryAddress"
      WHERE "id" = ${addressId} AND "profileId" = ${profile.id}
    `;

    if (addresses.length === 0) {
      throw new Error('Address not found');
    }

    // Basic validation (deterministic - just format check)
    const address = addresses[0];
    const validation = validateAddressFormat({
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      city: address.city,
      country: address.country,
    });

    if (!validation.valid) {
      throw new Error(`Address validation failed: ${validation.errors.join(', ')}`);
    }

    await prisma.$executeRaw`
      UPDATE "BuyerDeliveryAddress" SET
        "isValidated" = true,
        "validatedAt" = NOW(),
        "validationMethod" = 'FORMAT_CHECK',
        "validationNotes" = 'Basic format validation passed',
        "updatedAt" = NOW()
      WHERE "id" = ${addressId}
    `;

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.ADDRESS_VALIDATED,
      description: 'Address validated (format check)',
      actorId: adminId || userId,
      actorRole: adminId ? 'ADMIN' : 'USER',
      actorIp: adminIp,
      metadata: { addressId, method: 'FORMAT_CHECK' },
    });

    const updated = await prisma.$queryRaw<BuyerDeliveryAddress[]>`
      SELECT * FROM "BuyerDeliveryAddress" WHERE "id" = ${addressId}
    `;

    return updated[0];
  }

  // ============================================
  // PHONE VERIFICATION
  // ============================================

  /**
   * Send OTP to phone
   */
  async sendPhoneOtp(
    userId: number,
    data: SendBuyerOtpRequest
  ): Promise<{ sent: boolean; expiresAt: Date }> {
    const profile = await this.getProfile(userId);

    // Check rate limiting
    const existing = await prisma.$queryRaw<{ blockedUntil: Date | null; lastSentAt: Date | null; sentCount: number }[]>`
      SELECT "blockedUntil", "lastSentAt", "sentCount" FROM "BuyerPhoneOtp"
      WHERE "profileId" = ${profile.id} AND "phoneNumber" = ${data.phoneNumber}
      ORDER BY "createdAt" DESC LIMIT 1
    `;

    if (existing.length > 0) {
      const record = existing[0];

      if (record.blockedUntil && new Date(record.blockedUntil) > new Date()) {
        throw new Error('Too many attempts. Please try again later.');
      }

      if (record.lastSentAt) {
        const timeSince = Date.now() - new Date(record.lastSentAt).getTime();
        if (timeSince < OTP_RATE_LIMIT_MINUTES * 60 * 1000) {
          throw new Error(`Please wait ${OTP_RATE_LIMIT_MINUTES} minute(s) before requesting another OTP`);
        }
      }

      if (record.sentCount >= MAX_OTP_SENDS_PER_HOUR) {
        throw new Error('Maximum OTP requests exceeded. Please try again in an hour.');
      }
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert OTP record
    await prisma.$executeRaw`
      INSERT INTO "BuyerPhoneOtp" (
        "profileId", "userId", "phoneNumber", "countryCode",
        "otpHash", "expiresAt", "sentCount", "lastSentAt",
        "createdAt", "updatedAt"
      ) VALUES (
        ${profile.id}, ${userId}, ${data.phoneNumber}, ${data.countryCode},
        ${otpHash}, ${expiresAt}, 1, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("profileId", "phoneNumber")
      DO UPDATE SET
        "otpHash" = ${otpHash},
        "expiresAt" = ${expiresAt},
        "attempts" = 0,
        "sentCount" = "BuyerPhoneOtp"."sentCount" + 1,
        "lastSentAt" = NOW(),
        "updatedAt" = NOW()
    `;

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.PHONE_OTP_SENT,
      description: `OTP sent to phone: ***${data.phoneNumber.slice(-4)}`,
      actorId: userId,
      metadata: { phoneLastFour: data.phoneNumber.slice(-4) },
    });

    // TODO: Integrate with SMS provider
    console.log(`[DEV] Buyer OTP for ${data.phoneNumber}: ${otp}`);

    return { sent: true, expiresAt };
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOtp(
    userId: number,
    data: VerifyBuyerOtpRequest
  ): Promise<{ verified: boolean }> {
    const profile = await this.getProfile(userId);

    const otpRecords = await prisma.$queryRaw<{
      id: number;
      otpHash: string;
      expiresAt: Date;
      attempts: number;
      verified: boolean;
      blockedUntil: Date | null;
    }[]>`
      SELECT * FROM "BuyerPhoneOtp"
      WHERE "profileId" = ${profile.id} AND "phoneNumber" = ${data.phoneNumber}
      ORDER BY "createdAt" DESC LIMIT 1
    `;

    if (otpRecords.length === 0) {
      throw new Error('No OTP found. Please request a new one.');
    }

    const record = otpRecords[0];

    if (record.verified) {
      return { verified: true };
    }

    if (record.blockedUntil && new Date(record.blockedUntil) > new Date()) {
      throw new Error('Too many failed attempts. Please try again later.');
    }

    if (new Date(record.expiresAt) < new Date()) {
      throw new Error('OTP expired. Please request a new one.');
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.$executeRaw`
        UPDATE "BuyerPhoneOtp" SET
          "blockedUntil" = NOW() + INTERVAL '30 minutes',
          "updatedAt" = NOW()
        WHERE "id" = ${record.id}
      `;
      throw new Error('Too many failed attempts. Please try again in 30 minutes.');
    }

    // Verify OTP
    const providedHash = hashOtp(data.otp);
    if (providedHash !== record.otpHash) {
      await prisma.$executeRaw`
        UPDATE "BuyerPhoneOtp" SET
          "attempts" = "attempts" + 1,
          "lastAttemptAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = ${record.id}
      `;
      throw new Error('Invalid OTP. Please try again.');
    }

    // Mark as verified
    await prisma.$executeRaw`
      UPDATE "BuyerPhoneOtp" SET
        "verified" = true,
        "verifiedAt" = NOW(),
        "verifiedIp" = ${data.ipAddress},
        "updatedAt" = NOW()
      WHERE "id" = ${record.id}
    `;

    // Update profile
    await prisma.$executeRaw`
      UPDATE "BuyerTrustProfile" SET
        "phoneNumber" = ${data.phoneNumber},
        "phoneVerified" = true,
        "phoneVerifiedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "id" = ${profile.id}
    `;

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.PHONE_VERIFIED,
      description: `Phone verified: ***${data.phoneNumber.slice(-4)}`,
      actorId: userId,
      actorIp: data.ipAddress,
      metadata: { phoneLastFour: data.phoneNumber.slice(-4) },
    });

    // Check if ready for verification
    await this.checkAndUpdateVerificationStatus(userId);

    return { verified: true };
  }


  // ============================================
  // VERIFICATION STATUS
  // ============================================

  /**
   * Check and update verification status (deterministic)
   */
  private async checkAndUpdateVerificationStatus(userId: number): Promise<void> {
    const profile = await this.getProfile(userId);

    // Already verified or restricted - no change
    if (profile.status !== BuyerVerificationStatus.UNVERIFIED) {
      return;
    }

    const { ready } = isReadyForVerification(profile);

    if (ready) {
      await prisma.$executeRaw`
        UPDATE "BuyerTrustProfile" SET
          "status" = 'VERIFIED',
          "verifiedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = ${profile.id}
      `;

      // Update user table
      await prisma.$executeRaw`
        UPDATE "User" SET
          "buyerVerificationStatus" = 'VERIFIED',
          "buyerVerifiedAt" = NOW(),
          "buyerTrustProfileId" = ${profile.id}
        WHERE "id" = ${userId}
      `;

      await this.logAudit({
        profileId: profile.id,
        userId,
        action: BuyerTrustAuditAction.STATUS_CHANGED,
        description: 'Buyer verified - all requirements met',
        actorId: userId,
        previousState: { status: BuyerVerificationStatus.UNVERIFIED },
        newState: { status: BuyerVerificationStatus.VERIFIED },
      });
    }
  }

  /**
   * Check buyer access status
   */
  async checkBuyerAccess(userId: number): Promise<BuyerAccessStatus> {
    try {
      const profile = await this.getProfile(userId);

      const isVerified = profile.status === BuyerVerificationStatus.VERIFIED;
      const isRestricted = profile.status === BuyerVerificationStatus.RESTRICTED;

      return {
        userId,
        status: profile.status,
        isVerified,
        canBrowse: !isRestricted, // Unverified can browse
        canSubmitRequests: isVerified, // Only verified can submit
        message: isRestricted
          ? `Account restricted: ${profile.restrictionReason || 'Contact support'}`
          : isVerified
            ? 'Verified buyer. You can submit purchase requests.'
            : 'Complete verification to submit purchase requests.',
        profileId: profile.id,
      };
    } catch {
      // No profile exists
      return {
        userId,
        status: BuyerVerificationStatus.UNVERIFIED,
        isVerified: false,
        canBrowse: true,
        canSubmitRequests: false,
        message: 'Create a profile to submit purchase requests.',
      };
    }
  }

  /**
   * Get trust indicator (read-only, no scoring)
   */
  async getTrustIndicator(userId: number): Promise<BuyerTrustIndicator> {
    const profile = await this.getProfile(userId);

    const hasValidatedAddress = profile.addresses?.some((a) => a.isValidated) || false;
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      userId,
      status: profile.status,
      phoneVerified: profile.phoneVerified,
      emailVerified: profile.emailVerified,
      hasValidatedAddress,
      accountAgeDays,
      // NO score - just facts
    };
  }

  // ============================================
  // RESTRICTION MANAGEMENT (Admin)
  // ============================================

  /**
   * Apply restriction (admin only)
   */
  async applyRestriction(
    userId: number,
    adminId: number,
    data: ApplyRestrictionRequest,
    adminIp?: string
  ): Promise<BuyerTrustProfile> {
    const profile = await this.getProfile(userId);

    if (profile.status === BuyerVerificationStatus.RESTRICTED) {
      throw new Error('Profile is already restricted');
    }

    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    await prisma.$executeRaw`
      UPDATE "BuyerTrustProfile" SET
        "status" = 'RESTRICTED',
        "restrictedAt" = NOW(),
        "restrictedBy" = ${adminId},
        "restrictionReason" = ${data.reason},
        "restrictionExpiresAt" = ${expiresAt},
        "updatedAt" = NOW()
      WHERE "id" = ${profile.id}
    `;

    // Update user table
    await prisma.$executeRaw`
      UPDATE "User" SET "buyerVerificationStatus" = 'RESTRICTED'
      WHERE "id" = ${userId}
    `;

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.RESTRICTION_APPLIED,
      description: `Restriction applied: ${data.reason}`,
      actorId: adminId,
      actorRole: 'ADMIN',
      actorIp: adminIp,
      previousState: { status: profile.status },
      newState: { status: BuyerVerificationStatus.RESTRICTED, reason: data.reason },
    });

    return this.getProfile(userId);
  }

  /**
   * Lift restriction (admin only)
   */
  async liftRestriction(
    userId: number,
    adminId: number,
    notes?: string,
    adminIp?: string
  ): Promise<BuyerTrustProfile> {
    const profile = await this.getProfile(userId);

    if (profile.status !== BuyerVerificationStatus.RESTRICTED) {
      throw new Error('Profile is not restricted');
    }

    await prisma.$executeRaw`
      UPDATE "BuyerTrustProfile" SET
        "status" = 'VERIFIED',
        "restrictedAt" = NULL,
        "restrictedBy" = NULL,
        "restrictionReason" = NULL,
        "restrictionExpiresAt" = NULL,
        "updatedAt" = NOW()
      WHERE "id" = ${profile.id}
    `;

    // Update user table
    await prisma.$executeRaw`
      UPDATE "User" SET "buyerVerificationStatus" = 'VERIFIED'
      WHERE "id" = ${userId}
    `;

    await this.logAudit({
      profileId: profile.id,
      userId,
      action: BuyerTrustAuditAction.RESTRICTION_LIFTED,
      description: `Restriction lifted${notes ? `: ${notes}` : ''}`,
      actorId: adminId,
      actorRole: 'ADMIN',
      actorIp: adminIp,
      previousState: { status: BuyerVerificationStatus.RESTRICTED },
      newState: { status: BuyerVerificationStatus.VERIFIED },
      metadata: { notes },
    });

    return this.getProfile(userId);
  }

  // ============================================
  // DEVICE/IP LOGGING
  // ============================================

  /**
   * Log device activity (fraud detection)
   */
  async logDevice(
    userId: number,
    profileId: number,
    data: {
      ipAddress: string;
      deviceFingerprint?: string;
      userAgent?: string;
      activityType: string;
      activityDetails?: Record<string, unknown>;
    }
  ): Promise<BuyerDeviceLog> {
    // Check if new device/location (deterministic check)
    const previousDevices = await prisma.$queryRaw<{ deviceFingerprint: string; ipAddress: string }[]>`
      SELECT DISTINCT "deviceFingerprint", "ipAddress" FROM "BuyerDeviceLog"
      WHERE "profileId" = ${profileId}
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    const isNewDevice = data.deviceFingerprint
      ? !previousDevices.some((d) => d.deviceFingerprint === data.deviceFingerprint)
      : false;

    const isNewLocation = !previousDevices.some((d) => d.ipAddress === data.ipAddress);

    // Insert log (read-only indicator - no automation)
    await prisma.$executeRaw`
      INSERT INTO "BuyerDeviceLog" (
        "profileId", "userId", "ipAddress", "deviceFingerprint",
        "userAgent", "activityType", "activityDetails",
        "isNewDevice", "isNewLocation", "isSuspicious",
        "createdAt"
      ) VALUES (
        ${profileId}, ${userId}, ${data.ipAddress}, ${data.deviceFingerprint || null},
        ${data.userAgent || null}, ${data.activityType},
        ${data.activityDetails ? JSON.stringify(data.activityDetails) : null}::jsonb,
        ${isNewDevice}, ${isNewLocation}, false,
        NOW()
      )
    `;

    // Update profile last activity
    await prisma.$executeRaw`
      UPDATE "BuyerTrustProfile" SET
        "lastIpAddress" = ${data.ipAddress},
        "lastDeviceFingerprint" = ${data.deviceFingerprint || null},
        "lastUserAgent" = ${data.userAgent || null},
        "lastActivityAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "id" = ${profileId}
    `;

    const logs = await prisma.$queryRaw<BuyerDeviceLog[]>`
      SELECT * FROM "BuyerDeviceLog"
      WHERE "profileId" = ${profileId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return logs[0];
  }

  // ============================================
  // RESPONSE HELPERS
  // ============================================

  /**
   * Get profile response
   */
  async getProfileResponse(userId: number): Promise<BuyerProfileResponse> {
    const profile = await this.getProfile(userId);

    return {
      id: profile.id,
      userId: profile.userId,
      status: profile.status,
      completionStatus: {
        fullNameProvided: !!profile.fullName,
        phoneVerified: profile.phoneVerified,
        emailVerified: profile.emailVerified,
        addressAdded: (profile.addresses?.length || 0) > 0,
        emergencyContactProvided: !!(profile.emergencyContactName && profile.emergencyContactPhone),
      },
      progressPercent: calculateProgress(profile),
      addressCount: profile.addresses?.length || 0,
      verifiedAt: profile.verifiedAt,
      createdAt: profile.createdAt,
    };
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  /**
   * Log audit entry (immutable)
   */
  private async logAudit(data: {
    profileId: number;
    userId: number;
    action: BuyerTrustAuditAction;
    description: string;
    actorId?: number;
    actorRole?: string;
    actorIp?: string;
    actorUserAgent?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO "BuyerTrustAuditLog" (
        "profileId", "userId", "action", "description",
        "actorId", "actorRole", "actorIp", "actorUserAgent",
        "previousState", "newState", "metadata",
        "createdAt"
      ) VALUES (
        ${data.profileId}, ${data.userId}, ${data.action}::text::"BuyerTrustAuditAction",
        ${data.description}, ${data.actorId || null}, ${data.actorRole || null},
        ${data.actorIp || null}, ${data.actorUserAgent || null},
        ${data.previousState ? JSON.stringify(data.previousState) : null}::jsonb,
        ${data.newState ? JSON.stringify(data.newState) : null}::jsonb,
        ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
        NOW()
      )
    `;
  }
}

export const buyerTrustService = new BuyerTrustService();

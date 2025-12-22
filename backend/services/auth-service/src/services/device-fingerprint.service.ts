import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface DeviceFingerprint {
  userAgent: string;
  ipAddress: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  timezone?: string;
}

export interface FingerprintResult {
  success: boolean;
  fingerprint?: string;
  isNewDevice?: boolean;
  riskScore?: number;
  error?: string;
}

export class DeviceFingerprintService {
  /**
   * Generate device fingerprint from request headers
   * Requirements: SEC-007
   */
  generateFingerprint(deviceData: DeviceFingerprint): string {
    const fingerprintString = [
      deviceData.userAgent,
      deviceData.ipAddress,
      deviceData.acceptLanguage || '',
      deviceData.acceptEncoding || '',
      deviceData.timezone || '',
    ].join('|');

    return createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Register device fingerprint for user
   * Requirements: SEC-007
   */
  async registerDevice(
    userId: string,
    deviceData: DeviceFingerprint,
    deviceName?: string
  ): Promise<FingerprintResult> {
    try {
      logger.info(`Registering device for user ${userId}`);

      const fingerprint = this.generateFingerprint(deviceData);

      // Check if device already registered
      const existingDevice = await prisma.userDevice.findFirst({
        where: {
          userId,
          fingerprint,
        },
      });

      if (existingDevice) {
        // Update last seen
        await prisma.userDevice.update({
          where: { id: existingDevice.id },
          data: { lastSeenAt: new Date() },
        });

        return {
          success: true,
          fingerprint,
          isNewDevice: false,
          riskScore: 0,
        };
      }

      // Register new device
      await prisma.userDevice.create({
        data: {
          userId,
          fingerprint,
          deviceName: deviceName || 'Unknown Device',
          userAgent: deviceData.userAgent,
          ipAddress: deviceData.ipAddress,
          lastSeenAt: new Date(),
        },
      });

      logger.info(`New device registered for user ${userId}`);

      return {
        success: true,
        fingerprint,
        isNewDevice: true,
        riskScore: 0,
      };
    } catch (error) {
      logger.error(`Failed to register device: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify device fingerprint
   * Requirements: SEC-007
   */
  async verifyDevice(userId: string, deviceData: DeviceFingerprint): Promise<FingerprintResult> {
    try {
      const fingerprint = this.generateFingerprint(deviceData);

      const device = await prisma.userDevice.findFirst({
        where: {
          userId,
          fingerprint,
        },
      });

      if (!device) {
        // New device detected
        return {
          success: true,
          fingerprint,
          isNewDevice: true,
          riskScore: 50, // Medium risk for new device
        };
      }

      // Update last seen
      await prisma.userDevice.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() },
      });

      return {
        success: true,
        fingerprint,
        isNewDevice: false,
        riskScore: 0,
      };
    } catch (error) {
      logger.error(`Failed to verify device: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Detect suspicious login attempts
   * Requirements: SEC-007
   */
  async detectSuspiciousActivity(
    userId: string,
    deviceData: DeviceFingerprint
  ): Promise<{ suspicious: boolean; reason?: string }> {
    try {
      const fingerprint = this.generateFingerprint(deviceData);

      // Get user's devices
      const userDevices = await prisma.userDevice.findMany({
        where: { userId },
      });

      if (userDevices.length === 0) {
        return { suspicious: false };
      }

      // Check if device is known
      const knownDevice = userDevices.find((d) => d.fingerprint === fingerprint);

      if (!knownDevice) {
        // Check for rapid location changes
        const lastDevice = userDevices[userDevices.length - 1];
        if (lastDevice && lastDevice.lastSeenAt) {
          const timeDiff = Date.now() - lastDevice.lastSeenAt.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          // If different IP in less than 1 hour, flag as suspicious
          if (
            hoursDiff < 1 &&
            lastDevice.ipAddress !== deviceData.ipAddress
          ) {
            return {
              suspicious: true,
              reason: 'Rapid location change detected',
            };
          }
        }
      }

      return { suspicious: false };
    } catch (error) {
      logger.error(`Failed to detect suspicious activity: ${error}`);
      return { suspicious: false };
    }
  }

  /**
   * Get user's trusted devices
   * Requirements: SEC-007
   */
  async getTrustedDevices(userId: string) {
    try {
      return await prisma.userDevice.findMany({
        where: { userId },
        select: {
          id: true,
          deviceName: true,
          userAgent: true,
          ipAddress: true,
          lastSeenAt: true,
          createdAt: true,
        },
        orderBy: { lastSeenAt: 'desc' },
      });
    } catch (error) {
      logger.error(`Failed to get trusted devices: ${error}`);
      return [];
    }
  }

  /**
   * Remove trusted device
   * Requirements: SEC-007
   */
  async removeTrustedDevice(userId: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Removing device ${deviceId} for user ${userId}`);

      const device = await prisma.userDevice.findFirst({
        where: {
          id: deviceId,
          userId,
        },
      });

      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      await prisma.userDevice.delete({
        where: { id: deviceId },
      });

      return { success: true };
    } catch (error) {
      logger.error(`Failed to remove device: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();

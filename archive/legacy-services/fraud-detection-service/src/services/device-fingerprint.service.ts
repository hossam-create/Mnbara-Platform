// Device Fingerprinting Service
// خدمة بصمة الأجهزة - Advanced device identification and risk assessment

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export interface DeviceFingerprintInput {
  userAgent?: string;
  acceptLanguage?: string;
  timezone?: string;
  screenWidth?: number;
  screenHeight?: number;
  colorDepth?: number;
  pixelRatio?: number;
  canvasHash?: string;
  webglVendor?: string;
  webglRenderer?: string;
  platform?: string;
  plugins?: string[];
  hardwareConcurrency?: number;
  deviceMemory?: number;
  connectionType?: string;
  downlink?: number;
  rtt?: number;
  doNotTrack?: boolean;
  touchSupport?: boolean;
}

export interface FingerprintResult {
  fingerprintId: string;
  fingerprintHash: string;
  riskScore: number;
  isTrusted: boolean;
  isSuspicious: boolean;
  riskReasons: string[];
  deviceInfo: {
    type: string;
    brand: string;
    model: string;
    os: string;
    browser: string;
  };
  recommendations: string[];
}

export interface DeviceRiskAssessment {
  deviceId: string;
  riskScore: number;
  factors: {
    factor: string;
    score: number;
    description: string;
  }[];
  isNew: boolean;
  isSuspicious: boolean;
  recommendations: string[];
}

interface DeviceFingerprintRecord {
  id: string;
  fingerprintHash: string;
  userAgent: string | null;
  acceptLanguage: string | null;
  timezone: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  colorDepth: number | null;
  pixelRatio: number | null;
  canvasHash: string | null;
  webglVendor: string | null;
  webglRenderer: string | null;
  platform: string | null;
  deviceType: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  os: string | null;
  browser: string | null;
  browserVersion: string | null;
  isTrusted: boolean;
  isSuspicious: boolean;
  riskScore: number;
  riskReasons: string[];
  totalSessions: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  userId: string | null;
}

export class DeviceFingerprintingService {
  // Generate device fingerprint hash
  async generateFingerprintHash(input: DeviceFingerprintInput): Promise<string> {
    const components: string[] = [];

    // Collect identifiable components
    if (input.userAgent) components.push(input.userAgent);
    if (input.acceptLanguage) components.push(input.acceptLanguage);
    if (input.timezone) components.push(input.timezone);
    if (input.screenWidth) components.push(input.screenWidth.toString());
    if (input.screenHeight) components.push(input.screenHeight.toString());
    if (input.colorDepth) components.push(input.colorDepth.toString());
    if (input.pixelRatio) components.push(input.pixelRatio.toString());
    if (input.canvasHash) components.push(input.canvasHash);
    if (input.webglVendor) components.push(input.webglVendor);
    if (input.webglRenderer) components.push(input.webglRenderer);
    if (input.platform) components.push(input.platform);
    if (input.hardwareConcurrency) components.push(input.hardwareConcurrency.toString());
    if (input.deviceMemory) components.push(input.deviceMemory.toString());

    const combined = components.join('|');
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  // Extract device information from user agent
  extractDeviceInfo(userAgent: string): {
    deviceType: string;
    deviceBrand: string;
    deviceModel: string;
    os: string;
    browser: string;
  } {
    const info = {
      deviceType: 'unknown',
      deviceBrand: 'unknown',
      deviceModel: 'unknown',
      os: 'unknown',
      browser: 'unknown'
    };

    // Detect browser
    if (userAgent.includes('Chrome')) {
      info.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      info.browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      info.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      info.browser = 'Edge';
    }

    // Detect OS
    if (userAgent.includes('Windows')) {
      info.os = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      info.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      info.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      info.os = 'Android';
      info.deviceType = 'mobile';
      const match = userAgent.match(/Android[^;]+;[^;]+;([^)]+)\)?/);
      if (match) {
        info.deviceModel = match[1].trim();
      }
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      info.os = 'iOS';
      info.deviceType = userAgent.includes('iPad') ? 'tablet' : 'mobile';
    }

    // Detect device type
    if (userAgent.includes('Mobile')) {
      info.deviceType = 'mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      info.deviceType = 'tablet';
    } else {
      info.deviceType = 'desktop';
    }

    return info;
  }

  // Create or retrieve device fingerprint
  async getOrCreateFingerprint(
    input: DeviceFingerprintInput,
    userId?: string
  ): Promise<FingerprintResult> {
    const fingerprintHash = await this.generateFingerprintHash(input);
    
    // Check if fingerprint exists
    let fingerprint = await (prisma as any).deviceFingerprint?.findUnique({
      where: { fingerprintHash }
    });

    const deviceInfo = input.userAgent 
      ? this.extractDeviceInfo(input.userAgent) 
      : { deviceType: 'unknown', deviceBrand: 'unknown', deviceModel: 'unknown', os: 'unknown', browser: 'unknown' };

    // If no prisma model exists, create mock response
    if (!fingerprint) {
      const mockFingerprint: DeviceFingerprintRecord = {
        id: `fp_${Date.now()}`,
        fingerprintHash,
        userAgent: input.userAgent || null,
        acceptLanguage: input.acceptLanguage || null,
        timezone: input.timezone || null,
        screenWidth: input.screenWidth || null,
        screenHeight: input.screenHeight || null,
        colorDepth: input.colorDepth || null,
        pixelRatio: input.pixelRatio || null,
        canvasHash: input.canvasHash || null,
        webglVendor: input.webglVendor || null,
        webglRenderer: input.webglRenderer || null,
        platform: input.platform || null,
        deviceType: deviceInfo.deviceType,
        deviceBrand: deviceInfo.deviceBrand,
        deviceModel: deviceInfo.deviceModel,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        browserVersion: null,
        isTrusted: false,
        isSuspicious: false,
        riskScore: 0,
        riskReasons: [],
        totalSessions: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        userId: userId || null
      };
      fingerprint = mockFingerprint;
    } else {
      // Update existing fingerprint
      fingerprint = await (prisma as any).deviceFingerprint.update({
        where: { id: fingerprint.id },
        data: {
          lastSeenAt: new Date(),
          userAgent: input.userAgent || fingerprint.userAgent,
          totalSessions: { increment: 1 }
        }
      });
    }

    // Assess risk
    const riskAssessment = await this.assessDeviceRisk(fingerprint);

    return {
      fingerprintId: fingerprint.id,
      fingerprintHash: fingerprint.fingerprintHash,
      riskScore: fingerprint.riskScore,
      isTrusted: fingerprint.isTrusted,
      isSuspicious: fingerprint.isSuspicious,
      riskReasons: fingerprint.riskReasons,
      deviceInfo: {
        type: fingerprint.deviceType || 'unknown',
        brand: fingerprint.deviceBrand || 'unknown',
        model: fingerprint.deviceModel || 'unknown',
        os: fingerprint.os || 'unknown',
        browser: fingerprint.browser || 'unknown'
      },
      recommendations: riskAssessment.recommendations
    };
  }

  // Assess device risk
  async assessDeviceRisk(fingerprint: DeviceFingerprintRecord): Promise<DeviceRiskAssessment> {
    const factors: { factor: string; score: number; description: string }[] = [];
    let totalScore = 0;
    const recommendations: string[] = [];

    // Check if device is new
    const isNew = fingerprint.totalSessions <= 1;
    if (isNew) {
      factors.push({
        factor: 'new_device',
        score: 20,
        description: 'Device has never been seen before'
      });
      totalScore += 20;
      recommendations.push('Verify device through email or SMS confirmation');
    }

    // Check for suspicious features
    if (fingerprint.isSuspicious) {
      factors.push({
        factor: 'suspicious_features',
        score: 50,
        description: 'Device has suspicious characteristics'
      });
      totalScore += 50;
      recommendations.push('Require additional verification');
    }

    // Check device consistency
    if (fingerprint.userAgent && fingerprint.userAgent.length > 200) {
      factors.push({
        factor: 'long_user_agent',
        score: 15,
        description: 'User agent string is unusually long'
      });
      totalScore += 15;
      recommendations.push('Monitor for automation indicators');
    }

    // Check for VPN/Proxy indicators
    if (fingerprint.userAgent) {
      const indicators = [
        /VPN|vpn/i,
        /Proxy|proxy/i,
        /Tor/i
      ];
      
      for (const indicator of indicators) {
        if (indicator.test(fingerprint.userAgent)) {
          factors.push({
            factor: 'privacy_tool_detected',
            score: 25,
            description: 'Privacy tool detected in user agent'
          });
          totalScore += 25;
          break;
        }
      }
    }

    // Normalize score
    const normalizedScore = Math.min(100, totalScore);

    return {
      deviceId: fingerprint.id,
      riskScore: normalizedScore,
      factors,
      isNew,
      isSuspicious: normalizedScore > 50,
      recommendations
    };
  }

  // Mark device as trusted
  async markAsTrusted(fingerprintId: string, userId: string): Promise<boolean> {
    try {
      await (prisma as any).deviceFingerprint.update({
        where: { id: fingerprintId },
        data: {
          isTrusted: true,
          riskScore: 0,
          riskReasons: [],
          userId
        }
      });
      return true;
    } catch (error) {
      console.error('Error marking device as trusted:', error);
      return false;
    }
  }

  // Mark device as suspicious
  async markAsSuspicious(
    fingerprintId: string,
    reasons: string[],
    score: number = 80
  ): Promise<boolean> {
    try {
      await (prisma as any).deviceFingerprint.update({
        where: { id: fingerprintId },
        data: {
          isSuspicious: true,
          riskScore: score,
          riskReasons: reasons
        }
      });
      return true;
    } catch (error) {
      console.error('Error marking device as suspicious:', error);
      return false;
    }
  }

  // Get all devices for a user
  async getUserDevices(userId: string): Promise<DeviceFingerprintRecord[]> {
    try {
      return await (prisma as any).deviceFingerprint.findMany({
        where: { userId },
        orderBy: { lastSeenAt: 'desc' }
      });
    } catch {
      return [];
    }
  }

  // Check if device is blacklisted
  async isDeviceBlacklisted(fingerprintHash: string): Promise<boolean> {
    try {
      const fingerprint = await (prisma as any).deviceFingerprint?.findUnique({
        where: { fingerprintHash }
      });
      return fingerprint?.isSuspicious || false;
    } catch {
      return false;
    }
  }
}

export const deviceFingerprintingService = new DeviceFingerprintingService();

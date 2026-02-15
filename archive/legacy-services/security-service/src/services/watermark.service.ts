// Code Watermarking Service
// Service de filigrane de code

import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { logger, watermarkLogger } from '../utils/logger';
import { PrismaClient, LicenseType, WatermarkData, WatermarkResult, WatermarkVerification } from '@prisma/client';

const prisma = new PrismaClient();

export class WatermarkService {
  private readonly watermarkSecret: string;
  private readonly algorithm: string;

  constructor() {
    this.watermarkSecret = process.env.WATERMARK_SECRET || 'default-watermark-secret';
    this.algorithm = process.env.WATERMARK_ALGORITHM || 'SHA256';
  }

  /**
   * Generate a unique watermark for code
   */
  async generateWatermark(data: WatermarkData): Promise<WatermarkResult> {
    try {
      const watermarkId = uuidv4();
      const timestamp = Date.now();
      
      // Create watermark payload
      const payload = {
        id: watermarkId,
        ...data,
        timestamp,
        nonce: uuidv4() // Prevent replay attacks
      };

      // Generate hash
      const hash = this.generateHash(JSON.stringify(payload));
      
      // Create digital signature
      const signature = this.generateSignature(hash, data.organizationId);

      // Store in database
      await prisma.codeWatermark.create({
        data: {
          watermarkId,
          codeHash: hash,
          version: data.customData?.version as string || '1.0.0',
          buildNumber: data.customData?.buildNumber as string,
          commitHash: data.customData?.commitHash,
          organizationId: data.organizationId,
          organizationName: data.organizationName,
          licenseId: data.licenseId,
          watermarkData: payload as any,
          watermarkSignature: signature,
          injectedAt: new Date(),
          injectedBy: data.ownerId,
          injectionMethod: this.detectInjectionMethod(),
          watermarkData: payload as any,
          expiresAt: data.expiration
        }
      });

      watermarkLogger.info(`Watermark generated: ${watermarkId}`, {
        organizationId: data.organizationId,
        licenseType: data.licenseType
      });

      return {
        success: true,
        watermark: {
          id: watermarkId,
          hash,
          signature,
          injectedAt: new Date()
        }
      };
    } catch (error) {
      watermarkLogger.error('Failed to generate watermark', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Inject watermark into code
   */
  async injectWatermark(watermarkId: string, code: string, location: string): Promise<WatermarkResult> {
    try {
      const watermark = await prisma.codeWatermark.findUnique({
        where: { watermarkId }
      });

      if (!watermark) {
        return { success: false, error: 'Watermark not found' };
      }

      // Create injection marker
      const injectionMarker = this.createInjectionMarker(watermark);
      
      // Inject based on file type
      const injectedCode = this.injectIntoCode(code, injectionMarker, location);

      // Update watermark record
      await prisma.codeWatermark.update({
        where: { watermarkId },
        data: {
          injectionLocation: location,
          distributedTo: [],
          distributionDate: new Date()
        }
      });

      watermarkLogger.info(`Watermark injected: ${watermarkId}`, { location });

      return {
        success: true,
        watermark: {
          id: watermarkId,
          hash: watermark.codeHash,
          signature: watermark.watermarkSignature,
          injectedAt: new Date()
        }
      };
    } catch (error) {
      watermarkLogger.error('Failed to inject watermark', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify watermark in code
   */
  async verifyWatermark(code: string): Promise<WatermarkVerification> {
    try {
      // Extract watermark from code
      const extractedWatermark = this.extractWatermark(code);
      
      if (!extractedWatermark) {
        return { isValid: false, issues: ['No watermark found in code'] };
      }

      // Find watermark in database
      const watermark = await prisma.codeWatermark.findUnique({
        where: { watermarkId: extractedWatermark.id }
      });

      if (!watermark) {
        return { isValid: false, issues: ['Watermark not registered'] };
      }

      // Verify hash
      const currentHash = this.generateHash(JSON.stringify(extractedWatermark));
      if (currentHash !== watermark.codeHash) {
        return { isValid: false, issues: ['Code hash mismatch - code may be modified'] };
      }

      // Check expiration
      if (watermark.expiresAt && new Date() > watermark.expiresAt) {
        return {
          isValid: false,
          watermark: {
            id: watermark.watermarkId,
            ownerId: watermark.organizationId,
            organizationName: watermark.organizationName,
            licenseType: LicenseType.COMMERCIAL // TypeScript enum workaround
          },
          issues: ['Watermark has expired']
        };
      }

      // Check if compromised
      if (watermark.isCompromised) {
        return {
          isValid: false,
          watermark: {
            id: watermark.watermarkId,
            ownerId: watermark.organizationId,
            organizationName: watermark.organizationName,
            licenseType: LicenseType.COMMERCIAL
          },
          issues: ['Watermark has been marked as compromised']
        };
      }

      watermarkLogger.info(`Watermark verified: ${watermark.watermarkId}`);

      return {
        isValid: true,
        watermark: {
          id: watermark.watermarkId,
          ownerId: watermark.organizationId,
          organizationName: watermark.organizationName,
          licenseType: watermark.licenseId ? LicenseType.COMMERCIAL : LicenseType.PROPRIETARY,
          expiration: watermark.expiresAt || undefined
        }
      };
    } catch (error) {
      watermarkLogger.error('Failed to verify watermark', { error });
      return { isValid: false, issues: ['Verification failed'] };
    }
  }

  /**
   * Report a potential code leak
   */
  async reportLeak(
    watermarkId: string,
    detectionSource: string,
    detectionMethod: string,
    leakType: string
  ): Promise<{ success: boolean; leakId?: string; error?: string }> {
    try {
      const watermark = await prisma.codeWatermark.findUnique({
        where: { watermarkId }
      });

      if (!watermark) {
        return { success: false, error: 'Watermark not found' };
      }

      const leakId = uuidv4();

      await prisma.codeLeak.create({
        data: {
          leakId,
          sourceWatermarkId: watermarkId,
          detectionMethod: detectionMethod as any,
          detectionSource,
          confidence: 0.8, // Default confidence
          leakType: leakType as any,
          priority: this.calculateLeakPriority(watermark),
          detectedAt: new Date()
        }
      });

      watermarkLogger.leak(`Leak detected: ${leakId}`, {
        watermarkId,
        source: detectionSource,
        type: leakType
      });

      // Trigger alerts
      await this.triggerLeakAlerts(watermark, leakId);

      return { success: true, leakId };
    } catch (error) {
      watermarkLogger.error('Failed to report leak', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get all watermarks for an organization
   */
  async getOrganizationWatermarks(organizationId: string) {
    return prisma.codeWatermark.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Mark watermark as compromised
   */
  async markAsCompromised(watermarkId: string, reason: string) {
    return prisma.codeWatermark.update({
      where: { watermarkId },
      data: {
        isCompromised: true,
        compromisedAt: new Date(),
        compromisedReason: reason
      }
    });
  }

  // Private helper methods

  private generateHash(data: string): string {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }

  private generateSignature(hash: string, organizationId: string): string {
    const data = `${hash}:${organizationId}:${Date.now()}`;
    return CryptoJS.HmacSHA256(data, this.watermarkSecret).toString(CryptoJS.enc.Hex);
  }

  private detectInjectionMethod(): string {
    // Detect based on file type
    return 'metadata-comment';
  }

  private createInjectionMarker(watermark: any): string {
    const marker = {
      __mnbara_watermark__: {
        id: watermark.watermarkId,
        org: watermark.organizationName,
        ts: watermark.createdAt.getTime(),
        sig: watermark.watermarkSignature.substring(0, 16)
      }
    };
    return `/* ${JSON.stringify(marker)} */`;
  }

  private injectIntoCode(code: string, marker: string, location: string): string {
    // Inject at the beginning of the file
    return `${marker}\n\n${code}`;
  }

  private extractWatermark(code: string): any {
    const match = code.match(/\/\* \{.*?"__mnbara_watermark__".*?\} \*\//);
    if (match) {
      try {
        const parsed = JSON.parse(match[0].replace(/\/\* |\*\//g, ''));
        return parsed.__mnbara_watermark__;
      } catch {
        return null;
      }
    }
    return null;
  }

  private calculateLeakPriority(watermark: any): number {
    // Higher priority for enterprise/proprietary code
    const basePriority = watermark.licenseId ? 4 : 2;
    return Math.min(basePriority + 1, 5);
  }

  private async triggerLeakAlerts(watermark: any, leakId: string): Promise<void> {
    // TODO: Send email/webhook notifications
    logger.info(`Leak alert triggered: ${leakId}`);
  }
}

export const watermarkService = new WatermarkService();

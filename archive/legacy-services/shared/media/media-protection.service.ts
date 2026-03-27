/**
 * Media Protection Service
 * 
 * High-level service that combines watermarking, fingerprinting,
 * and duplicate detection for comprehensive image protection.
 */

import {
  WatermarkService,
  WatermarkConfig,
  FingerprintConfig,
  ImageFingerprint,
  WatermarkResult,
  createWatermarkService,
} from './watermark.service';
import { FingerprintRepository, fingerprintRepository } from './fingerprint.repository';

export interface MediaProtectionConfig {
  watermark: Partial<WatermarkConfig>;
  fingerprint: Partial<FingerprintConfig>;
  duplicateDetection: {
    enabled: boolean;
    threshold: number; // 0-1, similarity threshold
    blockDuplicates: boolean;
  };
}

export interface ProtectedImage {
  id: string;
  originalBuffer: Buffer;
  protectedBuffer: Buffer;
  fingerprint: ImageFingerprint;
  isDuplicate: boolean;
  duplicateOf?: string[];
  processingTime: number;
}

export interface VerificationResult {
  isProtected: boolean;
  fingerprintId?: string;
  fingerprint?: ImageFingerprint;
  confidence: number;
  verifiedAt: Date;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  matchingFingerprints: ImageFingerprint[];
}

const DEFAULT_CONFIG: MediaProtectionConfig = {
  watermark: {
    enabled: true,
    type: 'both',
  },
  fingerprint: {
    enabled: true,
    includeMetadata: true,
    hashAlgorithm: 'sha256',
  },
  duplicateDetection: {
    enabled: true,
    threshold: 0.9,
    blockDuplicates: false,
  },
};

/**
 * MediaProtectionService - Main service for image protection
 */
export class MediaProtectionService {
  private watermarkService: WatermarkService;
  private fingerprintRepository: FingerprintRepository;
  private config: MediaProtectionConfig;

  constructor(
    config: Partial<MediaProtectionConfig> = {},
    repository?: FingerprintRepository
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.watermarkService = createWatermarkService(
      this.config.watermark,
      this.config.fingerprint
    );
    this.fingerprintRepository = repository || fingerprintRepository;
  }

  /**
   * Process and protect an uploaded image
   */
  async protectImage(
    imageBuffer: Buffer,
    metadata: {
      uploaderId: string;
      originalFilename: string;
      mimeType: string;
      listingId?: string;
    }
  ): Promise<ProtectedImage> {
    const startTime = Date.now();

    // Check for duplicates first
    let isDuplicate = false;
    let duplicateOf: string[] = [];

    if (this.config.duplicateDetection.enabled) {
      const duplicateCheck = await this.checkForDuplicates(imageBuffer);
      isDuplicate = duplicateCheck.isDuplicate;
      duplicateOf = duplicateCheck.matchingFingerprints.map(f => f.id);

      if (isDuplicate && this.config.duplicateDetection.blockDuplicates) {
        throw new Error(
          `Duplicate image detected. Matches: ${duplicateOf.join(', ')}`
        );
      }
    }

    // Process image with watermarking and fingerprinting
    const result = await this.watermarkService.processImage(imageBuffer, {
      uploaderId: metadata.uploaderId,
      originalFilename: metadata.originalFilename,
      mimeType: metadata.mimeType,
    });

    if (!result.success) {
      throw new Error(`Failed to process image: ${result.error}`);
    }

    // Save fingerprint to repository
    await this.fingerprintRepository.save(result.fingerprint);

    const processingTime = Date.now() - startTime;

    return {
      id: result.fingerprint.id,
      originalBuffer: result.originalBuffer,
      protectedBuffer: result.watermarkedBuffer || result.originalBuffer,
      fingerprint: result.fingerprint,
      isDuplicate,
      duplicateOf: duplicateOf.length > 0 ? duplicateOf : undefined,
      processingTime,
    };
  }

  /**
   * Verify if an image is protected with MNBARA watermark
   */
  async verifyImage(imageBuffer: Buffer): Promise<VerificationResult> {
    const verification = await this.watermarkService.verifyWatermark(imageBuffer);

    if (!verification.valid) {
      return {
        isProtected: false,
        confidence: verification.confidence,
        verifiedAt: new Date(),
      };
    }

    // Look up fingerprint in repository
    const fingerprint = verification.fingerprintId
      ? await this.fingerprintRepository.findById(verification.fingerprintId)
      : null;

    return {
      isProtected: true,
      fingerprintId: verification.fingerprintId,
      fingerprint: fingerprint || undefined,
      confidence: verification.confidence,
      verifiedAt: new Date(),
    };
  }

  /**
   * Check if an image is a duplicate of existing images
   */
  async checkForDuplicates(imageBuffer: Buffer): Promise<DuplicateCheckResult> {
    const existingHashes = await this.fingerprintRepository.getAllPerceptualHashes();
    
    const result = await this.watermarkService.findDuplicates(
      imageBuffer,
      existingHashes,
      this.config.duplicateDetection.threshold
    );

    // Get full fingerprint data for matches
    const matchingFingerprints: ImageFingerprint[] = [];
    for (const hash of result.matchingHashes) {
      const fingerprints = await this.fingerprintRepository.findByPerceptualHash(hash);
      matchingFingerprints.push(...fingerprints);
    }

    return {
      isDuplicate: result.isDuplicate,
      similarity: result.similarity,
      matchingFingerprints,
    };
  }

  /**
   * Get fingerprint by ID
   */
  async getFingerprint(id: string): Promise<ImageFingerprint | null> {
    return this.fingerprintRepository.findById(id);
  }

  /**
   * Get all fingerprints for a user
   */
  async getUserFingerprints(
    uploaderId: string,
    limit = 100
  ): Promise<ImageFingerprint[]> {
    return this.fingerprintRepository.findByUploader(uploaderId, limit);
  }

  /**
   * Delete a fingerprint
   */
  async deleteFingerprint(id: string): Promise<boolean> {
    return this.fingerprintRepository.delete(id);
  }

  /**
   * Get protection statistics
   */
  async getStats(): Promise<{
    totalProtectedImages: number;
    uniqueImages: number;
    duplicatesDetected: number;
  }> {
    const stats = await this.fingerprintRepository.getStats();
    return {
      totalProtectedImages: stats.totalFingerprints,
      uniqueImages: stats.uniquePerceptualHashes,
      duplicatesDetected: stats.totalFingerprints - stats.uniquePerceptualHashes,
    };
  }

  /**
   * Batch process multiple images
   */
  async protectImages(
    images: Array<{
      buffer: Buffer;
      metadata: {
        uploaderId: string;
        originalFilename: string;
        mimeType: string;
      };
    }>
  ): Promise<ProtectedImage[]> {
    const results: ProtectedImage[] = [];

    for (const image of images) {
      try {
        const result = await this.protectImage(image.buffer, image.metadata);
        results.push(result);
      } catch (error) {
        console.error(
          `Failed to protect image ${image.metadata.originalFilename}:`,
          error
        );
      }
    }

    return results;
  }
}

// Export singleton instance with default config
export const mediaProtectionService = new MediaProtectionService();

// Export factory function for custom configurations
export function createMediaProtectionService(
  config?: Partial<MediaProtectionConfig>,
  repository?: FingerprintRepository
): MediaProtectionService {
  return new MediaProtectionService(config, repository);
}

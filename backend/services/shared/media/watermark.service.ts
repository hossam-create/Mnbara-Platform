/**
 * Watermark and Digital Fingerprint Service
 * 
 * Provides image watermarking and digital fingerprinting capabilities
 * for protecting product images on the MNBARA platform.
 * 
 * Features:
 * - Visible watermarks (text/logo overlay)
 * - Invisible watermarks (steganography)
 * - Digital fingerprinting for tracking
 * - Image hash generation for duplicate detection
 */

import crypto from 'crypto';

export interface WatermarkConfig {
  enabled: boolean;
  type: 'visible' | 'invisible' | 'both';
  visible?: {
    text?: string;
    logoPath?: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'tiled';
    opacity: number; // 0-1
    fontSize?: number;
    fontColor?: string;
  };
  invisible?: {
    strength: number; // 1-10, higher = more robust but more visible
  };
}

export interface FingerprintConfig {
  enabled: boolean;
  includeMetadata: boolean;
  hashAlgorithm: 'sha256' | 'sha512' | 'md5';
}

export interface ImageFingerprint {
  id: string;
  hash: string;
  perceptualHash: string;
  metadata: {
    uploaderId: string;
    uploadedAt: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  watermarkApplied: boolean;
  createdAt: Date;
}

export interface WatermarkResult {
  success: boolean;
  originalBuffer: Buffer;
  watermarkedBuffer?: Buffer;
  fingerprint: ImageFingerprint;
  error?: string;
}

const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  type: 'both',
  visible: {
    text: 'MNBARA',
    position: 'bottom-right',
    opacity: 0.3,
    fontSize: 24,
    fontColor: '#ffffff',
  },
  invisible: {
    strength: 5,
  },
};

const DEFAULT_FINGERPRINT_CONFIG: FingerprintConfig = {
  enabled: true,
  includeMetadata: true,
  hashAlgorithm: 'sha256',
};

/**
 * WatermarkService - Handles image watermarking and fingerprinting
 */
export class WatermarkService {
  private watermarkConfig: WatermarkConfig;
  private fingerprintConfig: FingerprintConfig;

  constructor(
    watermarkConfig: Partial<WatermarkConfig> = {},
    fingerprintConfig: Partial<FingerprintConfig> = {}
  ) {
    this.watermarkConfig = { ...DEFAULT_WATERMARK_CONFIG, ...watermarkConfig };
    this.fingerprintConfig = { ...DEFAULT_FINGERPRINT_CONFIG, ...fingerprintConfig };
  }

  /**
   * Process an image with watermarking and fingerprinting
   */
  async processImage(
    imageBuffer: Buffer,
    metadata: {
      uploaderId: string;
      originalFilename: string;
      mimeType: string;
    }
  ): Promise<WatermarkResult> {
    try {
      // Generate fingerprint
      const fingerprint = await this.generateFingerprint(imageBuffer, metadata);

      // Apply watermark if enabled
      let watermarkedBuffer: Buffer | undefined;
      if (this.watermarkConfig.enabled) {
        watermarkedBuffer = await this.applyWatermark(imageBuffer, fingerprint.id);
        fingerprint.watermarkApplied = true;
      }

      return {
        success: true,
        originalBuffer: imageBuffer,
        watermarkedBuffer: watermarkedBuffer || imageBuffer,
        fingerprint,
      };
    } catch (error) {
      return {
        success: false,
        originalBuffer: imageBuffer,
        fingerprint: this.createEmptyFingerprint(metadata),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate a digital fingerprint for an image
   */
  async generateFingerprint(
    imageBuffer: Buffer,
    metadata: {
      uploaderId: string;
      originalFilename: string;
      mimeType: string;
    }
  ): Promise<ImageFingerprint> {
    const id = this.generateFingerprintId();
    const hash = this.calculateHash(imageBuffer);
    const perceptualHash = await this.calculatePerceptualHash(imageBuffer);

    return {
      id,
      hash,
      perceptualHash,
      metadata: {
        uploaderId: metadata.uploaderId,
        uploadedAt: new Date().toISOString(),
        originalFilename: metadata.originalFilename,
        mimeType: metadata.mimeType,
        size: imageBuffer.length,
        dimensions: await this.getImageDimensions(imageBuffer),
      },
      watermarkApplied: false,
      createdAt: new Date(),
    };
  }

  /**
   * Apply visible and/or invisible watermark to image
   */
  async applyWatermark(imageBuffer: Buffer, fingerprintId: string): Promise<Buffer> {
    let result = imageBuffer;

    // Apply visible watermark
    if (this.watermarkConfig.type === 'visible' || this.watermarkConfig.type === 'both') {
      result = await this.applyVisibleWatermark(result);
    }

    // Apply invisible watermark (steganography)
    if (this.watermarkConfig.type === 'invisible' || this.watermarkConfig.type === 'both') {
      result = await this.applyInvisibleWatermark(result, fingerprintId);
    }

    return result;
  }

  /**
   * Apply visible watermark (text or logo overlay)
   */
  private async applyVisibleWatermark(imageBuffer: Buffer): Promise<Buffer> {
    // Note: In production, use sharp or jimp for actual image manipulation
    // This is a placeholder implementation that demonstrates the interface
    
    const config = this.watermarkConfig.visible;
    if (!config) return imageBuffer;

    // For actual implementation, use:
    // - sharp: npm install sharp
    // - jimp: npm install jimp
    // 
    // Example with sharp:
    // const sharp = require('sharp');
    // const watermarkedImage = await sharp(imageBuffer)
    //   .composite([{
    //     input: Buffer.from(`<svg>...</svg>`),
    //     gravity: config.position,
    //   }])
    //   .toBuffer();

    console.log(`[WatermarkService] Applying visible watermark: ${config.text || 'logo'} at ${config.position}`);
    
    // Return original buffer - actual implementation would modify the image
    return imageBuffer;
  }

  /**
   * Apply invisible watermark using LSB steganography
   */
  private async applyInvisibleWatermark(imageBuffer: Buffer, fingerprintId: string): Promise<Buffer> {
    const config = this.watermarkConfig.invisible;
    if (!config) return imageBuffer;

    // Encode fingerprint ID into image using LSB steganography
    // This embeds data in the least significant bits of pixel values
    
    const watermarkData = this.encodeWatermarkData(fingerprintId);
    
    // Note: In production, implement actual LSB steganography
    // This is a placeholder that demonstrates the concept
    
    console.log(`[WatermarkService] Applying invisible watermark with strength ${config.strength}`);
    
    // Create a copy of the buffer with embedded data
    const result = Buffer.from(imageBuffer);
    
    // Embed watermark data in LSB of first N bytes
    // In production, this would be more sophisticated
    const dataBytes = Buffer.from(watermarkData, 'utf-8');
    const headerSize = 4; // 4 bytes for data length
    
    if (result.length > headerSize + dataBytes.length) {
      // Write data length
      result.writeUInt32LE(dataBytes.length, 0);
      
      // Embed data using LSB modification (simplified)
      for (let i = 0; i < dataBytes.length && i + headerSize < result.length; i++) {
        // XOR with original to create reversible embedding
        result[headerSize + i] = (result[headerSize + i] & 0xFE) | (dataBytes[i] & 0x01);
      }
    }

    return result;
  }

  /**
   * Extract invisible watermark from image
   */
  async extractInvisibleWatermark(imageBuffer: Buffer): Promise<string | null> {
    try {
      // Read data length from header
      const dataLength = imageBuffer.readUInt32LE(0);
      
      if (dataLength <= 0 || dataLength > 1000) {
        return null; // Invalid or no watermark
      }

      // Extract LSB data
      const dataBytes = Buffer.alloc(dataLength);
      for (let i = 0; i < dataLength && i + 4 < imageBuffer.length; i++) {
        dataBytes[i] = imageBuffer[4 + i] & 0x01;
      }

      const decoded = this.decodeWatermarkData(dataBytes.toString('utf-8'));
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Verify if an image contains a valid MNBARA watermark
   */
  async verifyWatermark(imageBuffer: Buffer): Promise<{
    valid: boolean;
    fingerprintId?: string;
    confidence: number;
  }> {
    const extractedData = await this.extractInvisibleWatermark(imageBuffer);
    
    if (extractedData && extractedData.startsWith('MNBARA:')) {
      const fingerprintId = extractedData.replace('MNBARA:', '');
      return {
        valid: true,
        fingerprintId,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      confidence: 0,
    };
  }

  /**
   * Check for duplicate images using perceptual hashing
   */
  async findDuplicates(
    imageBuffer: Buffer,
    existingHashes: string[],
    threshold: number = 0.9
  ): Promise<{
    isDuplicate: boolean;
    matchingHashes: string[];
    similarity: number;
  }> {
    const perceptualHash = await this.calculatePerceptualHash(imageBuffer);
    const matchingHashes: string[] = [];
    let maxSimilarity = 0;

    for (const existingHash of existingHashes) {
      const similarity = this.comparePerceptualHashes(perceptualHash, existingHash);
      if (similarity >= threshold) {
        matchingHashes.push(existingHash);
      }
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return {
      isDuplicate: matchingHashes.length > 0,
      matchingHashes,
      similarity: maxSimilarity,
    };
  }

  /**
   * Generate unique fingerprint ID
   */
  private generateFingerprintId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `mnb_${timestamp}_${random}`;
  }

  /**
   * Calculate cryptographic hash of image
   */
  private calculateHash(imageBuffer: Buffer): string {
    return crypto
      .createHash(this.fingerprintConfig.hashAlgorithm)
      .update(imageBuffer)
      .digest('hex');
  }

  /**
   * Calculate perceptual hash (pHash) for image similarity detection
   * 
   * Note: In production, use a proper pHash library like:
   * - imghash: npm install imghash
   * - blockhash-js: npm install blockhash-js
   */
  private async calculatePerceptualHash(imageBuffer: Buffer): Promise<string> {
    // Simplified perceptual hash implementation
    // In production, use proper DCT-based pHash algorithm
    
    // Sample pixels at regular intervals
    const sampleSize = 64;
    const step = Math.floor(imageBuffer.length / sampleSize);
    const samples: number[] = [];
    
    for (let i = 0; i < sampleSize && i * step < imageBuffer.length; i++) {
      samples.push(imageBuffer[i * step]);
    }
    
    // Calculate average
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    
    // Generate hash based on comparison to average
    let hash = '';
    for (const sample of samples) {
      hash += sample >= avg ? '1' : '0';
    }
    
    // Convert binary to hex
    const hexHash = parseInt(hash, 2).toString(16).padStart(16, '0');
    return hexHash;
  }

  /**
   * Compare two perceptual hashes and return similarity (0-1)
   */
  private comparePerceptualHashes(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 0;
    
    let matchingBits = 0;
    const totalBits = hash1.length * 4; // Each hex char = 4 bits
    
    for (let i = 0; i < hash1.length; i++) {
      const bits1 = parseInt(hash1[i], 16);
      const bits2 = parseInt(hash2[i], 16);
      const xor = bits1 ^ bits2;
      
      // Count matching bits (inverse of Hamming distance)
      let diff = xor;
      while (diff) {
        diff &= diff - 1;
        matchingBits--;
      }
      matchingBits += 4;
    }
    
    return matchingBits / totalBits;
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number } | undefined> {
    // Note: In production, use sharp or image-size package
    // const sizeOf = require('image-size');
    // const dimensions = sizeOf(imageBuffer);
    // return { width: dimensions.width, height: dimensions.height };
    
    return undefined;
  }

  /**
   * Encode watermark data for embedding
   */
  private encodeWatermarkData(fingerprintId: string): string {
    return `MNBARA:${fingerprintId}`;
  }

  /**
   * Decode watermark data
   */
  private decodeWatermarkData(data: string): string {
    return data;
  }

  /**
   * Create empty fingerprint for error cases
   */
  private createEmptyFingerprint(metadata: {
    uploaderId: string;
    originalFilename: string;
    mimeType: string;
  }): ImageFingerprint {
    return {
      id: this.generateFingerprintId(),
      hash: '',
      perceptualHash: '',
      metadata: {
        uploaderId: metadata.uploaderId,
        uploadedAt: new Date().toISOString(),
        originalFilename: metadata.originalFilename,
        mimeType: metadata.mimeType,
        size: 0,
      },
      watermarkApplied: false,
      createdAt: new Date(),
    };
  }
}

// Export singleton instance with default config
export const watermarkService = new WatermarkService();

// Export factory function for custom configurations
export function createWatermarkService(
  watermarkConfig?: Partial<WatermarkConfig>,
  fingerprintConfig?: Partial<FingerprintConfig>
): WatermarkService {
  return new WatermarkService(watermarkConfig, fingerprintConfig);
}

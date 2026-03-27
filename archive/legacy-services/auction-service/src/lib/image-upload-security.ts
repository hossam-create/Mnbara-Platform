/**
 * Image Upload Security Framework
 * 
 * Comprehensive image upload validation with:
 * - Strict file type validation
 * - MIME type verification
 * - File signature validation
 * - Size limits enforcement
 * - Malicious file detection
 * 
 * MANDATORY REQUIREMENTS:
 * - Only JPG, PNG, WebP allowed
 * - Real MIME type verification
 * - File signature validation
 * - 2MB preferred, 5MB maximum
 * - Reject any non-compliant files
 */

import { BusinessLogicError, ErrorCode } from './errors';

// ============================================================
// FILE SIZE LIMITS (MANDATORY)
// ============================================================

export const FILE_SIZE_LIMITS = {
  PREFERRED: 2 * 1024 * 1024, // 2MB
  MAXIMUM: 5 * 1024 * 1024, // 5MB
} as const;

// ============================================================
// ALLOWED FILE TYPES (MANDATORY)
// ============================================================

export enum AllowedImageType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export const ALLOWED_MIME_TYPES = [
  AllowedImageType.JPEG,
  AllowedImageType.PNG,
  AllowedImageType.WEBP,
] as const;

// ============================================================
// FILE SIGNATURES (MAGIC BYTES) - MANDATORY VALIDATION
// ============================================================

export const FILE_SIGNATURES = {
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47],
  WEBP: [0x52, 0x49, 0x46, 0x46], // RIFF header
} as const;

// ============================================================
// IMAGE UPLOAD VALIDATOR
// ============================================================

export class ImageUploadValidator {
  /**
   * Validate image file (MANDATORY COMPREHENSIVE CHECK)
   */
  static validateImageFile(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string }
  ): void {
    // 1. Check file exists
    if (!file || !file.buffer) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        'No file provided'
      );
    }

    // 2. Check file size (MANDATORY)
    this.validateFileSize(file.buffer);

    // 3. Check extension (MANDATORY)
    this.validateExtension(file.originalname);

    // 4. Check MIME type (MANDATORY)
    this.validateMimeType(file.mimetype);

    // 5. Check file signature (MANDATORY)
    this.validateFileSignature(file.buffer);

    // 6. Check for malicious content
    this.checkForMaliciousContent(file.buffer);

    console.log('[IMAGE_UPLOAD] File validation passed:', {
      filename: file.originalname,
      size: file.buffer.length,
      mimetype: file.mimetype,
    });
  }

  /**
   * Validate file size (MANDATORY)
   */
  private static validateFileSize(buffer: Buffer): void {
    const fileSize = buffer.length;

    if (fileSize === 0) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        'File is empty'
      );
    }

    if (fileSize > FILE_SIZE_LIMITS.MAXIMUM) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        `File size exceeds maximum limit of ${FILE_SIZE_LIMITS.MAXIMUM / 1024 / 1024}MB`
      );
    }

    if (fileSize > FILE_SIZE_LIMITS.PREFERRED) {
      console.warn('[IMAGE_UPLOAD] File size exceeds preferred limit:', {
        size: fileSize,
        preferred: FILE_SIZE_LIMITS.PREFERRED,
      });
    }
  }

  /**
   * Validate file extension (MANDATORY)
   */
  private static validateExtension(filename: string): void {
    if (!filename) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        'Filename is required'
      );
    }

    const extension = filename.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension as any)) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
    }
  }

  /**
   * Validate MIME type (MANDATORY)
   */
  private static validateMimeType(mimetype: string): void {
    if (!mimetype) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        'MIME type is required'
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimetype as any)) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        `MIME type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }
  }

  /**
   * Validate file signature (MAGIC BYTES) - MANDATORY
   */
  private static validateFileSignature(buffer: Buffer): void {
    if (buffer.length < 4) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        'File is too small to be a valid image'
      );
    }

    const signature = Array.from(buffer.slice(0, 4));

    // Check JPEG signature
    if (
      signature[0] === FILE_SIGNATURES.JPEG[0] &&
      signature[1] === FILE_SIGNATURES.JPEG[1] &&
      signature[2] === FILE_SIGNATURES.JPEG[2]
    ) {
      return; // Valid JPEG
    }

    // Check PNG signature
    if (
      signature[0] === FILE_SIGNATURES.PNG[0] &&
      signature[1] === FILE_SIGNATURES.PNG[1] &&
      signature[2] === FILE_SIGNATURES.PNG[2] &&
      signature[3] === FILE_SIGNATURES.PNG[3]
    ) {
      return; // Valid PNG
    }

    // Check WebP signature (RIFF header)
    if (
      signature[0] === FILE_SIGNATURES.WEBP[0] &&
      signature[1] === FILE_SIGNATURES.WEBP[1] &&
      signature[2] === FILE_SIGNATURES.WEBP[2] &&
      signature[3] === FILE_SIGNATURES.WEBP[3]
    ) {
      // Additional check for WebP format
      if (buffer.length >= 12) {
        const webpMarker = buffer.slice(8, 12).toString('ascii');
        if (webpMarker === 'WEBP') {
          return; // Valid WebP
        }
      }
    }

    console.error('[SECURITY] Invalid file signature detected:', {
      signature: signature.map(b => '0x' + b.toString(16).toUpperCase()),
    });

    throw new BusinessLogicError(
      ErrorCode.INVALID_INPUT,
      'File signature does not match allowed image types'
    );
  }

  /**
   * Check for malicious content (MANDATORY)
   */
  private static checkForMaliciousContent(buffer: Buffer): void {
    // Check for embedded scripts or suspicious patterns
    const bufferString = buffer.toString('utf8', 0, Math.min(1000, buffer.length));

    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onclick=/i,
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i,
      /onload=/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(bufferString)) {
        console.error('[SECURITY] Malicious content detected in file');
        throw new BusinessLogicError(
          ErrorCode.INVALID_INPUT,
          'File contains malicious content'
        );
      }
    }
  }

  /**
   * Generate safe filename
   */
  static generateSafeFilename(originalFilename: string): string {
    // Extract extension
    const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const safeFilename = `${timestamp}-${random}.${extension}`;

    return safeFilename;
  }

  /**
   * Get image dimensions (for additional validation)
   */
  static async getImageDimensions(
    buffer: Buffer
  ): Promise<{ width: number; height: number } | null> {
    try {
      // This is a simplified version - in production, use a library like 'sharp'
      // For now, we'll just validate the file is readable

      if (buffer.length === 0) {
        return null;
      }

      // Basic validation that buffer is readable
      return { width: 0, height: 0 }; // Placeholder
    } catch (error) {
      console.error('[IMAGE_UPLOAD] Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Validate image file from request (MANDATORY)
   */
  static validateUploadRequest(
    file: Express.Multer.File | undefined
  ): Express.Multer.File {
    if (!file) {
      throw new BusinessLogicError(
        ErrorCode.INVALID_INPUT,
        'No file uploaded'
      );
    }

    this.validateImageFile(file);
    return file;
  }
}

// ============================================================
// MULTER CONFIGURATION
// ============================================================

export const multerConfig = {
  limits: {
    fileSize: FILE_SIZE_LIMITS.MAXIMUM,
  },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile?: boolean) => void
  ) => {
    try {
      // Check extension
      const extension = file.originalname.split('.').pop()?.toLowerCase();
      if (!extension || !ALLOWED_EXTENSIONS.includes(extension as any)) {
        return cb(
          new Error(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`)
        );
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
        return cb(
          new Error(`MIME type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)
        );
      }

      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  },
};

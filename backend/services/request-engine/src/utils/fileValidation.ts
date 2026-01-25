/**
 * File Validation Utilities
 * 
 * Provides utilities for validating, sanitizing, and processing uploaded files.
 */

import crypto from 'crypto';
import path from 'path';
import { Express } from 'express';
import { 
  InvalidFileTypeError, 
  FileTooLargeError, 
  TooManyFilesError 
} from '../errors/DisputeErrors';
import { EvidenceType } from '../types/dispute.types';

/**
 * File upload constants
 */
export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_UPLOAD: 5,
  MAX_TOTAL_FILES: 10,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf']
};

/**
 * Validate a single file
 */
export function validateFile(file: Express.Multer.File): void {
  // Check file type
  if (!FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new InvalidFileTypeError(
      file.mimetype,
      FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES
    );
  }

  // Check file size
  if (file.size > FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
    throw new FileTooLargeError(
      file.size,
      FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE
    );
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!FILE_UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS.includes(ext)) {
    throw new InvalidFileTypeError(
      ext,
      FILE_UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS
    );
  }
}

/**
 * Validate multiple files
 */
export function validateFiles(files: Express.Multer.File[]): void {
  // Check file count
  if (files.length > FILE_UPLOAD_CONSTANTS.MAX_FILES_PER_UPLOAD) {
    throw new TooManyFilesError(
      files.length,
      FILE_UPLOAD_CONSTANTS.MAX_FILES_PER_UPLOAD
    );
  }

  // Validate each file
  files.forEach(file => validateFile(file));
}

/**
 * Validate total evidence count
 */
export function validateTotalEvidenceCount(
  currentCount: number,
  newCount: number
): void {
  const totalCount = currentCount + newCount;
  if (totalCount > FILE_UPLOAD_CONSTANTS.MAX_TOTAL_FILES) {
    throw new TooManyFilesError(
      totalCount,
      FILE_UPLOAD_CONSTANTS.MAX_TOTAL_FILES
    );
  }
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    // Remove any path separators
    .replace(/[/\\]/g, '')
    // Replace special characters with underscores
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    // Remove consecutive dots (path traversal attempt)
    .replace(/\.{2,}/g, '.')
    // Limit length
    .substring(0, 255);
}

/**
 * Generate unique filename with timestamp and random hash
 */
export function generateUniqueFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  
  return `${nameWithoutExt}-${timestamp}-${randomHash}${ext}`;
}

/**
 * Get evidence type from mimetype
 */
export function getFileType(mimetype: string): EvidenceType {
  if (mimetype.startsWith('image/')) {
    return EvidenceType.IMAGE;
  }
  if (mimetype === 'application/pdf') {
    return EvidenceType.DOCUMENT;
  }
  throw new Error(`Unsupported mimetype: ${mimetype}`);
}

/**
 * Get file extension from mimetype
 */
export function getExtensionFromMimetype(mimetype: string): string {
  const mimetypeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf'
  };

  return mimetypeMap[mimetype] || '';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImage(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPDF(mimetype: string): boolean {
  return mimetype === 'application/pdf';
}

/**
 * Validate file buffer (basic check for corrupted files)
 */
export function validateFileBuffer(buffer: Buffer, mimetype: string): boolean {
  if (!buffer || buffer.length === 0) {
    return false;
  }

  // Check file signatures (magic numbers)
  const signatures: Record<string, Buffer[]> = {
    'image/jpeg': [
      Buffer.from([0xFF, 0xD8, 0xFF])
    ],
    'image/png': [
      Buffer.from([0x89, 0x50, 0x4E, 0x47])
    ],
    'application/pdf': [
      Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF
    ]
  };

  const expectedSignatures = signatures[mimetype];
  if (!expectedSignatures) {
    return true; // Unknown type, skip validation
  }

  return expectedSignatures.some(signature => 
    buffer.slice(0, signature.length).equals(signature)
  );
}

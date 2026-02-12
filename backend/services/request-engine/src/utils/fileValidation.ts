// ============================================
// File Validation Utilities
// ============================================

import {
  InvalidFileTypeError,
  FileTooLargeError,
  TooManyFilesError
} from '../errors/DisputeErrors';
import { EvidenceType, MulterFile } from '../types/dispute.types';

// Configuration
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 5;

export interface FileValidationResult {
  valid: boolean;
  fileType?: EvidenceType;
  errors?: string[];
}

/**
 * Validate a single file
 */
export function validateFile(file: MulterFile): FileValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Determine file type
  let evidenceType: EvidenceType | undefined;
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    evidenceType = EvidenceType.IMAGE;
  } else if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    evidenceType = EvidenceType.DOCUMENT;
  } else {
    errors.push(`Invalid file type: ${file.mimetype}`);
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    fileType: evidenceType,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: MulterFile[]): {
  valid: boolean;
  results: FileValidationResult[];
  error?: Error;
} {
  // Check file count
  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new TooManyFilesError(files.length, MAX_FILES_PER_UPLOAD);
  }

  const results = files.map(file => validateFile(file));
  const allValid = results.every(r => r.valid);

  return {
    valid: allValid,
    results
  };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove potentially dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(
  originalName: string,
  disputeId: string,
  party: string
): string {
  const sanitized = sanitizeFilename(originalName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = sanitized.split('.').pop() || '';
  
  const baseName = `${disputeId}_${party}_${timestamp}_${randomSuffix}`;
  
  return extension ? `${baseName}.${extension}` : baseName;
}

/**
 * Get evidence type from mimetype
 */
export function getEvidenceType(mimetype: string): EvidenceType {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return EvidenceType.IMAGE;
  }
  if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) {
    return EvidenceType.DOCUMENT;
  }
  throw new InvalidFileTypeError(mimetype, [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES
  ]);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Check if file is an image
 */
export function isImageFile(mimetype: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimetype);
}

/**
 * Check if file is a document
 */
export function isDocumentFile(mimetype: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(mimetype);
}

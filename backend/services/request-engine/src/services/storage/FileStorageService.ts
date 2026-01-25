/**
 * File Storage Service Interface
 * 
 * This interface defines the contract for file storage implementations.
 * Supports both cloud storage (S3) and local storage.
 */

import { Express } from 'express';

/**
 * File upload result
 */
export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * File storage configuration
 */
export interface FileStorageConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPath?: string; // For local storage
  bucket?: string; // For S3
  region?: string; // For S3
}

/**
 * File storage service interface
 */
export interface IFileStorageService {
  /**
   * Upload a single file
   */
  uploadFile(
    file: Express.Multer.File,
    filename: string
  ): Promise<FileUploadResult>;

  /**
   * Upload multiple files
   */
  uploadFiles(
    files: Express.Multer.File[],
    filenames: string[]
  ): Promise<FileUploadResult[]>;

  /**
   * Delete a file
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * Get file URL
   */
  getFileUrl(filename: string): string;

  /**
   * Check if file exists
   */
  fileExists(filename: string): Promise<boolean>;
}


/**
 * Local Storage Service Implementation
 * 
 * Implements file storage using local filesystem.
 * Used for development and testing environments.
 */

import fs from 'fs/promises';
import path from 'path';
import { Express } from 'express';
import { IFileStorageService, FileUploadResult, FileStorageConfig } from './FileStorageService';
import { logger } from '../../utils/logger';

export class LocalStorageService implements IFileStorageService {
  private uploadPath: string;
  private config: FileStorageConfig;

  constructor(config: FileStorageConfig) {
    this.config = config;
    this.uploadPath = config.uploadPath || path.join(process.cwd(), 'uploads', 'disputes');

    // Create upload directory if it doesn't exist
    this.ensureUploadDirectory();

    logger.info('LocalStorageService initialized', { uploadPath: this.uploadPath });
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directory', { uploadPath: this.uploadPath, error });
      throw new Error(`Failed to create upload directory: ${error.message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    filename: string
  ): Promise<FileUploadResult> {
    try {
      const filepath = path.join(this.uploadPath, filename);

      await fs.writeFile(filepath, file.buffer);

      logger.info('File uploaded to local storage', {
        filename,
        size: file.size,
        path: filepath
      });

      return {
        url: `/uploads/disputes/${filename}`,
        filename,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      logger.error('Local upload failed', { filename, error });
      throw new Error(`Failed to upload file to local storage: ${error.message}`);
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    filenames: string[]
  ): Promise<FileUploadResult[]> {
    if (files.length !== filenames.length) {
      throw new Error('Files and filenames arrays must have the same length');
    }

    const uploadPromises = files.map((file, index) =>
      this.uploadFile(file, filenames[index])
    );

    return Promise.all(uploadPromises);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const filename = path.basename(fileUrl);
      const filepath = path.join(this.uploadPath, filename);

      await fs.unlink(filepath);

      logger.info('File deleted from local storage', { fileUrl, filepath });
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('File not found for deletion', { fileUrl });
        return;
      }
      logger.error('Local delete failed', { fileUrl, error });
      throw new Error(`Failed to delete file from local storage: ${error.message}`);
    }
  }

  getFileUrl(filename: string): string {
    return `/uploads/disputes/${filename}`;
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.uploadPath, filename);
      await fs.access(filepath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get absolute file path
   */
  getFilePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }

  /**
   * Get file stats
   */
  async getFileStats(filename: string): Promise<fs.Stats> {
    const filepath = path.join(this.uploadPath, filename);
    return fs.stat(filepath);
  }
}

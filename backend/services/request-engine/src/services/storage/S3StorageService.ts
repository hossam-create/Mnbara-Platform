/**
 * S3 Storage Service Implementation
 * 
 * Implements file storage using AWS S3.
 * Used for production environments.
 */

import AWS from 'aws-sdk';
import { Express } from 'express';
import { IFileStorageService, FileUploadResult, FileStorageConfig } from './FileStorageService';
import { logger } from '../../utils/logger';

export class S3StorageService implements IFileStorageService {
  private s3: AWS.S3;
  private bucket: string;
  private config: FileStorageConfig;

  constructor(config: FileStorageConfig) {
    this.config = config;
    this.bucket = config.bucket || process.env.S3_BUCKET_NAME || '';

    if (!this.bucket) {
      throw new Error('S3 bucket name is required');
    }

    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: config.region || process.env.AWS_REGION || 'us-east-1'
    });

    logger.info('S3StorageService initialized', { bucket: this.bucket });
  }

  async uploadFile(
    file: Express.Multer.File,
    filename: string
  ): Promise<FileUploadResult> {
    try {
      const key = `disputes/${filename}`;
      
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private',
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      };

      const result = await this.s3.upload(params).promise();

      logger.info('File uploaded to S3', {
        filename,
        size: file.size,
        location: result.Location
      });

      return {
        url: result.Location,
        filename,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      logger.error('S3 upload failed', { filename, error });
      throw new Error(`Failed to upload file to S3: ${error.message}`);
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
      // Extract key from URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.deleteObject(params).promise();

      logger.info('File deleted from S3', { fileUrl, key });
    } catch (error) {
      logger.error('S3 delete failed', { fileUrl, error });
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  getFileUrl(filename: string): string {
    const key = `disputes/${filename}`;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const key = `disputes/${filename}`;
      
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    const key = `disputes/${filename}`;
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }
}

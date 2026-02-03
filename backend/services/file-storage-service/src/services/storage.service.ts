import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, storageConfig } from '../config/storage.config';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { FileType, StorageProvider, UploadedFile, UploadOptions, PresignedUrlOptions } from '../types/file.types';
import { logger } from '../utils/logger';

export class StorageService {
  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileType.DOCUMENT;
    return FileType.OTHER;
  }

  async uploadToS3(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<UploadedFile> {
    try {
      const fileId = uuidv4();
      const ext = path.extname(file.originalname);
      const folder = options.folder || 'uploads';
      const key = `${folder}/${fileId}${ext}`;

      let buffer = file.buffer;
      let thumbnailKey: string | undefined;

      // Process image if needed
      if (this.getFileType(file.mimetype) === FileType.IMAGE) {
        if (options.resize) {
          buffer = await sharp(buffer)
            .resize(options.resize.width, options.resize.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .toBuffer();
        }

        // Generate thumbnail
        if (options.generateThumbnail) {
          thumbnailKey = `${folder}/thumbnails/${fileId}${ext}`;
          const thumbnail = await sharp(file.buffer)
            .resize(storageConfig.image.thumbnailSize, storageConfig.image.thumbnailSize, {
              fit: 'cover'
            })
            .toBuffer();

          await s3Client.send(new PutObjectCommand({
            Bucket: storageConfig.s3.bucket,
            Key: thumbnailKey,
            Body: thumbnail,
            ContentType: file.mimetype
          }));
        }
      }

      // Upload main file
      await s3Client.send(new PutObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
        Metadata: options.metadata
      }));

      const url = `https://${storageConfig.s3.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${key}`;
      const thumbnailUrl = thumbnailKey 
        ? `https://${storageConfig.s3.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${thumbnailKey}`
        : undefined;

      logger.info(`File uploaded to S3: ${key}`);

      return {
        id: fileId,
        filename: `${fileId}${ext}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: this.getFileType(file.mimetype),
        url,
        thumbnailUrl,
        provider: StorageProvider.S3,
        bucket: storageConfig.s3.bucket,
        key,
        metadata: options.metadata,
        uploadedAt: new Date()
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  async uploadToLocal(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<UploadedFile> {
    try {
      const fileId = uuidv4();
      const ext = path.extname(file.originalname);
      const folder = options.folder || 'uploads';
      const uploadPath = path.join(storageConfig.local.path, folder);
      
      await fs.mkdir(uploadPath, { recursive: true });

      const filename = `${fileId}${ext}`;
      const filepath = path.join(uploadPath, filename);

      let buffer = file.buffer;
      let thumbnailPath: string | undefined;

      // Process image
      if (this.getFileType(file.mimetype) === FileType.IMAGE) {
        if (options.resize) {
          buffer = await sharp(buffer)
            .resize(options.resize.width, options.resize.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .toBuffer();
        }

        if (options.generateThumbnail) {
          const thumbDir = path.join(uploadPath, 'thumbnails');
          await fs.mkdir(thumbDir, { recursive: true });
          thumbnailPath = path.join(thumbDir, filename);
          
          const thumbnail = await sharp(file.buffer)
            .resize(storageConfig.image.thumbnailSize, storageConfig.image.thumbnailSize, {
              fit: 'cover'
            })
            .toBuffer();

          await fs.writeFile(thumbnailPath, thumbnail);
        }
      }

      await fs.writeFile(filepath, buffer);

      logger.info(`File uploaded locally: ${filepath}`);

      return {
        id: fileId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: this.getFileType(file.mimetype),
        url: `/files/${folder}/${filename}`,
        thumbnailUrl: thumbnailPath ? `/files/${folder}/thumbnails/${filename}` : undefined,
        provider: StorageProvider.LOCAL,
        key: filepath,
        metadata: options.metadata,
        uploadedAt: new Date()
      };
    } catch (error) {
      logger.error('Local upload error:', error);
      throw new Error('Failed to upload file locally');
    }
  }

  async deleteFromS3(key: string): Promise<void> {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: key
      }));
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  async deleteFromLocal(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
      logger.info(`File deleted locally: ${filepath}`);
    } catch (error) {
      logger.error('Local delete error:', error);
      throw new Error('Failed to delete file locally');
    }
  }

  async getPresignedUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: key
      });

      const url = await getSignedUrl(s3Client, command, {
        expiresIn: options.expiresIn || 3600 // 1 hour default
      });

      return url;
    } catch (error) {
      logger.error('Presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    options: PresignedUrlOptions = {}
  ): Promise<{ url: string; key: string }> {
    try {
      const fileId = uuidv4();
      const ext = path.extname(filename);
      const key = `uploads/${fileId}${ext}`;

      const command = new PutObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: key,
        ContentType: contentType
      });

      const url = await getSignedUrl(s3Client, command, {
        expiresIn: options.expiresIn || 3600
      });

      return { url, key };
    } catch (error) {
      logger.error('Presigned upload URL error:', error);
      throw new Error('Failed to generate presigned upload URL');
    }
  }
}

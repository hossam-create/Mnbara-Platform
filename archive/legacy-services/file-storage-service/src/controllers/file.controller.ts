import { Request, Response } from 'express';
import { StorageService } from '../services/storage.service';
import { UploadOptions } from '../types/file.types';
import { logger } from '../utils/logger';

const storageService = new StorageService();

export class FileController {
  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const options: UploadOptions = {
        folder: req.body.folder || 'uploads',
        generateThumbnail: req.body.generateThumbnail === 'true',
        resize: req.body.resize ? JSON.parse(req.body.resize) : undefined,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined
      };

      const provider = process.env.STORAGE_PROVIDER || 'S3';
      const uploadedFile = provider === 'S3'
        ? await storageService.uploadToS3(req.file, options)
        : await storageService.uploadToLocal(req.file, options);

      res.json(uploadedFile);
    } catch (error) {
      logger.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  async uploadMultiple(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const options: UploadOptions = {
        folder: req.body.folder || 'uploads',
        generateThumbnail: req.body.generateThumbnail === 'true',
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined
      };

      const provider = process.env.STORAGE_PROVIDER || 'S3';
      const uploadPromises = req.files.map(file =>
        provider === 'S3'
          ? storageService.uploadToS3(file, options)
          : storageService.uploadToLocal(file, options)
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      res.json(uploadedFiles);
    } catch (error) {
      logger.error('Multiple upload error:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const { key, provider } = req.body;

      if (!key) {
        return res.status(400).json({ error: 'File key required' });
      }

      if (provider === 'S3') {
        await storageService.deleteFromS3(key);
      } else {
        await storageService.deleteFromLocal(key);
      }

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      logger.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }

  async getPresignedUrl(req: Request, res: Response) {
    try {
      const { key, expiresIn } = req.query;

      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'File key required' });
      }

      const url = await storageService.getPresignedUrl(key, {
        expiresIn: expiresIn ? parseInt(expiresIn as string) : undefined
      });

      res.json({ url });
    } catch (error) {
      logger.error('Presigned URL error:', error);
      res.status(500).json({ error: 'Failed to generate presigned URL' });
    }
  }

  async getPresignedUploadUrl(req: Request, res: Response) {
    try {
      const { filename, contentType, expiresIn } = req.body;

      if (!filename || !contentType) {
        return res.status(400).json({ error: 'Filename and content type required' });
      }

      const result = await storageService.getPresignedUploadUrl(filename, contentType, {
        expiresIn: expiresIn ? parseInt(expiresIn) : undefined
      });

      res.json(result);
    } catch (error) {
      logger.error('Presigned upload URL error:', error);
      res.status(500).json({ error: 'Failed to generate presigned upload URL' });
    }
  }
}

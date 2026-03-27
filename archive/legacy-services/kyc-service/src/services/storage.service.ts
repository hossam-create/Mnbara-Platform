/**
 * Storage Service
 * Handles file storage (local or S3)
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  }

  /**
   * Save uploaded file
   * Optimizes image and stores locally
   */
  async saveFile(file: Express.Multer.File, subfolder: string): Promise<string> {
    // Create directory if not exists
    const dir = path.join(this.uploadDir, subfolder);
    await fs.mkdir(dir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const filepath = path.join(dir, filename);

    // Optimize image with sharp
    await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    // Return relative path
    return path.join(subfolder, filename);
  }

  /**
   * Get file path
   */
  getFilePath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }

  /**
   * Delete file
   */
  async deleteFile(relativePath: string): Promise<void> {
    const filepath = this.getFilePath(relativePath);
    await fs.unlink(filepath);
  }
}

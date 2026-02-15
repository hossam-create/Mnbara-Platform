/**
 * File Storage Service Interface
 * Supports both cloud storage (S3) and local storage
 */

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface IFileStorageService {
  uploadFile(file: Express.Multer.File, path: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  getFileUrl(filename: string): string;
  fileExists(filename: string): Promise<boolean>;
}

/**
 * Mock File Storage Service for development
 * In production, replace with S3StorageService or similar
 */
export class FileStorageService implements IFileStorageService {
  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    // Mock implementation - returns a fake URL
    // In production, upload to S3 or local storage
    return `https://storage.mnbara.com/${path}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Mock implementation
    // In production, delete from S3 or local storage
    console.log(`Deleting file: ${fileUrl}`);
  }

  getFileUrl(filename: string): string {
    return `https://storage.mnbara.com/${filename}`;
  }

  async fileExists(filename: string): Promise<boolean> {
    // Mock implementation
    return true;
  }
}

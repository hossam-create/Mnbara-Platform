// ============================================
// Local Storage Service Implementation
// ============================================

import * as fs from 'fs';
import * as path from 'path';
import { FileStorageService } from './FileStorageService';

export class LocalStorageService implements FileStorageService {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string = '/tmp/uploads', baseUrl: string = '/uploads') {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    mimetype: string,
    subPath?: string
  ): Promise<string> {
    const targetPath = subPath ? path.join(this.basePath, subPath) : this.basePath;
    
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    const targetFilename = path.join(targetPath, filename);
    await fs.promises.writeFile(targetFilename, file);

    const relativePath = subPath 
      ? path.join(subPath, filename)
      : filename;

    return `${this.baseUrl}/${relativePath}`;
  }

  async delete(url: string): Promise<void> {
    const filename = url.replace(this.baseUrl, '').replace(/^\//, '');
    const filePath = path.join(this.basePath, filename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async getUrl(path: string): Promise<string> {
    return `${this.baseUrl}/${path}`;
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = filePath.startsWith('/') 
      ? filePath 
      : path.join(this.basePath, filePath);
    return fs.existsSync(fullPath);
  }
}

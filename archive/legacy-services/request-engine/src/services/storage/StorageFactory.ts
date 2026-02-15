/**
 * Storage Factory
 * 
 * Factory for creating the appropriate storage service based on environment.
 */

import { IFileStorageService, FileStorageConfig } from './FileStorageService';
import { S3StorageService } from './S3StorageService';
import { LocalStorageService } from './LocalStorageService';
import { FILE_UPLOAD_CONSTANTS } from '../../utils/fileValidation';
import { logger } from '../../utils/logger';

export type StorageType = 's3' | 'local';

/**
 * Create storage service based on environment
 */
export function createStorageService(
  type?: StorageType,
  config?: Partial<FileStorageConfig>
): IFileStorageService {
  // Determine storage type
  const storageType = type || 
    (process.env.STORAGE_TYPE as StorageType) || 
    (process.env.NODE_ENV === 'production' ? 's3' : 'local');

  // Build configuration
  const fullConfig: FileStorageConfig = {
    maxFileSize: config?.maxFileSize || FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE,
    allowedMimeTypes: config?.allowedMimeTypes || FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES,
    uploadPath: config?.uploadPath || process.env.UPLOAD_PATH,
    bucket: config?.bucket || process.env.S3_BUCKET_NAME,
    region: config?.region || process.env.AWS_REGION
  };

  logger.info('Creating storage service', { type: storageType });

  // Create appropriate service
  switch (storageType) {
    case 's3':
      return new S3StorageService(fullConfig);
    
    case 'local':
      return new LocalStorageService(fullConfig);
    
    default:
      throw new Error(`Unknown storage type: ${storageType}`);
  }
}

/**
 * Singleton instance
 */
let storageServiceInstance: IFileStorageService | null = null;

/**
 * Get singleton storage service instance
 */
export function getStorageService(): IFileStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = createStorageService();
  }
  return storageServiceInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetStorageService(): void {
  storageServiceInstance = null;
}

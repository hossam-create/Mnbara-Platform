export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER'
}

export enum StorageProvider {
  S3 = 'S3',
  LOCAL = 'LOCAL'
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: FileType;
  url: string;
  thumbnailUrl?: string;
  provider: StorageProvider;
  bucket?: string;
  key?: string;
  metadata?: Record<string, any>;
  uploadedAt: Date;
}

export interface UploadOptions {
  folder?: string;
  generateThumbnail?: boolean;
  resize?: {
    width?: number;
    height?: number;
  };
  metadata?: Record<string, any>;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
}

import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export const storageConfig = {
  s3: {
    bucket: process.env.S3_BUCKET_NAME || 'mnbara-uploads',
    region: process.env.AWS_REGION || 'us-east-1'
  },
  local: {
    path: process.env.LOCAL_STORAGE_PATH || './uploads'
  },
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedTypes: (process.env.ALLOWED_FILE_TYPES || '').split(','),
  image: {
    maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH || '2048'),
    maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT || '2048'),
    thumbnailSize: parseInt(process.env.THUMBNAIL_SIZE || '300')
  }
};

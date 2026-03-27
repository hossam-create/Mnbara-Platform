// ============================================
// Upload Middleware
// Placeholder for multer configuration
// ============================================

/**
 * NOTE: This is a placeholder middleware.
 * 
 * To enable:
 * 1 file uploads. Install multer: npm install multer
 * 2. Install types: npm install --save-dev @types/multer
 * 3. Replace this file with the actual multer configuration
 */

// Placeholder upload middleware - replace with actual multer when installed
export const uploadMiddleware = {
  array: (fieldName: string, maxCount?: number) => {
    return (req: any, res: any, next: any) => {
      // Placeholder - files will be available from actual multer middleware
      next();
    };
  },
  single: (fieldName: string) => {
    return (req: any, res: any, next: any) => {
      // Placeholder - file will be available from actual multer middleware
      next();
    };
  }
};

// Configuration constants (used when multer is installed)
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

// Error handler placeholder
export function handleUploadError(err: any, req: any, res: any, next: any) {
  console.error('Upload error:', err);
  res.status(400).json({
    success: false,
    error: {
      code: 'UPLOAD_ERROR',
      message: err.message || 'File upload failed'
    }
  });
}

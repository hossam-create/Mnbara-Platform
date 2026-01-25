/**
 * Multer Upload Middleware Configuration
 * 
 * Configures multer for handling file uploads in dispute evidence.
 */

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { FILE_UPLOAD_CONSTANTS } from '../utils/fileValidation';
import { InvalidFileTypeError, FileTooLargeError } from '../errors/DisputeErrors';
import { logger } from '../utils/logger';

/**
 * Multer configuration for dispute evidence uploads
 */
const multerConfig: multer.Options = {
  // Use memory storage to process files before uploading to S3/local
  storage: multer.memoryStorage(),

  // File size limits
  limits: {
    fileSize: FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE,
    files: FILE_UPLOAD_CONSTANTS.MAX_FILES_PER_UPLOAD,
    fields: 10, // Max number of non-file fields
    fieldSize: 1024 * 1024 // 1MB max field size
  },

  // File filter
  fileFilter: (req, file, cb) => {
    // Check mimetype
    if (FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new InvalidFileTypeError(
        file.mimetype,
        FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES
      ) as any);
    }
  }
};

/**
 * Multer instance for dispute evidence
 */
export const upload = multer(multerConfig);

/**
 * Middleware for handling single file upload
 */
export const uploadSingle = (fieldName: string = 'evidence') => {
  return upload.single(fieldName);
};

/**
 * Middleware for handling multiple file uploads
 */
export const uploadMultiple = (
  fieldName: string = 'evidence',
  maxCount: number = FILE_UPLOAD_CONSTANTS.MAX_FILES_PER_UPLOAD
) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Error handling middleware for multer errors
 */
export const handleUploadError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error', { error: err.message, code: err.code });

    // Handle specific multer errors
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds maximum allowed size of ${FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE} bytes`
          }
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: `Too many files. Maximum ${FILE_UPLOAD_CONSTANTS.MAX_FILES_PER_UPLOAD} files allowed per upload`
          }
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNEXPECTED_FILE',
            message: 'Unexpected file field'
          }
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message
          }
        });
    }
  }

  // Handle custom errors (InvalidFileTypeError, etc.)
  if (err.name === 'DisputeError') {
    logger.error('File validation error', { error: err.message, code: err.code });
    return res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Pass other errors to next middleware
  next(err);
};

/**
 * Middleware to validate uploaded files
 */
export const validateUploadedFiles = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if files were uploaded
    if (!req.files && !req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_UPLOADED',
          message: 'No files were uploaded'
        }
      });
    }

    // Get files array
    const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : []);

    // Log upload info
    logger.info('Files uploaded', {
      count: files.length,
      sizes: files.map(f => f.size),
      types: files.map(f => f.mimetype)
    });

    next();
  } catch (error) {
    logger.error('File validation error', { error });
    next(error);
  }
};

/**
 * Middleware to check if request has files
 */
export const requireFiles = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.files && !req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILES_REQUIRED',
        message: 'At least one file is required'
      }
    });
  }
  next();
};

/**
 * Get uploaded files from request
 */
export function getUploadedFiles(req: Request): Express.Multer.File[] {
  if (req.files && Array.isArray(req.files)) {
    return req.files;
  }
  if (req.file) {
    return [req.file];
  }
  return [];
}

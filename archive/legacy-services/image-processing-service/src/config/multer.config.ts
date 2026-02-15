import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Memory storage for processing with Sharp
export const memoryStorage = multer.memoryStorage();

// Disk storage for direct uploads
export const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
export const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

// Upload limits
export const uploadLimits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 10 // Max 10 files per request
};

// Multer configurations
export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: uploadLimits
});

export const uploadDisk = multer({
  storage: diskStorage,
  fileFilter: imageFileFilter,
  limits: uploadLimits
});

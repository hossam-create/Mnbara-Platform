import multer from 'multer';
import { storageConfig } from '../config/storage.config';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (storageConfig.allowedTypes.length > 0 && !storageConfig.allowedTypes.includes(file.mimetype)) {
    cb(new Error(`File type ${file.mimetype} not allowed`));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: storageConfig.maxFileSize
  },
  fileFilter
});

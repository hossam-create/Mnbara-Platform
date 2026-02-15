import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const fileController = new FileController();

// Upload single file
router.post('/upload', upload.single('file'), (req, res) => fileController.uploadFile(req, res));

// Upload multiple files
router.post('/upload/multiple', upload.array('files', 10), (req, res) => fileController.uploadMultiple(req, res));

// Delete file
router.delete('/delete', (req, res) => fileController.deleteFile(req, res));

// Get presigned download URL
router.get('/presigned-url', (req, res) => fileController.getPresignedUrl(req, res));

// Get presigned upload URL (for direct client uploads)
router.post('/presigned-upload-url', (req, res) => fileController.getPresignedUploadUrl(req, res));

export default router;

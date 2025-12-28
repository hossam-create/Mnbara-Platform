import { Router } from 'express';
import multer from 'multer';
import { BulkController } from '../controllers/BulkController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = new BulkController();

// POST /api/bulk/upload
router.post('/upload', upload.single('inventory'), (req, res) => controller.uploadInventory(req, res));

export default router;

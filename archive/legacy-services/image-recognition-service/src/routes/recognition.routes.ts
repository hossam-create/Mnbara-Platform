import { Router } from 'express';
import multer from 'multer';
import { RecognitionController } from '../controllers/recognition.controller';

const router = Router();
const controller = new RecognitionController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Analyze image (classification + object detection)
router.post('/analyze', upload.single('image'), (req, res) => controller.analyzeImage(req, res));

// Classify image only
router.post('/classify', upload.single('image'), (req, res) => controller.classifyImage(req, res));

// Detect objects only
router.post('/detect', upload.single('image'), (req, res) => controller.detectObjects(req, res));

// Visual search (find similar products)
router.post('/search', upload.single('image'), (req, res) => controller.visualSearch(req, res));

// Suggest category for product
router.post('/suggest-category', upload.single('image'), (req, res) => controller.suggestCategory(req, res));

export default router;

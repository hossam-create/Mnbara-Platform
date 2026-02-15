// Model Routes - AI Model Management
// مسارات النماذج - إدارة نماذج الذكاء الاصطناعي

import { Router } from 'express';
import { modelController } from '../controllers/model.controller';

const router = Router();

// List available open source models
router.get('/available', modelController.listAvailable.bind(modelController));

// Initialize a model
router.post('/initialize', modelController.initializeModel.bind(modelController));

// List all initialized models
router.get('/', modelController.listModels.bind(modelController));

// Get model status
router.get('/:modelId', modelController.getStatus.bind(modelController));

// Get model metrics
router.get('/:modelId/metrics', modelController.getMetrics.bind(modelController));

// Generate text
router.post('/generate', modelController.generateText.bind(modelController));

// Generate embedding
router.post('/embed', modelController.generateEmbedding.bind(modelController));

export default router;

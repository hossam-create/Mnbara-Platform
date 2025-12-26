// Training Routes - Fine-tuning & Training
// مسارات التدريب - الضبط الدقيق والتدريب

import { Router } from 'express';
import { trainingController } from '../controllers/training.controller';

const router = Router();

// Create fine-tuning job
router.post('/jobs', trainingController.createJob.bind(trainingController));

// List training jobs
router.get('/jobs', trainingController.listJobs.bind(trainingController));

// Get job status
router.get('/jobs/:jobId', trainingController.getJob.bind(trainingController));

export default router;

import { Router } from 'express';
import { JobController } from '../controllers/job.controller';

const router = Router();
const jobController = new JobController();

// Add job to queue
router.post('/jobs', (req, res) => jobController.addJob(req, res));

// Get job status
router.get('/jobs/:queue/:jobId', (req, res) => jobController.getJobStatus(req, res));

// Remove job
router.delete('/jobs/:queue/:jobId', (req, res) => jobController.removeJob(req, res));

// Get queue stats
router.get('/queues/:queue/stats', (req, res) => jobController.getQueueStats(req, res));

// Get all queues stats
router.get('/queues/stats', (req, res) => jobController.getAllQueuesStats(req, res));

// Pause queue
router.post('/queues/:queue/pause', (req, res) => jobController.pauseQueue(req, res));

// Resume queue
router.post('/queues/:queue/resume', (req, res) => jobController.resumeQueue(req, res));

// Clean queue
router.post('/queues/:queue/clean', (req, res) => jobController.cleanQueue(req, res));

export default router;

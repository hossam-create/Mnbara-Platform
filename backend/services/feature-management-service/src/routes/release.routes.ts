// Release Routes - Release Management API
// مسارات الإصدارات - واجهة برمجة إدارة الإصدارات

import { Router } from 'express';
import { releaseController } from '../controllers/release.controller';

const router = Router();

// ==========================================
// 📦 RELEASE CRUD
// ==========================================

// Create release
router.post('/', (req, res) => releaseController.create(req, res));

// List releases
router.get('/', (req, res) => releaseController.list(req, res));

// Get release by version
router.get('/:version', (req, res) => releaseController.getByVersion(req, res));

// Update release
router.put('/:version', (req, res) => releaseController.update(req, res));

// ==========================================
// 🚀 RELEASE ACTIONS
// ==========================================

// Schedule release
router.post('/:version/schedule', (req, res) => releaseController.schedule(req, res));

// Deploy release
router.post('/:version/deploy', (req, res) => releaseController.deploy(req, res));

// Rollback release
router.post('/:version/rollback', (req, res) => releaseController.rollback(req, res));

// ==========================================
// 📜 CHANGELOG
// ==========================================

// Get changelog
router.get('/changelog/all', (req, res) => releaseController.getChangelog(req, res));

export default router;

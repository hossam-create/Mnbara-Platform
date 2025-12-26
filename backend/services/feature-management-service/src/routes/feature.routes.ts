// Feature Routes - Feature Flags API
// مسارات الميزات - واجهة برمجة أعلام الميزات

import { Router } from 'express';
import { featureController } from '../controllers/feature.controller';

const router = Router();

// ==========================================
// 📋 FEATURE CRUD
// ==========================================

// Create feature
router.post('/', (req, res) => featureController.create(req, res));

// List features
router.get('/', (req, res) => featureController.list(req, res));

// Get feature by key
router.get('/:key', (req, res) => featureController.getByKey(req, res));

// Update feature
router.put('/:key', (req, res) => featureController.update(req, res));

// ==========================================
// 🎚️ FEATURE TOGGLE
// ==========================================

// Enable feature
router.post('/:key/enable', (req, res) => featureController.enable(req, res));

// Disable feature
router.post('/:key/disable', (req, res) => featureController.disable(req, res));

// Set rollout percentage
router.post('/:key/rollout', (req, res) => featureController.setRollout(req, res));

// ==========================================
// ✅ FEATURE CHECK
// ==========================================

// Check single feature
router.get('/:key/check', (req, res) => featureController.check(req, res));

// Bulk check features
router.post('/check', (req, res) => featureController.bulkCheck(req, res));

// Get enabled features for client
router.get('/client/enabled', (req, res) => featureController.getClientFeatures(req, res));

// ==========================================
// 🎯 OVERRIDES
// ==========================================

// Add override
router.post('/:key/overrides', (req, res) => featureController.addOverride(req, res));

// Remove override
router.delete('/:key/overrides', (req, res) => featureController.removeOverride(req, res));

// ==========================================
// 📊 METRICS
// ==========================================

// Get feature metrics
router.get('/:key/metrics', (req, res) => featureController.getMetrics(req, res));

export default router;

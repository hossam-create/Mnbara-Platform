import { Router } from 'express';
import { SectionsController } from '../controllers/sections.controller';

const router = Router();
const controller = new SectionsController();

/**
 * PROTECTED ROUTES - For Dashboard
 * These endpoints are used by the admin dashboard to manage sections
 */

// Get all sections (including inactive)
router.get('/', controller.getAllSections);

// Get single section with all details
router.get('/:id', controller.getSection);

// Create new section
router.post('/', controller.createSection);

// Update section
router.put('/:id', controller.updateSection);

// Delete section
router.delete('/:id', controller.deleteSection);

// Duplicate section
router.post('/:id/duplicate', controller.duplicateSection);

// Toggle section visibility
router.patch('/:id/toggle-visibility', controller.toggleVisibility);

// Toggle section active status
router.patch('/:id/toggle-active', controller.toggleActive);

// Reorder sections (drag & drop)
router.post('/reorder', controller.reorderSections);

// Get section analytics
router.get('/:id/analytics', controller.getSectionAnalytics);

export default router;

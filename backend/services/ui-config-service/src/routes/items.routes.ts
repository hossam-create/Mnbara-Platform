import { Router } from 'express';
import { ItemsController } from '../controllers/items.controller';

const router = Router();
const controller = new ItemsController();

// Get all items for a section
router.get('/section/:sectionId', controller.getItemsBySection.bind(controller));

// Get single item
router.get('/:id', controller.getItem.bind(controller));

// Create item
router.post('/', controller.createItem.bind(controller));

// Update item
router.put('/:id', controller.updateItem.bind(controller));

// Delete item
router.delete('/:id', controller.deleteItem.bind(controller));

// Duplicate item
router.post('/:id/duplicate', controller.duplicateItem.bind(controller));

// Toggle item active status
router.patch('/:id/toggle-active', controller.toggleActive.bind(controller));

// Reorder items within section
router.post('/reorder', controller.reorderItems.bind(controller));

// Bulk create items
router.post('/bulk', controller.bulkCreateItems.bind(controller));

// Bulk delete items
router.delete('/bulk', controller.bulkDeleteItems.bind(controller));

export default router;

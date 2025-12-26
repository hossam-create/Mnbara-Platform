import { Router } from 'express';
import { OptimizedCategoryController } from '../controllers/category.controller.optimized';

const router = Router();
const categoryController = new OptimizedCategoryController();

// Get all categories with filtering and pagination
router.get('/', categoryController.getCategories);

// Get category tree (hierarchical) with performance optimization
router.get('/tree', categoryController.getCategoryTree);

// Get popular categories
router.get('/popular', categoryController.getPopularCategories);

// Search categories with full-text search
router.get('/search', categoryController.searchCategories);

// Get single category with full details
router.get('/:id', categoryController.getCategory);

// Get category path (breadcrumb)
router.get('/:id/path', categoryController.getCategoryPath);

// Get category statistics with real-time data
router.get('/:id/stats', categoryController.getCategoryStats);

// Refresh category statistics (admin endpoint)
router.post('/:id/refresh-stats', categoryController.refreshCategoryStats);

export default router;

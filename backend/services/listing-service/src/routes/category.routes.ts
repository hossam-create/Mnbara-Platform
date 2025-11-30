import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();
const categoryController = new CategoryController();

// Get all categories
router.get('/', categoryController.getCategories);

// Get category tree (hierarchical)
router.get('/tree', categoryController.getCategoryTree);

// Get single category
router.get('/:id', categoryController.getCategory);

// Get category with listings count
router.get('/:id/stats', categoryController.getCategoryStats);

export default router;

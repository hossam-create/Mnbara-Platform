/**
 * Category Routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /categories - Get all categories
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    // For now, return default categories from shared models
    const DEFAULT_CATEGORIES = [
        { id: 'electronics', nameAr: 'إلكترونيات', nameEn: 'Electronics', icon: '📱', level: 1, productCount: 0 },
        { id: 'fashion', nameAr: 'موضة', nameEn: 'Fashion', icon: '👕', level: 1, productCount: 0 },
        { id: 'home', nameAr: 'المنزل', nameEn: 'Home', icon: '🏠', level: 1, productCount: 0 },
        { id: 'vehicles', nameAr: 'مركبات', nameEn: 'Vehicles', icon: '🚗', level: 1, productCount: 0 },
        { id: 'sports', nameAr: 'رياضة', nameEn: 'Sports', icon: '⚽', level: 1, productCount: 0 },
    ];

    res.json({
        success: true,
        data: DEFAULT_CATEGORIES,
    });
}));

// GET /categories/:id - Get category by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    res.json({
        success: true,
        data: { id, name: 'Category', description: 'Category description' },
    });
}));

export { router as categoryRoutes };

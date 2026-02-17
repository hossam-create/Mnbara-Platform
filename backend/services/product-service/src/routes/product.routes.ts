/**
 * Product Routes - CRUD Operations
 */

import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Create Product Schema
const createProductSchema = z.object({
    body: z.object({
        categoryId: z.string().uuid(),
        title: z.string().min(3).max(200),
        titleAr: z.string().min(3).max(200),
        description: z.string().min(10).max(5000),
        descriptionAr: z.string().min(10).max(5000),
        price: z.number().positive(),
        originalPrice: z.number().positive().optional(),
        currency: z.string().length(3).optional(),
        discount: z.number().min(0).max(100).optional(),
        stock: z.number().int().min(0).optional(),
        sku: z.string().optional(),
        condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR', 'PARTS', 'REFURBISHED']).optional(),
        listingType: z.enum(['BUY_IT_NOW', 'AUCTION', 'MAKE_OFFER', 'COMBINED']).optional(),
        startingBid: z.number().positive().optional(),
        reservePrice: z.number().positive().optional(),
        buyNowPrice: z.number().positive().optional(),
        minBidIncrement: z.number().positive().optional(),
        auctionEndsAt: z.string().datetime().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        images: z.array(z.object({
            url: z.string().url(),
            thumbnailUrl: z.string().url().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            mimeType: z.string().optional(),
        })).optional(),
        specifications: z.record(z.string(), z.any()).optional(),
    })
});

// Update Product Schema
const updateProductSchema = z.object({
    body: z.object({
        id: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        title: z.string().min(3).max(200).optional(),
        titleAr: z.string().min(3).max(200).optional(),
        description: z.string().min(10).max(5000).optional(),
        descriptionAr: z.string().min(10).max(5000).optional(),
        price: z.number().positive().optional(),
        originalPrice: z.number().positive().optional(),
        currency: z.string().length(3).optional(),
        discount: z.number().min(0).max(100).optional(),
        stock: z.number().int().min(0).optional(),
        sku: z.string().optional(),
        condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR', 'PARTS', 'REFURBISHED']).optional(),
        listingType: z.enum(['BUY_IT_NOW', 'AUCTION', 'MAKE_OFFER', 'COMBINED']).optional(),
        startingBid: z.number().positive().optional(),
        reservePrice: z.number().positive().optional(),
        buyNowPrice: z.number().positive().optional(),
        minBidIncrement: z.number().positive().optional(),
        auctionEndsAt: z.string().datetime().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        images: z.array(z.object({
            url: z.string().url(),
            thumbnailUrl: z.string().url().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            mimeType: z.string().optional(),
        })).optional(),
        specifications: z.record(z.string(), z.any()).optional(),
    })
});

// GET /products - Get all products with filters
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { 
        sellerId, categoryId, status, condition, listingType,
        minPrice, maxPrice, city, country, isAuction,
        page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filters = {
        sellerId: sellerId as string,
        categoryId: categoryId as string,
        status: status as any,
        condition: condition as any,
        listingType: listingType as any,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        city: city as string,
        country: country as string,
        isAuction: isAuction === 'true' ? true : isAuction === 'false' ? false : undefined,
    };

    const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await productService.getProducts(filters, pagination);

    res.json({
        success: true,
        data: result.products,
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        }
    });
}));

// GET /products/:id - Get product by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const incrementViews = req.query.incrementViews === 'true';

    const product = await productService.getProductById(id, incrementViews);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    res.json({
        success: true,
        data: product,
    });
}));

// POST /products - Create product
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const validationResult = createProductSchema.safeParse(req);
    
    if (!validationResult.success) {
        throw new AppError('Invalid input: ' + validationResult.error.message, 400);
    }

    // Get seller ID from authenticated user
    const sellerId = (req as any).user?.userId || req.headers['x-seller-id'] as string;
    
    if (!sellerId) {
        throw new AppError('Authentication required', 401);
    }

    const data = validationResult.data.body;
    
    // Parse auctionEndsAt if provided
    if (data.auctionEndsAt) {
        data.auctionEndsAt = new Date(data.auctionEndsAt);
    }

    const product = await productService.createProduct(data, sellerId);

    res.status(201).json({
        success: true,
        data: product,
    });
}));

// PUT /products/:id - Update product
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const validationResult = updateProductSchema.safeParse(req);
    
    if (!validationResult.success) {
        throw new AppError('Invalid input: ' + validationResult.error.message, 400);
    }

    const { id } = req.params;
    const sellerId = (req as any).user?.userId || req.headers['x-seller-id'] as string;
    
    if (!sellerId) {
        throw new AppError('Authentication required', 401);
    }
    const data = validationResult.data.body;

    if (data.auctionEndsAt) {
        data.auctionEndsAt = new Date(data.auctionEndsAt);
    }

    const product = await productService.updateProduct(id, data, sellerId);

    res.json({
        success: true,
        data: product,
    });
}));

// DELETE /products/:id - Delete product (soft delete)
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sellerId = (req as any).user?.userId || req.headers['x-seller-id'] as string;

    if (!sellerId) {
        throw new AppError('Authentication required', 401);
    }

    await productService.deleteProduct(id, sellerId);

    res.json({
        success: true,
        message: 'Product deleted successfully',
    });
}));

// POST /products/:id/publish - Publish product
router.post('/:id/publish', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sellerId = (req as any).user?.userId || req.headers['x-seller-id'] as string;

    if (!sellerId) {
        throw new AppError('Authentication required', 401);
    }

    const product = await productService.publishProduct(id, sellerId);

    res.json({
        success: true,
        data: product,
        message: 'Product published successfully',
    });
}));

// POST /products/:id/pause - Pause product
router.post('/:id/pause', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sellerId = req.headers['x-seller-id'] as string || 'test-seller-id';

    const product = await productService.pauseProduct(id, sellerId);

    res.json({
        success: true,
        data: product,
        message: 'Product paused successfully',
    });
}));

// POST /products/:id/archive - Archive product
router.post('/:id/archive', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sellerId = req.headers['x-seller-id'] as string || 'test-seller-id';

    const product = await productService.archiveProduct(id, sellerId);

    res.json({
        success: true,
        data: product,
        message: 'Product archived successfully',
    });
}));

// POST /products/:id/sold - Mark as sold
router.post('/:id/sold', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const buyerId = req.headers['x-buyer-id'] as string || 'test-buyer-id';

    const product = await productService.markAsSold(id, buyerId);

    res.json({
        success: true,
        data: product,
        message: 'Product marked as sold',
    });
}));

// POST /products/:id/like - Like product
router.post('/:id/like', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await productService.likeProduct(id);

    res.json({
        success: true,
        message: 'Product liked',
    });
}));

export { router as productRoutes };

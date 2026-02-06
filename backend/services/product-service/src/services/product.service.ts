/**
 * Product Service - Core Business Logic
 * 
 * Handles all product CRUD operations, validation, and business logic
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { 
    Product, 
    ProductCondition, 
    ProductStatus, 
    ListingType,
    ModerationStatus 
} from '@prisma/client';
import { validationSchema, CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import { moderationService } from './moderation.service';
import { searchIndexingService } from './search-indexing.service';

export interface ProductFilters {
    sellerId?: string;
    categoryId?: string;
    status?: ProductStatus;
    condition?: ProductCondition;
    listingType?: ListingType;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    country?: string;
    isAuction?: boolean;
    moderationStatus?: ModerationStatus;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProducts {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class ProductService {
    /**
     * Create a new product
     */
    async createProduct(data: CreateProductInput, sellerId: string): Promise<Product> {
        // Validate input
        const validatedData = validationSchema.createProduct.parse(data);

        // Check for restricted content
        const moderationCheck = await moderationService.checkContent(validatedData.title, validatedData.description);
        if (moderationCheck.blocked) {
            throw new AppError('Product content violates platform policies', 400);
        }

        // Check for restricted keywords
        const restrictedCheck = await moderationService.checkRestrictedKeywords(
            [validatedData.title, validatedData.description].join(' ')
        );
        if (restrictedCheck.blocked) {
            throw new AppError('Product contains restricted keywords', 400);
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                sellerId,
                categoryId: validatedData.categoryId,
                title: validatedData.title,
                titleAr: validatedData.titleAr,
                description: validatedData.description,
                descriptionAr: validatedData.descriptionAr,
                price: validatedData.price,
                originalPrice: validatedData.originalPrice,
                currency: validatedData.currency || 'USD',
                discount: validatedData.discount || 0,
                stock: validatedData.stock || 0,
                sku: validatedData.sku,
                condition: validatedData.condition || ProductCondition.NEW,
                listingType: validatedData.listingType || ListingType.BUY_IT_NOW,
                isAuction: validatedData.listingType === ListingType.AUCTION || validatedData.listingType === ListingType.COMBINED,
                startingBid: validatedData.startingBid,
                reservePrice: validatedData.reservePrice,
                buyNowPrice: validatedData.buyNowPrice,
                minBidIncrement: validatedData.minBidIncrement || 1.00,
                auctionEndsAt: validatedData.auctionEndsAt,
                city: validatedData.city,
                country: validatedData.country,
                moderationStatus: moderationCheck.flagged ? ModerationStatus.FLAGGED : ModerationStatus.PENDING,
                status: moderationCheck.flagged ? ProductStatus.PENDING_REVIEW : ProductStatus.DRAFT,
            },
            include: {
                images: true,
                category: true,
            }
        });

        // Create images if provided
        if (validatedData.images && validatedData.images.length > 0) {
            await prisma.productImage.createMany({
                data: validatedData.images.map((img, index) => ({
                    productId: product.id,
                    url: img.url,
                    thumbnailUrl: img.thumbnailUrl,
                    position: index,
                    isPrimary: index === 0,
                    width: img.width,
                    height: img.height,
                    mimeType: img.mimeType,
                }))
            });
        }

        // Create specifications if provided
        if (validatedData.specifications) {
            await prisma.productSpecification.createMany({
                data: Object.entries(validatedData.specifications).map(([key, value]) => ({
                    productId: product.id,
                    key,
                    value: String(value),
                }))
            });
        }

        // Log moderation action if flagged
        if (moderationCheck.flagged) {
            await moderationService.logAction({
                productId: product.id,
                action: 'FLAGGED',
                newStatus: ModerationStatus.FLAGGED,
                reason: moderationCheck.reason,
            });
        }

        // Index in Elasticsearch
        try {
            await searchIndexingService.indexProduct(product);
        } catch (error) {
            logger.error('Failed to index product in Elasticsearch', { error, productId: product.id });
        }

        logger.info('Product created', { productId: product.id, sellerId });

        return product;
    }

    /**
     * Get product by ID
     */
    async getProductById(id: string, incrementViews: boolean = false): Promise<Product | null> {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                images: { orderBy: { position: 'asc' } },
                specifications: true,
                category: true,
                seller: {
                    select: { id: true, name: true, storeName: true, rating: true, trustScore: true }
                },
                bids: {
                    where: { status: 'ACTIVE' },
                    orderBy: { amount: 'desc' },
                    take: 10,
                },
                offers: {
                    where: { status: 'PENDING' },
                    orderBy: { offerPrice: 'desc' },
                    take: 5,
                },
            }
        });

        if (!product) {
            return null;
        }

        // Increment view count
        if (incrementViews) {
            await prisma.product.update({
                where: { id },
                data: { views: { increment: 1 } }
            });
        }

        return product;
    }

    /**
     * Get products with filters and pagination
     */
    async getProducts(
        filters: ProductFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedProducts> {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.sellerId) where.sellerId = filters.sellerId;
        if (filters.categoryId) where.categoryId = filters.categoryId;
        if (filters.status) where.status = filters.status;
        if (filters.condition) where.condition = filters.condition;
        if (filters.listingType) where.listingType = filters.listingType;
        if (filters.isAuction !== undefined) where.isAuction = filters.isAuction;
        if (filters.moderationStatus) where.moderationStatus = filters.moderationStatus;

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            where.price = {};
            if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
            if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
        }

        if (filters.city) where.city = filters.city;
        if (filters.country) where.country = filters.country;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    images: { where: { isPrimary: true }, take: 1 },
                    category: { select: { id: true, nameEn: true, nameAr: true } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma.product.count({ where })
        ]);

        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Update product
     */
    async updateProduct(id: string, data: UpdateProductInput, sellerId: string): Promise<Product> {
        const existing = await prisma.product.findUnique({ where: { id } });
        
        if (!existing) {
            throw new AppError('Product not found', 404);
        }

        if (existing.sellerId !== sellerId) {
            throw new AppError('Not authorized to update this product', 403);
        }

        // Cannot update sold or archived products
        if (existing.status === ProductStatus.SOLD || existing.status === ProductStatus.ARCHIVED) {
            throw new AppError('Cannot update sold or archived products', 400);
        }

        const validatedData = validationSchema.updateProduct.parse(data);

        // Check restricted content if updating title/description
        if (validatedData.title || validatedData.description) {
            const checkText = `${validatedData.title || existing.title} ${validatedData.description || existing.description}`;
            const moderationCheck = await moderationService.checkContent(
                validatedData.title || existing.title,
                validatedData.description || existing.description
            );
            
            if (moderationCheck.blocked) {
                throw new AppError('Updated content violates platform policies', 400);
            }
        }

        // Update product
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
                ...(validatedData.title && { title: validatedData.title }),
                ...(validatedData.titleAr && { titleAr: validatedData.titleAr }),
                ...(validatedData.description && { description: validatedData.description }),
                ...(validatedData.descriptionAr && { descriptionAr: validatedData.descriptionAr }),
                ...(validatedData.price !== undefined && { price: validatedData.price }),
                ...(validatedData.originalPrice !== undefined && { originalPrice: validatedData.originalPrice }),
                ...(validatedData.discount !== undefined && { discount: validatedData.discount }),
                ...(validatedData.stock !== undefined && { stock: validatedData.stock }),
                ...(validatedData.condition && { condition: validatedData.condition }),
                ...(validatedData.listingType && { 
                    listingType: validatedData.listingType,
                    isAuction: validatedData.listingType === ListingType.AUCTION || validatedData.listingType === ListingType.COMBINED
                }),
                ...(validatedData.startingBid !== undefined && { startingBid: validatedData.startingBid }),
                ...(validatedData.reservePrice !== undefined && { reservePrice: validatedData.reservePrice }),
                ...(validatedData.buyNowPrice !== undefined && { buyNowPrice: validatedData.buyNowPrice }),
                ...(validatedData.auctionEndsAt && { auctionEndsAt: validatedData.auctionEndsAt }),
                ...(validatedData.city && { city: validatedData.city }),
                ...(validatedData.country && { country: validatedData.country }),
            },
            include: {
                images: true,
                specifications: true,
                category: true,
            }
        });

        // Update images if provided
        if (validatedData.images) {
            await prisma.productImage.deleteMany({ where: { productId: id } });
            await prisma.productImage.createMany({
                data: validatedData.images.map((img, index) => ({
                    productId: id,
                    url: img.url,
                    thumbnailUrl: img.thumbnailUrl,
                    position: index,
                    isPrimary: index === 0,
                }))
            });
        }

        // Update specifications if provided
        if (validatedData.specifications) {
            await prisma.productSpecification.deleteMany({ where: { productId: id } });
            await prisma.productSpecification.createMany({
                data: Object.entries(validatedData.specifications).map(([key, value]) => ({
                    productId: id,
                    key,
                    value: String(value),
                }))
            });
        }

        // Re-index in Elasticsearch
        try {
            await searchIndexingService.indexProduct(product);
        } catch (error) {
            logger.error('Failed to re-index product in Elasticsearch', { error, productId: id });
        }

        logger.info('Product updated', { productId: id, sellerId });

        return product;
    }

    /**
     * Delete product (soft delete)
     */
    async deleteProduct(id: string, sellerId: string): Promise<void> {
        const existing = await prisma.product.findUnique({ where: { id } });
        
        if (!existing) {
            throw new AppError('Product not found', 404);
        }

        if (existing.sellerId !== sellerId) {
            throw new AppError('Not authorized to delete this product', 403);
        }

        await prisma.product.update({
            where: { id },
            data: { status: ProductStatus.DELETED }
        });

        // Remove from Elasticsearch
        try {
            await searchIndexingService.deleteProduct(id);
        } catch (error) {
            logger.error('Failed to remove product from Elasticsearch', { error, productId: id });
        }

        logger.info('Product deleted', { productId: id, sellerId });
    }

    /**
     * Publish product (change from DRAFT to ACTIVE)
     */
    async publishProduct(id: string, sellerId: string): Promise<Product> {
        const product = await prisma.product.findUnique({ where: { id } });
        
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (product.sellerId !== sellerId) {
            throw new AppError('Not authorized', 403);
        }

        if (product.status !== ProductStatus.DRAFT && product.status !== ProductStatus.PAUSED) {
            throw new AppError('Product can only be published from DRAFT or PAUSED status', 400);
        }

        if (product.moderationStatus !== ModerationStatus.APPROVED && 
            product.moderationStatus !== ModerationStatus.PENDING) {
            throw new AppError('Product must be approved before publishing', 400);
        }

        // Check for required images
        const imageCount = await prisma.productImage.count({ where: { productId: id } });
        if (imageCount === 0) {
            throw new AppError('Product must have at least one image', 400);
        }

        return prisma.$transaction(async (tx) => {
            // Update status
            const updated = await tx.product.update({
                where: { id },
                data: {
                    status: ProductStatus.ACTIVE,
                    publishedAt: new Date(),
                    moderationStatus: ModerationStatus.APPROVED,
                },
                include: {
                    images: true,
                    category: true,
                }
            });

            // Increment category product count
            await tx.category.update({
                where: { id: product.categoryId },
                data: { productCount: { increment: 1 } }
            });

            // Re-index in Elasticsearch
            try {
                await searchIndexingService.indexProduct(updated);
            } catch (error) {
                logger.error('Failed to re-index published product', { error, productId: id });
            }

            logger.info('Product published', { productId: id, sellerId });

            return updated;
        });
    }

    /**
     * Pause product
     */
    async pauseProduct(id: string, sellerId: string): Promise<Product> {
        const product = await prisma.product.findUnique({ where: { id } });
        
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (product.sellerId !== sellerId) {
            throw new AppError('Not authorized', 403);
        }

        if (product.status !== ProductStatus.ACTIVE) {
            throw new AppError('Only active products can be paused', 400);
        }

        const updated = await prisma.product.update({
            where: { id },
            data: { status: ProductStatus.PAUSED },
            include: { images: true }
        });

        // Update Elasticsearch
        try {
            await searchIndexingService.indexProduct(updated);
        } catch (error) {
            logger.error('Failed to update paused product in Elasticsearch', { error, productId: id });
        }

        logger.info('Product paused', { productId: id, sellerId });

        return updated;
    }

    /**
     * Archive product
     */
    async archiveProduct(id: string, sellerId: string): Promise<Product> {
        const product = await prisma.product.findUnique({ where: { id } });
        
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (product.sellerId !== sellerId) {
            throw new AppError('Not authorized', 403);
        }

        const updated = await prisma.product.update({
            where: { id },
            data: { status: ProductStatus.ARCHIVED },
            include: { images: true }
        });

        // Remove from active search results in Elasticsearch
        try {
            await searchIndexingService.deleteProduct(id);
        } catch (error) {
            logger.error('Failed to remove archived product from Elasticsearch', { error, productId: id });
        }

        logger.info('Product archived', { productId: id, sellerId });

        return updated;
    }

    /**
     * Mark product as sold
     */
    async markAsSold(id: string, buyerId: string): Promise<Product> {
        const product = await prisma.product.findUnique({ where: { id } });
        
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (product.status !== ProductStatus.ACTIVE) {
            throw new AppError('Only active products can be marked as sold', 400);
        }

        const updated = await prisma.product.update({
            where: { id },
            data: {
                status: ProductStatus.SOLD,
                stock: 0,
            },
            include: { images: true }
        });

        // Update Elasticsearch
        try {
            await searchIndexingService.indexProduct(updated);
        } catch (error) {
            logger.error('Failed to update sold product in Elasticsearch', { error, productId: id });
        }

        logger.info('Product marked as sold', { productId: id, buyerId });

        return updated;
    }

    /**
     * Increment product likes
     */
    async likeProduct(id: string): Promise<void> {
        await prisma.product.update({
            where: { id },
            data: { likes: { increment: 1 } }
        });
    }
}

export const productService = new ProductService();

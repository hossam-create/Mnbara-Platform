/**
 * Product Validator Schemas using Zod
 */

import { z } from 'zod';

// Product Condition Enum
export const ProductConditionEnum = z.enum([
    'NEW',
    'LIKE_NEW',
    'GOOD',
    'FAIR',
    'POOR',
    'PARTS',
    'REFURBISHED',
]);

// Product Status Enum
export const ProductStatusEnum = z.enum([
    'DRAFT',
    'PENDING_REVIEW',
    'ACTIVE',
    'PAUSED',
    'SOLD',
    'ARCHIVED',
    'DELETED',
    'REJECTED',
]);

// Listing Type Enum
export const ListingTypeEnum = z.enum([
    'BUY_IT_NOW',
    'AUCTION',
    'MAKE_OFFER',
    'COMBINED',
]);

// Moderation Status Enum
export const ModerationStatusEnum = z.enum([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'FLAGGED',
    'UNDER_REVIEW',
]);

// Image Schema
export const ImageSchema = z.object({
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    mimeType: z.string().optional(),
});

// Location Schema
export const LocationSchema = z.object({
    city: z.string().min(1).max(100),
    country: z.string().min(1).max(100),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

// Create Product Schema
export const CreateProductSchema = z.object({
    categoryId: z.string().uuid(),
    title: z.string().min(3).max(200),
    titleAr: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    descriptionAr: z.string().min(10).max(5000),
    price: z.number().positive(),
    originalPrice: z.number().positive().optional(),
    currency: z.string().length(3).default('USD'),
    discount: z.number().min(0).max(100).optional(),
    stock: z.number().int().min(0).optional(),
    sku: z.string().optional(),
    condition: ProductConditionEnum.optional(),
    listingType: ListingTypeEnum.optional(),
    images: z.array(ImageSchema).optional(),
    specifications: z.record(z.string(), z.any()).optional(),
    
    // Auction specific
    startingBid: z.number().positive().optional(),
    reservePrice: z.number().positive().optional(),
    buyNowPrice: z.number().positive().optional(),
    minBidIncrement: z.number().positive().optional(),
    auctionEndsAt: z.date().optional(),
    
    // Location
    city: z.string().optional(),
    country: z.string().optional(),
});

// Update Product Schema
export const UpdateProductSchema = z.object({
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
    condition: ProductConditionEnum.optional(),
    listingType: ListingTypeEnum.optional(),
    images: z.array(ImageSchema).optional(),
    specifications: z.record(z.string(), z.any()).optional(),
    
    // Auction specific
    startingBid: z.number().positive().optional(),
    reservePrice: z.number().positive().optional(),
    buyNowPrice: z.number().positive().optional(),
    minBidIncrement: z.number().positive().optional(),
    auctionEndsAt: z.date().optional(),
    
    // Location
    city: z.string().optional(),
    country: z.string().optional(),
});

// Product Filters Schema
export const ProductFiltersSchema = z.object({
    sellerId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    status: ProductStatusEnum.optional(),
    condition: ProductConditionEnum.optional(),
    listingType: ListingTypeEnum.optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    isAuction: z.boolean().optional(),
    moderationStatus: ModerationStatusEnum.optional(),
});

// Pagination Schema
export const PaginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductFilters = z.infer<typeof ProductFiltersSchema>;
export type PaginationOptions = z.infer<typeof PaginationSchema>;

// Validation Schema Object
export const validationSchema = {
    createProduct: CreateProductSchema,
    updateProduct: UpdateProductSchema,
    filters: ProductFiltersSchema,
    pagination: PaginationSchema,
};

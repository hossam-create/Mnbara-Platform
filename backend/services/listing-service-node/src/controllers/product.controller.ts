import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { RedisService } from '../services/redis.service';
import { RabbitMQService } from '../services/rabbitmq.service';
import { ImageService } from '../services/image.service';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api.types';
import { CreateProductDto, UpdateProductDto, ProductFilters } from '../types/product.types';
import { validateProduct } from '../validators/product.validator';
import slugify from 'slugify';

/**
 * Product Controller - eBay-Level Product Management
 * 
 * Features:
 * - Advanced product CRUD operations
 * - Real-time search indexing
 * - Image processing and optimization
 * - Auction management
 * - Analytics tracking
 * - Cache management
 */
export class ProductController {
  private prisma: PrismaClient;
  private elasticsearchService: ElasticsearchService;
  private redisService: RedisService;
  private rabbitmqService: RabbitMQService;
  private imageService: ImageService;

  constructor() {
    this.prisma = new PrismaClient();
    this.elasticsearchService = new ElasticsearchService();
    this.redisService = new RedisService();
    this.rabbitmqService = new RabbitMQService();
    this.imageService = new ImageService();
  }

  /**
   * Get all products with advanced filtering and pagination
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        categoryId,
        sellerId,
        status = 'ACTIVE',
        listingType,
        condition,
        minPrice,
        maxPrice,
        location,
        freeShipping,
        hasReturns,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Build where clause
      const where: any = {
        isActive: true
      };

      if (status) where.status = status;
      if (categoryId) where.categoryId = categoryId;
      if (sellerId) where.sellerId = sellerId;
      if (listingType) where.listingType = listingType;
      if (condition) where.condition = condition;
      if (location) where.location = { contains: location as string, mode: 'insensitive' };
      if (freeShipping === 'true') where.freeShipping = true;
      if (hasReturns === 'true') where.hasReturns = true;

      // Price range filter
      if (minPrice || maxPrice) {
        where.currentPrice = {};
        if (minPrice) where.currentPrice.gte = Number(minPrice);
        if (maxPrice) where.currentPrice.lte = Number(maxPrice);
      }

      // Search filter
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { brand: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Build order by
      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder;

      // Execute query with relations
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            images: {
              where: { isPrimary: true },
              take: 1
            },
            attributes: true,
            _count: {
              select: {
                bids: true,
                reviews: true,
                watchers: true
              }
            }
          }
        }),
        this.prisma.product.count({ where })
      ]);

      // Transform products for response
      const transformedProducts = products.map(product => ({
        ...product,
        primaryImage: product.images[0]?.url || null,
        bidCount: product._count.bids,
        reviewCount: product._count.reviews,
        watcherCount: product._count.watchers,
        images: undefined,
        _count: undefined
      }));

      const response: ApiResponse<any> = {
        success: true,
        data: {
          products: transformedProducts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      };

      res.json(response);

    } catch (error) {
      logger.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PRODUCTS_ERROR',
          message: 'Failed to fetch products'
        }
      });
    }
  }

  /**
   * Get single product by ID with full details
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check cache first
      const cacheKey = `product:${id}`;
      const cachedProduct = await this.redisService.get(cacheKey);

      if (cachedProduct) {
        // Increment view count asynchronously
        this.incrementViewCount(id, userId);
        
        res.json({
          success: true,
          data: JSON.parse(cachedProduct)
        });
        return;
      }

      // Fetch from database
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          videos: {
            orderBy: { sortOrder: 'asc' }
          },
          attributes: {
            orderBy: { sortOrder: 'asc' }
          },
          bids: {
            where: { isRetracted: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              amount: true,
              isWinning: true,
              createdAt: true,
              bidderId: true
            }
          },
          reviews: {
            where: { isReported: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              rating: true,
              title: true,
              comment: true,
              reviewerId: true,
              isVerifiedPurchase: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              bids: true,
              reviews: true,
              watchers: true
            }
          }
        }
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        });
        return;
      }

      // Check if user is watching this product
      let isWatching = false;
      if (userId) {
        const watcher = await this.prisma.productWatcher.findUnique({
          where: {
            productId_userId: {
              productId: id,
              userId
            }
          }
        });
        isWatching = !!watcher;
      }

      // Calculate average rating
      const avgRating = await this.prisma.review.aggregate({
        where: { productId: id, isReported: false },
        _avg: { rating: true }
      });

      // Transform product for response
      const transformedProduct = {
        ...product,
        averageRating: avgRating._avg.rating || 0,
        bidCount: product._count.bids,
        reviewCount: product._count.reviews,
        watcherCount: product._count.watchers,
        isWatching,
        currentBid: product.bids[0]?.amount || product.startingPrice,
        timeRemaining: product.auctionEndTime ? 
          Math.max(0, new Date(product.auctionEndTime).getTime() - Date.now()) : null,
        _count: undefined
      };

      // Cache the result
      await this.redisService.setWithExpiration(
        cacheKey, 
        JSON.stringify(transformedProduct), 
        300 // 5 minutes
      );

      // Increment view count asynchronously
      this.incrementViewCount(id, userId);

      res.json({
        success: true,
        data: transformedProduct
      });

    } catch (error) {
      logger.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PRODUCT_ERROR',
          message: 'Failed to fetch product'
        }
      });
    }
  }

  /**
   * Create new product
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      // Validate input
      const validation = validateProduct(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: validation.errors
          }
        });
        return;
      }

      const productData: CreateProductDto = req.body;

      // Generate slug
      const slug = await this.generateUniqueSlug(productData.title);

      // Set auction end time if it's an auction
      let auctionEndTime = null;
      if (productData.listingType === 'AUCTION' && productData.auctionDuration) {
        auctionEndTime = new Date(Date.now() + productData.auctionDuration * 60 * 60 * 1000);
      }

      // Create product in database
      const product = await this.prisma.product.create({
        data: {
          ...productData,
          slug,
          sellerId: userId,
          auctionEndTime,
          currentPrice: productData.listingType === 'AUCTION' ? 
            productData.startingPrice : productData.fixedPrice,
          quantityAvailable: productData.quantity,
          createdBy: userId,
          updatedBy: userId,
          // Create attributes if provided
          attributes: productData.attributes ? {
            create: productData.attributes.map((attr, index) => ({
              name: attr.name,
              value: attr.value,
              type: attr.type || 'TEXT',
              sortOrder: index
            }))
          } : undefined
        },
        include: {
          category: true,
          attributes: true
        }
      });

      // Index in Elasticsearch
      await this.elasticsearchService.indexProduct(product);

      // Publish event
      await this.rabbitmqService.publishEvent('product.created', {
        productId: product.id,
        sellerId: userId,
        categoryId: product.categoryId,
        listingType: product.listingType,
        price: product.currentPrice
      });

      // Clear related caches
      await this.clearProductCaches(product.categoryId);

      logger.info(`Product created: ${product.id} by user: ${userId}`);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });

    } catch (error) {
      logger.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_PRODUCT_ERROR',
          message: 'Failed to create product'
        }
      });
    }
  }

  /**
   * Update product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData: UpdateProductDto = req.body;

      // Check if product exists and user owns it
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
        select: { sellerId: true, status: true }
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        });
        return;
      }

      if (existingProduct.sellerId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own products'
          }
        });
        return;
      }

      // Update slug if title changed
      let slug = undefined;
      if (updateData.title) {
        slug = await this.generateUniqueSlug(updateData.title, id);
      }

      // Update product
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateData,
          slug,
          updatedBy: userId,
          // Update attributes if provided
          ...(updateData.attributes && {
            attributes: {
              deleteMany: {},
              create: updateData.attributes.map((attr, index) => ({
                name: attr.name,
                value: attr.value,
                type: attr.type || 'TEXT',
                sortOrder: index
              }))
            }
          })
        },
        include: {
          category: true,
          attributes: true
        }
      });

      // Update in Elasticsearch
      await this.elasticsearchService.updateProduct(id, updatedProduct);

      // Clear caches
      await this.clearProductCaches(updatedProduct.categoryId, id);

      // Publish event
      await this.rabbitmqService.publishEvent('product.updated', {
        productId: id,
        sellerId: userId,
        changes: Object.keys(updateData)
      });

      logger.info(`Product updated: ${id} by user: ${userId}`);

      res.json({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      });

    } catch (error) {
      logger.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_PRODUCT_ERROR',
          message: 'Failed to update product'
        }
      });
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if product exists and user owns it
      const product = await this.prisma.product.findUnique({
        where: { id },
        select: { sellerId: true, status: true, categoryId: true }
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        });
        return;
      }

      if (product.sellerId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own products'
          }
        });
        return;
      }

      // Check if product has active bids
      if (product.status === 'ACTIVE') {
        const bidCount = await this.prisma.bid.count({
          where: { productId: id, isRetracted: false }
        });

        if (bidCount > 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'PRODUCT_HAS_BIDS',
              message: 'Cannot delete product with active bids'
            }
          });
          return;
        }
      }

      // Soft delete (mark as cancelled)
      await this.prisma.product.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          isActive: false,
          updatedBy: userId
        }
      });

      // Remove from Elasticsearch
      await this.elasticsearchService.deleteProduct(id);

      // Clear caches
      await this.clearProductCaches(product.categoryId, id);

      // Publish event
      await this.rabbitmqService.publishEvent('product.deleted', {
        productId: id,
        sellerId: userId
      });

      logger.info(`Product deleted: ${id} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_PRODUCT_ERROR',
          message: 'Failed to delete product'
        }
      });
    }
  }

  /**
   * Upload product images
   */
  async uploadImages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES',
            message: 'No files uploaded'
          }
        });
        return;
      }

      // Check if product exists and user owns it
      const product = await this.prisma.product.findUnique({
        where: { id },
        select: { sellerId: true }
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        });
        return;
      }

      if (product.sellerId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only upload images to your own products'
          }
        });
        return;
      }

      // Process and upload images
      const uploadedImages = await Promise.all(
        files.map(async (file, index) => {
          const processedImage = await this.imageService.processProductImage(file);
          
          return this.prisma.productImage.create({
            data: {
              productId: id,
              url: processedImage.url,
              altText: `${product} image ${index + 1}`,
              width: processedImage.width,
              height: processedImage.height,
              size: processedImage.size,
              format: processedImage.format,
              isPrimary: index === 0, // First image is primary
              sortOrder: index
            }
          });
        })
      );

      // Clear product cache
      await this.redisService.delete(`product:${id}`);

      res.json({
        success: true,
        data: uploadedImages,
        message: 'Images uploaded successfully'
      });

    } catch (error) {
      logger.error('Error uploading images:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_IMAGES_ERROR',
          message: 'Failed to upload images'
        }
      });
    }
  }

  /**
   * Add product to watchlist
   */
  async addToWatchlist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      // Check if product exists
      const product = await this.prisma.product.findUnique({
        where: { id },
        select: { id: true, title: true }
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        });
        return;
      }

      // Add to watchlist (upsert to handle duplicates)
      await this.prisma.productWatcher.upsert({
        where: {
          productId_userId: {
            productId: id,
            userId
          }
        },
        update: {},
        create: {
          productId: id,
          userId
        }
      });

      // Update watch count
      await this.prisma.product.update({
        where: { id },
        data: {
          watchCount: {
            increment: 1
          }
        }
      });

      // Clear cache
      await this.redisService.delete(`product:${id}`);

      res.json({
        success: true,
        message: 'Product added to watchlist'
      });

    } catch (error) {
      logger.error('Error adding to watchlist:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ADD_WATCHLIST_ERROR',
          message: 'Failed to add product to watchlist'
        }
      });
    }
  }

  // Private helper methods

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findUnique({
        where: { slug },
        select: { id: true }
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async incrementViewCount(productId: string, userId?: string): Promise<void> {
    try {
      // Use Redis to track unique views per user per day
      const today = new Date().toISOString().split('T')[0];
      const viewKey = `product_view:${productId}:${today}:${userId || 'anonymous'}`;
      
      const hasViewed = await this.redisService.get(viewKey);
      if (!hasViewed) {
        // Mark as viewed for today
        await this.redisService.setWithExpiration(viewKey, '1', 86400); // 24 hours
        
        // Increment view count
        await this.prisma.product.update({
          where: { id: productId },
          data: {
            viewCount: {
              increment: 1
            }
          }
        });
      }
    } catch (error) {
      logger.error('Error incrementing view count:', error);
    }
  }

  private async clearProductCaches(categoryId?: string, productId?: string): Promise<void> {
    try {
      const keys = ['products:*'];
      
      if (categoryId) {
        keys.push(`category:${categoryId}:*`);
      }
      
      if (productId) {
        keys.push(`product:${productId}`);
      }

      await Promise.all(keys.map(pattern => this.redisService.deletePattern(pattern)));
    } catch (error) {
      logger.error('Error clearing caches:', error);
    }
  }
}
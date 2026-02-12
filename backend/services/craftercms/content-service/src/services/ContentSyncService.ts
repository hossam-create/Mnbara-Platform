import { PrismaClient } from '@prisma/client';
import { CrafterCMSClient } from '../craftercms-client/CrafterCMSClient';
import { Logger } from '@mnbara/shared-utils';
import { EventBus } from '@mnbara/event-bus';
import { ContentUpdate } from '../types/Content.types';

/**
 * Content Sync Service - Synchronizes data between Mnbara database and CrafterCMS
 */
export class ContentSyncService {
  private prisma: PrismaClient;
  private crafterClient: CrafterCMSClient;
  private eventBus: EventBus;
  private logger: Logger;

  constructor(
    prisma: PrismaClient,
    crafterClient: CrafterCMSClient,
    eventBus: EventBus
  ) {
    this.prisma = prisma;
    this.crafterClient = crafterClient;
    this.eventBus = eventBus;
    this.logger = new Logger('ContentSyncService');
  }

  /**
   * Sync product data to CrafterCMS
   */
  async syncProductToCrafterCMS(productId: string, siteId: string = 'mnbara'): Promise<void> {
    try {
      this.logger.info(`Syncing product ${productId} to CrafterCMS`);

      // Get product data from database
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          images: true,
          variants: true,
          specifications: true,
          reviews: {
            where: { status: 'approved' },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          seller: {
            select: {
              id: true,
              businessName: true,
              rating: true,
              verified: true
            }
          }
        }
      });

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Transform product data to CrafterCMS content format
      const contentUpdate: ContentUpdate = {
        path: `/products/${product.slug || product.id}`,
        contentType: 'product',
        content: {
          // Basic product information
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          currency: product.currency,
          compareAtPrice: product.compareAtPrice,
          cost: product.cost,
          
          // Inventory
          sku: product.sku,
          inventory: product.inventory,
          trackInventory: product.trackInventory,
          allowBackorders: product.allowBackorders,
          lowStockThreshold: product.lowStockThreshold,
          
          // Category and classification
          category: product.category?.name,
          categoryId: product.categoryId,
          categoryPath: product.category ? this.buildCategoryPath(product.category) : null,
          tags: product.tags || [],
          
          // Media
          images: product.images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            position: img.position,
            isPrimary: img.isPrimary
          })),
          primaryImage: product.images.find(img => img.isPrimary)?.url,
          
          // Variants
          variants: product.variants.map(variant => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            inventory: variant.inventory,
            options: variant.options,
            image: variant.image
          })),
          
          // Specifications
          specifications: product.specifications.map(spec => ({
            name: spec.name,
            value: spec.value,
            unit: spec.unit,
            displayOrder: spec.displayOrder
          })),
          
          // Reviews
          reviews: product.reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            content: review.content,
            author: review.authorName,
            verified: review.verified,
            createdAt: review.createdAt,
            helpful: review.helpfulCount
          })),
          
          // Seller information
          seller: product.seller ? {
            id: product.seller.id,
            businessName: product.seller.businessName,
            rating: product.seller.rating,
            verified: product.seller.verified
          } : null,
          
          // SEO and metadata
          seoTitle: product.seoTitle || product.name,
          seoDescription: product.seoDescription || product.shortDescription,
          slug: product.slug || product.id,
          metaKeywords: product.metaKeywords || [],
          
          // Status and visibility
          status: product.status,
          visibility: product.visibility,
          featured: product.featured,
          
          // Dates
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          publishedAt: product.publishedAt,
          
          // Additional fields
          brand: product.brand,
          manufacturer: product.manufacturer,
          model: product.model,
          weight: product.weight,
          dimensions: product.dimensions,
          material: product.material,
          color: product.color,
          size: product.size,
          style: product.style,
          
          // Pricing and promotions
          taxClass: product.taxClass,
          shippingClass: product.shippingClass,
          freeShipping: product.freeShipping,
          
          // Digital products
          isDigital: product.isDigital,
          downloadUrl: product.downloadUrl,
          downloadLimit: product.downloadLimit,
          downloadExpiry: product.downloadExpiry,
          
          // Subscription products
          isSubscription: product.isSubscription,
          subscriptionPlan: product.subscriptionPlan,
          
          // Custom fields
          customFields: product.customFields || {}
        },
        metadata: [
          {
            key: 'sync_source',
            value: 'mnbara_database'
          },
          {
            key: 'sync_timestamp',
            value: new Date().toISOString()
          },
          {
            key: 'product_id',
            value: product.id
          },
          {
            key: 'seller_id',
            value: product.sellerId
          }
        ],
        commitMessage: `Sync product: ${product.name} (${product.id})`
      };

      // Update content in CrafterCMS
      await this.crafterClient.updateContent(siteId, contentUpdate);

      // Publish the content if product is published
      if (product.status === 'published' && product.visibility === 'public') {
        await this.crafterClient.publishContent(
          siteId, 
          [contentUpdate.path], 
          'production',
          undefined,
          `Auto-publish product: ${product.name}`
        );
      }

      this.logger.info(`Successfully synced product ${productId} to CrafterCMS`);

      // Publish sync event
      await this.eventBus.publish({
        type: 'content.sync_completed',
        source: 'content-sync-service',
        data: {
          productId,
          siteId,
          path: contentUpdate.path,
          action: 'sync_to_craftercms',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error(`Failed to sync product ${productId} to CrafterCMS`, error);
      
      // Publish sync error event
      await this.eventBus.publish({
        type: 'content.sync_failed',
        source: 'content-sync-service',
        data: {
          productId,
          siteId,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

      throw error;
    }
  }

  /**
   * Sync CrafterCMS content back to database
   */
  async syncContentToDatabase(contentPath: string, siteId: string = 'mnbara'): Promise<void> {
    try {
      this.logger.info(`Syncing content ${contentPath} from CrafterCMS to database`);

      // Get content from CrafterCMS
      const content = await this.crafterClient.getContentByPath(siteId, contentPath);
      
      if (!content) {
        throw new Error(`Content not found: ${contentPath}`);
      }

      // Check if this is a product content type
      if (content.contentType !== 'product') {
        this.logger.debug(`Skipping non-product content: ${contentPath}`);
        return;
      }

      // Extract product data from content
      const productData = content.content;
      
      if (!productData.id) {
        throw new Error(`Product ID not found in content: ${contentPath}`);
      }

      // Update product in database
      const updatedProduct = await this.prisma.product.update({
        where: { id: productData.id },
        data: {
          // Update basic fields
          name: productData.name || undefined,
          description: productData.description || undefined,
          shortDescription: productData.shortDescription || undefined,
          price: productData.price || undefined,
          currency: productData.currency || undefined,
          compareAtPrice: productData.compareAtPrice || undefined,
          
          // Update inventory
          inventory: productData.inventory || undefined,
          trackInventory: productData.trackInventory || undefined,
          allowBackorders: productData.allowBackorders || undefined,
          lowStockThreshold: productData.lowStockThreshold || undefined,
          
          // Update SEO
          seoTitle: productData.seoTitle || undefined,
          seoDescription: productData.seoDescription || undefined,
          slug: productData.slug || undefined,
          metaKeywords: productData.metaKeywords || undefined,
          
          // Update status and visibility
          status: productData.status || undefined,
          visibility: productData.visibility || undefined,
          featured: productData.featured || undefined,
          
          // Update additional fields
          brand: productData.brand || undefined,
          manufacturer: productData.manufacturer || undefined,
          model: productData.model || undefined,
          weight: productData.weight || undefined,
          dimensions: productData.dimensions || undefined,
          material: productData.material || undefined,
          color: productData.color || undefined,
          size: productData.size || undefined,
          style: productData.style || undefined,
          
          // Update digital product fields
          isDigital: productData.isDigital || undefined,
          downloadUrl: productData.downloadUrl || undefined,
          downloadLimit: productData.downloadLimit || undefined,
          downloadExpiry: productData.downloadExpiry || undefined,
          
          // Update subscription fields
          isSubscription: productData.isSubscription || undefined,
          subscriptionPlan: productData.subscriptionPlan || undefined,
          
          // Update custom fields
          customFields: productData.customFields || undefined,
          tags: productData.tags || undefined,
          
          // Update timestamps
          updatedAt: new Date()
        }
      });

      this.logger.info(`Successfully synced content ${contentPath} to database`);

      // Publish sync event
      await this.eventBus.publish({
        type: 'content.sync_completed',
        source: 'content-sync-service',
        data: {
          contentPath,
          siteId,
          productId: productData.id,
          action: 'sync_to_database',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error(`Failed to sync content ${contentPath} to database`, error);
      
      // Publish sync error event
      await this.eventBus.publish({
        type: 'content.sync_failed',
        source: 'content-sync-service',
        data: {
          contentPath,
          siteId,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

      throw error;
    }
  }

  /**
   * Batch sync products to CrafterCMS
   */
  async batchSyncProductsToCrafterCMS(
    productIds: string[], 
    siteId: string = 'mnbara',
    batchSize: number = 10
  ): Promise<{
    successful: string[];
    failed: { id: string; error: string }[];
    total: number;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
      total: productIds.length
    };

    this.logger.info(`Starting batch sync of ${productIds.length} products to CrafterCMS`);

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (productId) => {
        try {
          await this.syncProductToCrafterCMS(productId, siteId);
          results.successful.push(productId);
          
          this.logger.debug(`Successfully synced product ${productId} to CrafterCMS`);
        } catch (error) {
          results.failed.push({
            id: productId,
            error: error.message
          });
          
          this.logger.error(`Failed to sync product ${productId} to CrafterCMS`, error);
        }
      });

      await Promise.all(batchPromises);
      
      this.logger.info(`Batch sync progress: ${results.successful.length + results.failed.length}/${results.total}`);
    }

    this.logger.info(`Batch sync completed: ${results.successful.length} successful, ${results.failed.length} failed`);

    return results;
  }

  /**
   * Sync all products to CrafterCMS
   */
  async syncAllProductsToCrafterCMS(
    siteId: string = 'mnbara',
    filters: {
      status?: string[];
      sellerId?: string;
      categoryId?: string;
      featured?: boolean;
    } = {}
  ): Promise<{
    successful: string[];
    failed: { id: string; error: string }[];
    total: number;
  }> {
    try {
      this.logger.info('Starting full product sync to CrafterCMS');

      // Build where clause based on filters
      const whereClause: any = {};
      
      if (filters.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status };
      }
      
      if (filters.sellerId) {
        whereClause.sellerId = filters.sellerId;
      }
      
      if (filters.categoryId) {
        whereClause.categoryId = filters.categoryId;
      }
      
      if (filters.featured !== undefined) {
        whereClause.featured = filters.featured;
      }

      // Get all product IDs
      const products = await this.prisma.product.findMany({
        where: whereClause,
        select: { id: true },
        orderBy: { createdAt: 'desc' }
      });

      const productIds = products.map(p => p.id);
      
      this.logger.info(`Found ${productIds.length} products to sync`);

      // Batch sync all products
      return await this.batchSyncProductsToCrafterCMS(productIds, siteId);

    } catch (error) {
      this.logger.error('Failed to sync all products to CrafterCMS', error);
      throw error;
    }
  }

  /**
   * Build category path for hierarchical navigation
   */
  private buildCategoryPath(category: any): string[] {
    const path: string[] = [];
    let current = category;
    
    while (current) {
      path.unshift(current.slug || current.name);
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Handle real-time sync events
   */
  async handleProductCreated(productId: string): Promise<void> {
    try {
      this.logger.info(`Handling product created event: ${productId}`);
      await this.syncProductToCrafterCMS(productId);
    } catch (error) {
      this.logger.error(`Failed to handle product created event: ${productId}`, error);
    }
  }

  async handleProductUpdated(productId: string): Promise<void> {
    try {
      this.logger.info(`Handling product updated event: ${productId}`);
      await this.syncProductToCrafterCMS(productId);
    } catch (error) {
      this.logger.error(`Failed to handle product updated event: ${productId}`, error);
    }
  }

  async handleProductDeleted(productId: string): Promise<void> {
    try {
      this.logger.info(`Handling product deleted event: ${productId}`);
      
      // Delete content from CrafterCMS
      const contentPath = `/products/${productId}`;
      await this.crafterClient.deleteContent('mnbara', contentPath, 'Product deleted from database');
      
      this.logger.info(`Successfully deleted product content: ${contentPath}`);
    } catch (error) {
      this.logger.error(`Failed to handle product deleted event: ${productId}`, error);
    }
  }

  /**
   * Handle CrafterCMS content events
   */
  async handleContentUpdated(eventData: any): Promise<void> {
    try {
      const { siteId, path, contentType } = eventData;
      
      if (contentType === 'product') {
        this.logger.info(`Handling content updated event: ${path}`);
        await this.syncContentToDatabase(path, siteId);
      }
    } catch (error) {
      this.logger.error('Failed to handle content updated event', error);
    }
  }

  async handleContentPublished(eventData: any): Promise<void> {
    try {
      const { siteId, path, contentType } = eventData;
      
      if (contentType === 'product') {
        this.logger.info(`Handling content published event: ${path}`);
        await this.syncContentToDatabase(path, siteId);
      }
    } catch (error) {
      this.logger.error('Failed to handle content published event', error);
    }
  }
}
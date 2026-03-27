import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { CustomError } from '@/utils/error-handler';
import { AuctionItem, ProductCarousel } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface CarouselItem {
  id: string;
  productId: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity?: number;
  sellerId: string;
  sellerName: string;
  isFeatured: boolean;
  isOnSale: boolean;
  discountPercentage?: number;
  position: number;
  metadata: Record<string, any>;
}

export interface CarouselConfig {
  autoRotate: boolean;
  rotationInterval: number;
  maxItems: number;
  showPrice: boolean;
  showRatings: boolean;
  showStock: boolean;
  enableClick: boolean;
  enableWishlist: boolean;
  animationType: 'slide' | 'fade' | 'zoom';
  theme: 'light' | 'dark';
}

export interface CarouselEvent {
  type: 'item-shown' | 'item-clicked' | 'item-wishlisted' | 'carousel-started' | 'carousel-stopped';
  carouselId: string;
  streamId: string;
  itemId?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ProductCarouselManager extends EventEmitter {
  private carousels: Map<string, ProductCarousel> = new Map();
  private items: Map<string, CarouselItem[]> = new Map();
  private activeCarousels: Map<string, string> = new Map(); // streamId -> carouselId
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private currentPositions: Map<string, number> = new Map();
  private eventHistory: Map<string, CarouselEvent[]> = new Map();
  private config: CarouselConfig;
  private running: boolean = false;

  constructor(config?: Partial<CarouselConfig>) {
    super();
    
    this.config = {
      autoRotate: config?.autoRotate !== false,
      rotationInterval: config?.rotationInterval || 5000, // 5 seconds
      maxItems: config?.maxItems || 10,
      showPrice: config?.showPrice !== false,
      showRatings: config?.showRatings !== false,
      showStock: config?.showStock !== false,
      enableClick: config?.enableClick !== false,
      enableWishlist: config?.enableWishlist !== false,
      animationType: config?.animationType || 'slide',
      theme: config?.theme || 'light'
    };
  }

  public async createCarousel(
    streamId: string,
    name: string,
    items: CarouselItem[],
    options?: {
      autoStart?: boolean;
      config?: Partial<CarouselConfig>;
      sellerId?: string;
      sellerName?: string;
    }
  ): Promise<ProductCarousel> {
    try {
      // Check if there's already an active carousel for this stream
      if (this.activeCarousels.has(streamId)) {
        throw new CustomError('Active carousel already exists for this stream', 409);
      }

      // Limit items
      const limitedItems = items.slice(0, this.config.maxItems);

      const carousel: ProductCarousel = {
        id: uuidv4(),
        streamId,
        name,
        itemCount: limitedItems.length,
        currentItemIndex: 0,
        isActive: false,
        autoRotate: options?.config?.autoRotate ?? this.config.autoRotate,
        rotationInterval: options?.config?.rotationInterval ?? this.config.rotationInterval,
        showPrice: options?.config?.showPrice ?? this.config.showPrice,
        showRatings: options?.config?.showRatings ?? this.config.showRatings,
        showStock: options?.config?.showStock ?? this.config.showStock,
        enableClick: options?.config?.enableClick ?? this.config.enableClick,
        enableWishlist: options?.config?.enableWishlist ?? this.config.enableWishlist,
        animationType: options?.config?.animationType ?? this.config.animationType,
        theme: options?.config?.theme ?? this.config.theme,
        sellerId: options?.sellerId,
        sellerName: options?.sellerName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.carousels.set(carousel.id, carousel);
      this.items.set(carousel.id, limitedItems);
      this.currentPositions.set(carousel.id, 0);
      this.eventHistory.set(carousel.id, []);

      if (options?.autoStart !== false) {
        await this.startCarousel(carousel.id);
      }

      logger.info(`Carousel created: ${carousel.id} for stream ${streamId} with ${limitedItems.length} items`);
      
      this.emit('carousel-created', { carousel });
      
      return carousel;
    } catch (error) {
      logger.error('Failed to create carousel:', error);
      throw error;
    }
  }

  public async startCarousel(carouselId: string): Promise<ProductCarousel> {
    try {
      const carousel = this.carousels.get(carouselId);
      if (!carousel) {
        throw new CustomError('Carousel not found', 404);
      }

      if (carousel.isActive) {
        throw new CustomError('Carousel is already active', 400);
      }

      // Check if there's already an active carousel for this stream
      if (this.activeCarousels.has(carousel.streamId)) {
        throw new CustomError('Active carousel already exists for this stream', 409);
      }

      carousel.isActive = true;
      carousel.updatedAt = new Date();

      // Set as active carousel for stream
      this.activeCarousels.set(carousel.streamId, carousel.id);

      // Start auto-rotation if enabled
      if (carousel.autoRotate && carousel.itemCount > 1) {
        this.startAutoRotation(carousel.id);
      }

      // Show first item
      await this.showItem(carousel.id, 0);

      logger.info(`Carousel started: ${carouselId}`);
      
      this.emit('carousel-started', { carousel });
      
      return carousel;
    } catch (error) {
      logger.error('Failed to start carousel:', error);
      throw error;
    }
  }

  public async stopCarousel(carouselId: string): Promise<ProductCarousel> {
    try {
      const carousel = this.carousels.get(carouselId);
      if (!carousel) {
        throw new CustomError('Carousel not found', 404);
      }

      if (!carousel.isActive) {
        throw new CustomError('Carousel is not active', 400);
      }

      carousel.isActive = false;
      carousel.updatedAt = new Date();

      // Remove from active carousels
      this.activeCarousels.delete(carousel.streamId);

      // Stop auto-rotation
      this.stopAutoRotation(carousel.id);

      logger.info(`Carousel stopped: ${carouselId}`);
      
      this.emit('carousel-stopped', { carousel });
      
      return carousel;
    } catch (error) {
      logger.error('Failed to stop carousel:', error);
      throw error;
    }
  }

  public async nextItem(carouselId: string): Promise<CarouselItem | null> {
    try {
      const carousel = this.carousels.get(carouselId);
      if (!carousel || !carousel.isActive) {
        throw new CustomError('Carousel not found or not active', 404);
      }

      const items = this.items.get(carouselId) || [];
      if (items.length === 0) {
        return null;
      }

      const nextIndex = (carousel.currentItemIndex + 1) % items.length;
      return await this.showItem(carouselId, nextIndex);
    } catch (error) {
      logger.error('Failed to show next item:', error);
      throw error;
    }
  }

  public async previousItem(carouselId: string): Promise<CarouselItem | null> {
    try {
      const carousel = this.carousels.get(carouselId);
      if (!carousel || !carousel.isActive) {
        throw new CustomError('Carousel not found or not active', 404);
      }

      const items = this.items.get(carouselId) || [];
      if (items.length === 0) {
        return null;
      }

      const prevIndex = carousel.currentItemIndex === 0 ? items.length - 1 : carousel.currentItemIndex - 1;
      return await this.showItem(carouselId, prevIndex);
    } catch (error) {
      logger.error('Failed to show previous item:', error);
      throw error;
    }
  }

  public async showItem(carouselId: string, index: number): Promise<CarouselItem | null> {
    try {
      const carousel = this.carousels.get(carouselId);
      if (!carousel || !carousel.isActive) {
        throw new CustomError('Carousel not found or not active', 404);
      }

      const items = this.items.get(carouselId) || [];
      if (index < 0 || index >= items.length) {
        throw new CustomError('Invalid item index', 400);
      }

      const item = items[index];
      carousel.currentItemIndex = index;
      carousel.updatedAt = new Date();

      // Record event
      this.recordEvent('item-shown', carouselId, carousel.streamId, item.id);

      logger.debug(`Item shown: ${item.id} at index ${index} in carousel ${carouselId}`);
      
      this.emit('item-shown', { carousel, item, index });
      
      return item;
    } catch (error) {
      logger.error('Failed to show item:', error);
      throw error;
    }
  }

  public async handleItemClick(
    carouselId: string,
    itemId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const carousel = this.carousels.get(carouselId);
      if (!carousel || !carousel.isActive) {
        throw new CustomError('Carousel not found or not active', 404);
      }

      if (!carousel.enableClick) {
        throw new CustomError('Item clicks are disabled', 403);
      }

      const items = this.items.get(carouselId) || [];
      const item = items.find(i => i.id === itemId);
      if (!item) {
        throw new CustomError('Item not found', 404);
      }

      // Record event
      this.recordEvent('item-clicked', carouselId, carousel.streamId, itemId, userId, metadata);

      logger.info(`Item clicked: ${itemId} by user ${userId} in carousel ${carouselId}`);
      
      this.emit('item-clicked', { carousel, item, userId, metadata });
    } catch (error) {
      logger.error('Failed to handle item click:', error);
      throw error;
    }
  }

  public async handleItemWishlist(
    carouselId: string,
    itemId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const carousel = this.carousels.get(carouselId);
      if (!carousel || !carousel.isActive) {
        throw new CustomError('Carousel not found or not active', 404);
      }

      if (!carousel.enableWishlist) {
        throw new CustomError('Wishlist is disabled', 403);
      }

      const items = this.items.get(carouselId) || [];
      const item = items.find(i => i.id === itemId);
      if (!item) {
        throw new CustomError('Item not found', 404);
      }

      // Record event
      this.recordEvent('item-wishlisted', carouselId, carousel.streamId, itemId, userId, metadata);

      logger.info(`Item wishlisted: ${itemId} by user ${userId} in carousel ${carouselId}`);
      
      this.emit('item-wishlisted', { carousel, item, userId, metadata });
    } catch (error) {
      logger.error('Failed to handle item wishlist:', error);
      throw error;
    }
  }

  public addItemToCarousel(carouselId: string, item: CarouselItem): void {
    const carousel = this.carousels.get(carouselId);
    if (!carousel) {
      throw new CustomError('Carousel not found', 404);
    }

    const items = this.items.get(carouselId) || [];
    if (items.length >= this.config.maxItems) {
      throw new CustomError('Maximum items reached', 400);
    }

    items.push(item);
    this.items.set(carouselId, items);
    carousel.itemCount = items.length;
    carousel.updatedAt = new Date();

    logger.info(`Item added to carousel: ${item.id} in carousel ${carouselId}`);
    
    this.emit('item-added', { carousel, item });
  }

  public removeItemFromCarousel(carouselId: string, itemId: string): void {
    const carousel = this.carousels.get(carouselId);
    if (!carousel) {
      throw new CustomError('Carousel not found', 404);
    }

    const items = this.items.get(carouselId) || [];
    const itemIndex = items.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      throw new CustomError('Item not found', 404);
    }

    items.splice(itemIndex, 1);
    this.items.set(carouselId, items);
    carousel.itemCount = items.length;
    
    // Adjust current index if necessary
    if (carousel.currentItemIndex >= items.length && items.length > 0) {
      carousel.currentItemIndex = items.length - 1;
    }
    
    carousel.updatedAt = new Date();

    logger.info(`Item removed from carousel: ${itemId} from carousel ${carouselId}`);
    
    this.emit('item-removed', { carousel, itemId });
  }

  private startAutoRotation(carouselId: string): void {
    const carousel = this.carousels.get(carouselId);
    if (!carousel || !carousel.autoRotate) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        await this.nextItem(carouselId);
      } catch (error) {
        logger.error('Auto-rotation failed:', error);
      }
    }, carousel.rotationInterval);

    this.timers.set(carouselId, timer);
  }

  private stopAutoRotation(carouselId: string): void {
    const timer = this.timers.get(carouselId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(carouselId);
    }
  }

  private recordEvent(
    type: CarouselEvent['type'],
    carouselId: string,
    streamId: string,
    itemId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const event: CarouselEvent = {
      type,
      carouselId,
      streamId,
      itemId,
      userId,
      timestamp: new Date(),
      metadata
    };

    if (!this.eventHistory.has(carouselId)) {
      this.eventHistory.set(carouselId, []);
    }
    
    const events = this.eventHistory.get(carouselId)!;
    events.push(event);
    
    // Keep only recent events
    if (events.length > 1000) {
      this.eventHistory.set(carouselId, events.slice(-1000));
    }
  }

  public getCarousel(carouselId: string): ProductCarousel | undefined {
    return this.carousels.get(carouselId);
  }

  public getActiveCarousel(streamId: string): ProductCarousel | undefined {
    const carouselId = this.activeCarousels.get(streamId);
    return carouselId ? this.carousels.get(carouselId) : undefined;
  }

  public getCurrentItem(carouselId: string): CarouselItem | null {
    const carousel = this.carousels.get(carouselId);
    if (!carousel) return null;

    const items = this.items.get(carouselId) || [];
    return items[carousel.currentItemIndex] || null;
  }

  public getItems(carouselId: string): CarouselItem[] {
    return this.items.get(carouselId) || [];
  }

  public getEventHistory(carouselId: string, limit = 100): CarouselEvent[] {
    const events = this.eventHistory.get(carouselId) || [];
    return events.slice(-limit);
  }

  public getStats(carouselId: string): {
    totalClicks: number;
    totalWishlists: number;
    uniqueUsers: Set<string>;
    topItems: Array<{ itemId: string; clicks: number; wishlists: number }>;
  } {
    const events = this.eventHistory.get(carouselId) || [];
    
    const clicks = events.filter(e => e.type === 'item-clicked');
    const wishlists = events.filter(e => e.type === 'item-wishlisted');
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
    
    const itemStats: Record<string, { clicks: number; wishlists: number }> = {};
    
    clicks.forEach(event => {
      if (event.itemId) {
        itemStats[event.itemId] = itemStats[event.itemId] || { clicks: 0, wishlists: 0 };
        itemStats[event.itemId].clicks++;
      }
    });
    
    wishlists.forEach(event => {
      if (event.itemId) {
        itemStats[event.itemId] = itemStats[event.itemId] || { clicks: 0, wishlists: 0 };
        itemStats[event.itemId].wishlists++;
      }
    });
    
    const topItems = Object.entries(itemStats)
      .map(([itemId, stats]) => ({ itemId, ...stats }))
      .sort((a, b) => (b.clicks + b.wishlists) - (a.clicks + a.wishlists))
      .slice(0, 10);
    
    return {
      totalClicks: clicks.length,
      totalWishlists: wishlists.length,
      uniqueUsers,
      topItems
    };
  }

  public async start(): Promise<void> {
    logger.info('Product carousel manager started');
    this.running = true;
  }

  public async stop(): Promise<void> {
    logger.info('Product carousel manager stopping...');
    this.running = false;
    
    // Stop all auto-rotation timers
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    
    this.carousels.clear();
    this.items.clear();
    this.activeCarousels.clear();
    this.timers.clear();
    this.currentPositions.clear();
    this.eventHistory.clear();
  }

  public isRunning(): boolean {
    return this.running;
  }
}
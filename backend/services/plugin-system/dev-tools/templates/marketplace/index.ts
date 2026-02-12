/**
 * {{PluginName}} - Marketplace Plugin
 * 
 * A plugin for managing marketplace operations, product listings, and order processing
 */

import { Plugin, PluginContext, PluginConfig } from '@mnbara/plugin-core';
import { MarketplaceManager, Product, Order, Review } from '@mnbara/marketplace';
import axios from 'axios';

export interface {{PluginName}}Config extends PluginConfig {
  apiEndpoint?: string;
  refreshInterval?: number;
  maxProducts?: number;
  categories?: string[];
  currency?: string;
}

export interface ProductListing extends Product {
  marketplaceId: string;
  sellerId: string;
  listedAt: Date;
  expiresAt?: Date;
  featured: boolean;
}

export interface MarketplaceOrder extends Order {
  marketplaceId: string;
  commission: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export class {{PluginName}} implements Plugin {
  private marketplaceManager: MarketplaceManager;
  private config: {{PluginName}}Config;
  private apiClient: any;
  private products: Map<string, ProductListing> = new Map();
  private orders: Map<string, MarketplaceOrder> = new Map();
  private refreshTimer?: NodeJS.Timeout;

  constructor(private context: PluginContext) {
    this.config = context.config as {{PluginName}}Config;
    this.marketplaceManager = new MarketplaceManager(context);
    
    // Initialize API client
    this.apiClient = axios.create({
      baseURL: this.config.apiEndpoint || 'https://api.marketplace.example.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '{{pluginName}}/1.0.0'
      }
    });
  }

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    console.log('🏪 Initializing {{PluginName}} marketplace plugin');
    
    // Set up marketplace event listeners
    this.setupMarketplaceListeners();
    
    // Start data refresh if interval is configured
    if (this.config.refreshInterval && this.config.refreshInterval > 0) {
      this.startDataRefresh();
    }
    
    // Load initial data
    await this.loadInitialData();
    
    console.log('✅ {{PluginName}} plugin initialized successfully');
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    console.log('🧹 Cleaning up {{PluginName}} plugin');
    
    // Stop refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Clean up managers
    await this.marketplaceManager.destroy();
    
    console.log('✅ {{PluginName}} plugin cleaned up');
  }

  /**
   * Handle product listed hook
   */
  async onProductListed(data: ProductListing): Promise<void> {
    console.log(`📦 Product listed: ${data.name} (${data.id})`);
    
    try {
      // Validate product data
      this.validateProduct(data);
      
      // Store product
      this.products.set(data.id, data);
      
      // Notify marketplace
      await this.marketplaceManager.notifyProductListed(data);
      
      // Check if we need to refresh due to max products limit
      if (this.config.maxProducts && this.products.size > this.config.maxProducts) {
        await this.cleanupOldProducts();
      }
      
      console.log(`✅ Product ${data.id} listed successfully`);
    } catch (error) {
      console.error(`❌ Failed to list product ${data.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle product sold hook
   */
  async onProductSold(data: { productId: string; orderId: string; quantity: number; price: number }): Promise<void> {
    console.log(`💰 Product sold: ${data.productId} (Order: ${data.orderId})`);
    
    try {
      // Update product inventory
      const product = this.products.get(data.productId);
      if (product) {
        product.stock = Math.max(0, (product.stock || 0) - data.quantity);
        
        // Remove product if out of stock
        if (product.stock === 0) {
          this.products.delete(data.productId);
        }
      }
      
      // Update order
      const order = this.orders.get(data.orderId);
      if (order) {
        order.status = 'confirmed';
        order.updatedAt = new Date();
      }
      
      // Notify marketplace
      await this.marketplaceManager.notifyProductSold(data);
      
      console.log(`✅ Product ${data.productId} sold successfully`);
    } catch (error) {
      console.error(`❌ Failed to process product sold ${data.productId}:`, error);
      throw error;
    }
  }

  /**
   * Handle price changed hook
   */
  async onPriceChanged(data: { productId: string; oldPrice: number; newPrice: number; reason?: string }): Promise<void> {
    console.log(`💲 Price changed for ${data.productId}: $${data.oldPrice} → $${data.newPrice}`);
    
    try {
      // Update product price
      const product = this.products.get(data.productId);
      if (product) {
        product.price = data.newPrice;
        product.updatedAt = new Date();
        
        // Log price change
        await this.logPriceChange(data);
      }
      
      // Notify marketplace
      await this.marketplaceManager.notifyPriceChanged(data);
      
      console.log(`✅ Price updated for product ${data.productId}`);
    } catch (error) {
      console.error(`❌ Failed to update price for ${data.productId}:`, error);
      throw error;
    }
  }

  /**
   * Handle order created hook
   */
  async onOrderCreated(data: MarketplaceOrder): Promise<void> {
    console.log(`📋 Order created: ${data.id} (${data.marketplaceId})`);
    
    try {
      // Validate order
      this.validateOrder(data);
      
      // Store order
      this.orders.set(data.id, data);
      
      // Process order
      await this.processOrder(data);
      
      // Notify marketplace
      await this.marketplaceManager.notifyOrderCreated(data);
      
      console.log(`✅ Order ${data.id} created successfully`);
    } catch (error) {
      console.error(`❌ Failed to create order ${data.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle order completed hook
   */
  async onOrderCompleted(data: { orderId: string; completedAt: Date; trackingNumber?: string }): Promise<void> {
    console.log(`✅ Order completed: ${data.orderId}`);
    
    try {
      // Update order status
      const order = this.orders.get(data.orderId);
      if (order) {
        order.status = 'delivered';
        order.updatedAt = data.completedAt;
        
        if (data.trackingNumber) {
          order.trackingNumber = data.trackingNumber;
        }
      }
      
      // Process commission
      await this.processCommission(order);
      
      // Notify marketplace
      await this.marketplaceManager.notifyOrderCompleted(data);
      
      console.log(`✅ Order ${data.orderId} completed successfully`);
    } catch (error) {
      console.error(`❌ Failed to complete order ${data.orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle review added hook
   */
  async onReviewAdded(data: Review): Promise<void> {
    console.log(`⭐ Review added: ${data.id} for product ${data.productId}`);
    
    try {
      // Validate review
      this.validateReview(data);
      
      // Update product rating
      const product = this.products.get(data.productId);
      if (product) {
        await this.updateProductRating(product, data);
      }
      
      // Notify marketplace
      await this.marketplaceManager.notifyReviewAdded(data);
      
      console.log(`✅ Review ${data.id} added successfully`);
    } catch (error) {
      console.error(`❌ Failed to add review ${data.id}:`, error);
      throw error;
    }
  }

  /**
   * Set up marketplace event listeners
   */
  private setupMarketplaceListeners(): void {
    this.marketplaceManager.on('product:listed', this.onProductListed.bind(this));
    this.marketplaceManager.on('product:sold', this.onProductSold.bind(this));
    this.marketplaceManager.on('product:price-changed', this.onPriceChanged.bind(this));
    this.marketplaceManager.on('marketplace:order-created', this.onOrderCreated.bind(this));
    this.marketplaceManager.on('marketplace:order-completed', this.onOrderCompleted.bind(this));
    this.marketplaceManager.on('marketplace:review-added', this.onReviewAdded.bind(this));
  }

  /**
   * Load initial data
   */
  private async loadInitialData(): Promise<void> {
    try {
      console.log('📊 Loading initial marketplace data...');
      
      // Load products
      const products = await this.marketplaceManager.getProducts();
      products.forEach(product => {
        this.products.set(product.id, product as ProductListing);
      });
      
      // Load orders
      const orders = await this.marketplaceManager.getOrders();
      orders.forEach(order => {
        this.orders.set(order.id, order as MarketplaceOrder);
      });
      
      console.log(`✅ Loaded ${this.products.size} products and ${this.orders.size} orders`);
    } catch (error) {
      console.warn('⚠️  Failed to load initial data:', error);
    }
  }

  /**
   * Start data refresh timer
   */
  private startDataRefresh(): void {
    const interval = this.config.refreshInterval || 300000; // 5 minutes default
    
    this.refreshTimer = setInterval(async () => {
      try {
        console.log('🔄 Refreshing marketplace data...');
        await this.loadInitialData();
      } catch (error) {
        console.error('❌ Failed to refresh data:', error);
      }
    }, interval);
    
    console.log(`✅ Data refresh started (interval: ${interval}ms)`);
  }

  /**
   * Validate product data
   */
  private validateProduct(product: ProductListing): void {
    if (!product.id) throw new Error('Product ID is required');
    if (!product.name) throw new Error('Product name is required');
    if (product.price < 0) throw new Error('Product price cannot be negative');
    if (product.stock < 0) throw new Error('Product stock cannot be negative');
  }

  /**
   * Validate order data
   */
  private validateOrder(order: MarketplaceOrder): void {
    if (!order.id) throw new Error('Order ID is required');
    if (!order.marketplaceId) throw new Error('Marketplace ID is required');
    if (!order.items || order.items.length === 0) throw new Error('Order must have items');
    if (order.totalAmount < 0) throw new Error('Order total cannot be negative');
  }

  /**
   * Validate review data
   */
  private validateReview(review: Review): void {
    if (!review.id) throw new Error('Review ID is required');
    if (!review.productId) throw new Error('Product ID is required');
    if (review.rating < 1 || review.rating > 5) throw new Error('Rating must be between 1 and 5');
  }

  /**
   * Process order
   */
  private async processOrder(order: MarketplaceOrder): Promise<void> {
    // Calculate commission
    order.commission = order.totalAmount * 0.05; // 5% commission
    
    // Set initial status
    order.status = 'pending';
    
    // Validate inventory
    for (const item of order.items) {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }
  }

  /**
   * Process commission
   */
  private async processCommission(order: MarketplaceOrder | undefined): Promise<void> {
    if (!order) return;
    
    // TODO: Implement commission processing logic
    console.log(`💰 Commission processed: $${order.commission} for order ${order.id}`);
  }

  /**
   * Update product rating
   */
  private async updateProductRating(product: ProductListing, review: Review): Promise<void> {
    // This is a simplified implementation
    // In a real system, you'd want to calculate weighted averages
    const currentRating = product.rating || 0;
    const reviewCount = product.reviewCount || 0;
    
    product.rating = ((currentRating * reviewCount) + review.rating) / (reviewCount + 1);
    product.reviewCount = reviewCount + 1;
    product.updatedAt = new Date();
  }

  /**
   * Log price change
   */
  private async logPriceChange(data: { productId: string; oldPrice: number; newPrice: number; reason?: string }): Promise<void> {
    // TODO: Implement price change logging
    console.log(`💲 Price change logged for ${data.productId}: $${data.oldPrice} → $${data.newPrice}`);
  }

  /**
   * Cleanup old products
   */
  private async cleanupOldProducts(): Promise<void> {
    const now = new Date();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    let removedCount = 0;
    for (const [id, product] of this.products.entries()) {
      if (product.expiresAt && product.expiresAt < now) {
        this.products.delete(id);
        removedCount++;
      } else if (product.listedAt && (now.getTime() - product.listedAt.getTime()) > maxAge) {
        this.products.delete(id);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old products`);
    }
  }

  /**
   * Get products
   */
  getProducts(): ProductListing[] {
    return Array.from(this.products.values());
  }

  /**
   * Get orders
   */
  getOrders(): MarketplaceOrder[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get product by ID
   */
  getProduct(id: string): ProductListing | undefined {
    return this.products.get(id);
  }

  /**
   * Get order by ID
   */
  getOrder(id: string): MarketplaceOrder | undefined {
    return this.orders.get(id);
  }

  /**
   * Get plugin info
   */
  getInfo(): any {
    return {
      name: '{{pluginName}}',
      version: '1.0.0',
      products: this.products.size,
      orders: this.orders.size,
      currency: this.config.currency || 'USD'
    };
  }
}
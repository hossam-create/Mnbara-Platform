/**
 * Elasticsearch Sync Worker
 * Listens to RabbitMQ events and syncs data to Elasticsearch indices
 */

import { RabbitMQService } from '../rabbitmq.service';
import { IndexingService, ProductDocument, ListingDocument, AuctionDocument } from './indexing.service';
import { initializeIndices, checkElasticsearchHealth } from './index-manager';
import { getElasticsearchClient } from './elasticsearch.client';

const SEARCH_QUEUE = 'search-indexing';
const SEARCH_EXCHANGE = 'mnbara.events';

// Event types for search indexing
export type SearchEventType =
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'listing.created'
  | 'listing.updated'
  | 'listing.deleted'
  | 'listing.status_changed'
  | 'auction.created'
  | 'auction.updated'
  | 'auction.bid_placed'
  | 'auction.ended'
  | 'auction.deleted'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted';

export interface SearchEvent {
  type: SearchEventType;
  timestamp: string;
  data: unknown;
}

/**
 * Search Sync Worker
 * Processes events from RabbitMQ and updates Elasticsearch
 */
export class SearchSyncWorker {
  private indexingService: IndexingService;
  private isRunning: boolean = false;

  constructor() {
    this.indexingService = new IndexingService();
  }

  /**
   * Start the sync worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[SearchSyncWorker] Already running');
      return;
    }

    console.log('[SearchSyncWorker] Starting...');

    // Wait for Elasticsearch to be healthy
    let retries = 0;
    const maxRetries = 30;
    while (retries < maxRetries) {
      const healthy = await checkElasticsearchHealth();
      if (healthy) {
        console.log('[SearchSyncWorker] Elasticsearch is healthy');
        break;
      }
      console.log(`[SearchSyncWorker] Waiting for Elasticsearch... (${retries + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries++;
    }

    if (retries >= maxRetries) {
      throw new Error('Elasticsearch is not available');
    }

    // Initialize indices
    await initializeIndices();

    // Connect to RabbitMQ and set up queue
    await this.setupQueue();

    // Start consuming events
    await this.consumeEvents();

    this.isRunning = true;
    console.log('[SearchSyncWorker] Started successfully');
  }

  /**
   * Set up RabbitMQ queue for search indexing
   */
  private async setupQueue(): Promise<void> {
    await RabbitMQService.connect();

    // The queue will be created by RabbitMQ service
    // We need to bind it to relevant routing keys
    const client = getElasticsearchClient();
    
    // Verify connection
    await client.ping();
  }

  /**
   * Consume events from RabbitMQ
   */
  private async consumeEvents(): Promise<void> {
    await RabbitMQService.consume(SEARCH_QUEUE, async (event: SearchEvent) => {
      try {
        await this.processEvent(event);
      } catch (error) {
        console.error('[SearchSyncWorker] Error processing event:', error);
        // Don't throw - let the message be acknowledged to prevent infinite retries
      }
    });
  }

  /**
   * Process a single event
   */
  private async processEvent(event: SearchEvent): Promise<void> {
    console.log(`[SearchSyncWorker] Processing event: ${event.type}`);

    switch (event.type) {
      // Product events
      case 'product.created':
        await this.handleProductCreated(event.data as ProductDocument);
        break;
      case 'product.updated':
        await this.handleProductUpdated(event.data as { id: string; updates: Partial<ProductDocument> });
        break;
      case 'product.deleted':
        await this.handleProductDeleted(event.data as { id: string });
        break;

      // Listing events
      case 'listing.created':
        await this.handleListingCreated(event.data as ListingDocument);
        break;
      case 'listing.updated':
        await this.handleListingUpdated(event.data as { id: string; updates: Partial<ListingDocument> });
        break;
      case 'listing.deleted':
        await this.handleListingDeleted(event.data as { id: string });
        break;
      case 'listing.status_changed':
        await this.handleListingStatusChanged(event.data as { id: string; status: string });
        break;

      // Auction events
      case 'auction.created':
        await this.handleAuctionCreated(event.data as AuctionDocument);
        break;
      case 'auction.updated':
        await this.handleAuctionUpdated(event.data as { id: string; updates: Partial<AuctionDocument> });
        break;
      case 'auction.bid_placed':
        await this.handleAuctionBidPlaced(event.data as {
          auctionId: string;
          currentBid: number;
          bidsCount: number;
          highestBidder?: { id: string; name: string };
          reserveMet?: boolean;
        });
        break;
      case 'auction.ended':
        await this.handleAuctionEnded(event.data as { id: string; status: string });
        break;
      case 'auction.deleted':
        await this.handleAuctionDeleted(event.data as { id: string });
        break;

      // Category events
      case 'category.created':
      case 'category.updated':
        await this.handleCategoryUpsert(event.data as {
          id: string;
          name: string;
          slug: string;
          parentId?: string;
          path: string;
          level: number;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        });
        break;
      case 'category.deleted':
        await this.handleCategoryDeleted(event.data as { id: string });
        break;

      default:
        console.warn(`[SearchSyncWorker] Unknown event type: ${event.type}`);
    }
  }

  // ==================== Product Handlers ====================

  private async handleProductCreated(product: ProductDocument): Promise<void> {
    await this.indexingService.indexProduct(product);
    console.log(`[SearchSyncWorker] Indexed product: ${product.id}`);
  }

  private async handleProductUpdated(data: { id: string; updates: Partial<ProductDocument> }): Promise<void> {
    await this.indexingService.updateProduct(data.id, data.updates);
    console.log(`[SearchSyncWorker] Updated product: ${data.id}`);
  }

  private async handleProductDeleted(data: { id: string }): Promise<void> {
    try {
      await this.indexingService.deleteProduct(data.id);
      console.log(`[SearchSyncWorker] Deleted product: ${data.id}`);
    } catch (error: unknown) {
      // Ignore not found errors
      if ((error as { meta?: { statusCode?: number } })?.meta?.statusCode !== 404) {
        throw error;
      }
    }
  }

  // ==================== Listing Handlers ====================

  private async handleListingCreated(listing: ListingDocument): Promise<void> {
    await this.indexingService.indexListing(listing);
    console.log(`[SearchSyncWorker] Indexed listing: ${listing.id}`);
  }

  private async handleListingUpdated(data: { id: string; updates: Partial<ListingDocument> }): Promise<void> {
    await this.indexingService.updateListing(data.id, data.updates);
    console.log(`[SearchSyncWorker] Updated listing: ${data.id}`);
  }

  private async handleListingDeleted(data: { id: string }): Promise<void> {
    try {
      await this.indexingService.deleteListing(data.id);
      console.log(`[SearchSyncWorker] Deleted listing: ${data.id}`);
    } catch (error: unknown) {
      if ((error as { meta?: { statusCode?: number } })?.meta?.statusCode !== 404) {
        throw error;
      }
    }
  }

  private async handleListingStatusChanged(data: { id: string; status: string }): Promise<void> {
    await this.indexingService.updateListing(data.id, { status: data.status });
    console.log(`[SearchSyncWorker] Updated listing status: ${data.id} -> ${data.status}`);
  }

  // ==================== Auction Handlers ====================

  private async handleAuctionCreated(auction: AuctionDocument): Promise<void> {
    await this.indexingService.indexAuction(auction);
    console.log(`[SearchSyncWorker] Indexed auction: ${auction.id}`);
  }

  private async handleAuctionUpdated(data: { id: string; updates: Partial<AuctionDocument> }): Promise<void> {
    await this.indexingService.updateAuction(data.id, data.updates);
    console.log(`[SearchSyncWorker] Updated auction: ${data.id}`);
  }

  private async handleAuctionBidPlaced(data: {
    auctionId: string;
    currentBid: number;
    bidsCount: number;
    highestBidder?: { id: string; name: string };
    reserveMet?: boolean;
  }): Promise<void> {
    await this.indexingService.updateAuctionBid(
      data.auctionId,
      data.currentBid,
      data.bidsCount,
      data.highestBidder,
      data.reserveMet
    );
    console.log(`[SearchSyncWorker] Updated auction bid: ${data.auctionId}`);
  }

  private async handleAuctionEnded(data: { id: string; status: string }): Promise<void> {
    await this.indexingService.updateAuction(data.id, { status: data.status });
    console.log(`[SearchSyncWorker] Auction ended: ${data.id}`);
  }

  private async handleAuctionDeleted(data: { id: string }): Promise<void> {
    try {
      await this.indexingService.deleteAuction(data.id);
      console.log(`[SearchSyncWorker] Deleted auction: ${data.id}`);
    } catch (error: unknown) {
      if ((error as { meta?: { statusCode?: number } })?.meta?.statusCode !== 404) {
        throw error;
      }
    }
  }

  // ==================== Category Handlers ====================

  private async handleCategoryUpsert(category: {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    path: string;
    level: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }): Promise<void> {
    await this.indexingService.indexCategory(category);
    console.log(`[SearchSyncWorker] Indexed category: ${category.id}`);
  }

  private async handleCategoryDeleted(data: { id: string }): Promise<void> {
    const client = getElasticsearchClient();
    try {
      await client.delete({
        index: 'mnbara_categories',
        id: data.id,
      });
      console.log(`[SearchSyncWorker] Deleted category: ${data.id}`);
    } catch (error: unknown) {
      if ((error as { meta?: { statusCode?: number } })?.meta?.statusCode !== 404) {
        throw error;
      }
    }
  }

  /**
   * Stop the sync worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    await RabbitMQService.close();
    console.log('[SearchSyncWorker] Stopped');
  }
}

/**
 * Publish a search indexing event
 */
export async function publishSearchEvent(type: SearchEventType, data: unknown): Promise<void> {
  const event: SearchEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  await RabbitMQService.publish(SEARCH_QUEUE, event);
}

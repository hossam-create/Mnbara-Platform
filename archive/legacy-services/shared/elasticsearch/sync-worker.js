"use strict";
/**
 * Elasticsearch Sync Worker
 * Listens to RabbitMQ events and syncs data to Elasticsearch indices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchSyncWorker = void 0;
exports.publishSearchEvent = publishSearchEvent;
const rabbitmq_service_1 = require("../rabbitmq.service");
const indexing_service_1 = require("./indexing.service");
const index_manager_1 = require("./index-manager");
const elasticsearch_client_1 = require("./elasticsearch.client");
const SEARCH_QUEUE = 'search-indexing';
const SEARCH_EXCHANGE = 'mnbara.events';
/**
 * Search Sync Worker
 * Processes events from RabbitMQ and updates Elasticsearch
 */
class SearchSyncWorker {
    constructor() {
        this.isRunning = false;
        this.indexingService = new indexing_service_1.IndexingService();
    }
    /**
     * Start the sync worker
     */
    async start() {
        if (this.isRunning) {
            console.log('[SearchSyncWorker] Already running');
            return;
        }
        console.log('[SearchSyncWorker] Starting...');
        // Wait for Elasticsearch to be healthy
        let retries = 0;
        const maxRetries = 30;
        while (retries < maxRetries) {
            const healthy = await (0, index_manager_1.checkElasticsearchHealth)();
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
        await (0, index_manager_1.initializeIndices)();
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
    async setupQueue() {
        await rabbitmq_service_1.RabbitMQService.connect();
        // The queue will be created by RabbitMQ service
        // We need to bind it to relevant routing keys
        const client = (0, elasticsearch_client_1.getElasticsearchClient)();
        // Verify connection
        await client.ping();
    }
    /**
     * Consume events from RabbitMQ
     */
    async consumeEvents() {
        await rabbitmq_service_1.RabbitMQService.consume(SEARCH_QUEUE, async (event) => {
            try {
                await this.processEvent(event);
            }
            catch (error) {
                console.error('[SearchSyncWorker] Error processing event:', error);
                // Don't throw - let the message be acknowledged to prevent infinite retries
            }
        });
    }
    /**
     * Process a single event
     */
    async processEvent(event) {
        console.log(`[SearchSyncWorker] Processing event: ${event.type}`);
        switch (event.type) {
            // Product events
            case 'product.created':
                await this.handleProductCreated(event.data);
                break;
            case 'product.updated':
                await this.handleProductUpdated(event.data);
                break;
            case 'product.deleted':
                await this.handleProductDeleted(event.data);
                break;
            // Listing events
            case 'listing.created':
                await this.handleListingCreated(event.data);
                break;
            case 'listing.updated':
                await this.handleListingUpdated(event.data);
                break;
            case 'listing.deleted':
                await this.handleListingDeleted(event.data);
                break;
            case 'listing.status_changed':
                await this.handleListingStatusChanged(event.data);
                break;
            // Auction events
            case 'auction.created':
                await this.handleAuctionCreated(event.data);
                break;
            case 'auction.updated':
                await this.handleAuctionUpdated(event.data);
                break;
            case 'auction.bid_placed':
                await this.handleAuctionBidPlaced(event.data);
                break;
            case 'auction.ended':
                await this.handleAuctionEnded(event.data);
                break;
            case 'auction.deleted':
                await this.handleAuctionDeleted(event.data);
                break;
            // Category events
            case 'category.created':
            case 'category.updated':
                await this.handleCategoryUpsert(event.data);
                break;
            case 'category.deleted':
                await this.handleCategoryDeleted(event.data);
                break;
            default:
                console.warn(`[SearchSyncWorker] Unknown event type: ${event.type}`);
        }
    }
    // ==================== Product Handlers ====================
    async handleProductCreated(product) {
        await this.indexingService.indexProduct(product);
        console.log(`[SearchSyncWorker] Indexed product: ${product.id}`);
    }
    async handleProductUpdated(data) {
        await this.indexingService.updateProduct(data.id, data.updates);
        console.log(`[SearchSyncWorker] Updated product: ${data.id}`);
    }
    async handleProductDeleted(data) {
        try {
            await this.indexingService.deleteProduct(data.id);
            console.log(`[SearchSyncWorker] Deleted product: ${data.id}`);
        }
        catch (error) {
            // Ignore not found errors
            if (error?.meta?.statusCode !== 404) {
                throw error;
            }
        }
    }
    // ==================== Listing Handlers ====================
    async handleListingCreated(listing) {
        await this.indexingService.indexListing(listing);
        console.log(`[SearchSyncWorker] Indexed listing: ${listing.id}`);
    }
    async handleListingUpdated(data) {
        await this.indexingService.updateListing(data.id, data.updates);
        console.log(`[SearchSyncWorker] Updated listing: ${data.id}`);
    }
    async handleListingDeleted(data) {
        try {
            await this.indexingService.deleteListing(data.id);
            console.log(`[SearchSyncWorker] Deleted listing: ${data.id}`);
        }
        catch (error) {
            if (error?.meta?.statusCode !== 404) {
                throw error;
            }
        }
    }
    async handleListingStatusChanged(data) {
        await this.indexingService.updateListing(data.id, { status: data.status });
        console.log(`[SearchSyncWorker] Updated listing status: ${data.id} -> ${data.status}`);
    }
    // ==================== Auction Handlers ====================
    async handleAuctionCreated(auction) {
        await this.indexingService.indexAuction(auction);
        console.log(`[SearchSyncWorker] Indexed auction: ${auction.id}`);
    }
    async handleAuctionUpdated(data) {
        await this.indexingService.updateAuction(data.id, data.updates);
        console.log(`[SearchSyncWorker] Updated auction: ${data.id}`);
    }
    async handleAuctionBidPlaced(data) {
        await this.indexingService.updateAuctionBid(data.auctionId, data.currentBid, data.bidsCount, data.highestBidder, data.reserveMet);
        console.log(`[SearchSyncWorker] Updated auction bid: ${data.auctionId}`);
    }
    async handleAuctionEnded(data) {
        await this.indexingService.updateAuction(data.id, { status: data.status });
        console.log(`[SearchSyncWorker] Auction ended: ${data.id}`);
    }
    async handleAuctionDeleted(data) {
        try {
            await this.indexingService.deleteAuction(data.id);
            console.log(`[SearchSyncWorker] Deleted auction: ${data.id}`);
        }
        catch (error) {
            if (error?.meta?.statusCode !== 404) {
                throw error;
            }
        }
    }
    // ==================== Category Handlers ====================
    async handleCategoryUpsert(category) {
        await this.indexingService.indexCategory(category);
        console.log(`[SearchSyncWorker] Indexed category: ${category.id}`);
    }
    async handleCategoryDeleted(data) {
        const client = (0, elasticsearch_client_1.getElasticsearchClient)();
        try {
            await client.delete({
                index: 'mnbara_categories',
                id: data.id,
            });
            console.log(`[SearchSyncWorker] Deleted category: ${data.id}`);
        }
        catch (error) {
            if (error?.meta?.statusCode !== 404) {
                throw error;
            }
        }
    }
    /**
     * Stop the sync worker
     */
    async stop() {
        this.isRunning = false;
        await rabbitmq_service_1.RabbitMQService.close();
        console.log('[SearchSyncWorker] Stopped');
    }
}
exports.SearchSyncWorker = SearchSyncWorker;
/**
 * Publish a search indexing event
 */
async function publishSearchEvent(type, data) {
    const event = {
        type,
        timestamp: new Date().toISOString(),
        data,
    };
    await rabbitmq_service_1.RabbitMQService.publish(SEARCH_QUEUE, event);
}
//# sourceMappingURL=sync-worker.js.map
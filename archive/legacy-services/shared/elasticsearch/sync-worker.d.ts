/**
 * Elasticsearch Sync Worker
 * Listens to RabbitMQ events and syncs data to Elasticsearch indices
 */
export type SearchEventType = 'product.created' | 'product.updated' | 'product.deleted' | 'listing.created' | 'listing.updated' | 'listing.deleted' | 'listing.status_changed' | 'auction.created' | 'auction.updated' | 'auction.bid_placed' | 'auction.ended' | 'auction.deleted' | 'category.created' | 'category.updated' | 'category.deleted';
export interface SearchEvent {
    type: SearchEventType;
    timestamp: string;
    data: unknown;
}
/**
 * Search Sync Worker
 * Processes events from RabbitMQ and updates Elasticsearch
 */
export declare class SearchSyncWorker {
    private indexingService;
    private isRunning;
    constructor();
    /**
     * Start the sync worker
     */
    start(): Promise<void>;
    /**
     * Set up RabbitMQ queue for search indexing
     */
    private setupQueue;
    /**
     * Consume events from RabbitMQ
     */
    private consumeEvents;
    /**
     * Process a single event
     */
    private processEvent;
    private handleProductCreated;
    private handleProductUpdated;
    private handleProductDeleted;
    private handleListingCreated;
    private handleListingUpdated;
    private handleListingDeleted;
    private handleListingStatusChanged;
    private handleAuctionCreated;
    private handleAuctionUpdated;
    private handleAuctionBidPlaced;
    private handleAuctionEnded;
    private handleAuctionDeleted;
    private handleCategoryUpsert;
    private handleCategoryDeleted;
    /**
     * Stop the sync worker
     */
    stop(): Promise<void>;
}
/**
 * Publish a search indexing event
 */
export declare function publishSearchEvent(type: SearchEventType, data: unknown): Promise<void>;
//# sourceMappingURL=sync-worker.d.ts.map
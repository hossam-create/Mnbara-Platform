/**
 * Elasticsearch Indexing Service
 * Handles document indexing, updates, and bulk operations
 */
export interface ProductDocument {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    categoryId: string;
    categoryPath?: string;
    categoryName?: string;
    price: number;
    currency: string;
    condition: string;
    status: string;
    images: string[];
    tags?: string[];
    attributes?: Record<string, unknown>;
    location?: {
        lat: number;
        lon: number;
    };
    city?: string;
    country?: string;
    seller?: {
        id: string;
        name: string;
        rating: number;
        verified: boolean;
    };
    viewsCount?: number;
    favoritesCount?: number;
    createdAt: string;
    updatedAt: string;
}
export interface ListingDocument {
    id: string;
    productId: string;
    sellerId: string;
    type: 'fixed' | 'auction';
    title: string;
    description: string;
    categoryId: string;
    categoryPath?: string;
    startPrice?: number;
    currentPrice: number;
    buyItNowPrice?: number;
    reservePrice?: number;
    currency: string;
    condition: string;
    status: string;
    images: string[];
    location?: {
        lat: number;
        lon: number;
    };
    city?: string;
    country?: string;
    startAt: string;
    endAt: string;
    bidsCount?: number;
    viewsCount?: number;
    watchersCount?: number;
    featured?: boolean;
    highlighted?: boolean;
    seller?: {
        id: string;
        name: string;
        rating: number;
        verified: boolean;
    };
    createdAt: string;
    updatedAt: string;
}
export interface AuctionDocument extends ListingDocument {
    listingId: string;
    currentBid: number;
    reserveMet: boolean;
    timeRemaining?: number;
    uniqueBidders?: number;
    highestBidder?: {
        id: string;
        name: string;
    };
    autoExtend: boolean;
    extensionMinutes: number;
}
export declare class IndexingService {
    private client;
    /**
     * Index a single product
     */
    indexProduct(product: ProductDocument): Promise<void>;
    /**
     * Update a product document
     */
    updateProduct(productId: string, updates: Partial<ProductDocument>): Promise<void>;
    /**
     * Delete a product from the index
     */
    deleteProduct(productId: string): Promise<void>;
    /**
     * Bulk index products
     */
    bulkIndexProducts(products: ProductDocument[]): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Index a single listing
     */
    indexListing(listing: ListingDocument): Promise<void>;
    /**
     * Update a listing document
     */
    updateListing(listingId: string, updates: Partial<ListingDocument>): Promise<void>;
    /**
     * Delete a listing from the index
     */
    deleteListing(listingId: string): Promise<void>;
    /**
     * Bulk index listings
     */
    bulkIndexListings(listings: ListingDocument[]): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Index a single auction
     */
    indexAuction(auction: AuctionDocument): Promise<void>;
    /**
     * Update an auction document
     */
    updateAuction(auctionId: string, updates: Partial<AuctionDocument>): Promise<void>;
    /**
     * Update auction bid information (optimized for frequent updates)
     */
    updateAuctionBid(auctionId: string, currentBid: number, bidsCount: number, highestBidder?: {
        id: string;
        name: string;
    }, reserveMet?: boolean): Promise<void>;
    /**
     * Delete an auction from the index
     */
    deleteAuction(auctionId: string): Promise<void>;
    /**
     * Bulk index auctions
     */
    bulkIndexAuctions(auctions: AuctionDocument[]): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Index a category
     */
    indexCategory(category: {
        id: string;
        name: string;
        slug: string;
        parentId?: string;
        path: string;
        level: number;
        listingsCount?: number;
        activeListingsCount?: number;
        icon?: string;
        image?: string;
        sortOrder?: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }): Promise<void>;
    /**
     * Bulk index categories
     */
    bulkIndexCategories(categories: Array<{
        id: string;
        name: string;
        slug: string;
        parentId?: string;
        path: string;
        level: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }>): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Refresh all indices to make changes searchable
     */
    refreshAllIndices(): Promise<void>;
    /**
     * Delete documents by query
     */
    deleteByQuery(indexName: string, query: Record<string, unknown>): Promise<number>;
    /**
     * Update documents by query
     */
    updateByQuery(indexName: string, query: Record<string, unknown>, script: string): Promise<number>;
}
//# sourceMappingURL=indexing.service.d.ts.map
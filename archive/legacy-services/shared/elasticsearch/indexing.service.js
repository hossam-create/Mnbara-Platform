"use strict";
/**
 * Elasticsearch Indexing Service
 * Handles document indexing, updates, and bulk operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const elasticsearch_client_1 = require("./elasticsearch.client");
const elasticsearch_config_1 = require("./elasticsearch.config");
const index_manager_1 = require("./index-manager");
class IndexingService {
    constructor() {
        this.client = (0, elasticsearch_client_1.getElasticsearchClient)();
    }
    // ==================== Product Indexing ====================
    /**
     * Index a single product
     */
    async indexProduct(product) {
        await this.client.index({
            index: elasticsearch_config_1.INDICES.PRODUCTS,
            id: product.id,
            body: product,
            refresh: false,
        });
    }
    /**
     * Update a product document
     */
    async updateProduct(productId, updates) {
        await this.client.update({
            index: elasticsearch_config_1.INDICES.PRODUCTS,
            id: productId,
            body: {
                doc: {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                },
            },
            refresh: false,
        });
    }
    /**
     * Delete a product from the index
     */
    async deleteProduct(productId) {
        await this.client.delete({
            index: elasticsearch_config_1.INDICES.PRODUCTS,
            id: productId,
            refresh: false,
        });
    }
    /**
     * Bulk index products
     */
    async bulkIndexProducts(products) {
        if (products.length === 0) {
            return { successful: 0, failed: 0, errors: [] };
        }
        const operations = products.flatMap((product) => [
            { index: { _index: elasticsearch_config_1.INDICES.PRODUCTS, _id: product.id } },
            product,
        ]);
        const response = await this.client.bulk({
            body: operations,
            refresh: false,
        });
        const errors = [];
        let failed = 0;
        if (response.errors) {
            for (const item of response.items) {
                if (item.index?.error) {
                    failed++;
                    errors.push(`${item.index._id}: ${item.index.error.reason || 'Unknown error'}`);
                }
            }
        }
        return {
            successful: products.length - failed,
            failed,
            errors,
        };
    }
    // ==================== Listing Indexing ====================
    /**
     * Index a single listing
     */
    async indexListing(listing) {
        await this.client.index({
            index: elasticsearch_config_1.INDICES.LISTINGS,
            id: listing.id,
            body: listing,
            refresh: false,
        });
    }
    /**
     * Update a listing document
     */
    async updateListing(listingId, updates) {
        await this.client.update({
            index: elasticsearch_config_1.INDICES.LISTINGS,
            id: listingId,
            body: {
                doc: {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                },
            },
            refresh: false,
        });
    }
    /**
     * Delete a listing from the index
     */
    async deleteListing(listingId) {
        await this.client.delete({
            index: elasticsearch_config_1.INDICES.LISTINGS,
            id: listingId,
            refresh: false,
        });
    }
    /**
     * Bulk index listings
     */
    async bulkIndexListings(listings) {
        if (listings.length === 0) {
            return { successful: 0, failed: 0, errors: [] };
        }
        const operations = listings.flatMap((listing) => [
            { index: { _index: elasticsearch_config_1.INDICES.LISTINGS, _id: listing.id } },
            listing,
        ]);
        const response = await this.client.bulk({
            body: operations,
            refresh: false,
        });
        const errors = [];
        let failed = 0;
        if (response.errors) {
            for (const item of response.items) {
                if (item.index?.error) {
                    failed++;
                    errors.push(`${item.index._id}: ${item.index.error.reason || 'Unknown error'}`);
                }
            }
        }
        return {
            successful: listings.length - failed,
            failed,
            errors,
        };
    }
    // ==================== Auction Indexing ====================
    /**
     * Index a single auction
     */
    async indexAuction(auction) {
        await this.client.index({
            index: elasticsearch_config_1.INDICES.AUCTIONS,
            id: auction.id,
            body: auction,
            refresh: false,
        });
    }
    /**
     * Update an auction document
     */
    async updateAuction(auctionId, updates) {
        await this.client.update({
            index: elasticsearch_config_1.INDICES.AUCTIONS,
            id: auctionId,
            body: {
                doc: {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                },
            },
            refresh: false,
        });
    }
    /**
     * Update auction bid information (optimized for frequent updates)
     */
    async updateAuctionBid(auctionId, currentBid, bidsCount, highestBidder, reserveMet) {
        await this.client.update({
            index: elasticsearch_config_1.INDICES.AUCTIONS,
            id: auctionId,
            body: {
                doc: {
                    currentBid,
                    bidsCount,
                    highestBidder,
                    reserveMet,
                    updatedAt: new Date().toISOString(),
                },
            },
            refresh: false,
        });
    }
    /**
     * Delete an auction from the index
     */
    async deleteAuction(auctionId) {
        await this.client.delete({
            index: elasticsearch_config_1.INDICES.AUCTIONS,
            id: auctionId,
            refresh: false,
        });
    }
    /**
     * Bulk index auctions
     */
    async bulkIndexAuctions(auctions) {
        if (auctions.length === 0) {
            return { successful: 0, failed: 0, errors: [] };
        }
        const operations = auctions.flatMap((auction) => [
            { index: { _index: elasticsearch_config_1.INDICES.AUCTIONS, _id: auction.id } },
            auction,
        ]);
        const response = await this.client.bulk({
            body: operations,
            refresh: false,
        });
        const errors = [];
        let failed = 0;
        if (response.errors) {
            for (const item of response.items) {
                if (item.index?.error) {
                    failed++;
                    errors.push(`${item.index._id}: ${item.index.error.reason || 'Unknown error'}`);
                }
            }
        }
        return {
            successful: auctions.length - failed,
            failed,
            errors,
        };
    }
    // ==================== Category Indexing ====================
    /**
     * Index a category
     */
    async indexCategory(category) {
        await this.client.index({
            index: elasticsearch_config_1.INDICES.CATEGORIES,
            id: category.id,
            body: category,
            refresh: false,
        });
    }
    /**
     * Bulk index categories
     */
    async bulkIndexCategories(categories) {
        if (categories.length === 0) {
            return { successful: 0, failed: 0, errors: [] };
        }
        const operations = categories.flatMap((category) => [
            { index: { _index: elasticsearch_config_1.INDICES.CATEGORIES, _id: category.id } },
            category,
        ]);
        const response = await this.client.bulk({
            body: operations,
            refresh: false,
        });
        const errors = [];
        let failed = 0;
        if (response.errors) {
            for (const item of response.items) {
                if (item.index?.error) {
                    failed++;
                    errors.push(`${item.index._id}: ${item.index.error.reason || 'Unknown error'}`);
                }
            }
        }
        return {
            successful: categories.length - failed,
            failed,
            errors,
        };
    }
    // ==================== Utility Methods ====================
    /**
     * Refresh all indices to make changes searchable
     */
    async refreshAllIndices() {
        for (const indexName of Object.values(elasticsearch_config_1.INDICES)) {
            await (0, index_manager_1.refreshIndex)(indexName);
        }
    }
    /**
     * Delete documents by query
     */
    async deleteByQuery(indexName, query) {
        const response = await this.client.deleteByQuery({
            index: indexName,
            body: { query },
            refresh: true,
        });
        return response.deleted || 0;
    }
    /**
     * Update documents by query
     */
    async updateByQuery(indexName, query, script) {
        const response = await this.client.updateByQuery({
            index: indexName,
            body: {
                query,
                script: {
                    source: script,
                    lang: 'painless',
                },
            },
            refresh: true,
        });
        return response.updated || 0;
    }
}
exports.IndexingService = IndexingService;
//# sourceMappingURL=indexing.service.js.map
/**
 * Elasticsearch Indexing Service
 * Handles document indexing, updates, and bulk operations
 */

import { getElasticsearchClient } from './elasticsearch.client';
import { INDICES } from './elasticsearch.config';
import { refreshIndex } from './index-manager';

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
  location?: { lat: number; lon: number };
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
  location?: { lat: number; lon: number };
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

export class IndexingService {
  private client = getElasticsearchClient();

  // ==================== Product Indexing ====================

  /**
   * Index a single product
   */
  async indexProduct(product: ProductDocument): Promise<void> {
    await this.client.index({
      index: INDICES.PRODUCTS,
      id: product.id,
      body: product,
      refresh: false,
    });
  }

  /**
   * Update a product document
   */
  async updateProduct(
    productId: string,
    updates: Partial<ProductDocument>
  ): Promise<void> {
    await this.client.update({
      index: INDICES.PRODUCTS,
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
  async deleteProduct(productId: string): Promise<void> {
    await this.client.delete({
      index: INDICES.PRODUCTS,
      id: productId,
      refresh: false,
    });
  }

  /**
   * Bulk index products
   */
  async bulkIndexProducts(products: ProductDocument[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    if (products.length === 0) {
      return { successful: 0, failed: 0, errors: [] };
    }

    const operations = products.flatMap((product) => [
      { index: { _index: INDICES.PRODUCTS, _id: product.id } },
      product,
    ]);

    const response = await this.client.bulk({
      body: operations,
      refresh: false,
    });

    const errors: string[] = [];
    let failed = 0;

    if (response.errors) {
      for (const item of response.items) {
        if (item.index?.error) {
          failed++;
          errors.push(
            `${item.index._id}: ${item.index.error.reason || 'Unknown error'}`
          );
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
  async indexListing(listing: ListingDocument): Promise<void> {
    await this.client.index({
      index: INDICES.LISTINGS,
      id: listing.id,
      body: listing,
      refresh: false,
    });
  }

  /**
   * Update a listing document
   */
  async updateListing(
    listingId: string,
    updates: Partial<ListingDocument>
  ): Promise<void> {
    await this.client.update({
      index: INDICES.LISTINGS,
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
  async deleteListing(listingId: string): Promise<void> {
    await this.client.delete({
      index: INDICES.LISTINGS,
      id: listingId,
      refresh: false,
    });
  }

  /**
   * Bulk index listings
   */
  async bulkIndexListings(listings: ListingDocument[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    if (listings.length === 0) {
      return { successful: 0, failed: 0, errors: [] };
    }

    const operations = listings.flatMap((listing) => [
      { index: { _index: INDICES.LISTINGS, _id: listing.id } },
      listing,
    ]);

    const response = await this.client.bulk({
      body: operations,
      refresh: false,
    });

    const errors: string[] = [];
    let failed = 0;

    if (response.errors) {
      for (const item of response.items) {
        if (item.index?.error) {
          failed++;
          errors.push(
            `${item.index._id}: ${item.index.error.reason || 'Unknown error'}`
          );
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
  async indexAuction(auction: AuctionDocument): Promise<void> {
    await this.client.index({
      index: INDICES.AUCTIONS,
      id: auction.id,
      body: auction,
      refresh: false,
    });
  }

  /**
   * Update an auction document
   */
  async updateAuction(
    auctionId: string,
    updates: Partial<AuctionDocument>
  ): Promise<void> {
    await this.client.update({
      index: INDICES.AUCTIONS,
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
  async updateAuctionBid(
    auctionId: string,
    currentBid: number,
    bidsCount: number,
    highestBidder?: { id: string; name: string },
    reserveMet?: boolean
  ): Promise<void> {
    await this.client.update({
      index: INDICES.AUCTIONS,
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
  async deleteAuction(auctionId: string): Promise<void> {
    await this.client.delete({
      index: INDICES.AUCTIONS,
      id: auctionId,
      refresh: false,
    });
  }

  /**
   * Bulk index auctions
   */
  async bulkIndexAuctions(auctions: AuctionDocument[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    if (auctions.length === 0) {
      return { successful: 0, failed: 0, errors: [] };
    }

    const operations = auctions.flatMap((auction) => [
      { index: { _index: INDICES.AUCTIONS, _id: auction.id } },
      auction,
    ]);

    const response = await this.client.bulk({
      body: operations,
      refresh: false,
    });

    const errors: string[] = [];
    let failed = 0;

    if (response.errors) {
      for (const item of response.items) {
        if (item.index?.error) {
          failed++;
          errors.push(
            `${item.index._id}: ${item.index.error.reason || 'Unknown error'}`
          );
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
  async indexCategory(category: {
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
  }): Promise<void> {
    await this.client.index({
      index: INDICES.CATEGORIES,
      id: category.id,
      body: category,
      refresh: false,
    });
  }

  /**
   * Bulk index categories
   */
  async bulkIndexCategories(
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      parentId?: string;
      path: string;
      level: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>
  ): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    if (categories.length === 0) {
      return { successful: 0, failed: 0, errors: [] };
    }

    const operations = categories.flatMap((category) => [
      { index: { _index: INDICES.CATEGORIES, _id: category.id } },
      category,
    ]);

    const response = await this.client.bulk({
      body: operations,
      refresh: false,
    });

    const errors: string[] = [];
    let failed = 0;

    if (response.errors) {
      for (const item of response.items) {
        if (item.index?.error) {
          failed++;
          errors.push(
            `${item.index._id}: ${item.index.error.reason || 'Unknown error'}`
          );
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
  async refreshAllIndices(): Promise<void> {
    for (const indexName of Object.values(INDICES)) {
      await refreshIndex(indexName);
    }
  }

  /**
   * Delete documents by query
   */
  async deleteByQuery(
    indexName: string,
    query: Record<string, unknown>
  ): Promise<number> {
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
  async updateByQuery(
    indexName: string,
    query: Record<string, unknown>,
    script: string
  ): Promise<number> {
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

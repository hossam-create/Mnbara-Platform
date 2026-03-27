import { MeiliSearch, Index } from 'meilisearch';
import { logger } from '../utils/logger';

export interface SearchableProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  sellerName: string;
  location?: { lat: number; lng: number };
  inStock: boolean;
  imageUrl?: string;
  rating?: number;
  reviewCount: number;
  createdAt: number;
}

export interface SearchableAuction {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  startingBid: number;
  category: string;
  sellerId: string;
  sellerName: string;
  status: string;
  endTime: number;
  imageUrl?: string;
  bidCount: number;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sellerId?: string;
  location?: { lat: number; lng: number; radius: number };
}

export class SearchService {
  private client: MeiliSearch;
  private productsIndex: Index;
  private auctionsIndex: Index;

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey'
    });

    this.productsIndex = this.client.index('products');
    this.auctionsIndex = this.client.index('auctions');
  }

  async initialize() {
    try {
      // Configure products index
      await this.productsIndex.updateSettings({
        searchableAttributes: [
          'name',
          'description',
          'category',
          'sellerName'
        ],
        filterableAttributes: [
          'price',
          'category',
          'inStock',
          'sellerId',
          'rating',
          'createdAt'
        ],
        sortableAttributes: ['price', 'createdAt', 'rating', 'reviewCount'],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness'
        ]
      });

      // Configure auctions index
      await this.auctionsIndex.updateSettings({
        searchableAttributes: [
          'title',
          'description',
          'category',
          'sellerName'
        ],
        filterableAttributes: [
          'currentBid',
          'startingBid',
          'category',
          'sellerId',
          'status',
          'endTime'
        ],
        sortableAttributes: ['currentBid', 'endTime', 'bidCount']
      });

      logger.info('Meilisearch indexes configured successfully');
    } catch (error) {
      logger.error('Failed to configure Meilisearch indexes:', error);
      throw error;
    }
  }

  // Index products
  async indexProducts(products: SearchableProduct[]) {
    try {
      const task = await this.productsIndex.addDocuments(products, {
        primaryKey: 'id'
      });
      logger.info(`Indexed ${products.length} products. Task ID: ${task.taskUid}`);
      return task;
    } catch (error) {
      logger.error('Failed to index products:', error);
      throw error;
    }
  }

  // Index single product
  async indexProduct(product: SearchableProduct) {
    return this.indexProducts([product]);
  }

  // Update product
  async updateProduct(productId: string, updates: Partial<SearchableProduct>) {
    try {
      const task = await this.productsIndex.updateDocuments([
        { id: productId, ...updates }
      ]);
      return task;
    } catch (error) {
      logger.error('Failed to update product:', error);
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId: string) {
    try {
      const task = await this.productsIndex.deleteDocument(productId);
      return task;
    } catch (error) {
      logger.error('Failed to delete product:', error);
      throw error;
    }
  }

  // Search products
  async searchProducts(
    query: string,
    filters?: SearchFilters,
    options?: {
      limit?: number;
      offset?: number;
      sort?: string[];
    }
  ) {
    try {
      const filterArray: string[] = [];

      if (filters?.category) {
        filterArray.push(`category = "${filters.category}"`);
      }
      if (filters?.minPrice !== undefined) {
        filterArray.push(`price >= ${filters.minPrice}`);
      }
      if (filters?.maxPrice !== undefined) {
        filterArray.push(`price <= ${filters.maxPrice}`);
      }
      if (filters?.inStock !== undefined) {
        filterArray.push(`inStock = ${filters.inStock}`);
      }
      if (filters?.sellerId) {
        filterArray.push(`sellerId = "${filters.sellerId}"`);
      }

      // Geo search
      if (filters?.location) {
        const { lat, lng, radius } = filters.location;
        filterArray.push(`_geoRadius(${lat}, ${lng}, ${radius})`);
      }

      const results = await this.productsIndex.search(query, {
        filter: filterArray.length > 0 ? filterArray : undefined,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        sort: options?.sort
      });

      return {
        hits: results.hits,
        total: results.estimatedTotalHits,
        query: results.query,
        processingTimeMs: results.processingTimeMs
      };
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  // Index auctions
  async indexAuctions(auctions: SearchableAuction[]) {
    try {
      const task = await this.auctionsIndex.addDocuments(auctions, {
        primaryKey: 'id'
      });
      logger.info(`Indexed ${auctions.length} auctions. Task ID: ${task.taskUid}`);
      return task;
    } catch (error) {
      logger.error('Failed to index auctions:', error);
      throw error;
    }
  }

  // Search auctions
  async searchAuctions(
    query: string,
    filters?: {
      category?: string;
      status?: string;
      minBid?: number;
      maxBid?: number;
    },
    options?: {
      limit?: number;
      offset?: number;
      sort?: string[];
    }
  ) {
    try {
      const filterArray: string[] = [];

      if (filters?.category) {
        filterArray.push(`category = "${filters.category}"`);
      }
      if (filters?.status) {
        filterArray.push(`status = "${filters.status}"`);
      }
      if (filters?.minBid !== undefined) {
        filterArray.push(`currentBid >= ${filters.minBid}`);
      }
      if (filters?.maxBid !== undefined) {
        filterArray.push(`currentBid <= ${filters.maxBid}`);
      }

      const results = await this.auctionsIndex.search(query, {
        filter: filterArray.length > 0 ? filterArray : undefined,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        sort: options?.sort
      });

      return {
        hits: results.hits,
        total: results.estimatedTotalHits,
        query: results.query,
        processingTimeMs: results.processingTimeMs
      };
    } catch (error) {
      logger.error('Auction search failed:', error);
      throw error;
    }
  }

  // Get search suggestions (autocomplete)
  async getSuggestions(query: string, type: 'products' | 'auctions' = 'products') {
    try {
      const index = type === 'products' ? this.productsIndex : this.auctionsIndex;
      const results = await index.search(query, {
        limit: 5,
        attributesToRetrieve: type === 'products' ? ['id', 'name'] : ['id', 'title']
      });

      return results.hits.map(hit => ({
        id: hit.id,
        text: type === 'products' ? hit.name : hit.title
      }));
    } catch (error) {
      logger.error('Failed to get suggestions:', error);
      throw error;
    }
  }

  // Get facets (for filters UI)
  async getFacets(type: 'products' | 'auctions' = 'products') {
    try {
      const index = type === 'products' ? this.productsIndex : this.auctionsIndex;
      const results = await index.search('', {
        facets: type === 'products' 
          ? ['category', 'inStock', 'rating']
          : ['category', 'status'],
        limit: 0
      });

      return results.facetDistribution;
    } catch (error) {
      logger.error('Failed to get facets:', error);
      throw error;
    }
  }

  // Clear index
  async clearIndex(type: 'products' | 'auctions') {
    try {
      const index = type === 'products' ? this.productsIndex : this.auctionsIndex;
      const task = await index.deleteAllDocuments();
      logger.info(`Cleared ${type} index. Task ID: ${task.taskUid}`);
      return task;
    } catch (error) {
      logger.error(`Failed to clear ${type} index:`, error);
      throw error;
    }
  }

  // Get index stats
  async getStats(type: 'products' | 'auctions') {
    try {
      const index = type === 'products' ? this.productsIndex : this.auctionsIndex;
      const stats = await index.getStats();
      return stats;
    } catch (error) {
      logger.error(`Failed to get ${type} stats:`, error);
      throw error;
    }
  }
}

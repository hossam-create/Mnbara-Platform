import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

/**
 * Elasticsearch Service - eBay-Level Search Engine
 * 
 * Features:
 * - Advanced product search with NLP
 * - Faceted search and filtering
 * - Auto-complete and suggestions
 * - Search analytics and optimization
 * - Real-time indexing
 * - Performance monitoring
 */
export class ElasticsearchService {
  private client: Client;
  private readonly indexName = 'mnbara-products';
  private readonly categoryIndexName = 'mnbara-categories';

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_AUTH ? {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
      } : undefined,
      requestTimeout: 30000,
      pingTimeout: 3000,
      maxRetries: 3
    });
  }

  /**
   * Initialize Elasticsearch indices and mappings
   */
  async initialize(): Promise<void> {
    try {
      await this.createProductIndex();
      await this.createCategoryIndex();
      await this.createSearchTemplates();
      logger.info('Elasticsearch service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch:', error);
      throw error;
    }
  }

  /**
   * Create product index with eBay-level mapping
   */
  private async createProductIndex(): Promise<void> {
    const indexExists = await this.client.indices.exists({
      index: this.indexName
    });

    if (!indexExists) {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                product_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'stop',
                    'stemmer',
                    'synonym_filter'
                  ]
                },
                autocomplete_analyzer: {
                  type: 'custom',
                  tokenizer: 'keyword',
                  filter: [
                    'lowercase',
                    'edge_ngram_filter'
                  ]
                }
              },
              filter: {
                edge_ngram_filter: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 20
                },
                synonym_filter: {
                  type: 'synonym',
                  synonyms: [
                    'phone,mobile,smartphone',
                    'laptop,notebook,computer',
                    'car,vehicle,automobile'
                  ]
                }
              }
            }
          },
          mappings: {
            properties: {
              // Basic product info
              id: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'product_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer'
                  }
                }
              },
              description: {
                type: 'text',
                analyzer: 'product_analyzer'
              },
              shortDescription: {
                type: 'text',
                analyzer: 'product_analyzer'
              },
              
              // Category and classification
              categoryId: { type: 'keyword' },
              categoryName: { type: 'keyword' },
              categoryPath: { type: 'keyword' },
              categoryHierarchy: { type: 'keyword' },
              
              // Seller info
              sellerId: { type: 'keyword' },
              sellerType: { type: 'keyword' },
              sellerRating: { type: 'float' },
              
              // Product details
              brand: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              model: { type: 'keyword' },
              condition: { type: 'keyword' },
              sku: { type: 'keyword' },
              
              // Pricing
              listingType: { type: 'keyword' },
              currentPrice: { type: 'float' },
              startingPrice: { type: 'float' },
              fixedPrice: { type: 'float' },
              
              // Inventory
              quantity: { type: 'integer' },
              quantityAvailable: { type: 'integer' },
              
              // Shipping
              shippingCost: { type: 'float' },
              freeShipping: { type: 'boolean' },
              location: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              country: { type: 'keyword' },
              
              // Status and visibility
              status: { type: 'keyword' },
              isActive: { type: 'boolean' },
              isFeatured: { type: 'boolean' },
              isPromoted: { type: 'boolean' },
              
              // Features
              hasReturns: { type: 'boolean' },
              hasWarranty: { type: 'boolean' },
              
              // Analytics
              viewCount: { type: 'integer' },
              watchCount: { type: 'integer' },
              salesCount: { type: 'integer' },
              
              // Images
              images: {
                type: 'nested',
                properties: {
                  url: { type: 'keyword' },
                  altText: { type: 'text' },
                  isPrimary: { type: 'boolean' }
                }
              },
              
              // Attributes (dynamic)
              attributes: {
                type: 'nested',
                properties: {
                  name: { type: 'keyword' },
                  value: {
                    type: 'text',
                    fields: {
                      keyword: { type: 'keyword' }
                    }
                  }
                }
              },
              
              // SEO
              keywords: { type: 'keyword' },
              tags: { type: 'keyword' },
              
              // Dates
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              publishedAt: { type: 'date' },
              auctionEndTime: { type: 'date' },
              
              // Location for geo search
              geoLocation: { type: 'geo_point' },
              
              // Reviews and ratings
              averageRating: { type: 'float' },
              reviewCount: { type: 'integer' },
              
              // Search boost factors
              popularityScore: { type: 'float' },
              qualityScore: { type: 'float' },
              relevanceBoost: { type: 'float' }
            }
          }
        }
      });
      
      logger.info(`Created Elasticsearch index: ${this.indexName}`);
    }
  }

  /**
   * Create category index
   */
  private async createCategoryIndex(): Promise<void> {
    const indexExists = await this.client.indices.exists({
      index: this.categoryIndexName
    });

    if (!indexExists) {
      await this.client.indices.create({
        index: this.categoryIndexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: {
                type: 'text',
                analyzer: 'product_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer'
                  }
                }
              },
              slug: { type: 'keyword' },
              description: { type: 'text' },
              parentId: { type: 'keyword' },
              path: { type: 'keyword' },
              level: { type: 'integer' },
              productCount: { type: 'integer' },
              isActive: { type: 'boolean' },
              isFeatured: { type: 'boolean' }
            }
          }
        }
      });
      
      logger.info(`Created Elasticsearch index: ${this.categoryIndexName}`);
    }
  }

  /**
   * Create search templates for common queries
   */
  private async createSearchTemplates(): Promise<void> {
    // Product search template
    await this.client.putScript({
      id: 'product_search_template',
      body: {
        script: {
          lang: 'mustache',
          source: {
            query: {
              bool: {
                must: [
                  {
                    multi_match: {
                      query: '{{query}}',
                      fields: [
                        'title^3',
                        'description^2',
                        'brand^2',
                        'attributes.value',
                        'keywords'
                      ],
                      type: 'best_fields',
                      fuzziness: 'AUTO'
                    }
                  }
                ],
                filter: [
                  { term: { isActive: true } },
                  { term: { status: 'ACTIVE' } }
                ]
              }
            },
            sort: [
              { _score: { order: 'desc' } },
              { popularityScore: { order: 'desc' } },
              { createdAt: { order: 'desc' } }
            ],
            aggs: {
              categories: {
                terms: { field: 'categoryName', size: 20 }
              },
              brands: {
                terms: { field: 'brand.keyword', size: 20 }
              },
              conditions: {
                terms: { field: 'condition', size: 10 }
              },
              priceRanges: {
                range: {
                  field: 'currentPrice',
                  ranges: [
                    { to: 25 },
                    { from: 25, to: 50 },
                    { from: 50, to: 100 },
                    { from: 100, to: 500 },
                    { from: 500 }
                  ]
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Search products with advanced filtering - eBay-style
   */
  async searchProducts(params: {
    query?: string;
    categoryId?: string;
    filters?: Record<string, any>;
    sort?: string;
    page?: number;
    size?: number;
    userId?: string;
  }): Promise<any> {
    const {
      query = '',
      categoryId,
      filters = {},
      sort = 'relevance',
      page = 1,
      size = 20,
      userId
    } = params;

    try {
      const searchBody: any = {
        query: {
          bool: {
            must: [],
            filter: [
              { term: { isActive: true } },
              { term: { status: 'ACTIVE' } }
            ]
          }
        },
        sort: this.buildSortCriteria(sort),
        aggs: this.buildAggregations(),
        from: (page - 1) * size,
        size,
        highlight: {
          fields: {
            title: {},
            description: {}
          }
        }
      };

      // Add search query
      if (query) {
        searchBody.query.bool.must.push({
          multi_match: {
            query,
            fields: [
              'title^3',
              'description^2',
              'brand^2',
              'attributes.value',
              'keywords'
            ],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchBody.query.bool.must.push({ match_all: {} });
      }

      // Add category filter
      if (categoryId) {
        searchBody.query.bool.filter.push({
          term: { categoryId }
        });
      }

      // Add custom filters
      this.addFilters(searchBody, filters);

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      // Log search query for analytics
      if (userId || query) {
        this.logSearchQuery({
          query,
          userId,
          categoryId,
          filters,
          resultCount: response.body.hits.total.value
        });
      }

      return {
        products: response.body.hits.hits.map((hit: any) => ({
          ...hit._source,
          score: hit._score,
          highlights: hit.highlight
        })),
        total: response.body.hits.total.value,
        aggregations: response.body.aggregations,
        page,
        size,
        totalPages: Math.ceil(response.body.hits.total.value / size)
      };

    } catch (error) {
      logger.error('Elasticsearch search error:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string, size: number = 10): Promise<string[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    'title.autocomplete': {
                      query,
                      fuzziness: 'AUTO'
                    }
                  }
                }
              ],
              filter: [
                { term: { isActive: true } },
                { term: { status: 'ACTIVE' } }
              ]
            }
          },
          _source: ['title'],
          size
        }
      });

      return response.body.hits.hits.map((hit: any) => hit._source.title);
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Index a product
   */
  async indexProduct(product: any): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: product.id,
        body: this.transformProductForIndex(product)
      });
      
      logger.debug(`Indexed product: ${product.id}`);
    } catch (error) {
      logger.error(`Failed to index product ${product.id}:`, error);
      throw error;
    }
  }

  /**
   * Update a product in the index
   */
  async updateProduct(productId: string, updates: any): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id: productId,
        body: {
          doc: this.transformProductForIndex(updates)
        }
      });
      
      logger.debug(`Updated product in index: ${productId}`);
    } catch (error) {
      logger.error(`Failed to update product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product from the index
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: productId
      });
      
      logger.debug(`Deleted product from index: ${productId}`);
    } catch (error) {
      logger.error(`Failed to delete product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk index products
   */
  async bulkIndexProducts(products: any[]): Promise<void> {
    try {
      const body = products.flatMap(product => [
        { index: { _index: this.indexName, _id: product.id } },
        this.transformProductForIndex(product)
      ]);

      const response = await this.client.bulk({ body });
      
      if (response.body.errors) {
        logger.error('Bulk indexing errors:', response.body.items);
      } else {
        logger.info(`Bulk indexed ${products.length} products`);
      }
    } catch (error) {
      logger.error('Bulk indexing failed:', error);
      throw error;
    }
  }

  /**
   * Check Elasticsearch health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.cluster.health();
      return response.body.status !== 'red';
    } catch (error) {
      logger.error('Elasticsearch health check failed:', error);
      return false;
    }
  }

  /**
   * Close Elasticsearch connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }

  // Private helper methods

  private buildSortCriteria(sort: string): any[] {
    switch (sort) {
      case 'price_asc':
        return [{ currentPrice: { order: 'asc' } }];
      case 'price_desc':
        return [{ currentPrice: { order: 'desc' } }];
      case 'newest':
        return [{ createdAt: { order: 'desc' } }];
      case 'ending_soon':
        return [{ auctionEndTime: { order: 'asc' } }];
      case 'popular':
        return [{ popularityScore: { order: 'desc' } }];
      case 'relevance':
      default:
        return [
          { _score: { order: 'desc' } },
          { popularityScore: { order: 'desc' } }
        ];
    }
  }

  private buildAggregations(): any {
    return {
      categories: {
        terms: { field: 'categoryName', size: 20 }
      },
      brands: {
        terms: { field: 'brand.keyword', size: 20 }
      },
      conditions: {
        terms: { field: 'condition', size: 10 }
      },
      listingTypes: {
        terms: { field: 'listingType', size: 5 }
      },
      priceRanges: {
        range: {
          field: 'currentPrice',
          ranges: [
            { key: 'under_25', to: 25 },
            { key: '25_to_50', from: 25, to: 50 },
            { key: '50_to_100', from: 50, to: 100 },
            { key: '100_to_500', from: 100, to: 500 },
            { key: 'over_500', from: 500 }
          ]
        }
      },
      locations: {
        terms: { field: 'location.keyword', size: 20 }
      },
      freeShipping: {
        terms: { field: 'freeShipping' }
      }
    };
  }

  private addFilters(searchBody: any, filters: Record<string, any>): void {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        switch (key) {
          case 'priceMin':
            searchBody.query.bool.filter.push({
              range: { currentPrice: { gte: value } }
            });
            break;
          case 'priceMax':
            searchBody.query.bool.filter.push({
              range: { currentPrice: { lte: value } }
            });
            break;
          case 'condition':
            searchBody.query.bool.filter.push({
              terms: { condition: Array.isArray(value) ? value : [value] }
            });
            break;
          case 'brand':
            searchBody.query.bool.filter.push({
              terms: { 'brand.keyword': Array.isArray(value) ? value : [value] }
            });
            break;
          case 'location':
            searchBody.query.bool.filter.push({
              term: { 'location.keyword': value }
            });
            break;
          case 'freeShipping':
            if (value === true || value === 'true') {
              searchBody.query.bool.filter.push({
                term: { freeShipping: true }
              });
            }
            break;
          case 'listingType':
            searchBody.query.bool.filter.push({
              term: { listingType: value }
            });
            break;
        }
      }
    });
  }

  private transformProductForIndex(product: any): any {
    return {
      ...product,
      // Add computed fields for search optimization
      popularityScore: this.calculatePopularityScore(product),
      qualityScore: this.calculateQualityScore(product),
      relevanceBoost: this.calculateRelevanceBoost(product)
    };
  }

  private calculatePopularityScore(product: any): number {
    const views = product.viewCount || 0;
    const watches = product.watchCount || 0;
    const sales = product.quantitySold || 0;
    
    return (views * 0.1) + (watches * 0.5) + (sales * 2.0);
  }

  private calculateQualityScore(product: any): number {
    let score = 0;
    
    // Image quality
    if (product.images && product.images.length > 0) {
      score += Math.min(product.images.length * 10, 50);
    }
    
    // Description quality
    if (product.description && product.description.length > 100) {
      score += 20;
    }
    
    // Seller rating
    if (product.sellerRating) {
      score += product.sellerRating * 10;
    }
    
    return Math.min(score, 100);
  }

  private calculateRelevanceBoost(product: any): number {
    let boost = 1.0;
    
    if (product.isFeatured) boost += 0.5;
    if (product.isPromoted) boost += 0.3;
    if (product.freeShipping) boost += 0.2;
    if (product.hasReturns) boost += 0.1;
    
    return boost;
  }

  private async logSearchQuery(params: {
    query?: string;
    userId?: string;
    categoryId?: string;
    filters?: any;
    resultCount: number;
  }): Promise<void> {
    // This would typically log to a separate analytics index
    // For now, we'll just log to the application logs
    logger.info('Search query:', params);
  }
}
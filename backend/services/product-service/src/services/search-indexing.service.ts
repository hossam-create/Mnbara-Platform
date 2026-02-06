/**
 * Search Indexing Service - Elasticsearch Integration
 * 
 * Handles product indexing and removal from Elasticsearch
 */

import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

// Elasticsearch client configuration
const ES_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const ES_PRODUCTS_INDEX = 'products';

let esClient: Client | null = null;

function getClient(): Client {
    if (!esClient) {
        esClient = new Client({
            node: ES_NODE,
            maxRetries: 3,
            requestTimeout: 30000,
        });
    }
    return esClient;
}

/**
 * Product document for Elasticsearch
 */
interface ProductDocument {
    id: string;
    sellerId: string;
    sellerName: string;
    categoryId: string;
    categoryName: string;
    categoryPath: string[];
    
    title: string;
    titleAr: string;
    titleAutocomplete: string[];
    description: string;
    descriptionAr: string;
    
    price: number;
    originalPrice?: number;
    currency: string;
    discount: number;
    
    condition: string;
    status: string;
    listingType: string;
    isAuction: boolean;
    
    images: string[];
    thumbnail?: string;
    
    specifications: Record<string, string>;
    
    city?: string;
    country?: string;
    location?: {
        lat: number;
        lon: number;
    };
    
    stock: number;
    views: number;
    likes: number;
    
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}

export class SearchIndexingService {
    private client = getClient();

    /**
     * Index a product in Elasticsearch
     */
    async indexProduct(product: any): Promise<void> {
        try {
            const document: ProductDocument = {
                id: product.id,
                sellerId: product.sellerId,
                sellerName: product.seller?.name || 'Unknown',
                categoryId: product.categoryId,
                categoryName: product.category?.nameEn || 'Unknown',
                categoryPath: product.category ? [product.category.nameEn] : [],
                
                title: product.title,
                titleAr: product.titleAr,
                titleAutocomplete: [
                    product.title,
                    product.titleAr,
                    ...this.generateAutocompleteTerms(product.title),
                ],
                description: product.description,
                descriptionAr: product.descriptionAr,
                
                price: parseFloat(product.price.toString()),
                originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : undefined,
                currency: product.currency,
                discount: product.discount,
                
                condition: product.condition,
                status: product.status,
                listingType: product.listingType,
                isAuction: product.isAuction,
                
                images: product.images?.map((img: any) => img.url) || [],
                thumbnail: product.images?.find((img: any) => img.isPrimary)?.url,
                
                specifications: product.specifications?.reduce((acc: Record<string, string>, spec: any) => {
                    acc[spec.key] = spec.value;
                    return acc;
                }, {}) || {},
                
                city: product.city,
                country: product.country,
                location: product.latitude && product.longitude ? {
                    lat: product.latitude,
                    lon: product.longitude,
                } : undefined,
                
                stock: product.stock,
                views: product.views,
                likes: product.likes,
                
                createdAt: product.createdAt.toISOString(),
                updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
                publishedAt: product.publishedAt?.toISOString(),
            };

            await this.client.index({
                index: ES_PRODUCTS_INDEX,
                id: product.id,
                document,
                refresh: true, // For development; use 'wait_for' in production
            });

            logger.info('Product indexed in Elasticsearch', { productId: product.id });
        } catch (error) {
            logger.error('Failed to index product in Elasticsearch', { error, productId: product.id });
            throw error;
        }
    }

    /**
     * Update product in Elasticsearch
     */
    async updateProduct(productId: string, updates: Partial<ProductDocument>): Promise<void> {
        try {
            await this.client.update({
                index: ES_PRODUCTS_INDEX,
                id: productId,
                doc: updates,
                refresh: true,
            });

            logger.info('Product updated in Elasticsearch', { productId });
        } catch (error) {
            logger.error('Failed to update product in Elasticsearch', { error, productId });
            throw error;
        }
    }

    /**
     * Delete product from Elasticsearch
     */
    async deleteProduct(productId: string): Promise<void> {
        try {
            await this.client.delete({
                index: ES_PRODUCTS_INDEX,
                id: productId,
                refresh: true,
            });

            logger.info('Product removed from Elasticsearch', { productId });
        } catch (error: any) {
            if (error.meta?.statusCode === 404) {
                logger.warn('Product not found in Elasticsearch', { productId });
            } else {
                logger.error('Failed to remove product from Elasticsearch', { error, productId });
                throw error;
            }
        }
    }

    /**
     * Bulk index multiple products
     */
    async bulkIndexProducts(products: any[]): Promise<void> {
        if (products.length === 0) return;

        try {
            const operations = products.flatMap(product => [
                { index: { _index: ES_PRODUCTS_INDEX, _id: product.id } },
                {
                    id: product.id,
                    sellerId: product.sellerId,
                    sellerName: product.seller?.name || 'Unknown',
                    categoryId: product.categoryId,
                    categoryName: product.category?.nameEn || 'Unknown',
                    title: product.title,
                    titleAr: product.titleAr,
                    titleAutocomplete: [product.title, product.titleAr],
                    description: product.description,
                    descriptionAr: product.descriptionAr,
                    price: parseFloat(product.price.toString()),
                    currency: product.currency,
                    condition: product.condition,
                    status: product.status,
                    listingType: product.listingType,
                    isAuction: product.isAuction,
                    images: product.images?.map((img: any) => img.url) || [],
                    stock: product.stock,
                    views: product.views,
                    likes: product.likes,
                    createdAt: product.createdAt.toISOString(),
                    updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
                }
            ]);

            const response = await this.client.bulk({ operations, refresh: true });

            if (response.errors) {
                const errorItems = response.items.filter((item: any) => item.index?.error);
                logger.error('Bulk indexing had errors', { errorItems });
            }

            logger.info('Bulk indexing completed', { count: products.length });
        } catch (error) {
            logger.error('Failed to bulk index products', { error });
            throw error;
        }
    }

    /**
     * Generate autocomplete terms from title
     */
    private generateAutocompleteTerms(title: string): string[] {
        const words = title.toLowerCase().split(/\s+/);
        const terms: string[] = [];
        
        // Generate n-grams for autocomplete
        for (let n = 1; n <= Math.min(words.length, 4); n++) {
            for (let i = 0; i <= words.length - n; i++) {
                terms.push(words.slice(i, i + n).join(' '));
            }
        }
        
        return [...new Set(terms)];
    }

    /**
     * Create products index with mappings
     */
    async createProductsIndex(): Promise<void> {
        try {
            const indexExists = await this.client.indices.exists({ index: ES_PRODUCTS_INDEX });
            
            if (!indexExists) {
                await this.client.indices.create({
                    index: ES_PRODUCTS_INDEX,
                    body: {
                        settings: {
                            number_of_shards: 1,
                            number_of_replicas: 0,
                            analysis: {
                                analyzer: {
                                    arabic_analyzer: {
                                        type: 'arabic',
                                    },
                                    autocomplete_analyzer: {
                                        type: 'custom',
                                        tokenizer: 'standard',
                                        filter: ['lowercase', 'autocomplete_filter'],
                                    },
                                },
                                filter: {
                                    autocomplete_filter: {
                                        type: 'edge_ngram',
                                        min_gram: 2,
                                        max_gram: 20,
                                    },
                                },
                            },
                        },
                        mappings: {
                            properties: {
                                id: { type: 'keyword' },
                                sellerId: { type: 'keyword' },
                                sellerName: { type: 'text' },
                                categoryId: { type: 'keyword' },
                                categoryName: { type: 'text' },
                                categoryPath: { type: 'keyword' },
                                title: { 
                                    type: 'text',
                                    analyzer: 'standard',
                                    fields: {
                                        autocomplete: {
                                            type: 'text',
                                            analyzer: 'autocomplete_analyzer',
                                        },
                                        keyword: {
                                            type: 'keyword',
                                        },
                                    },
                                },
                                titleAr: { type: 'text', analyzer: 'arabic_analyzer' },
                                titleAutocomplete: { type: 'text', analyzer: 'autocomplete_analyzer' },
                                description: { type: 'text' },
                                descriptionAr: { type: 'text', analyzer: 'arabic_analyzer' },
                                price: { type: 'float' },
                                originalPrice: { type: 'float' },
                                currency: { type: 'keyword' },
                                discount: { type: 'float' },
                                condition: { type: 'keyword' },
                                status: { type: 'keyword' },
                                listingType: { type: 'keyword' },
                                isAuction: { type: 'boolean' },
                                images: { type: 'keyword' },
                                thumbnail: { type: 'keyword' },
                                specifications: { type: 'object', enabled: false },
                                city: { type: 'keyword' },
                                country: { type: 'keyword' },
                                location: { type: 'geo_point' },
                                stock: { type: 'integer' },
                                views: { type: 'integer' },
                                likes: { type: 'integer' },
                                createdAt: { type: 'date' },
                                updatedAt: { type: 'date' },
                                publishedAt: { type: 'date' },
                            },
                        },
                    },
                });

                logger.info('Products index created', { index: ES_PRODUCTS_INDEX });
            }
        } catch (error) {
            logger.error('Failed to create products index', { error });
            throw error;
        }
    }

    /**
     * Delete products index
     */
    async deleteProductsIndex(): Promise<void> {
        try {
            const indexExists = await this.client.indices.exists({ index: ES_PRODUCTS_INDEX });
            
            if (indexExists) {
                await this.client.indices.delete({ index: ES_PRODUCTS_INDEX });
                logger.info('Products index deleted', { index: ES_PRODUCTS_INDEX });
            }
        } catch (error) {
            logger.error('Failed to delete products index', { error });
            throw error;
        }
    }
}

export const searchIndexingService = new SearchIndexingService();

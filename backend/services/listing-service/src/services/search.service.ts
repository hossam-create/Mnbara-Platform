import { Client } from '@elastic/elasticsearch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SearchService {
    private client: Client;
    private indexName = 'listings';

    constructor() {
        this.client = new Client({
            node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
        });
        this.initializeIndex();
    }

    /**
     * Initialize Elasticsearch index with mapping
     */
    private async initializeIndex() {
        try {
            const exists = await this.client.indices.exists({ index: this.indexName });
            if (!exists) {
                await this.client.indices.create({
                    index: this.indexName,
                    mappings: {
                        properties: {
                            title: { type: 'text' },
                            description: { type: 'text' },
                            price: { type: 'double' },
                            categoryId: { type: 'integer' },
                            location: { type: 'geo_point' },
                            status: { type: 'keyword' },
                            createdAt: { type: 'date' }
                        }
                    }
                });
                console.log(`✅ Elasticsearch index '${this.indexName}' created`);
            }
        } catch (error) {
            console.error('❌ Failed to initialize Elasticsearch index:', error);
        }
    }

    /**
     * Index a listing
     */
    async indexListing(listingId: number) {
        try {
            const listing = await prisma.listing.findUnique({
                where: { id: listingId }
            });

            if (!listing) return;

            await this.client.index({
                index: this.indexName,
                id: listing.id.toString(),
                document: {
                    id: listing.id,
                    title: listing.title,
                    description: listing.description,
                    price: Number(listing.price),
                    categoryId: listing.categoryId,
                    location: listing.latitude && listing.longitude ? {
                        lat: listing.latitude,
                        lon: listing.longitude
                    } : null,
                    status: listing.status,
                    createdAt: listing.createdAt
                }
            });
            console.log(`[Search] Indexed listing ${listingId}`);
        } catch (error) {
            console.error(`[Search] Failed to index listing ${listingId}:`, error);
        }
    }

    /**
     * Search listings
     */
    async search(query: string, filters: any = {}) {
        try {
            const must: any[] = [];
            
            // Full text search
            if (query) {
                must.push({
                    multi_match: {
                        query,
                        fields: ['title^2', 'description'],
                        fuzziness: 'AUTO'
                    }
                });
            }

            // Filters
            if (filters.categoryId) {
                must.push({ term: { categoryId: filters.categoryId } });
            }
            if (filters.minPrice || filters.maxPrice) {
                const range: any = {};
                if (filters.minPrice) range.gte = filters.minPrice;
                if (filters.maxPrice) range.lte = filters.maxPrice;
                must.push({ range: { price: range } });
            }
            if (filters.status) {
                must.push({ term: { status: filters.status } });
            }

            // Geo filter
            const filter: any[] = [];
            if (filters.lat && filters.lon && filters.distance) {
                filter.push({
                    geo_distance: {
                        distance: filters.distance,
                        location: {
                            lat: filters.lat,
                            lon: filters.lon
                        }
                    }
                });
            }

            const result = await this.client.search({
                index: this.indexName,
                query: {
                    bool: {
                        must,
                        filter
                    }
                },
                size: 50,
                sort: [
                    { _score: { order: 'desc' } },
                    { createdAt: { order: 'desc' } }
                ]
            });

            return result.hits.hits.map((hit: any) => hit._source);
        } catch (error) {
            console.error('[Search] Search failed:', error);
            throw error;
        }
    }

    /**
     * Delete listing from index
     */
    async deleteListing(listingId: number) {
        try {
            await this.client.delete({
                index: this.indexName,
                id: listingId.toString()
            });
        } catch (error) {
            console.error(`[Search] Failed to delete listing ${listingId}:`, error);
        }
    }
}

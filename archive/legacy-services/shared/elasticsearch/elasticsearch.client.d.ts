/**
 * Elasticsearch Client Service
 * Singleton client for Elasticsearch operations
 */
import { Client } from '@elastic/elasticsearch';
/**
 * Get or create Elasticsearch client instance
 */
export declare function getElasticsearchClient(): Client;
/**
 * Check if Elasticsearch is healthy
 */
export declare function checkElasticsearchHealth(): Promise<boolean>;
/**
 * Close Elasticsearch client connection
 */
export declare function closeElasticsearchClient(): Promise<void>;
//# sourceMappingURL=elasticsearch.client.d.ts.map
/**
 * Elasticsearch Client Service
 * Singleton client for Elasticsearch operations
 */

import { Client } from '@elastic/elasticsearch';
import { elasticsearchConfig } from './elasticsearch.config';

let client: Client | null = null;

/**
 * Get or create Elasticsearch client instance
 */
export function getElasticsearchClient(): Client {
  if (!client) {
    client = new Client({
      node: elasticsearchConfig.node,
      maxRetries: elasticsearchConfig.maxRetries,
      requestTimeout: elasticsearchConfig.requestTimeout,
      sniffOnStart: elasticsearchConfig.sniffOnStart,
      ...(elasticsearchConfig.auth ? { auth: elasticsearchConfig.auth } : {}),
    });
  }
  return client;
}

/**
 * Check if Elasticsearch is healthy
 */
export async function checkElasticsearchHealth(): Promise<boolean> {
  try {
    const esClient = getElasticsearchClient();
    const health = await esClient.cluster.health();
    return health.status === 'green' || health.status === 'yellow';
  } catch (error) {
    console.error('Elasticsearch health check failed:', error);
    return false;
  }
}

/**
 * Close Elasticsearch client connection
 */
export async function closeElasticsearchClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}

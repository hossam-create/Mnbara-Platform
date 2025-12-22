/**
 * Elasticsearch Index Manager
 * Handles index creation, updates, and management
 */

import { getElasticsearchClient } from './elasticsearch.client';
import { INDICES } from './elasticsearch.config';
import {
  allIndexTemplates,
  productsIndexTemplate,
  listingsIndexTemplate,
  auctionsIndexTemplate,
  categoriesIndexTemplate,
} from './index-templates';

/**
 * Initialize all Elasticsearch indices
 * Creates indices if they don't exist
 */
export async function initializeIndices(): Promise<void> {
  const client = getElasticsearchClient();

  for (const template of allIndexTemplates) {
    try {
      const indexExists = await client.indices.exists({ index: template.index });

      if (!indexExists) {
        console.log(`Creating index: ${template.index}`);
        await client.indices.create({
          index: template.index,
          body: template.body,
        });
        console.log(`Index ${template.index} created successfully`);
      } else {
        console.log(`Index ${template.index} already exists`);
      }
    } catch (error) {
      console.error(`Error creating index ${template.index}:`, error);
      throw error;
    }
  }
}

/**
 * Delete and recreate an index (use with caution!)
 */
export async function recreateIndex(indexName: string): Promise<void> {
  const client = getElasticsearchClient();

  const template = allIndexTemplates.find((t) => t.index === indexName);
  if (!template) {
    throw new Error(`Unknown index: ${indexName}`);
  }

  try {
    const indexExists = await client.indices.exists({ index: indexName });

    if (indexExists) {
      console.log(`Deleting index: ${indexName}`);
      await client.indices.delete({ index: indexName });
    }

    console.log(`Creating index: ${indexName}`);
    await client.indices.create({
      index: indexName,
      body: template.body,
    });
    console.log(`Index ${indexName} recreated successfully`);
  } catch (error) {
    console.error(`Error recreating index ${indexName}:`, error);
    throw error;
  }
}

/**
 * Update index mappings (for adding new fields)
 */
export async function updateIndexMappings(
  indexName: string,
  newMappings: Record<string, unknown>
): Promise<void> {
  const client = getElasticsearchClient();

  try {
    await client.indices.putMapping({
      index: indexName,
      body: {
        properties: newMappings,
      },
    });
    console.log(`Mappings updated for index: ${indexName}`);
  } catch (error) {
    console.error(`Error updating mappings for ${indexName}:`, error);
    throw error;
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats(indexName: string): Promise<{
  docsCount: number;
  sizeInBytes: number;
  status: string;
}> {
  const client = getElasticsearchClient();

  try {
    const stats = await client.indices.stats({ index: indexName });
    const indexStats = stats.indices?.[indexName];

    return {
      docsCount: indexStats?.primaries?.docs?.count || 0,
      sizeInBytes: indexStats?.primaries?.store?.size_in_bytes || 0,
      status: 'healthy',
    };
  } catch (error) {
    console.error(`Error getting stats for ${indexName}:`, error);
    return {
      docsCount: 0,
      sizeInBytes: 0,
      status: 'error',
    };
  }
}

/**
 * Refresh index to make recent changes searchable
 */
export async function refreshIndex(indexName: string): Promise<void> {
  const client = getElasticsearchClient();

  try {
    await client.indices.refresh({ index: indexName });
  } catch (error) {
    console.error(`Error refreshing index ${indexName}:`, error);
    throw error;
  }
}

/**
 * Get all indices status
 */
export async function getAllIndicesStatus(): Promise<
  Array<{
    name: string;
    docsCount: number;
    sizeInBytes: number;
    status: string;
  }>
> {
  const results = [];

  for (const indexName of Object.values(INDICES)) {
    const stats = await getIndexStats(indexName);
    results.push({
      name: indexName,
      ...stats,
    });
  }

  return results;
}

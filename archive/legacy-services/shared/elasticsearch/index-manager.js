"use strict";
/**
 * Elasticsearch Index Manager
 * Handles index creation, updates, and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIndices = initializeIndices;
exports.recreateIndex = recreateIndex;
exports.updateIndexMappings = updateIndexMappings;
exports.getIndexStats = getIndexStats;
exports.refreshIndex = refreshIndex;
exports.getAllIndicesStatus = getAllIndicesStatus;
const elasticsearch_client_1 = require("./elasticsearch.client");
const elasticsearch_config_1 = require("./elasticsearch.config");
const index_templates_1 = require("./index-templates");
/**
 * Initialize all Elasticsearch indices
 * Creates indices if they don't exist
 */
async function initializeIndices() {
    const client = (0, elasticsearch_client_1.getElasticsearchClient)();
    for (const template of index_templates_1.allIndexTemplates) {
        try {
            const indexExists = await client.indices.exists({ index: template.index });
            if (!indexExists) {
                console.log(`Creating index: ${template.index}`);
                await client.indices.create({
                    index: template.index,
                    body: template.body,
                });
                console.log(`Index ${template.index} created successfully`);
            }
            else {
                console.log(`Index ${template.index} already exists`);
            }
        }
        catch (error) {
            console.error(`Error creating index ${template.index}:`, error);
            throw error;
        }
    }
}
/**
 * Delete and recreate an index (use with caution!)
 */
async function recreateIndex(indexName) {
    const client = (0, elasticsearch_client_1.getElasticsearchClient)();
    const template = index_templates_1.allIndexTemplates.find((t) => t.index === indexName);
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
    }
    catch (error) {
        console.error(`Error recreating index ${indexName}:`, error);
        throw error;
    }
}
/**
 * Update index mappings (for adding new fields)
 */
async function updateIndexMappings(indexName, newMappings) {
    const client = (0, elasticsearch_client_1.getElasticsearchClient)();
    try {
        await client.indices.putMapping({
            index: indexName,
            body: {
                properties: newMappings,
            },
        });
        console.log(`Mappings updated for index: ${indexName}`);
    }
    catch (error) {
        console.error(`Error updating mappings for ${indexName}:`, error);
        throw error;
    }
}
/**
 * Get index statistics
 */
async function getIndexStats(indexName) {
    const client = (0, elasticsearch_client_1.getElasticsearchClient)();
    try {
        const stats = await client.indices.stats({ index: indexName });
        const indexStats = stats.indices?.[indexName];
        return {
            docsCount: indexStats?.primaries?.docs?.count || 0,
            sizeInBytes: indexStats?.primaries?.store?.size_in_bytes || 0,
            status: 'healthy',
        };
    }
    catch (error) {
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
async function refreshIndex(indexName) {
    const client = (0, elasticsearch_client_1.getElasticsearchClient)();
    try {
        await client.indices.refresh({ index: indexName });
    }
    catch (error) {
        console.error(`Error refreshing index ${indexName}:`, error);
        throw error;
    }
}
/**
 * Get all indices status
 */
async function getAllIndicesStatus() {
    const results = [];
    for (const indexName of Object.values(elasticsearch_config_1.INDICES)) {
        const stats = await getIndexStats(indexName);
        results.push({
            name: indexName,
            ...stats,
        });
    }
    return results;
}
//# sourceMappingURL=index-manager.js.map
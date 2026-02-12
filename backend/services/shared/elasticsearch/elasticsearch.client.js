"use strict";
/**
 * Elasticsearch Client Service
 * Singleton client for Elasticsearch operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElasticsearchClient = getElasticsearchClient;
exports.checkElasticsearchHealth = checkElasticsearchHealth;
exports.closeElasticsearchClient = closeElasticsearchClient;
const elasticsearch_1 = require("@elastic/elasticsearch");
const elasticsearch_config_1 = require("./elasticsearch.config");
let client = null;
/**
 * Get or create Elasticsearch client instance
 */
function getElasticsearchClient() {
    if (!client) {
        client = new elasticsearch_1.Client({
            node: elasticsearch_config_1.elasticsearchConfig.node,
            maxRetries: elasticsearch_config_1.elasticsearchConfig.maxRetries,
            requestTimeout: elasticsearch_config_1.elasticsearchConfig.requestTimeout,
            sniffOnStart: elasticsearch_config_1.elasticsearchConfig.sniffOnStart,
            ...(elasticsearch_config_1.elasticsearchConfig.auth ? { auth: elasticsearch_config_1.elasticsearchConfig.auth } : {}),
        });
    }
    return client;
}
/**
 * Check if Elasticsearch is healthy
 */
async function checkElasticsearchHealth() {
    try {
        const esClient = getElasticsearchClient();
        const health = await esClient.cluster.health();
        return health.status === 'green' || health.status === 'yellow';
    }
    catch (error) {
        console.error('Elasticsearch health check failed:', error);
        return false;
    }
}
/**
 * Close Elasticsearch client connection
 */
async function closeElasticsearchClient() {
    if (client) {
        await client.close();
        client = null;
    }
}
//# sourceMappingURL=elasticsearch.client.js.map
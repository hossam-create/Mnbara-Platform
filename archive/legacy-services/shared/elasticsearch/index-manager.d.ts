/**
 * Elasticsearch Index Manager
 * Handles index creation, updates, and management
 */
/**
 * Initialize all Elasticsearch indices
 * Creates indices if they don't exist
 */
export declare function initializeIndices(): Promise<void>;
/**
 * Delete and recreate an index (use with caution!)
 */
export declare function recreateIndex(indexName: string): Promise<void>;
/**
 * Update index mappings (for adding new fields)
 */
export declare function updateIndexMappings(indexName: string, newMappings: Record<string, unknown>): Promise<void>;
/**
 * Get index statistics
 */
export declare function getIndexStats(indexName: string): Promise<{
    docsCount: number;
    sizeInBytes: number;
    status: string;
}>;
/**
 * Refresh index to make recent changes searchable
 */
export declare function refreshIndex(indexName: string): Promise<void>;
/**
 * Get all indices status
 */
export declare function getAllIndicesStatus(): Promise<Array<{
    name: string;
    docsCount: number;
    sizeInBytes: number;
    status: string;
}>>;
//# sourceMappingURL=index-manager.d.ts.map
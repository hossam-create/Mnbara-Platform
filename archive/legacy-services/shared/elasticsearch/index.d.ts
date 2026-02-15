/**
 * Elasticsearch Module Exports
 */
export { elasticsearchConfig, INDICES, ANALYZERS, TOKENIZERS, FILTERS, type ElasticsearchConfig, } from './elasticsearch.config';
export { getElasticsearchClient, checkElasticsearchHealth, closeElasticsearchClient, } from './elasticsearch.client';
export { productsIndexTemplate, listingsIndexTemplate, auctionsIndexTemplate, categoriesIndexTemplate, allIndexTemplates, } from './index-templates';
export { initializeIndices, recreateIndex, updateIndexMappings, getIndexStats, refreshIndex, getAllIndicesStatus, } from './index-manager';
export { SearchService } from './search.service';
export { IndexingService } from './indexing.service';
export type { ProductDocument, ListingDocument, AuctionDocument } from './indexing.service';
export { SearchSyncWorker, publishSearchEvent } from './sync-worker';
export type { SearchEventType, SearchEvent } from './sync-worker';
export { searchRouter } from './search.controller';
//# sourceMappingURL=index.d.ts.map
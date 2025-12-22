/**
 * Elasticsearch Module Exports
 */

// Configuration
export {
  elasticsearchConfig,
  INDICES,
  ANALYZERS,
  TOKENIZERS,
  FILTERS,
  type ElasticsearchConfig,
} from './elasticsearch.config';

// Client
export {
  getElasticsearchClient,
  checkElasticsearchHealth,
  closeElasticsearchClient,
} from './elasticsearch.client';

// Index Templates
export {
  productsIndexTemplate,
  listingsIndexTemplate,
  auctionsIndexTemplate,
  categoriesIndexTemplate,
  allIndexTemplates,
} from './index-templates';

// Index Manager
export {
  initializeIndices,
  recreateIndex,
  updateIndexMappings,
  getIndexStats,
  refreshIndex,
  getAllIndicesStatus,
} from './index-manager';

// Search Service
export { SearchService } from './search.service';

// Indexing Service
export { IndexingService } from './indexing.service';
export type { ProductDocument, ListingDocument, AuctionDocument } from './indexing.service';

// Sync Worker
export { SearchSyncWorker, publishSearchEvent } from './sync-worker';
export type { SearchEventType, SearchEvent } from './sync-worker';

// Search Controller (Express Router)
export { searchRouter } from './search.controller';

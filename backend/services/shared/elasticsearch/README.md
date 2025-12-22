# Elasticsearch Module

This module provides centralized Elasticsearch configuration, indexing, and search functionality for the MNBARA platform.

## Features

- **Multi-language Search**: Support for English and Arabic text analysis
- **Fuzzy Matching**: Typo-tolerant search with configurable fuzziness
- **Autocomplete**: Edge n-gram based suggestions for instant search
- **Geo-spatial Search**: Location-based filtering with radius search
- **Faceted Search**: Aggregations for category, price, and condition filters
- **Real-time Indexing**: Document indexing with bulk operations support

## Quick Start

### 1. Initialize Indices

```typescript
import { initializeIndices } from '@mnbara/shared/elasticsearch';

// Run once on application startup
await initializeIndices();
```

### 2. Index Documents

```typescript
import { IndexingService } from '@mnbara/shared/elasticsearch';

const indexingService = new IndexingService();

// Index a single product
await indexingService.indexProduct({
  id: 'prod-123',
  sellerId: 'seller-456',
  title: 'iPhone 15 Pro Max',
  description: 'Brand new, sealed in box',
  categoryId: 'electronics-phones',
  price: 1199.99,
  currency: 'USD',
  condition: 'new',
  status: 'active',
  images: ['https://...'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Bulk index products
const result = await indexingService.bulkIndexProducts(products);
console.log(`Indexed ${result.successful} products, ${result.failed} failed`);
```

### 3. Search Products

```typescript
import { SearchService } from '@mnbara/shared/elasticsearch';

const searchService = new SearchService();

// Full-text search with filters
const results = await searchService.searchProducts({
  query: 'iphone',
  filters: {
    categoryId: 'electronics-phones',
    priceMin: 500,
    priceMax: 1500,
    condition: ['new', 'like_new'],
  },
  page: 1,
  pageSize: 20,
  sortBy: 'relevance',
});

// Autocomplete suggestions
const suggestions = await searchService.autocomplete('iph', 10);
```

## Index Structure

### Products Index (`mnbara_products`)
- Full product catalog with all details
- Used for product search and browsing

### Listings Index (`mnbara_listings`)
- Active marketplace listings (fixed price + auctions)
- Includes pricing and timing information

### Auctions Index (`mnbara_auctions`)
- Specialized auction data with bid information
- Optimized for auction-specific queries

### Categories Index (`mnbara_categories`)
- Category hierarchy for browsing and filtering
- Supports autocomplete for category search

## Configuration

Environment variables:

```env
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
```

## Analyzers

### `mnbara_text`
Standard text analyzer with:
- Lowercase filter
- ASCII folding (accent removal)
- English stemming
- Synonym expansion

### `mnbara_autocomplete`
Edge n-gram analyzer for instant search:
- Min gram: 2
- Max gram: 20
- Lowercase and ASCII folding

### `mnbara_arabic`
Arabic text analyzer with:
- Arabic normalization
- Arabic stemming

## Synonyms

Pre-configured synonyms include:
- phone, mobile, cellphone, smartphone
- laptop, notebook, computer
- car, automobile, vehicle
- clothes, clothing, apparel, garments
- And more...

## Integration with RabbitMQ

For real-time index updates, integrate with RabbitMQ events:

```typescript
import { IndexingService } from '@mnbara/shared/elasticsearch';
import { RabbitMQService } from '@mnbara/shared/rabbitmq';

const indexingService = new IndexingService();
const rabbitmq = new RabbitMQService();

// Listen for product events
rabbitmq.subscribe('product.created', async (product) => {
  await indexingService.indexProduct(product);
});

rabbitmq.subscribe('product.updated', async ({ id, updates }) => {
  await indexingService.updateProduct(id, updates);
});

rabbitmq.subscribe('product.deleted', async ({ id }) => {
  await indexingService.deleteProduct(id);
});
```

## Performance Tips

1. **Batch Operations**: Use bulk indexing for large data sets
2. **Refresh Strategy**: Avoid immediate refresh for high-throughput indexing
3. **Query Optimization**: Use filters instead of queries for exact matches
4. **Pagination**: Use `search_after` for deep pagination instead of `from/size`

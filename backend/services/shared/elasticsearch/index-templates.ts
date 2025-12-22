/**
 * Elasticsearch Index Templates
 * Defines mappings and settings for all indices
 */

import { INDICES, ANALYZERS, TOKENIZERS, FILTERS } from './elasticsearch.config';

// Common index settings with analyzers
const commonSettings = {
  number_of_shards: 1,
  number_of_replicas: 0, // Set to 1+ in production
  analysis: {
    analyzer: ANALYZERS,
    tokenizer: TOKENIZERS,
    filter: FILTERS,
  },
};

/**
 * Products Index Template
 * For searchable product catalog
 */
export const productsIndexTemplate = {
  index: INDICES.PRODUCTS,
  body: {
    settings: {
      ...commonSettings,
      max_ngram_diff: 18,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        sellerId: { type: 'keyword' },
        title: {
          type: 'text',
          analyzer: 'mnbara_text',
          fields: {
            keyword: { type: 'keyword' },
            autocomplete: {
              type: 'text',
              analyzer: 'mnbara_autocomplete',
              search_analyzer: 'mnbara_autocomplete_search',
            },
            arabic: {
              type: 'text',
              analyzer: 'mnbara_arabic',
            },
          },
        },
        description: {
          type: 'text',
          analyzer: 'mnbara_text',
          fields: {
            arabic: {
              type: 'text',
              analyzer: 'mnbara_arabic',
            },
          },
        },
        categoryId: { type: 'keyword' },
        categoryPath: { type: 'keyword' }, // Full category hierarchy
        categoryName: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } },
        },
        price: { type: 'float' },
        currency: { type: 'keyword' },
        condition: { type: 'keyword' }, // new, like_new, good, fair
        status: { type: 'keyword' }, // draft, active, sold, archived
        images: { type: 'keyword' }, // Array of image URLs
        tags: {
          type: 'text',
          analyzer: 'mnbara_text',
          fields: { keyword: { type: 'keyword' } },
        },
        attributes: {
          type: 'object',
          enabled: true,
        },
        location: {
          type: 'geo_point',
        },
        city: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } },
        },
        country: { type: 'keyword' },
        seller: {
          type: 'object',
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            rating: { type: 'float' },
            verified: { type: 'boolean' },
          },
        },
        viewsCount: { type: 'integer' },
        favoritesCount: { type: 'integer' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  },
};

/**
 * Listings Index Template
 * For active marketplace listings (fixed price + auctions)
 */
export const listingsIndexTemplate = {
  index: INDICES.LISTINGS,
  body: {
    settings: {
      ...commonSettings,
      max_ngram_diff: 18,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        productId: { type: 'keyword' },
        sellerId: { type: 'keyword' },
        type: { type: 'keyword' }, // fixed, auction
        title: {
          type: 'text',
          analyzer: 'mnbara_text',
          fields: {
            keyword: { type: 'keyword' },
            autocomplete: {
              type: 'text',
              analyzer: 'mnbara_autocomplete',
              search_analyzer: 'mnbara_autocomplete_search',
            },
          },
        },
        description: {
          type: 'text',
          analyzer: 'mnbara_text',
        },
        categoryId: { type: 'keyword' },
        categoryPath: { type: 'keyword' },
        startPrice: { type: 'float' },
        currentPrice: { type: 'float' },
        buyItNowPrice: { type: 'float' },
        reservePrice: { type: 'float' },
        currency: { type: 'keyword' },
        condition: { type: 'keyword' },
        status: { type: 'keyword' }, // scheduled, active, ended, sold
        images: { type: 'keyword' },
        location: { type: 'geo_point' },
        city: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        country: { type: 'keyword' },
        startAt: { type: 'date' },
        endAt: { type: 'date' },
        bidsCount: { type: 'integer' },
        viewsCount: { type: 'integer' },
        watchersCount: { type: 'integer' },
        featured: { type: 'boolean' },
        highlighted: { type: 'boolean' },
        seller: {
          type: 'object',
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            rating: { type: 'float' },
            verified: { type: 'boolean' },
          },
        },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  },
};

/**
 * Auctions Index Template
 * Specialized index for auction-specific search and filtering
 */
export const auctionsIndexTemplate = {
  index: INDICES.AUCTIONS,
  body: {
    settings: {
      ...commonSettings,
      max_ngram_diff: 18,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        listingId: { type: 'keyword' },
        productId: { type: 'keyword' },
        sellerId: { type: 'keyword' },
        title: {
          type: 'text',
          analyzer: 'mnbara_text',
          fields: {
            keyword: { type: 'keyword' },
            autocomplete: {
              type: 'text',
              analyzer: 'mnbara_autocomplete',
              search_analyzer: 'mnbara_autocomplete_search',
            },
          },
        },
        description: { type: 'text', analyzer: 'mnbara_text' },
        categoryId: { type: 'keyword' },
        categoryPath: { type: 'keyword' },
        startPrice: { type: 'float' },
        currentBid: { type: 'float' },
        reservePrice: { type: 'float' },
        buyItNowPrice: { type: 'float' },
        reserveMet: { type: 'boolean' },
        currency: { type: 'keyword' },
        condition: { type: 'keyword' },
        status: { type: 'keyword' }, // scheduled, active, ending_soon, ended, sold
        images: { type: 'keyword' },
        location: { type: 'geo_point' },
        city: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        country: { type: 'keyword' },
        startAt: { type: 'date' },
        endAt: { type: 'date' },
        timeRemaining: { type: 'long' }, // Seconds remaining (updated periodically)
        bidsCount: { type: 'integer' },
        uniqueBidders: { type: 'integer' },
        highestBidder: {
          type: 'object',
          properties: {
            id: { type: 'keyword' },
            name: { type: 'keyword' },
          },
        },
        autoExtend: { type: 'boolean' },
        extensionMinutes: { type: 'integer' },
        featured: { type: 'boolean' },
        seller: {
          type: 'object',
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            rating: { type: 'float' },
            verified: { type: 'boolean' },
          },
        },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  },
};

/**
 * Categories Index Template
 * For category browsing and filtering
 */
export const categoriesIndexTemplate = {
  index: INDICES.CATEGORIES,
  body: {
    settings: {
      ...commonSettings,
      max_ngram_diff: 18,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'mnbara_text',
          fields: {
            keyword: { type: 'keyword' },
            autocomplete: {
              type: 'text',
              analyzer: 'mnbara_autocomplete',
              search_analyzer: 'mnbara_autocomplete_search',
            },
          },
        },
        slug: { type: 'keyword' },
        parentId: { type: 'keyword' },
        path: { type: 'keyword' }, // Full path like "electronics/phones/smartphones"
        level: { type: 'integer' },
        listingsCount: { type: 'integer' },
        activeListingsCount: { type: 'integer' },
        icon: { type: 'keyword' },
        image: { type: 'keyword' },
        sortOrder: { type: 'integer' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  },
};

export const allIndexTemplates = [
  productsIndexTemplate,
  listingsIndexTemplate,
  auctionsIndexTemplate,
  categoriesIndexTemplate,
];

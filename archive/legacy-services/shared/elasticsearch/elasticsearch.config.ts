/**
 * Elasticsearch Configuration
 * Centralized configuration for Elasticsearch client and index settings
 */

export interface ElasticsearchConfig {
  node: string;
  maxRetries: number;
  requestTimeout: number;
  sniffOnStart: boolean;
  auth?: {
    username: string;
    password: string;
  };
}

export const elasticsearchConfig: ElasticsearchConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: false,
  ...(process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
    ? {
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD,
        },
      }
    : {}),
};

// Index names
export const INDICES = {
  PRODUCTS: 'mnbarh_products',
  LISTINGS: 'mnbarh_listings',
  AUCTIONS: 'mnbarh_auctions',
  USERS: 'mnbarh_users',
  CATEGORIES: 'mnbarh_categories',
} as const;

// Analyzer configurations for multi-language support
export const ANALYZERS = {
  // Custom analyzer for product titles and descriptions
  mnbarh_text: {
    type: 'custom' as const,
    tokenizer: 'standard',
    filter: ['lowercase', 'asciifolding', 'mnbarh_stemmer', 'mnbarh_synonyms'],
  },
  // Analyzer for autocomplete suggestions
  mnbarh_autocomplete: {
    type: 'custom' as const,
    tokenizer: 'mnbarh_autocomplete_tokenizer',
    filter: ['lowercase', 'asciifolding'],
  },
  // Search analyzer for autocomplete (no edge ngram on search)
  mnbarh_autocomplete_search: {
    type: 'custom' as const,
    tokenizer: 'standard',
    filter: ['lowercase', 'asciifolding'],
  },
  // Arabic text analyzer
  mnbarh_arabic: {
    type: 'custom' as const,
    tokenizer: 'standard',
    filter: ['lowercase', 'arabic_normalization', 'arabic_stemmer'],
  },
};

// Tokenizer configurations
export const TOKENIZERS = {
  mnbarh_autocomplete_tokenizer: {
    type: 'edge_ngram' as const,
    min_gram: 2,
    max_gram: 20,
    token_chars: ['letter', 'digit'],
  },
};

// Filter configurations
export const FILTERS = {
  mnbarh_stemmer: {
    type: 'stemmer' as const,
    language: 'english',
  },
  mnbarh_synonyms: {
    type: 'synonym' as const,
    synonyms: [
      'phone, mobile, cellphone, smartphone',
      'laptop, notebook, computer',
      'car, automobile, vehicle',
      'clothes, clothing, apparel, garments',
      'shoes, footwear, sneakers',
      'watch, timepiece, wristwatch',
      'bag, handbag, purse',
      'jewelry, jewellery, accessories',
      'electronics, gadgets, devices',
      'furniture, furnishings',
    ],
  },
  arabic_stemmer: {
    type: 'stemmer' as const,
    language: 'arabic',
  },
};

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
  PRODUCTS: 'mnbara_products',
  LISTINGS: 'mnbara_listings',
  AUCTIONS: 'mnbara_auctions',
  USERS: 'mnbara_users',
  CATEGORIES: 'mnbara_categories',
} as const;

// Analyzer configurations for multi-language support
export const ANALYZERS = {
  // Custom analyzer for product titles and descriptions
  mnbara_text: {
    type: 'custom' as const,
    tokenizer: 'standard',
    filter: ['lowercase', 'asciifolding', 'mnbara_stemmer', 'mnbara_synonyms'],
  },
  // Analyzer for autocomplete suggestions
  mnbara_autocomplete: {
    type: 'custom' as const,
    tokenizer: 'mnbara_autocomplete_tokenizer',
    filter: ['lowercase', 'asciifolding'],
  },
  // Search analyzer for autocomplete (no edge ngram on search)
  mnbara_autocomplete_search: {
    type: 'custom' as const,
    tokenizer: 'standard',
    filter: ['lowercase', 'asciifolding'],
  },
  // Arabic text analyzer
  mnbara_arabic: {
    type: 'custom' as const,
    tokenizer: 'standard',
    filter: ['lowercase', 'arabic_normalization', 'arabic_stemmer'],
  },
};

// Tokenizer configurations
export const TOKENIZERS = {
  mnbara_autocomplete_tokenizer: {
    type: 'edge_ngram' as const,
    min_gram: 2,
    max_gram: 20,
    token_chars: ['letter', 'digit'],
  },
};

// Filter configurations
export const FILTERS = {
  mnbara_stemmer: {
    type: 'stemmer' as const,
    language: 'english',
  },
  mnbara_synonyms: {
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

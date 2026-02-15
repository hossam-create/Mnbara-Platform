"use strict";
/**
 * Elasticsearch Configuration
 * Centralized configuration for Elasticsearch client and index settings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILTERS = exports.TOKENIZERS = exports.ANALYZERS = exports.INDICES = exports.elasticsearchConfig = void 0;
exports.elasticsearchConfig = {
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
exports.INDICES = {
    PRODUCTS: 'mnbarh_products',
    LISTINGS: 'mnbarh_listings',
    AUCTIONS: 'mnbarh_auctions',
    USERS: 'mnbarh_users',
    CATEGORIES: 'mnbarh_categories',
};
// Analyzer configurations for multi-language support
exports.ANALYZERS = {
    // Custom analyzer for product titles and descriptions
    mnbarh_text: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding', 'mnbarh_stemmer', 'mnbarh_synonyms'],
    },
    // Analyzer for autocomplete suggestions
    mnbarh_autocomplete: {
        type: 'custom',
        tokenizer: 'mnbarh_autocomplete_tokenizer',
        filter: ['lowercase', 'asciifolding'],
    },
    // Search analyzer for autocomplete (no edge ngram on search)
    mnbarh_autocomplete_search: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding'],
    },
    // Arabic text analyzer
    mnbarh_arabic: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'arabic_normalization', 'arabic_stemmer'],
    },
};
// Tokenizer configurations
exports.TOKENIZERS = {
    mnbarh_autocomplete_tokenizer: {
        type: 'edge_ngram',
        min_gram: 2,
        max_gram: 20,
        token_chars: ['letter', 'digit'],
    },
};
// Filter configurations
exports.FILTERS = {
    mnbarh_stemmer: {
        type: 'stemmer',
        language: 'english',
    },
    mnbarh_synonyms: {
        type: 'synonym',
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
        type: 'stemmer',
        language: 'arabic',
    },
};
//# sourceMappingURL=elasticsearch.config.js.map
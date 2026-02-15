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
export declare const elasticsearchConfig: ElasticsearchConfig;
export declare const INDICES: {
    readonly PRODUCTS: "mnbarh_products";
    readonly LISTINGS: "mnbarh_listings";
    readonly AUCTIONS: "mnbarh_auctions";
    readonly USERS: "mnbarh_users";
    readonly CATEGORIES: "mnbarh_categories";
};
export declare const ANALYZERS: {
    mnbarh_text: {
        type: "custom";
        tokenizer: string;
        filter: string[];
    };
    mnbarh_autocomplete: {
        type: "custom";
        tokenizer: string;
        filter: string[];
    };
    mnbarh_autocomplete_search: {
        type: "custom";
        tokenizer: string;
        filter: string[];
    };
    mnbarh_arabic: {
        type: "custom";
        tokenizer: string;
        filter: string[];
    };
};
export declare const TOKENIZERS: {
    mnbarh_autocomplete_tokenizer: {
        type: "edge_ngram";
        min_gram: number;
        max_gram: number;
        token_chars: string[];
    };
};
export declare const FILTERS: {
    mnbarh_stemmer: {
        type: "stemmer";
        language: string;
    };
    mnbarh_synonyms: {
        type: "synonym";
        synonyms: string[];
    };
    arabic_stemmer: {
        type: "stemmer";
        language: string;
    };
};
//# sourceMappingURL=elasticsearch.config.d.ts.map
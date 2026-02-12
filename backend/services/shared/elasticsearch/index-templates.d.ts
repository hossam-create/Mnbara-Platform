/**
 * Elasticsearch Index Templates
 * Defines mappings and settings for all indices
 */
/**
 * Products Index Template
 * For searchable product catalog
 */
export declare const productsIndexTemplate: {
    index: "mnbarh_products";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                sellerId: {
                    type: string;
                };
                title: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                        arabic: {
                            type: string;
                            analyzer: string;
                        };
                    };
                };
                description: {
                    type: string;
                    analyzer: string;
                    fields: {
                        arabic: {
                            type: string;
                            analyzer: string;
                        };
                    };
                };
                categoryId: {
                    type: string;
                };
                categoryPath: {
                    type: string;
                };
                categoryName: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                price: {
                    type: string;
                };
                currency: {
                    type: string;
                };
                condition: {
                    type: string;
                };
                status: {
                    type: string;
                };
                images: {
                    type: string;
                };
                tags: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                attributes: {
                    type: string;
                    enabled: boolean;
                };
                location: {
                    type: string;
                };
                city: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                country: {
                    type: string;
                };
                seller: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                            fields: {
                                keyword: {
                                    type: string;
                                };
                            };
                        };
                        rating: {
                            type: string;
                        };
                        verified: {
                            type: string;
                        };
                    };
                };
                viewsCount: {
                    type: string;
                };
                favoritesCount: {
                    type: string;
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
};
/**
 * Listings Index Template
 * For active marketplace listings (fixed price + auctions)
 */
export declare const listingsIndexTemplate: {
    index: "mnbarh_listings";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                productId: {
                    type: string;
                };
                sellerId: {
                    type: string;
                };
                type: {
                    type: string;
                };
                title: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                    };
                };
                description: {
                    type: string;
                    analyzer: string;
                };
                categoryId: {
                    type: string;
                };
                categoryPath: {
                    type: string;
                };
                startPrice: {
                    type: string;
                };
                currentPrice: {
                    type: string;
                };
                buyItNowPrice: {
                    type: string;
                };
                reservePrice: {
                    type: string;
                };
                currency: {
                    type: string;
                };
                condition: {
                    type: string;
                };
                status: {
                    type: string;
                };
                images: {
                    type: string;
                };
                location: {
                    type: string;
                };
                city: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                country: {
                    type: string;
                };
                startAt: {
                    type: string;
                };
                endAt: {
                    type: string;
                };
                bidsCount: {
                    type: string;
                };
                viewsCount: {
                    type: string;
                };
                watchersCount: {
                    type: string;
                };
                featured: {
                    type: string;
                };
                highlighted: {
                    type: string;
                };
                seller: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                            fields: {
                                keyword: {
                                    type: string;
                                };
                            };
                        };
                        rating: {
                            type: string;
                        };
                        verified: {
                            type: string;
                        };
                    };
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
};
/**
 * Auctions Index Template
 * Specialized index for auction-specific search and filtering
 */
export declare const auctionsIndexTemplate: {
    index: "mnbarh_auctions";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                listingId: {
                    type: string;
                };
                productId: {
                    type: string;
                };
                sellerId: {
                    type: string;
                };
                title: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                    };
                };
                description: {
                    type: string;
                    analyzer: string;
                };
                categoryId: {
                    type: string;
                };
                categoryPath: {
                    type: string;
                };
                startPrice: {
                    type: string;
                };
                currentBid: {
                    type: string;
                };
                reservePrice: {
                    type: string;
                };
                buyItNowPrice: {
                    type: string;
                };
                reserveMet: {
                    type: string;
                };
                currency: {
                    type: string;
                };
                condition: {
                    type: string;
                };
                status: {
                    type: string;
                };
                images: {
                    type: string;
                };
                location: {
                    type: string;
                };
                city: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                country: {
                    type: string;
                };
                startAt: {
                    type: string;
                };
                endAt: {
                    type: string;
                };
                timeRemaining: {
                    type: string;
                };
                bidsCount: {
                    type: string;
                };
                uniqueBidders: {
                    type: string;
                };
                highestBidder: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                    };
                };
                autoExtend: {
                    type: string;
                };
                extensionMinutes: {
                    type: string;
                };
                featured: {
                    type: string;
                };
                seller: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                            fields: {
                                keyword: {
                                    type: string;
                                };
                            };
                        };
                        rating: {
                            type: string;
                        };
                        verified: {
                            type: string;
                        };
                    };
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
};
/**
 * Categories Index Template
 * For category browsing and filtering
 */
export declare const categoriesIndexTemplate: {
    index: "mnbarh_categories";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                name: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                    };
                };
                slug: {
                    type: string;
                };
                parentId: {
                    type: string;
                };
                path: {
                    type: string;
                };
                level: {
                    type: string;
                };
                listingsCount: {
                    type: string;
                };
                activeListingsCount: {
                    type: string;
                };
                icon: {
                    type: string;
                };
                image: {
                    type: string;
                };
                sortOrder: {
                    type: string;
                };
                isActive: {
                    type: string;
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
};
export declare const allIndexTemplates: ({
    index: "mnbarh_products";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                sellerId: {
                    type: string;
                };
                title: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                        arabic: {
                            type: string;
                            analyzer: string;
                        };
                    };
                };
                description: {
                    type: string;
                    analyzer: string;
                    fields: {
                        arabic: {
                            type: string;
                            analyzer: string;
                        };
                    };
                };
                categoryId: {
                    type: string;
                };
                categoryPath: {
                    type: string;
                };
                categoryName: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                price: {
                    type: string;
                };
                currency: {
                    type: string;
                };
                condition: {
                    type: string;
                };
                status: {
                    type: string;
                };
                images: {
                    type: string;
                };
                tags: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                attributes: {
                    type: string;
                    enabled: boolean;
                };
                location: {
                    type: string;
                };
                city: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                country: {
                    type: string;
                };
                seller: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                            fields: {
                                keyword: {
                                    type: string;
                                };
                            };
                        };
                        rating: {
                            type: string;
                        };
                        verified: {
                            type: string;
                        };
                    };
                };
                viewsCount: {
                    type: string;
                };
                favoritesCount: {
                    type: string;
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
} | {
    index: "mnbarh_listings";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                productId: {
                    type: string;
                };
                sellerId: {
                    type: string;
                };
                type: {
                    type: string;
                };
                title: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                    };
                };
                description: {
                    type: string;
                    analyzer: string;
                };
                categoryId: {
                    type: string;
                };
                categoryPath: {
                    type: string;
                };
                startPrice: {
                    type: string;
                };
                currentPrice: {
                    type: string;
                };
                buyItNowPrice: {
                    type: string;
                };
                reservePrice: {
                    type: string;
                };
                currency: {
                    type: string;
                };
                condition: {
                    type: string;
                };
                status: {
                    type: string;
                };
                images: {
                    type: string;
                };
                location: {
                    type: string;
                };
                city: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                country: {
                    type: string;
                };
                startAt: {
                    type: string;
                };
                endAt: {
                    type: string;
                };
                bidsCount: {
                    type: string;
                };
                viewsCount: {
                    type: string;
                };
                watchersCount: {
                    type: string;
                };
                featured: {
                    type: string;
                };
                highlighted: {
                    type: string;
                };
                seller: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                            fields: {
                                keyword: {
                                    type: string;
                                };
                            };
                        };
                        rating: {
                            type: string;
                        };
                        verified: {
                            type: string;
                        };
                    };
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
} | {
    index: "mnbarh_auctions";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                listingId: {
                    type: string;
                };
                productId: {
                    type: string;
                };
                sellerId: {
                    type: string;
                };
                title: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                    };
                };
                description: {
                    type: string;
                    analyzer: string;
                };
                categoryId: {
                    type: string;
                };
                categoryPath: {
                    type: string;
                };
                startPrice: {
                    type: string;
                };
                currentBid: {
                    type: string;
                };
                reservePrice: {
                    type: string;
                };
                buyItNowPrice: {
                    type: string;
                };
                reserveMet: {
                    type: string;
                };
                currency: {
                    type: string;
                };
                condition: {
                    type: string;
                };
                status: {
                    type: string;
                };
                images: {
                    type: string;
                };
                location: {
                    type: string;
                };
                city: {
                    type: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                    };
                };
                country: {
                    type: string;
                };
                startAt: {
                    type: string;
                };
                endAt: {
                    type: string;
                };
                timeRemaining: {
                    type: string;
                };
                bidsCount: {
                    type: string;
                };
                uniqueBidders: {
                    type: string;
                };
                highestBidder: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                    };
                };
                autoExtend: {
                    type: string;
                };
                extensionMinutes: {
                    type: string;
                };
                featured: {
                    type: string;
                };
                seller: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        name: {
                            type: string;
                            fields: {
                                keyword: {
                                    type: string;
                                };
                            };
                        };
                        rating: {
                            type: string;
                        };
                        verified: {
                            type: string;
                        };
                    };
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
} | {
    index: "mnbarh_categories";
    body: {
        settings: {
            max_ngram_diff: number;
            number_of_shards: number;
            number_of_replicas: number;
            analysis: {
                analyzer: {
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
                tokenizer: {
                    mnbarh_autocomplete_tokenizer: {
                        type: "edge_ngram";
                        min_gram: number;
                        max_gram: number;
                        token_chars: string[];
                    };
                };
                filter: {
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
            };
        };
        mappings: {
            properties: {
                id: {
                    type: string;
                };
                name: {
                    type: string;
                    analyzer: string;
                    fields: {
                        keyword: {
                            type: string;
                        };
                        autocomplete: {
                            type: string;
                            analyzer: string;
                            search_analyzer: string;
                        };
                    };
                };
                slug: {
                    type: string;
                };
                parentId: {
                    type: string;
                };
                path: {
                    type: string;
                };
                level: {
                    type: string;
                };
                listingsCount: {
                    type: string;
                };
                activeListingsCount: {
                    type: string;
                };
                icon: {
                    type: string;
                };
                image: {
                    type: string;
                };
                sortOrder: {
                    type: string;
                };
                isActive: {
                    type: string;
                };
                createdAt: {
                    type: string;
                };
                updatedAt: {
                    type: string;
                };
            };
        };
    };
})[];
//# sourceMappingURL=index-templates.d.ts.map
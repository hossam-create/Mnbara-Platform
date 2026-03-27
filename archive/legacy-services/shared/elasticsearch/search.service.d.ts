/**
 * Elasticsearch Search Service
 * Provides search functionality with fuzzy matching, autocomplete, and filters
 */
export interface SearchFilters {
    categoryId?: string;
    categoryPath?: string;
    priceMin?: number;
    priceMax?: number;
    condition?: string[];
    status?: string[];
    location?: {
        lat: number;
        lon: number;
        radiusKm: number;
    };
    city?: string;
    country?: string;
    sellerId?: string;
    featured?: boolean;
    type?: 'fixed' | 'auction';
}
export interface SearchOptions {
    query: string;
    filters?: SearchFilters;
    page?: number;
    pageSize?: number;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'ending_soon' | 'popularity';
}
export interface SearchResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    aggregations?: Record<string, unknown>;
}
export interface AutocompleteResult {
    text: string;
    type: 'product' | 'category' | 'suggestion';
    id?: string;
    score: number;
}
export declare class SearchService {
    private client;
    /**
     * Search products with full-text search, filters, and sorting
     */
    searchProducts(options: SearchOptions): Promise<SearchResult<unknown>>;
    /**
     * Search listings (both fixed price and auctions)
     */
    searchListings(options: SearchOptions): Promise<SearchResult<unknown>>;
    /**
     * Search auctions with auction-specific filters
     */
    searchAuctions(options: SearchOptions & {
        endingSoon?: boolean;
        reserveMet?: boolean;
    }): Promise<SearchResult<unknown>>;
    /**
     * Autocomplete suggestions for search
     */
    autocomplete(query: string, limit?: number): Promise<AutocompleteResult[]>;
    /**
     * Get search suggestions based on popular searches
     */
    getSuggestions(query: string, limit?: number): Promise<string[]>;
    /**
     * Apply common filters to search query
     */
    private applyFilters;
    /**
     * Build sort configuration
     */
    private buildSort;
}
//# sourceMappingURL=search.service.d.ts.map
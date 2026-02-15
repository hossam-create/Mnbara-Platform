/**
 * Plugin Marketplace Service
 *
 * Manages plugin discovery, installation, ratings, reviews, and marketplace
 * operations. Provides plugin search, filtering, and recommendation features.
 *
 * Features:
 * - Plugin discovery and search
 * - Rating and review system
 * - Plugin recommendations
 * - Category management
 * - Version management
 * - Publisher management
 *
 * Usage:
 * ```typescript
 * const marketplace = new PluginMarketplace(prisma);
 * const plugins = await marketplace.searchPlugins({ category: 'payment' });
 * ```
 */
import { PrismaClient } from '@prisma/client';
export interface PluginSearchOptions {
    query?: string;
    category?: string;
    tags?: string[];
    minRating?: number;
    verifiedOnly?: boolean;
    sortBy?: 'name' | 'rating' | 'downloads' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export interface PluginRatingData {
    pluginId: string;
    userId: string;
    rating: number;
    review?: string;
    version?: string;
}
export interface PluginPublisherData {
    name: string;
    email: string;
    website?: string;
    verified: boolean;
    description?: string;
}
export interface PluginVersionData {
    pluginId: string;
    version: string;
    manifest: any;
    downloadUrl: string;
    changelog?: string;
    minCoreVersion?: string;
    maxCoreVersion?: string;
    dependencies?: string[];
}
export interface MarketplaceStats {
    totalPlugins: number;
    totalDownloads: number;
    totalPublishers: number;
    averageRating: number;
    topCategories: Array<{
        category: string;
        count: number;
    }>;
    recentPlugins: Array<{
        name: string;
        createdAt: Date;
    }>;
    popularPlugins: Array<{
        name: string;
        downloads: number;
    }>;
}
export declare class PluginMarketplace {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Search plugins with various filters
     */
    searchPlugins(options?: PluginSearchOptions): Promise<any[]>;
    /**
     * Get plugin details by ID
     */
    getPluginById(pluginId: string): Promise<any>;
    /**
     * Get plugin by name
     */
    getPluginByName(name: string): Promise<any>;
    /**
     * Add or update plugin rating
     */
    addRating(data: PluginRatingData): Promise<any>;
    /**
     * Get plugin rating distribution
     */
    private getRatingDistribution;
    /**
     * Update plugin average rating
     */
    private updatePluginAverageRating;
    /**
     * Record plugin download
     */
    recordDownload(pluginId: string, userId: string, version: string): Promise<void>;
    /**
     * Get plugin recommendations for a user
     */
    getRecommendations(userId: string, limit?: number): Promise<any[]>;
    /**
     * Get trending plugins
     */
    getTrendingPlugins(limit?: number): Promise<any[]>;
    /**
     * Get categories with plugin counts
     */
    getCategories(): Promise<any[]>;
    /**
     * Get marketplace statistics
     */
    getMarketplaceStats(): Promise<MarketplaceStats>;
    /**
     * Create or update publisher
     */
    createOrUpdatePublisher(data: PluginPublisherData): Promise<any>;
    /**
     * Add plugin version
     */
    addPluginVersion(data: PluginVersionData): Promise<any>;
    /**
     * Get plugin versions
     */
    getPluginVersions(pluginId: string): Promise<any[]>;
    /**
     * Check plugin compatibility
     */
    checkCompatibility(pluginId: string, coreVersion: string): Promise<{
        compatible: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=PluginMarketplace.d.ts.map
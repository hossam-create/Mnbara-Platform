import { CrafterCMSClient } from './CrafterCMSClient';
import { Logger } from '@mnbara/shared-utils';
import { ContentItem, ContentQuery, SearchResult, ContentFetchOptions } from '../types/Content.types';
import { CacheService } from '../services/CacheService';

/**
 * Content Fetcher Service - Handles content retrieval with caching and optimization
 */
export class ContentFetcher {
  private crafterClient: CrafterCMSClient;
  private cacheService: CacheService;
  private logger: Logger;

  constructor(crafterClient: CrafterCMSClient, cacheService: CacheService) {
    this.crafterClient = crafterClient;
    this.cacheService = cacheService;
    this.logger = new Logger('ContentFetcher');
  }

  /**
   * Fetch content with caching
   */
  async fetchContent(
    siteId: string, 
    path: string, 
    options: ContentFetchOptions = {}
  ): Promise<ContentItem | null> {
    const cacheKey = `content:${siteId}:${path}:${options.locale || 'en'}`;
    const cacheTTL = options.cacheTTL || 300; // 5 minutes default

    try {
      // Check cache first
      if (!options.skipCache) {
        const cachedContent = await this.cacheService.get<ContentItem>(cacheKey);
        if (cachedContent) {
          this.logger.debug(`Cache hit for content: ${path}`);
          return cachedContent;
        }
      }

      // Fetch from CrafterCMS
      this.logger.info(`Fetching content: ${path} from site: ${siteId}`);
      const content = await this.crafterClient.getContentByPath(siteId, path);

      // Cache the result
      if (!options.skipCache && content) {
        await this.cacheService.set(cacheKey, content, cacheTTL);
      }

      return content;
    } catch (error) {
      this.logger.error(`Failed to fetch content: ${path}`, error);
      
      // Return stale cache if available and allowStale is true
      if (options.allowStale) {
        const staleContent = await this.cacheService.get<ContentItem>(cacheKey);
        if (staleContent) {
          this.logger.warn(`Returning stale cache for content: ${path}`);
          return staleContent;
        }
      }

      throw error;
    }
  }

  /**
   * Fetch multiple content items efficiently
   */
  async fetchMultipleContent(
    siteId: string, 
    paths: string[], 
    options: ContentFetchOptions = {}
  ): Promise<Map<string, ContentItem | null>> {
    const results = new Map<string, ContentItem | null>();
    const fetchPromises: Promise<void>[] = [];

    for (const path of paths) {
      const fetchPromise = this.fetchContent(siteId, path, options)
        .then(content => {
          results.set(path, content);
        })
        .catch(error => {
          this.logger.error(`Failed to fetch content: ${path}`, error);
          results.set(path, null);
        });
      
      fetchPromises.push(fetchPromise);
    }

    await Promise.all(fetchPromises);
    return results;
  }

  /**
   * Fetch content tree with nested children
   */
  async fetchContentTree(
    siteId: string, 
    path: string = '/', 
    depth: number = 3,
    options: ContentFetchOptions = {}
  ): Promise<any> {
    const cacheKey = `content-tree:${siteId}:${path}:${depth}:${options.locale || 'en'}`;

    try {
      // Check cache
      if (!options.skipCache) {
        const cachedTree = await this.cacheService.get<any>(cacheKey);
        if (cachedTree) {
          this.logger.debug(`Cache hit for content tree: ${path}`);
          return cachedTree;
        }
      }

      // Fetch tree from CrafterCMS
      this.logger.info(`Fetching content tree: ${path} (depth: ${depth}) from site: ${siteId}`);
      const tree = await this.crafterClient.getContentTree(siteId, path);

      // Apply depth limit and fetch additional details if needed
      const processedTree = await this.processContentTree(tree, depth, options);

      // Cache the result
      if (!options.skipCache) {
        await this.cacheService.set(cacheKey, processedTree, options.cacheTTL || 600); // 10 minutes
      }

      return processedTree;
    } catch (error) {
      this.logger.error(`Failed to fetch content tree: ${path}`, error);
      throw error;
    }
  }

  /**
   * Search content with advanced filtering
   */
  async searchContent(
    siteId: string, 
    query: ContentQuery, 
    options: ContentFetchOptions = {}
  ): Promise<SearchResult> {
    const cacheKey = `search:${siteId}:${JSON.stringify(query)}`;
    const cacheTTL = options.cacheTTL || 180; // 3 minutes default for search

    try {
      // Check cache
      if (!options.skipCache) {
        const cachedResults = await this.cacheService.get<SearchResult>(cacheKey);
        if (cachedResults) {
          this.logger.debug(`Cache hit for search: ${query.query}`);
          return cachedResults;
        }
      }

      // Perform search
      this.logger.info(`Searching content in site: ${siteId} with query: ${query.query}`);
      const results = await this.crafterClient.searchContent(query);

      // Cache the results
      if (!options.skipCache) {
        await this.cacheService.set(cacheKey, results, cacheTTL);
      }

      return results;
    } catch (error) {
      this.logger.error(`Search failed for query: ${query.query}`, error);
      throw error;
    }
  }

  /**
   * Fetch content with related items
   */
  async fetchContentWithRelated(
    siteId: string, 
    path: string, 
    options: ContentFetchOptions = {}
  ): Promise<{
    content: ContentItem | null;
    related: ContentItem[];
    breadcrumbs: ContentItem[];
  }> {
    try {
      // Fetch main content
      const content = await this.fetchContent(siteId, path, options);
      if (!content) {
        return { content: null, related: [], breadcrumbs: [] };
      }

      // Extract related content paths from metadata
      const relatedPaths = this.extractRelatedPaths(content);
      const breadcrumbPaths = this.generateBreadcrumbPaths(path);

      // Fetch related content in parallel
      const [relatedResults, breadcrumbResults] = await Promise.all([
        this.fetchMultipleContent(siteId, relatedPaths, { ...options, skipCache: false }),
        this.fetchMultipleContent(siteId, breadcrumbPaths, { ...options, skipCache: false })
      ]);

      const related = Array.from(relatedResults.values()).filter(item => item !== null) as ContentItem[];
      const breadcrumbs = Array.from(breadcrumbResults.values()).filter(item => item !== null) as ContentItem[];

      return {
        content,
        related,
        breadcrumbs: this.sortBreadcrumbs(breadcrumbs, breadcrumbPaths)
      };
    } catch (error) {
      this.logger.error(`Failed to fetch content with related: ${path}`, error);
      throw error;
    }
  }

  /**
   * Fetch content by content type
   */
  async fetchContentByType(
    siteId: string, 
    contentType: string, 
    options: ContentFetchOptions = {}
  ): Promise<ContentItem[]> {
    const query: ContentQuery = {
      query: `contentType:"${contentType}"`,
      filters: {
        contentType: [contentType],
        ...(options.filters || {})
      },
      sort: options.sort || [{ field: 'lastModifiedOn', order: 'desc' }],
      limit: options.limit || 50,
      offset: options.offset || 0
    };

    try {
      const results = await this.searchContent(siteId, query, options);
      return results.items;
    } catch (error) {
      this.logger.error(`Failed to fetch content by type: ${contentType}`, error);
      throw error;
    }
  }

  /**
   * Fetch paginated content list
   */
  async fetchPaginatedContent(
    siteId: string, 
    path: string = '/', 
    page: number = 1, 
    pageSize: number = 20,
    options: ContentFetchOptions = {}
  ): Promise<{
    items: ContentItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * pageSize;
    const query: ContentQuery = {
      query: `path:"${path}*"`,
      filters: {
        ...(options.filters || {})
      },
      sort: options.sort || [{ field: 'lastModifiedOn', order: 'desc' }],
      limit: pageSize,
      offset
    };

    try {
      const results = await this.searchContent(siteId, query, options);
      
      return {
        items: results.items,
        total: results.total,
        page,
        pageSize,
        totalPages: Math.ceil(results.total / pageSize)
      };
    } catch (error) {
      this.logger.error(`Failed to fetch paginated content: ${path}`, error);
      throw error;
    }
  }

  /**
   * Clear cache for specific content
   */
  async clearContentCache(siteId: string, path: string): Promise<void> {
    const cacheKey = `content:${siteId}:${path}:*`;
    await this.cacheService.deletePattern(cacheKey);
    this.logger.info(`Cleared cache for content: ${path}`);
  }

  /**
   * Clear cache for entire site
   */
  async clearSiteCache(siteId: string): Promise<void> {
    const cachePattern = `*:${siteId}:*`;
    await this.cacheService.deletePattern(cachePattern);
    this.logger.info(`Cleared cache for site: ${siteId}`);
  }

  /**
   * Process content tree with depth limiting
   */
  private async processContentTree(tree: any, depth: number, options: ContentFetchOptions): Promise<any> {
    if (depth <= 0) {
      return { ...tree, children: [] };
    }

    if (tree.children && tree.children.length > 0) {
      const processedChildren = await Promise.all(
        tree.children.map(async (child: any) => {
          return await this.processContentTree(child, depth - 1, options);
        })
      );

      return {
        ...tree,
        children: processedChildren
      };
    }

    return tree;
  }

  /**
   * Extract related content paths from content metadata
   */
  private extractRelatedPaths(content: ContentItem): string[] {
    const relatedPaths: string[] = [];
    
    if (content.metadata) {
      content.metadata.forEach(meta => {
        if (meta.key === 'related_content' || meta.key === 'related_products') {
          try {
            const paths = JSON.parse(meta.value);
            if (Array.isArray(paths)) {
              relatedPaths.push(...paths);
            }
          } catch (error) {
            this.logger.warn(`Failed to parse related content metadata`, error);
          }
        }
      });
    }

    return relatedPaths;
  }

  /**
   * Generate breadcrumb paths from content path
   */
  private generateBreadcrumbPaths(path: string): string[] {
    const paths: string[] = [];
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    let currentPath = '';
    for (const segment of segments.slice(0, -1)) { // Exclude the current item
      currentPath += '/' + segment;
      paths.push(currentPath);
    }

    return paths;
  }

  /**
   * Sort breadcrumbs in correct order
   */
  private sortBreadcrumbs(breadcrumbs: ContentItem[], expectedPaths: string[]): ContentItem[] {
    const pathMap = new Map(breadcrumbs.map(item => [item.path, item]));
    return expectedPaths.map(path => pathMap.get(path)).filter(Boolean) as ContentItem[];
  }
}
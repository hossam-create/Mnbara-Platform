import { GraphQLClient } from 'graphql-request';
import { Logger } from '@mnbara/shared-utils';
import { CrafterCMSConfig } from '../types/CrafterCMS.types';
import { ContentItem, ContentQuery, ContentUpdate, SearchResult, PublishingTarget } from '../types/Content.types';

/**
 * CrafterCMS Client - Main interface for interacting with CrafterCMS
 * Provides GraphQL and REST API access to content management
 */
export class CrafterCMSClient {
  private graphQLClient: GraphQLClient;
  private restClient: {
    studio: string;
    engine: string;
  };
  private logger: Logger;
  private config: CrafterCMSConfig;

  constructor(config: CrafterCMSConfig) {
    this.config = config;
    this.logger = new Logger('CrafterCMSClient');
    
    // Initialize GraphQL client
    this.graphQLClient = new GraphQLClient(`${config.studioUrl}/api/1/site/graphql`, {
      headers: {
        'Content-Type': 'application/json',
        ...(config.authToken && { 'Authorization': `Bearer ${config.authToken}` }),
      },
      timeout: config.timeout || 30000,
    });

    // REST API endpoints
    this.restClient = {
      studio: config.studioUrl,
      engine: config.engineUrl,
    };
  }

  /**
   * Fetch content by path
   */
  async getContentByPath(siteId: string, path: string): Promise<ContentItem> {
    try {
      const query = `
        query GetContentByPath($siteId: String!, $path: String!) {
          contentByPath(siteId: $siteId, path: $path) {
            id
            path
            previewUrl
            contentType
            mimeType
            locale
            createdBy
            createdOn
            lastModifiedBy
            lastModifiedOn
            state
            commitId
            metadata {
              key
              value
            }
          }
        }
      `;

      const variables = { siteId, path };
      const response = await this.graphQLClient.request(query, variables);
      
      this.logger.info(`Fetched content: ${path} from site: ${siteId}`);
      return response.contentByPath;
    } catch (error) {
      this.logger.error(`Failed to fetch content: ${path}`, error);
      throw new Error(`Content fetch failed: ${error.message}`);
    }
  }

  /**
   * Search content with filters
   */
  async searchContent(query: ContentQuery): Promise<SearchResult> {
    try {
      const searchQuery = `
        query SearchContent($query: ContentQueryInput!) {
          searchContent(query: $query) {
            total
            items {
              id
              path
              previewUrl
              contentType
              mimeType
              locale
              createdBy
              createdOn
              lastModifiedBy
              lastModifiedOn
              state
              score
            }
            facets {
              name
              values {
                value
                count
              }
            }
          }
        }
      `;

      const variables = { query };
      const response = await this.graphQLClient.request(searchQuery, variables);
      
      this.logger.info(`Search completed: ${query.query} (${response.searchContent.total} results)`);
      return response.searchContent;
    } catch (error) {
      this.logger.error('Content search failed', error);
      throw new Error(`Content search failed: ${error.message}`);
    }
  }

  /**
   * Create or update content
   */
  async updateContent(siteId: string, contentUpdate: ContentUpdate): Promise<ContentItem> {
    try {
      const mutation = `
        mutation UpdateContent($siteId: String!, $contentUpdate: ContentUpdateInput!) {
          updateContent(siteId: $siteId, contentUpdate: $contentUpdate) {
            id
            path
            previewUrl
            contentType
            state
            commitId
            createdBy
            createdOn
            lastModifiedBy
            lastModifiedOn
          }
        }
      `;

      const variables = { siteId, contentUpdate };
      const response = await this.graphQLClient.request(mutation, variables);
      
      this.logger.info(`Content updated: ${contentUpdate.path} in site: ${siteId}`);
      return response.updateContent;
    } catch (error) {
      this.logger.error(`Failed to update content: ${contentUpdate.path}`, error);
      throw new Error(`Content update failed: ${error.message}`);
    }
  }

  /**
   * Delete content
   */
  async deleteContent(siteId: string, path: string, submissionComment?: string): Promise<boolean> {
    try {
      const mutation = `
        mutation DeleteContent($siteId: String!, $path: String!, $submissionComment: String) {
          deleteContent(siteId: $siteId, path: $path, submissionComment: $submissionComment)
        }
      `;

      const variables = { siteId, path, submissionComment };
      const response = await this.graphQLClient.request(mutation, variables);
      
      this.logger.info(`Content deleted: ${path} from site: ${siteId}`);
      return response.deleteContent;
    } catch (error) {
      this.logger.error(`Failed to delete content: ${path}`, error);
      throw new Error(`Content deletion failed: ${error.message}`);
    }
  }

  /**
   * Get publishing targets
   */
  async getPublishingTargets(siteId: string): Promise<PublishingTarget[]> {
    try {
      const query = `
        query GetPublishingTargets($siteId: String!) {
          publishingTargets(siteId: $siteId) {
            id
            name
            environment
            serverUrl
            status
            createdOn
          }
        }
      `;

      const variables = { siteId };
      const response = await this.graphQLClient.request(query, variables);
      
      return response.publishingTargets;
    } catch (error) {
      this.logger.error(`Failed to get publishing targets for site: ${siteId}`, error);
      throw new Error(`Publishing targets fetch failed: ${error.message}`);
    }
  }

  /**
   * Publish content
   */
  async publishContent(
    siteId: string, 
    paths: string[], 
    target: string, 
    scheduledDate?: Date,
    submissionComment?: string
  ): Promise<string> {
    try {
      const mutation = `
        mutation PublishContent(
          $siteId: String!, 
          $paths: [String!]!, 
          $target: String!, 
          $scheduledDate: DateTime,
          $submissionComment: String
        ) {
          publishContent(
            siteId: $siteId, 
            paths: $paths, 
            target: $target, 
            scheduledDate: $scheduledDate,
            submissionComment: $submissionComment
          )
        }
      `;

      const variables = { 
        siteId, 
        paths, 
        target, 
        scheduledDate: scheduledDate?.toISOString(),
        submissionComment 
      };
      
      const response = await this.graphQLClient.request(mutation, variables);
      
      this.logger.info(`Content published: ${paths.length} items to ${target} in site: ${siteId}`);
      return response.publishContent;
    } catch (error) {
      this.logger.error(`Failed to publish content to ${target}`, error);
      throw new Error(`Content publishing failed: ${error.message}`);
    }
  }

  /**
   * Get content tree (hierarchical navigation)
   */
  async getContentTree(siteId: string, path: string = '/'): Promise<any> {
    try {
      const query = `
        query GetContentTree($siteId: String!, $path: String!) {
          contentTree(siteId: $siteId, path: $path) {
            id
            path
            name
            contentType
            children {
              id
              path
              name
              contentType
              children {
                id
                path
                name
                contentType
              }
            }
          }
        }
      `;

      const variables = { siteId, path };
      const response = await this.graphQLClient.request(query, variables);
      
      return response.contentTree;
    } catch (error) {
      this.logger.error(`Failed to get content tree: ${path}`, error);
      throw new Error(`Content tree fetch failed: ${error.message}`);
    }
  }

  /**
   * Get content versions
   */
  async getContentVersions(siteId: string, path: string): Promise<any[]> {
    try {
      const query = `
        query GetContentVersions($siteId: String!, $path: String!) {
          contentVersions(siteId: $siteId, path: $path) {
            id
            commitId
            author
            message
            date
            size
          }
        }
      `;

      const variables = { siteId, path };
      const response = await this.graphQLClient.request(query, variables);
      
      return response.contentVersions;
    } catch (error) {
      this.logger.error(`Failed to get content versions: ${path}`, error);
      throw new Error(`Content versions fetch failed: ${error.message}`);
    }
  }

  /**
   * Compare content versions
   */
  async compareContentVersions(siteId: string, path: string, version1: string, version2: string): Promise<any> {
    try {
      const query = `
        query CompareContentVersions(
          $siteId: String!, 
          $path: String!, 
          $version1: String!, 
          $version2: String!
        ) {
          compareContentVersions(
            siteId: $siteId, 
            path: $path, 
            version1: $version1, 
            version2: $version2
          ) {
            additions
            deletions
            changes
            diff
          }
        }
      `;

      const variables = { siteId, path, version1, version2 };
      const response = await this.graphQLClient.request(query, variables);
      
      return response.compareContentVersions;
    } catch (error) {
      this.logger.error(`Failed to compare content versions: ${path}`, error);
      throw new Error(`Content version comparison failed: ${error.message}`);
    }
  }

  /**
   * Revert content to a specific version
   */
  async revertContent(siteId: string, path: string, commitId: string, submissionComment?: string): Promise<ContentItem> {
    try {
      const mutation = `
        mutation RevertContent(
          $siteId: String!, 
          $path: String!, 
          $commitId: String!, 
          $submissionComment: String
        ) {
          revertContent(
            siteId: $siteId, 
            path: $path, 
            commitId: $commitId, 
            submissionComment: $submissionComment
          ) {
            id
            path
            previewUrl
            contentType
            state
            commitId
            createdBy
            createdOn
            lastModifiedBy
            lastModifiedOn
          }
        }
      `;

      const variables = { siteId, path, commitId, submissionComment };
      const response = await this.graphQLClient.request(mutation, variables);
      
      this.logger.info(`Content reverted: ${path} to commit: ${commitId} in site: ${siteId}`);
      return response.revertContent;
    } catch (error) {
      this.logger.error(`Failed to revert content: ${path}`, error);
      throw new Error(`Content revert failed: ${error.message}`);
    }
  }

  /**
   * Bulk operations
   */
  async bulkOperation(siteId: string, operation: string, paths: string[], options?: any): Promise<any> {
    try {
      const mutation = `
        mutation BulkOperation(
          $siteId: String!, 
          $operation: String!, 
          $paths: [String!]!, 
          $options: JSON
        ) {
          bulkOperation(
            siteId: $siteId, 
            operation: $operation, 
            paths: $paths, 
            options: $options
          ) {
            success
            failed
            errors {
              path
              message
            }
          }
        }
      `;

      const variables = { siteId, operation, paths, options };
      const response = await this.graphQLClient.request(mutation, variables);
      
      this.logger.info(`Bulk operation completed: ${operation} on ${paths.length} items in site: ${siteId}`);
      return response.bulkOperation;
    } catch (error) {
      this.logger.error(`Bulk operation failed: ${operation}`, error);
      throw new Error(`Bulk operation failed: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const query = `
        query HealthCheck {
          health {
            status
            timestamp
            version
          }
        }
      `;

      const response = await this.graphQLClient.request(query);
      return response.health.status === 'UP';
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }
}
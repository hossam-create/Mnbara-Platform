import { CrafterCMSClient } from './CrafterCMSClient';
import { Logger } from '@mnbara/shared-utils';
import { ContentItem, ContentUpdate, BatchUpdateRequest } from '../types/Content.types';
import { EventBus } from '@mnbara/event-bus';
import { CacheService } from '../services/CacheService';

/**
 * Content Updater Service - Handles content updates with validation and event publishing
 */
export class ContentUpdater {
  private crafterClient: CrafterCMSClient;
  private eventBus: EventBus;
  private cacheService: CacheService;
  private logger: Logger;

  constructor(
    crafterClient: CrafterCMSClient, 
    eventBus: EventBus,
    cacheService: CacheService
  ) {
    this.crafterClient = crafterClient;
    this.eventBus = eventBus;
    this.cacheService = cacheService;
    this.logger = new Logger('ContentUpdater');
  }

  /**
   * Update single content item
   */
  async updateContent(
    siteId: string, 
    contentUpdate: ContentUpdate, 
    options: {
      validate?: boolean;
      publish?: boolean;
      target?: string;
      userId?: string;
    } = {}
  ): Promise<ContentItem> {
    try {
      this.logger.info(`Updating content: ${contentUpdate.path} in site: ${siteId}`);

      // Validation
      if (options.validate) {
        await this.validateContentUpdate(siteId, contentUpdate);
      }

      // Perform update
      const updatedContent = await this.crafterClient.updateContent(siteId, contentUpdate);

      // Clear cache
      await this.clearRelatedCache(siteId, contentUpdate.path);

      // Publish event
      await this.publishContentEvent('content.updated', {
        siteId,
        contentId: updatedContent.id,
        path: contentUpdate.path,
        userId: options.userId,
        timestamp: new Date().toISOString(),
        metadata: {
          contentType: updatedContent.contentType,
          state: updatedContent.state,
          commitId: updatedContent.commitId
        }
      });

      // Auto-publish if requested
      if (options.publish && options.target) {
        await this.publishContent(siteId, [contentUpdate.path], options.target, options.userId);
      }

      this.logger.info(`Content updated successfully: ${contentUpdate.path}`);
      return updatedContent;
    } catch (error) {
      this.logger.error(`Failed to update content: ${contentUpdate.path}`, error);
      
      // Publish error event
      await this.publishContentEvent('content.update_failed', {
        siteId,
        path: contentUpdate.path,
        userId: options.userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Batch update multiple content items
   */
  async batchUpdateContent(
    siteId: string, 
    updates: BatchUpdateRequest[], 
    options: {
      validate?: boolean;
      publish?: boolean;
      target?: string;
      userId?: string;
    } = {}
  ): Promise<{
    successful: ContentItem[];
    failed: { path: string; error: string }[];
    total: number;
  }> {
    const results = {
      successful: [] as ContentItem[],
      failed: [] as { path: string; error: string }[],
      total: updates.length
    };

    this.logger.info(`Starting batch update of ${updates.length} content items in site: ${siteId}`);

    // Process updates in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (update) => {
        try {
          const updatedContent = await this.updateContent(siteId, update, options);
          results.successful.push(updatedContent);
          
          // Publish progress event
          await this.publishContentEvent('content.batch_update_progress', {
            siteId,
            userId: options.userId,
            progress: Math.round(((i + 1) / updates.length) * 100),
            successful: results.successful.length,
            failed: results.failed.length,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          results.failed.push({
            path: update.path,
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
    }

    // Publish completion event
    await this.publishContentEvent('content.batch_update_completed', {
      siteId,
      userId: options.userId,
      successful: results.successful.length,
      failed: results.failed.length,
      total: results.total,
      timestamp: new Date().toISOString()
    });

    this.logger.info(`Batch update completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Delete content item
   */
  async deleteContent(
    siteId: string, 
    path: string, 
    options: {
      submissionComment?: string;
      userId?: string;
      softDelete?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      this.logger.info(`Deleting content: ${path} from site: ${siteId}`);

      // Check if content exists
      const existingContent = await this.crafterClient.getContentByPath(siteId, path);
      if (!existingContent) {
        throw new Error(`Content not found: ${path}`);
      }

      // Perform deletion
      const success = await this.crafterClient.deleteContent(siteId, path, options.submissionComment);

      if (success) {
        // Clear cache
        await this.clearRelatedCache(siteId, path);

        // Publish event
        await this.publishContentEvent('content.deleted', {
          siteId,
          contentId: existingContent.id,
          path,
          userId: options.userId,
          timestamp: new Date().toISOString(),
          metadata: {
            contentType: existingContent.contentType,
            softDelete: options.softDelete || false
          }
        });

        this.logger.info(`Content deleted successfully: ${path}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to delete content: ${path}`, error);
      
      // Publish error event
      await this.publishContentEvent('content.delete_failed', {
        siteId,
        path,
        userId: options.userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Publish content to target environment
   */
  async publishContent(
    siteId: string, 
    paths: string[], 
    target: string, 
    userId?: string,
    scheduledDate?: Date,
    submissionComment?: string
  ): Promise<string> {
    try {
      this.logger.info(`Publishing ${paths.length} content items to ${target} in site: ${siteId}`);

      // Get publishing targets to validate target exists
      const targets = await this.crafterClient.getPublishingTargets(siteId);
      const validTarget = targets.find(t => t.name === target || t.environment === target);
      
      if (!validTarget) {
        throw new Error(`Invalid publishing target: ${target}. Available targets: ${targets.map(t => t.name).join(', ')}`);
      }

      // Perform publishing
      const publishId = await this.crafterClient.publishContent(
        siteId, 
        paths, 
        validTarget.name, 
        scheduledDate, 
        submissionComment
      );

      // Publish event
      await this.publishContentEvent('content.published', {
        siteId,
        userId,
        target,
        paths,
        publishId,
        scheduled: !!scheduledDate,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Content published successfully: ${paths.length} items to ${target}`);
      return publishId;
    } catch (error) {
      this.logger.error(`Failed to publish content to ${target}`, error);
      
      // Publish error event
      await this.publishContentEvent('content.publish_failed', {
        siteId,
        userId,
        target,
        paths,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Revert content to a specific version
   */
  async revertContent(
    siteId: string, 
    path: string, 
    commitId: string, 
    options: {
      userId?: string;
      submissionComment?: string;
    } = {}
  ): Promise<ContentItem> {
    try {
      this.logger.info(`Reverting content: ${path} to commit: ${commitId} in site: ${siteId}`);

      // Get current content for comparison
      const currentContent = await this.crafterClient.getContentByPath(siteId, path);
      if (!currentContent) {
        throw new Error(`Content not found: ${path}`);
      }

      // Get version history
      const versions = await this.crafterClient.getContentVersions(siteId, path);
      const targetVersion = versions.find(v => v.commitId === commitId);
      
      if (!targetVersion) {
        throw new Error(`Version not found: ${commitId}`);
      }

      // Perform revert
      const revertedContent = await this.crafterClient.revertContent(
        siteId, 
        path, 
        commitId, 
        options.submissionComment
      );

      // Clear cache
      await this.clearRelatedCache(siteId, path);

      // Publish event
      await this.publishContentEvent('content.reverted', {
        siteId,
        contentId: revertedContent.id,
        path,
        userId: options.userId,
        fromCommitId: currentContent.commitId,
        toCommitId: commitId,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Content reverted successfully: ${path} to commit: ${commitId}`);
      return revertedContent;
    } catch (error) {
      this.logger.error(`Failed to revert content: ${path}`, error);
      
      // Publish error event
      await this.publishContentEvent('content.revert_failed', {
        siteId,
        path,
        userId: options.userId,
        commitId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Bulk operations (move, copy, etc.)
   */
  async bulkOperation(
    siteId: string, 
    operation: string, 
    paths: string[], 
    options: {
      userId?: string;
      operationOptions?: any;
    } = {}
  ): Promise<any> {
    try {
      this.logger.info(`Starting bulk operation: ${operation} on ${paths.length} items in site: ${siteId}`);

      const result = await this.crafterClient.bulkOperation(
        siteId, 
        operation, 
        paths, 
        options.operationOptions
      );

      // Clear cache for affected paths
      for (const path of paths) {
        await this.clearRelatedCache(siteId, path);
      }

      // Publish event
      await this.publishContentEvent('content.bulk_operation_completed', {
        siteId,
        userId: options.userId,
        operation,
        paths,
        successful: result.successful,
        failed: result.failed,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Bulk operation completed: ${operation} - ${result.successful} successful, ${result.failed} failed`);
      return result;
    } catch (error) {
      this.logger.error(`Bulk operation failed: ${operation}`, error);
      
      // Publish error event
      await this.publishContentEvent('content.bulk_operation_failed', {
        siteId,
        userId: options.userId,
        operation,
        paths,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Validate content update
   */
  private async validateContentUpdate(siteId: string, contentUpdate: ContentUpdate): Promise<void> {
    // Content type validation
    if (!contentUpdate.contentType) {
      throw new Error('Content type is required');
    }

    // Path validation
    if (!contentUpdate.path || !contentUpdate.path.startsWith('/')) {
      throw new Error('Invalid content path');
    }

    // Required fields validation (based on content type)
    const requiredFields = await this.getRequiredFields(siteId, contentUpdate.contentType);
    for (const field of requiredFields) {
      if (!contentUpdate.content || !contentUpdate.content[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Business rule validation
    await this.validateBusinessRules(siteId, contentUpdate);
  }

  /**
   * Get required fields for content type
   */
  private async getRequiredFields(siteId: string, contentType: string): Promise<string[]> {
    // This would typically come from content type definition
    const contentTypeDefinitions: Record<string, string[]> = {
      'product': ['name', 'description', 'price'],
      'blog-post': ['title', 'content', 'author'],
      'page': ['title', 'content'],
      'category': ['name', 'description']
    };

    return contentTypeDefinitions[contentType] || ['title'];
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(siteId: string, contentUpdate: ContentUpdate): Promise<void> {
    // Example business rules:
    
    // 1. Product price validation
    if (contentUpdate.contentType === 'product' && contentUpdate.content.price) {
      const price = parseFloat(contentUpdate.content.price);
      if (price < 0) {
        throw new Error('Product price cannot be negative');
      }
      if (price > 1000000) {
        throw new Error('Product price exceeds maximum allowed value');
      }
    }

    // 2. URL slug validation
    if (contentUpdate.content.urlSlug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(contentUpdate.content.urlSlug)) {
        throw new Error('URL slug can only contain lowercase letters, numbers, and hyphens');
      }
    }

    // 3. SEO metadata validation
    if (contentUpdate.content.seoTitle && contentUpdate.content.seoTitle.length > 60) {
      throw new Error('SEO title cannot exceed 60 characters');
    }
    
    if (contentUpdate.content.seoDescription && contentUpdate.content.seoDescription.length > 160) {
      throw new Error('SEO description cannot exceed 160 characters');
    }
  }

  /**
   * Clear related cache entries
   */
  private async clearRelatedCache(siteId: string, path: string): Promise<void> {
    // Clear specific content cache
    const contentCacheKey = `content:${siteId}:${path}:*`;
    await this.cacheService.deletePattern(contentCacheKey);

    // Clear content tree cache
    const treeCacheKey = `content-tree:${siteId}:*`;
    await this.cacheService.deletePattern(treeCacheKey);

    // Clear search cache
    const searchCacheKey = `search:${siteId}:*`;
    await this.cacheService.deletePattern(searchCacheKey);

    this.logger.debug(`Cleared cache for content: ${path}`);
  }

  /**
   * Publish content event to event bus
   */
  private async publishContentEvent(eventType: string, data: any): Promise<void> {
    try {
      await this.eventBus.publish({
        type: eventType,
        source: 'content-updater',
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`Failed to publish content event: ${eventType}`, error);
      // Don't throw error here as the content operation was successful
    }
  }
}
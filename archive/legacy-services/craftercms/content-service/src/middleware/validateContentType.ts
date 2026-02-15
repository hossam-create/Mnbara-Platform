import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

/**
 * Content type validation middleware
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Validate content type in request body
    if (req.body.contentType) {
      const validContentTypes = [
        'product',
        'blog-post',
        'page',
        'category',
        'user',
        'article',
        'news',
        'event',
        'document',
        'media',
        'component',
        'template',
        'form',
        'navigation',
        'banner',
        'promotion',
        'review',
        'comment',
        'faq',
        'testimonial',
        'case-study',
        'whitepaper',
        'ebook',
        'webinar',
        'podcast',
        'video',
        'infographic',
        'gallery',
        'location',
        'store',
        'service',
        'pricing',
        'team-member',
        'job',
        'press-release',
        'announcement',
        'tutorial',
        'guide',
        'checklist',
        'tool',
        'calculator',
        'quiz',
        'survey',
        'poll',
        'contest',
        'giveaway',
        'coupon',
        'voucher',
        'gift-card',
        'subscription',
        'membership',
        'course',
        'lesson',
        'assignment',
        'certificate',
        'badge',
        'achievement',
        'leaderboard',
        'challenge',
        'mission',
        'quest',
        'reward',
        'point',
        'credit',
        'wallet',
        'transaction',
        'invoice',
        'receipt',
        'order',
        'shipment',
        'return',
        'refund',
        'dispute',
        'review-request',
        'feedback',
        'rating',
        'vote',
        'like',
        'share',
        'bookmark',
        'favorite',
        'wishlist',
        'comparison',
        'recommendation',
        'suggestion',
        'alert',
        'notification',
        'reminder',
        'message',
        'chat',
        'conversation',
        'thread',
        'reply',
        'mention',
        'tag',
        'hashtag',
        'keyword',
        'search-query',
        'search-result',
        'filter',
        'sort',
        'view',
        'click',
        'conversion',
        'goal',
        'metric',
        'report',
        'dashboard',
        'widget',
        'integration',
        'webhook',
        'api-key',
        'oauth-app',
        'plugin',
        'extension',
        'theme',
        'template-part',
        'layout',
        'section',
        'block',
        'element',
        'field',
        'form-field',
        'validation-rule',
        'workflow',
        'approval',
        'permission',
        'role',
        'user-group',
        'segment',
        'audience',
        'campaign',
        'ad',
        'creative',
        'landing-page',
        'squeeze-page',
        'thank-you-page',
        'error-page',
        'maintenance-page',
        'coming-soon-page',
        '404-page',
        'search-page',
        'archive-page',
        'author-page',
        'category-page',
        'tag-page',
        'date-page',
        'attachment-page',
        'media-item',
        'image',
        'video-item',
        'audio-item',
        'document-item',
        'spreadsheet',
        'presentation',
        'pdf',
        'zip',
        'archive',
        'backup',
        'export',
        'import',
        'migration',
        'sync',
        'cache',
        'index',
        'sitemap',
        'robots',
        'redirect',
        'shortlink',
        'qr-code',
        'barcode',
        'tracking-pixel',
        'analytics',
        'heatmap',
        'session-recording',
        'ab-test',
        'variation',
        'experiment',
        'feature-flag',
        'remote-config',
        'personalization-rule',
        'recommendation-engine',
        'search-engine',
        'ai-model',
        'ml-model',
        'prediction',
        'forecast',
        'trend',
        'pattern',
        'anomaly',
        'alert-rule',
        'threshold',
        'trigger',
        'action',
        'automation',
        'schedule',
        'cron-job',
        'task',
        'queue',
        'worker',
        'job',
        'batch',
        'pipeline',
        'stage',
        'step',
        'checkpoint',
        'rollback',
        'backup-point',
        'snapshot',
        'clone',
        'duplicate',
        'template-clone',
        'site-clone',
        'content-clone'
      ];

      if (!validContentTypes.includes(req.body.contentType)) {
        throw new ValidationError(`Invalid content type: ${req.body.contentType}. Must be one of: ${validContentTypes.slice(0, 10).join(', ')}...`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Content validation schema
 */
export const contentValidationSchema = Joi.object({
  path: Joi.string().required().pattern(/^\//).messages({
    'string.pattern.base': 'Content path must start with /',
    'any.required': 'Content path is required'
  }),
  contentType: Joi.string().required().messages({
    'any.required': 'Content type is required'
  }),
  content: Joi.object().required().messages({
    'any.required': 'Content data is required'
  }),
  metadata: Joi.array().items(
    Joi.object({
      key: Joi.string().required(),
      value: Joi.string().required()
    })
  ).optional(),
  locale: Joi.string().optional().default('en'),
  commitMessage: Joi.string().optional().max(500),
  validate: Joi.boolean().optional().default(true),
  publish: Joi.boolean().optional().default(false),
  target: Joi.string().optional()
});

/**
 * Content update validation middleware
 */
export const validateContentUpdate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { error } = contentValidationSchema.validate(req.body);
    
    if (error) {
      throw new ValidationError(`Content validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Additional business logic validation
    validateBusinessRules(req.body);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Search query validation middleware
 */
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const searchSchema = Joi.object({
      query: Joi.string().optional().default('*'),
      filters: Joi.object().optional(),
      sort: Joi.array().items(
        Joi.object({
          field: Joi.string().required(),
          order: Joi.string().valid('asc', 'desc').required()
        })
      ).optional(),
      limit: Joi.number().integer().min(1).max(1000).optional().default(20),
      offset: Joi.number().integer().min(0).optional().default(0),
      locale: Joi.string().optional().default('en'),
      contentTypes: Joi.array().items(Joi.string()).optional(),
      dateRange: Joi.object({
        start: Joi.date().optional(),
        end: Joi.date().optional()
      }).optional()
    });

    const { error } = searchSchema.validate(req.body);
    
    if (error) {
      throw new ValidationError(`Search query validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * User profile validation middleware
 */
export const validateUserProfile = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userProfileSchema = Joi.object({
      id: Joi.string().required(),
      username: Joi.string().required(),
      email: Joi.string().email().required(),
      demographics: Joi.object({
        age: Joi.number().integer().min(0).max(150).optional(),
        gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional(),
        location: Joi.string().optional(),
        language: Joi.string().optional(),
        timezone: Joi.string().optional(),
        currency: Joi.string().optional(),
        income: Joi.string().optional(),
        education: Joi.string().optional(),
        occupation: Joi.string().optional()
      }).optional(),
      preferences: Joi.object({
        theme: Joi.string().valid('light', 'dark', 'auto').optional(),
        language: Joi.string().optional(),
        currency: Joi.string().optional(),
        timezone: Joi.string().optional(),
        notifications: Joi.object({
          email: Joi.boolean().optional(),
          push: Joi.boolean().optional(),
          sms: Joi.boolean().optional()
        }).optional(),
        privacy: Joi.object({
          analytics: Joi.boolean().optional(),
          marketing: Joi.boolean().optional(),
          personalization: Joi.boolean().optional()
        }).optional(),
        content: Joi.object({
          categories: Joi.array().items(Joi.string()).optional(),
          tags: Joi.array().items(Joi.string()).optional(),
          formats: Joi.array().items(Joi.string()).optional(),
          frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'never').optional()
        }).optional()
      }).optional(),
      interests: Joi.object({
        categories: Joi.array().items(Joi.string()).optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        topics: Joi.array().items(Joi.string()).optional(),
        brands: Joi.array().items(Joi.string()).optional(),
        activities: Joi.array().items(Joi.string()).optional()
      }).optional(),
      behavior: Joi.object({
        engagementLevel: Joi.string().valid('low', 'medium', 'high').optional(),
        loyaltyStatus: Joi.string().valid('new', 'regular', 'vip').optional()
      }).optional(),
      device: Joi.object({
        type: Joi.string().valid('desktop', 'mobile', 'tablet', 'smart-tv').optional(),
        os: Joi.string().optional(),
        browser: Joi.string().optional(),
        screenResolution: Joi.string().optional(),
        viewportSize: Joi.string().optional()
      }).optional(),
      location: Joi.object({
        country: Joi.string().optional(),
        region: Joi.string().optional(),
        city: Joi.string().optional(),
        postalCode: Joi.string().optional(),
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
        timezone: Joi.string().optional(),
        currency: Joi.string().optional(),
        language: Joi.string().optional()
      }).optional(),
      segments: Joi.array().items(Joi.string()).optional(),
      createdAt: Joi.string().isoDate().required(),
      updatedAt: Joi.string().isoDate().required(),
      lastActivityAt: Joi.string().isoDate().optional()
    });

    const { error } = userProfileSchema.validate(req.body.userProfile);
    
    if (error) {
      throw new ValidationError(`User profile validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Business rules validation
 */
function validateBusinessRules(content: any): void {
  // Product price validation
  if (content.contentType === 'product' && content.content.price) {
    const price = parseFloat(content.content.price);
    if (isNaN(price)) {
      throw new ValidationError('Product price must be a valid number');
    }
    if (price < 0) {
      throw new ValidationError('Product price cannot be negative');
    }
    if (price > 1000000) {
      throw new ValidationError('Product price exceeds maximum allowed value');
    }
  }

  // URL slug validation
  if (content.content.urlSlug) {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(content.content.urlSlug)) {
      throw new ValidationError('URL slug can only contain lowercase letters, numbers, and hyphens');
    }
  }

  // SEO metadata validation
  if (content.content.seoTitle && content.content.seoTitle.length > 60) {
    throw new ValidationError('SEO title cannot exceed 60 characters');
  }
  
  if (content.content.seoDescription && content.content.seoDescription.length > 160) {
    throw new ValidationError('SEO description cannot exceed 160 characters');
  }

  // Content length validation
  if (content.content.content && content.content.content.length > 50000) {
    throw new ValidationError('Content body cannot exceed 50,000 characters');
  }

  // Image URL validation
  if (content.content.imageUrl) {
    try {
      new URL(content.content.imageUrl);
    } catch {
      throw new ValidationError('Image URL must be a valid URL');
    }
  }

  // Date validation
  if (content.content.publishDate) {
    const publishDate = new Date(content.content.publishDate);
    if (isNaN(publishDate.getTime())) {
      throw new ValidationError('Publish date must be a valid date');
    }
  }

  if (content.content.expiryDate) {
    const expiryDate = new Date(content.content.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      throw new ValidationError('Expiry date must be a valid date');
    }
    
    if (content.content.publishDate && expiryDate < new Date(content.content.publishDate)) {
      throw new ValidationError('Expiry date cannot be earlier than publish date');
    }
  }
}
/**
 * AI Buyer Controller
 * HTTP handlers for Smart Buyer AI Assistant endpoints
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  CameraUploadRequest,
  GalleryUploadRequest,
  VoiceProcessRequest,
  SearchRequest,
  MatchRequest
} from '../types/ai-buyer.types';
import { imageRecognitionService } from '../services/image-recognition.service';
import { voiceProcessingService } from '../services/voice-processing.service';
import { productMatchingService } from '../services/product-matching.service';
import { smartSearchService } from '../services/smart-search.service';
import { logger } from '../utils/logger';

export class AIBuyerController {
  /**
   * POST /api/ai-buyer/camera/upload
   * Upload and process camera-captured image
   */
  async cameraUpload(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: CameraUploadRequest = req.body;

      // Validate required fields
      if (!request.imageData || !request.userId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Missing required fields: imageData, userId' }
        });
        return;
      }

      // Generate image ID
      const imageId = uuidv4();

      // Process image for recognition
      let recognitionResult = null;
      let suggestedTags: string[] = [];
      let suggestedCategories: string[] = [];

      if (imageRecognitionService) {
        try {
          const imageBuffer = Buffer.from(request.imageData, 'base64');
          recognitionResult = await imageRecognitionService.processImage(imageBuffer);
          const extracted = imageRecognitionService.extractProductTags(recognitionResult);
          suggestedTags = extracted.tags;
          suggestedCategories = extracted.categories;
        } catch (recError) {
          logger.warn('Image recognition failed:', recError);
        }
      }

      res.json({
        success: true,
        data: {
          imageId,
          thumbnailUrl: `/api/ai-buyer/images/${imageId}/thumbnail`,
          recognitionResult,
          suggestedCategories,
          suggestedTags
        },
        meta: {
          processingTimeMs: Date.now() - startTime,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Camera upload failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROCESSING_ERROR', message: (error as Error).message }
      });
    }
  }

  /**
   * POST /api/ai-buyer/gallery/upload
   * Upload and process image from gallery
   */
  async galleryUpload(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: GalleryUploadRequest = req.body;

      if (!request.imageUrl || !request.userId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Missing required fields: imageUrl, userId' }
        });
        return;
      }

      const imageId = uuidv4();

      let recognitionResult = null;
      if (imageRecognitionService) {
        try {
          recognitionResult = await imageRecognitionService.processImageFromUrl(request.imageUrl);
        } catch (recError) {
          logger.warn('Image recognition from URL failed:', recError);
        }
      }

      res.json({
        success: true,
        data: {
          imageId,
          originalUrl: request.imageUrl,
          recognitionResult
        },
        meta: {
          processingTimeMs: Date.now() - startTime,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Gallery upload failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROCESSING_ERROR', message: (error as Error).message }
      });
    }
  }

  /**
   * POST /api/ai-buyer/voice/process
   * Process voice/audio input
   */
  async voiceProcess(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: VoiceProcessRequest = req.body;

      if (!request.audioData || !request.userId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Missing required fields: audioData, userId' }
        });
        return;
      }

      let voiceResult = null;
      let command = null;

      if (voiceProcessingService) {
        try {
          voiceResult = await voiceProcessingService.processBase64Audio(request.audioData, request.language);
          command = voiceProcessingService.extractCommand(voiceResult.transcript);
        } catch (voiceError) {
          logger.warn('Voice processing failed:', voiceError);
        }
      }

      const suggestedActions = this.generateSuggestedActions(command);

      res.json({
        success: true,
        data: {
          transcript: voiceResult?.transcript || '',
          confidence: voiceResult?.confidence || 0,
          command,
          suggestedActions
        },
        meta: {
          processingTimeMs: Date.now() - startTime,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Voice processing failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROCESSING_ERROR', message: (error as Error).message }
      });
    }
  }

  /**
   * POST /api/ai-buyer/search
   * Smart product search with natural language
   */
  async search(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: SearchRequest = req.body;

      if (!request.query) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_QUERY', message: 'Missing required field: query' }
        });
        return;
      }

      let searchResult = null;
      if (smartSearchService) {
        searchResult = await smartSearchService.search(request.query);
      }

      res.json({
        success: true,
        data: searchResult,
        meta: {
          processingTimeMs: Date.now() - startTime,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Smart search failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SEARCH_ERROR', message: (error as Error).message }
      });
    }
  }

  /**
   * POST /api/ai-buyer/match
   * Match products from image/voice/text query
   */
  async match(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: MatchRequest = req.body;

      if (!request.imageUrl && !request.imageData && !request.tags?.length) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_QUERY', message: 'Missing query (imageUrl, imageData, or tags required)' }
        });
        return;
      }

      let matchResult = null;

      if (productMatchingService) {
        if (request.imageUrl) {
          matchResult = await productMatchingService.matchFromImage(request.imageUrl, request.tags || []);
        } else if (request.imageData) {
          const imageBuffer = Buffer.from(request.imageData, 'base64');
          if (imageRecognitionService) {
            const recognitionResult = await imageRecognitionService.processImage(imageBuffer);
            const extracted = imageRecognitionService.extractProductTags(recognitionResult);
            matchResult = await productMatchingService.matchProducts({
              type: 'image',
              sourceImageUrl: undefined,
              extractedTags: extracted.tags,
              extractedCategories: extracted.categories,
              extractedColors: extracted.colors,
              extractedAttributes: {}
            });
          }
        } else if (request.tags) {
          matchResult = await productMatchingService.matchProducts({
            type: 'text',
            textQuery: request.tags.join(' '),
            extractedTags: request.tags,
            extractedCategories: request.categories || [],
            extractedColors: [],
            extractedAttributes: {}
          });
        }
      }

      res.json({
        success: true,
        data: matchResult,
        meta: {
          processingTimeMs: Date.now() - startTime,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Product matching failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'MATCH_ERROR', message: (error as Error).message }
      });
    }
  }

  /**
   * GET /api/ai-buyer/suggestions/:query
   * Get search suggestions
   */
  async suggestions(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      let suggestions: any[] = [];
      if (smartSearchService) {
        suggestions = await smartSearchService.getSuggestions(query || '', limit);
      }

      res.json({
        success: true,
        data: { suggestions },
        meta: { version: '1.0.0' }
      });
    } catch (error) {
      logger.error('Suggestions failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SUGGESTIONS_ERROR', message: (error as Error).message }
      });
    }
  }

  /**
   * GET /api/ai-buyer/health
   * Service health check
   */
  async health(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        services: {
          imageRecognition: imageRecognitionService ? await imageRecognitionService.healthCheck() : false,
          voiceProcessing: voiceProcessingService ? await voiceProcessingService.healthCheck() : false,
          productMatching: productMatchingService ? await productMatchingService.healthCheck() : false,
          smartSearch: smartSearchService ? await smartSearchService.healthCheck() : false
        },
        timestamp: new Date().toISOString()
      };

      const allHealthy = Object.values(health.services).every(s => s);
      health.status = allHealthy ? 'healthy' : 'degraded';

      res.status(allHealthy ? 200 : 503).json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: { code: 'HEALTH_CHECK_FAILED', message: (error as Error).message }
      });
    }
  }

  /**
   * Generate suggested actions based on voice command
   */
  private generateSuggestedActions(command: any): string[] {
    const suggestions: string[] = [];
    if (!command) return suggestions;

    switch (command.action) {
      case 'SEARCH':
        suggestions.push('View search results', 'Refine search filters');
        break;
      case 'FILTER':
        suggestions.push('Apply filters', 'Clear all filters');
        break;
      case 'SORT':
        suggestions.push('Sort results', 'Change sort order');
        break;
      case 'ADD_TO_CART':
        suggestions.push('Add to cart', 'View product details');
        break;
      case 'COMPARE':
        suggestions.push('Compare products', 'View comparison table');
        break;
      case 'DETAILS':
        suggestions.push('View full details', 'Ask follow-up questions');
        break;
    }
    return suggestions;
  }
}

export const aiBuyerController = new AIBuyerController();

// AI Pricing Controller
// HTTP request handlers for all AI Pricing endpoints

import { Request, Response } from 'express';
import { predictiveBuyingService } from '../services/predictive-buying.service';
import { dynamicPricingService } from '../services/dynamic-pricing.service';
import { marketIntelligenceService } from '../services/market-intelligence.service';

// ==========================================
// PREDICTIVE BUYING ENDPOINTS
// ==========================================

/**
 * Build user behavior profile
 * POST /api/ai-pricing/predictive/profile
 */
export async function buildUserProfile(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const profile = await predictiveBuyingService.buildUserProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get user predictions
 * GET /api/ai-pricing/predictive/predictions/:userId
 */
export async function getUserPredictions(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const predictions = await predictiveBuyingService.getUserPredictions(
      userId,
      status as any
    );

    res.json({
      success: true,
      data: predictions,
      meta: {
        total: predictions.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate proactive suggestions
 * GET /api/ai-pricing/predictive/suggestions/:userId
 */
export async function getProactiveSuggestions(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const suggestions = await predictiveBuyingService.generateProactiveSuggestions(userId);

    res.json({
      success: true,
      data: suggestions,
      meta: {
        total: suggestions.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Optimize purchase timing
 * POST /api/ai-pricing/predictive/timing
 */
export async function optimizePurchaseTiming(req: Request, res: Response) {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'userId and productId are required',
      });
    }

    const timing = await predictiveBuyingService.optimizePurchaseTiming(userId, productId);

    res.json({
      success: true,
      data: timing,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Predict user needs
 * POST /api/ai-pricing/predictive/needs
 */
export async function predictUserNeeds(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const needs = await predictiveBuyingService.predictUserNeeds(userId);

    res.json({
      success: true,
      data: needs,
      meta: {
        total: needs.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Acknowledge prediction
 * PUT /api/ai-pricing/predictive/predictions/:predictionId/acknowledge
 */
export async function acknowledgePrediction(req: Request, res: Response) {
  try {
    const { predictionId } = req.params;

    await predictiveBuyingService.acknowledgePrediction(predictionId);

    res.json({
      success: true,
      message: 'Prediction acknowledged',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Record prediction result
 * PUT /api/ai-pricing/predictive/predictions/:predictionId/result
 */
export async function recordPredictionResult(req: Request, res: Response) {
  try {
    const { predictionId } = req.params;
    const { result, purchaseDate } = req.body;

    await predictiveBuyingService.recordPredictionResult(
      predictionId,
      result,
      purchaseDate ? new Date(purchaseDate) : undefined
    );

    res.json({
      success: true,
      message: 'Result recorded',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ==========================================
// DYNAMIC PRICING ENDPOINTS
// ==========================================

/**
 * Optimize product price
 * POST /api/ai-pricing/pricing/optimize
 */
export async function optimizePrice(req: Request, res: Response) {
  try {
    const { productId, basePrice, costPrice, categoryId, brandId, inventoryLevel, targetMargin } = req.body;

    if (!productId || basePrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'productId and basePrice are required',
      });
    }

    const result = await dynamicPricingService.optimizePrice({
      productId,
      basePrice,
      costPrice,
      categoryId,
      brandId,
      inventoryLevel,
      targetMargin,
    });

    // Save optimization
    await dynamicPricingService.saveOptimization(productId, result);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Batch optimize prices
 * POST /api/ai-pricing/pricing/batch-optimize
 */
export async function batchOptimizePrices(req: Request, res: Response) {
  try {
    const { products, maxConcurrent } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'products array is required',
      });
    }

    const results = await dynamicPricingService.batchOptimizePrices(products, {
      maxConcurrent,
    });

    res.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get competitive price suggestion
 * POST /api/ai-pricing/pricing/competitive
 */
export async function getCompetitiveSuggestion(req: Request, res: Response) {
  try {
    const { productId, costPrice, strategy } = req.body;

    if (!productId || costPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'productId and costPrice are required',
      });
    }

    const suggestion = await dynamicPricingService.getCompetitiveSuggestion(
      productId,
      costPrice,
      strategy || 'maximize_revenue'
    );

    res.json({
      success: true,
      data: suggestion,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Apply pricing rules
 * POST /api/ai-pricing/pricing/rules/apply
 */
export async function applyPricingRules(req: Request, res: Response) {
  try {
    const { productId, basePrice, categoryId, brandId, inventoryLevel, isHoliday, userSegment } = req.body;

    if (!productId || basePrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'productId and basePrice are required',
      });
    }

    const result = await dynamicPricingService.applyPricingRules(productId, basePrice, {
      categoryId,
      brandId,
      inventoryLevel,
      isHoliday,
      userSegment,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get product optimizations
 * GET /api/ai-pricing/pricing/optimizations/:productId
 */
export async function getProductOptimizations(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const { status } = req.query;

    const optimizations = await dynamicPricingService.getProductOptimizations(
      productId,
      status as any
    );

    res.json({
      success: true,
      data: optimizations,
      meta: {
        total: optimizations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Apply optimization
 * PUT /api/ai-pricing/pricing/optimizations/:optimizationId/apply
 */
export async function applyOptimization(req: Request, res: Response) {
  try {
    const { optimizationId } = req.params;

    await dynamicPricingService.applyOptimization(optimizationId);

    res.json({
      success: true,
      message: 'Optimization applied',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ==========================================
// MARKET INTELLIGENCE ENDPOINTS
// ==========================================

/**
 * Get market overview
 * GET /api/ai-pricing/market/overview
 */
export async function getMarketOverview(req: Request, res: Response) {
  try {
    const { categoryId } = req.query;

    const overview = await marketIntelligenceService.getMarketOverview(categoryId as string);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get trends
 * GET /api/ai-pricing/market/trends
 */
export async function getTrends(req: Request, res: Response) {
  try {
    const { targetType, targetId, trendTypes, periodType, limit } = req.query;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        error: 'targetType and targetId are required',
      });
    }

    const trends = await marketIntelligenceService.getTrends(
      targetType as string,
      targetId as string,
      trendTypes ? (trendTypes as string).split(',') as any : undefined,
      (periodType as any) || 'WEEKLY',
      limit ? parseInt(limit as string) : 12
    );

    res.json({
      success: true,
      data: trends,
      meta: {
        total: trends.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get market direction
 * GET /api/ai-pricing/market/direction
 */
export async function getMarketDirection(req: Request, res: Response) {
  try {
    const { categoryId } = req.query;

    const direction = await marketIntelligenceService.getMarketDirection(categoryId as string);

    res.json({
      success: true,
      data: direction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get price index history
 * GET /api/ai-pricing/market/price-index
 */
export async function getPriceIndexHistory(req: Request, res: Response) {
  try {
    const { categoryId, periodType, limit } = req.query;

    const indices = await marketIntelligenceService.getPriceIndexHistory(
      categoryId as string,
      (periodType as any) || 'WEEKLY',
      limit ? parseInt(limit as string) : 52
    );

    res.json({
      success: true,
      data: indices,
      meta: {
        total: indices.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Compare category prices
 * GET /api/ai-pricing/market/price-compare/:categoryId
 */
export async function compareCategoryPrices(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;

    const comparison = await marketIntelligenceService.compareCategoryPrices(categoryId);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate demand forecast
 * POST /api/ai-pricing/market/forecast
 */
export async function generateDemandForecast(req: Request, res: Response) {
  try {
    const { targetType, targetId, targetName, periodType, periods } = req.body;

    if (!targetType || !targetId || !targetName) {
      return res.status(400).json({
        success: false,
        error: 'targetType, targetId, and targetName are required',
      });
    }

    const forecasts = await marketIntelligenceService.generateDemandForecast(
      targetType,
      targetId,
      targetName,
      periodType || 'WEEKLY',
      periods || 12
    );

    res.json({
      success: true,
      data: forecasts,
      meta: {
        total: forecasts.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get active insights
 * GET /api/ai-pricing/market/insights
 */
export async function getActiveInsights(req: Request, res: Response) {
  try {
    const { insightType, impactLevel, targetType } = req.query;

    const insights = await marketIntelligenceService.getActiveInsights({
      insightType: insightType as any,
      impactLevel: impactLevel as any,
      targetType: targetType as string,
    });

    res.json({
      success: true,
      data: insights,
      meta: {
        total: insights.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate insights
 * POST /api/ai-pricing/market/insights/generate
 */
export async function generateInsights(req: Request, res: Response) {
  try {
    const insights = await marketIntelligenceService.generateInsights();

    res.json({
      success: true,
      data: insights,
      meta: {
        total: insights.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get price history
 * GET /api/ai-pricing/market/price-history/:productId
 */
export async function getPriceHistory(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    const history = await marketIntelligenceService.getPriceHistory(
      productId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: history,
      meta: {
        total: history.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get price statistics
 * GET /api/ai-pricing/market/price-stats/:productId
 */
export async function getPriceStats(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    const stats = await marketIntelligenceService.getPriceStats(productId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Validate forecast
 * PUT /api/ai-pricing/market/forecast/:forecastId/validate
 */
export async function validateForecast(req: Request, res: Response) {
  try {
    const { forecastId } = req.params;
    const { actualDemand } = req.body;

    if (actualDemand === undefined) {
      return res.status(400).json({
        success: false,
        error: 'actualDemand is required',
      });
    }

    const result = await marketIntelligenceService.validateForecast(forecastId, actualDemand);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ==========================================
// HEALTH CHECK
// ==========================================

/**
 * Health check
 * GET /api/ai-pricing/health
 */
export async function healthCheck(req: Request, res: Response) {
  res.json({
    success: true,
    status: 'healthy',
    service: 'ai-pricing-service',
    timestamp: new Date().toISOString(),
  });
}

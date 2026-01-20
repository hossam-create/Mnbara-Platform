import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { FinancialAnalysisEngine } from '../services/financial-analysis/FinancialAnalysisEngine';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const financialAnalysisEngine = new FinancialAnalysisEngine(prisma);

// Perform financial analysis
router.post('/analyze', authMiddleware, rbacMiddleware(['ADMIN', 'FINANCE_MANAGER', 'ANALYST']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      analysisType: z.enum(['COMMON_SIZE', 'RATIOS', 'TREND', 'COMPARISON']),
      periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      dataSource: z.enum(['ACTUAL', 'FORECAST', 'BOTH']),
      scenarioId: z.string().optional(),
      includeAIInsights: z.boolean().optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    const analysis = await financialAnalysisEngine.performAnalysis({
      ...data,
      userId
    });

    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('Failed to perform financial analysis:', error);
    res.status(500).json({ error: 'Failed to perform financial analysis' });
  }
});

// Get analysis results
router.get('/results/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      analysisType: z.string().optional(),
      periodType: z.string().optional(),
      fiscalYear: z.string().optional().transform(val => parseInt(val)),
      fiscalQuarter: z.string().optional().transform(val => parseInt(val)),
      fiscalMonth: z.string().optional().transform(val => parseInt(val))
    });

    const { businessAccountId } = req.params;
    const filters = schema.parse(req.query);

    const results = await financialAnalysisEngine.getAnalysisResults(businessAccountId, filters);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Failed to get analysis results:', error);
    res.status(500).json({ error: 'Failed to get analysis results' });
  }
});

// Get specific analysis result
router.get('/result/:analysisResultId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { analysisResultId } = req.params;
    const businessAccountId = req.query.businessAccountId as string;

    if (!businessAccountId) {
      return res.status(400).json({ error: 'Business account ID is required' });
    }

    const results = await financialAnalysisEngine.getAnalysisResults(businessAccountId);
    const result = results.find(r => r.id === analysisResultId);

    if (!result) {
      return res.status(404).json({ error: 'Analysis result not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to get analysis result:', error);
    res.status(500).json({ error: 'Failed to get analysis result' });
  }
});

// Delete analysis result
router.delete('/result/:analysisResultId', authMiddleware, rbacMiddleware(['ADMIN', 'FINANCE_MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string()
    });

    const { analysisResultId } = req.params;
    const { businessAccountId } = schema.parse(req.query);

    await financialAnalysisEngine.deleteAnalysisResult(businessAccountId, analysisResultId);
    res.json({ success: true, message: 'Analysis result deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete analysis result:', error);
    res.status(500).json({ error: 'Failed to delete analysis result' });
  }
});

// Get common size statements
router.post('/common-size', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      dataSource: z.enum(['ACTUAL', 'FORECAST'])
    });

    const data = schema.parse(req.body);
    const commonSize = await financialAnalysisEngine.calculateCommonSizeStatements(data);
    res.json({ success: true, data: commonSize });
  } catch (error) {
    logger.error('Failed to calculate common size statements:', error);
    res.status(500).json({ error: 'Failed to calculate common size statements' });
  }
});

// Get financial ratios
router.post('/ratios', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      dataSource: z.enum(['ACTUAL', 'FORECAST'])
    });

    const data = schema.parse(req.body);
    const ratios = await financialAnalysisEngine.calculateFinancialRatios(data);
    res.json({ success: true, data: ratios });
  } catch (error) {
    logger.error('Failed to calculate financial ratios:', error);
    res.status(500).json({ error: 'Failed to calculate financial ratios' });
  }
});

// Get trend analysis
router.post('/trend', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      dataSource: z.enum(['ACTUAL', 'FORECAST', 'BOTH'])
    });

    const data = schema.parse(req.body);
    const analysis = await financialAnalysisEngine.performAnalysis({
      ...data,
      analysisType: 'TREND'
    });
    res.json({ success: true, data: analysis.trendAnalysis });
  } catch (error) {
    logger.error('Failed to perform trend analysis:', error);
    res.status(500).json({ error: 'Failed to perform trend analysis' });
  }
});

// Get forecast vs actual comparison
router.post('/comparison', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      scenarioId: z.string(),
      periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional()
    });

    const data = schema.parse(req.body);
    const comparison = await financialAnalysisEngine.performAnalysis({
      ...data,
      analysisType: 'COMPARISON',
      dataSource: 'BOTH'
    });
    res.json({ success: true, data: comparison.forecastVsActual });
  } catch (error) {
    logger.error('Failed to perform forecast vs actual comparison:', error);
    res.status(500).json({ error: 'Failed to perform forecast vs actual comparison' });
  }
});

// Get AI insights
router.post('/insights', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      analysisType: z.enum(['COMMON_SIZE', 'RATIOS', 'TREND', 'COMPARISON']),
      periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      dataSource: z.enum(['ACTUAL', 'FORECAST', 'BOTH']),
      scenarioId: z.string().optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    const analysis = await financialAnalysisEngine.performAnalysis({
      ...data,
      includeAIInsights: true,
      userId
    });
    res.json({ success: true, data: analysis.aiInsights });
  } catch (error) {
    logger.error('Failed to generate AI insights:', error);
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
});

// Refresh analysis views
router.post('/refresh-views', authMiddleware, rbacMiddleware(['ADMIN', 'FINANCE_MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    await financialAnalysisEngine.refreshAnalysisViews();
    res.json({ success: true, message: 'Financial analysis views refreshed successfully' });
  } catch (error) {
    logger.error('Failed to refresh analysis views:', error);
    res.status(500).json({ error: 'Failed to refresh analysis views' });
  }
});

// Get analysis summary from materialized view
router.get('/summary/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const { fiscalYear, analysisType } = req.query;

    let whereClause = 'business_account_id = $1';
    const params: any[] = [businessAccountId];

    if (fiscalYear) {
      whereClause += ' AND fiscal_year = $' + (params.length + 1);
      params.push(fiscalYear);
    }

    if (analysisType) {
      whereClause += ' AND analysis_type = $' + (params.length + 1);
      params.push(analysisType);
    }

    const summary = await prisma.$queryRaw`
      SELECT * FROM mv_financial_analysis_summary 
      WHERE ${whereClause}
      ORDER BY fiscal_year DESC, fiscal_quarter DESC, fiscal_month DESC
    `;

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Failed to get analysis summary:', error);
    res.status(500).json({ error: 'Failed to get analysis summary' });
  }
});

// Get trend analysis summary from materialized view
router.get('/trend-summary/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const { metricName, periodType } = req.query;

    let whereClause = 'business_account_id = $1';
    const params: any[] = [businessAccountId];

    if (metricName) {
      whereClause += ' AND metric_name = $' + (params.length + 1);
      params.push(metricName);
    }

    if (periodType) {
      whereClause += ' AND period_type = $' + (params.length + 1);
      params.push(periodType);
    }

    const summary = await prisma.$queryRaw`
      SELECT * FROM mv_trend_analysis_summary 
      WHERE ${whereClause}
      ORDER BY latest_date DESC
    `;

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Failed to get trend analysis summary:', error);
    res.status(500).json({ error: 'Failed to get trend analysis summary' });
  }
});

// Get forecast accuracy summary from materialized view
router.get('/accuracy-summary/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const { scenarioName, fiscalYear } = req.query;

    let whereClause = 'business_account_id = $1';
    const params: any[] = [businessAccountId];

    if (scenarioName) {
      whereClause += ' AND scenario_name = $' + (params.length + 1);
      params.push(scenarioName);
    }

    if (fiscalYear) {
      whereClause += ' AND fiscal_year = $' + (params.length + 1);
      params.push(fiscalYear);
    }

    const summary = await prisma.$queryRaw`
      SELECT * FROM mv_forecast_accuracy_summary 
      WHERE ${whereClause}
      ORDER BY last_updated DESC
    `;

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Failed to get forecast accuracy summary:', error);
    res.status(500).json({ error: 'Failed to get forecast accuracy summary' });
  }
});

export default router;

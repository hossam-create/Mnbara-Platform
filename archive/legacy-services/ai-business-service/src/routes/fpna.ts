import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { FinancialAssumptionsService } from '../services/fpna/FinancialAssumptionsService';
import { ForecastingEngine } from '../services/fpna/ForecastingEngine';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const assumptionsService = new FinancialAssumptionsService(prisma);
const forecastingEngine = new ForecastingEngine(prisma, assumptionsService);

// Financial Assumptions Routes

// Create default assumptions
router.post('/assumptions/default', authMiddleware, rbacMiddleware(['ADMIN', 'FINANCE_MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string()
    });

    const { businessAccountId } = schema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const assumptions = await assumptionsService.createDefaultAssumptions(businessAccountId, userId);
    res.json({ success: true, data: assumptions });
  } catch (error) {
    logger.error('Failed to create default assumptions:', error);
    res.status(500).json({ error: 'Failed to create default assumptions' });
  }
});

// Get all assumptions
router.get('/assumptions', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      category: z.string().optional(),
      isActive: z.string().optional().transform(val => val === 'true'),
      isEditable: z.string().optional().transform(val => val === 'true'),
      version: z.string().optional().transform(val => parseInt(val))
    });

    const query = schema.parse(req.query);
    const assumptions = await assumptionsService.getAssumptions(query.businessAccountId, {
      category: query.category,
      isActive: query.isActive,
      isEditable: query.isEditable,
      version: query.version
    });

    res.json({ success: true, data: assumptions });
  } catch (error) {
    logger.error('Failed to get assumptions:', error);
    res.status(500).json({ error: 'Failed to get assumptions' });
  }
});

// Get assumption by key
router.get('/assumptions/:key', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      key: z.string(),
      version: z.string().optional().transform(val => parseInt(val))
    });

    const { businessAccountId } = req.query;
    const { key } = req.params;
    const { version } = req.query;

    const assumption = await assumptionsService.getAssumptionByKey(
      businessAccountId as string,
      key,
      version
    );

    if (!assumption) {
      return res.status(404).json({ error: 'Assumption not found' });
    }

    res.json({ success: true, data: assumption });
  } catch (error) {
    logger.error('Failed to get assumption:', error);
    res.status(500).json({ error: 'Failed to get assumption' });
  }
});

// Create assumption
router.post('/assumptions', authenticateToken, requireRole(['ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      assumptionCategory: z.string(),
      assumptionName: z.string(),
      assumptionKey: z.string(),
      assumptionValue: z.number(),
      assumptionType: z.enum(['PERCENTAGE', 'GROWTH_RATE', 'DAYS', 'RATIO', 'AMOUNT']),
      unitOfMeasure: z.string().optional(),
      description: z.string().optional(),
      isEditable: z.boolean().optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    const assumption = await assumptionsService.createAssumption({
      ...data,
      createdBy: userId
    });

    res.json({ success: true, data: assumption });
  } catch (error) {
    logger.error('Failed to create assumption:', error);
    res.status(500).json({ error: 'Failed to create assumption' });
  }
});

// Update assumption
router.put('/assumptions/:key', authenticateToken, requireRole(['ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      assumptionValue: z.number().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      isEditable: z.boolean().optional(),
      changeReason: z.string().optional()
    });

    const { businessAccountId } = req.query;
    const { key } = req.params;
    const data = schema.parse(req.body);
    const userId = req.user?.id;

    const assumption = await assumptionsService.updateAssumption(
      businessAccountId as string,
      key,
      {
        ...data,
        updatedBy: userId
      }
    );

    res.json({ success: true, data: assumption });
  } catch (error) {
    logger.error('Failed to update assumption:', error);
    res.status(500).json({ error: 'Failed to update assumption' });
  }
});

// Get assumptions by category
router.get('/assumptions/by-category/:businessAccountId', authenticateToken, async (req, res) => {
  try {
    const { businessAccountId } = req.params;
    const assumptions = await assumptionsService.getAssumptionsByCategory(businessAccountId);
    res.json({ success: true, data: assumptions });
  } catch (error) {
    logger.error('Failed to get assumptions by category:', error);
    res.status(500).json({ error: 'Failed to get assumptions by category' });
  }
});

// Validate assumptions
router.get('/assumptions/validate/:businessAccountId', authenticateToken, async (req, res) => {
  try {
    const { businessAccountId } = req.params;
    const validation = await assumptionsService.validateAssumptions(businessAccountId);
    res.json({ success: true, data: validation });
  } catch (error) {
    logger.error('Failed to validate assumptions:', error);
    res.status(500).json({ error: 'Failed to validate assumptions' });
  }
});

// Get assumptions history
router.get('/assumptions/history/:businessAccountId', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      assumptionKey: z.string().optional(),
      startDate: z.string().optional().transform(val => new Date(val)),
      endDate: z.string().optional().transform(val => new Date(val)),
      changedBy: z.string().optional()
    });

    const { businessAccountId } = req.params;
    const filters = schema.parse(req.query);

    const history = await assumptionsService.getAssumptionsHistory(businessAccountId, filters);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Failed to get assumptions history:', error);
    res.status(500).json({ error: 'Failed to get assumptions history' });
  }
});

// Bulk update assumptions
router.put('/assumptions/bulk/:businessAccountId', authenticateToken, requireRole(['ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const schema = z.object({
      updates: z.array(z.object({
        assumptionKey: z.string(),
        assumptionValue: z.number(),
        changeReason: z.string().optional()
      }))
    });

    const { businessAccountId } = req.params;
    const { updates } = schema.parse(req.body);
    const userId = req.user?.id;

    const updatedAssumptions = await assumptionsService.bulkUpdateAssumptions(
      businessAccountId,
      updates,
      userId!
    );

    res.json({ success: true, data: updatedAssumptions });
  } catch (error) {
    logger.error('Failed to bulk update assumptions:', error);
    res.status(500).json({ error: 'Failed to bulk update assumptions' });
  }
});

// Export assumptions
router.get('/assumptions/export/:businessAccountId', authenticateToken, async (req, res) => {
  try {
    const { businessAccountId } = req.params;
    const exportData = await assumptionsService.exportAssumptions(businessAccountId);
    res.json({ success: true, data: exportData });
  } catch (error) {
    logger.error('Failed to export assumptions:', error);
    res.status(500).json({ error: 'Failed to export assumptions' });
  }
});

// Import assumptions
router.post('/assumptions/import/:businessAccountId', authenticateToken, requireRole(['ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const schema = z.object({
      importData: z.any(),
      options: z.object({
        overwriteExisting: z.boolean().optional(),
        createNewVersion: z.boolean().optional()
      }).optional()
    });

    const { businessAccountId } = req.params;
    const { importData, options } = schema.parse(req.body);
    const userId = req.user?.id;

    const importedAssumptions = await assumptionsService.importAssumptions(
      businessAccountId,
      importData,
      userId!,
      options
    );

    res.json({ success: true, data: importedAssumptions });
  } catch (error) {
    logger.error('Failed to import assumptions:', error);
    res.status(500).json({ error: 'Failed to import assumptions' });
  }
});

// Forecasting Routes

// Generate forecast
router.post('/forecast', authenticateToken, requireRole(['ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      scenarioName: z.string(),
      scenarioType: z.enum(['BASE', 'OPTIMISTIC', 'PESSIMISTIC', 'CUSTOM']),
      startDate: z.string().transform(val => new Date(val)),
      endDate: z.string().transform(val => new Date(val)),
      periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      baseRevenue: z.number().optional(),
      forecastMethod: z.enum(['PERCENTAGE_OF_SALES', 'GROWTH_BASED', 'TREND_BASED'])
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    const forecast = await forecastingEngine.generateForecast({
      ...data,
      userId
    });

    res.json({ success: true, data: forecast });
  } catch (error) {
    logger.error('Failed to generate forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Get forecast
router.get('/forecast/:scenarioId', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      businessAccountId: z.string()
    });

    const { scenarioId } = req.params;
    const { businessAccountId } = schema.parse(req.query);

    const forecast = await forecastingEngine.getForecast(businessAccountId, scenarioId);

    if (!forecast) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    res.json({ success: true, data: forecast });
  } catch (error) {
    logger.error('Failed to get forecast:', error);
    res.status(500).json({ error: 'Failed to get forecast' });
  }
});

// List forecasts
router.get('/forecasts/:businessAccountId', authenticateToken, async (req, res) => {
  try {
    const { businessAccountId } = req.params;
    const forecasts = await forecastingEngine.listForecasts(businessAccountId);
    res.json({ success: true, data: forecasts });
  } catch (error) {
    logger.error('Failed to list forecasts:', error);
    res.status(500).json({ error: 'Failed to list forecasts' });
  }
});

// Delete forecast
router.delete('/forecast/:scenarioId', authenticateToken, requireRole(['ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const schema = z.object({
      businessAccountId: z.string()
    });

    const { scenarioId } = req.params;
    const { businessAccountId } = schema.parse(req.query);

    await forecastingEngine.deleteForecast(businessAccountId, scenarioId);
    res.json({ success: true, message: 'Forecast deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete forecast:', error);
    res.status(500).json({ error: 'Failed to delete forecast' });
  }
});

// Refresh materialized views
router.post('/refresh-views', authenticateToken, requireRole(['ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    await prisma.$executeRaw`SELECT refresh_forecast_views()`;
    res.json({ success: true, message: 'Forecast views refreshed successfully' });
  } catch (error) {
    logger.error('Failed to refresh forecast views:', error);
    res.status(500).json({ error: 'Failed to refresh forecast views' });
  }
});

export default router;

import { Router, Response, Request } from 'express';
import { adminStatistics } from '../services/AdminStatistics.service';
import { rulesEngine } from '../services/RulesEngine.service';
import { AdminEvaluationsResponse } from '../types/Admin.types';

/**
 * Admin Routes - READ ONLY
 * 
 * Provides visibility into rule evaluations without control capabilities
 * NO editing, NO disabling, NO UI control - READ ONLY
 */

const router = Router();

/**
 * GET /api/v1/admin/rules/evaluations
 * 
 * Returns rule evaluation statistics for admin visibility
 * READ ONLY - No editing or control capabilities
 */
router.get('/evaluations', (_req: Request, res: Response) => {
  try {
    // Get rule descriptions from registered rules
    const registeredRules = rulesEngine.getRegisteredRules();
    const ruleDescriptions = new Map();
    
    registeredRules.forEach(rule => {
      ruleDescriptions.set(rule.id, {
        description: rule.description,
        severity: rule.severity
      });
    });

    // Get admin evaluations response
    const response: AdminEvaluationsResponse = adminStatistics.getAdminEvaluationsResponse(ruleDescriptions);

    res.json(response);
  } catch (error) {
    console.error('[AdminRoutes] Error getting evaluations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve rule evaluations'
    });
  }
});

/**
 * GET /api/v1/admin/rules/evaluations/summary
 * 
 * Returns summary statistics for all rule evaluations
 * READ ONLY
 */
router.get('/evaluations/summary', (_req: Request, res: Response) => {
  try {
    const summary = adminStatistics.getSummaryStats();
    
    res.json({
      summary,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('[AdminRoutes] Error getting summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve summary statistics'
    });
  }
});

/**
 * GET /api/v1/admin/rules/evaluations/:ruleId
 * 
 * Returns statistics for a specific rule
 * READ ONLY
 */
router.get('/evaluations/:ruleId', (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    
    if (!ruleId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Rule ID is required'
      });
    }

    const ruleStats = adminStatistics.getRuleStats(ruleId);
    
    if (!ruleStats) {
      return res.status(404).json({
        error: 'Not found',
        message: `Rule '${ruleId}' not found or has no evaluations`
      });
    }

    // Get rule description
    const registeredRules = rulesEngine.getRegisteredRules();
    const rule = registeredRules.find(r => r.id === ruleId);
    
    res.json({
      ruleId: ruleStats.ruleId,
      ruleDescription: rule?.description || 'Unknown Rule',
      ruleSeverity: rule?.severity,
      counts: {
        allow: ruleStats.allowCount,
        deny: ruleStats.denyCount,
        flag: ruleStats.flagCount,
        total: ruleStats.totalCount
      },
      lastTriggeredAt: ruleStats.lastTriggeredAt,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('[AdminRoutes] Error getting rule stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve rule statistics'
    });
  }
});

export default router;

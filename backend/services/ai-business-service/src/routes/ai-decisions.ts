import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AIRecommendationEngine } from '../services/ai-decisions/AIRecommendationEngine';
import { SimulationEngine } from '../services/ai-decisions/SimulationEngine';
import { AlertsEngine } from '../services/ai-decisions/AlertsEngine';
import { DecisionIntegrationLayer } from '../services/ai-decisions/DecisionIntegrationLayer';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize services
const recommendationEngine = new AIRecommendationEngine(prisma);
const simulationEngine = new SimulationEngine(prisma);
const alertsEngine = new AlertsEngine(prisma);
const decisionLayer = new DecisionIntegrationLayer(prisma, recommendationEngine, simulationEngine, alertsEngine);

// Middleware to ensure authenticated requests
router.use(authMiddleware);

// ========================================
// AI RECOMMENDATIONS ENDPOINTS
// ========================================

// Generate AI recommendations
router.post('/recommendations/generate', async (req: AuthenticatedRequest, res) => {
  try {
    const { businessAccountId, recommendationType, category, limit } = req.body;
    
    const result = await recommendationEngine.generateRecommendations({
      businessAccountId,
      recommendationType,
      category,
      limit
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate recommendations'
    });
  }
});

// Get recommendations
router.get('/recommendations', async (req: AuthenticatedRequest, res) => {
  try {
    const { businessAccountId, type, category, status, limit } = req.query;
    
    const recommendations = await recommendationEngine.getRecommendations(
      businessAccountId as string,
      {
        type: type as string,
        category: category as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendations'
    });
  }
});

// Create manual recommendation
router.post('/recommendations', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await recommendationEngine.createRecommendation(req.body, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create recommendation'
    });
  }
});

// Accept recommendation
router.post('/recommendations/:id/accept', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { notes } = req.body;
    const result = await recommendationEngine.acceptRecommendation(req.params.id, userId, notes);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error accepting recommendation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept recommendation'
    });
  }
});

// Update recommendation status
router.put('/recommendations/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { status, notes, actualImpact } = req.body;
    const result = await recommendationEngine.updateRecommendationStatus(
      req.params.id,
      status,
      userId,
      notes,
      actualImpact
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update recommendation status'
    });
  }
});

// Get recommendation categories
router.get('/recommendations/categories', async (req, res) => {
  try {
    const categories = await recommendationEngine.getRecommendationCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting recommendation categories:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendation categories'
    });
  }
});

// Get recommendation impact
router.get('/recommendations/:id/impact', async (req, res) => {
  try {
    const impact = await recommendationEngine.getRecommendationImpact(req.params.id);

    res.json({
      success: true,
      data: impact
    });
  } catch (error) {
    console.error('Error getting recommendation impact:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendation impact'
    });
  }
});

// Track recommendation impact
router.post('/recommendations/:id/impact', async (req: AuthenticatedRequest, res) => {
  try {
    const { metricName, baselineValue, targetValue, actualValue, notes } = req.body;
    
    const result = await recommendationEngine.trackRecommendationImpact(
      req.params.id,
      metricName,
      baselineValue,
      targetValue,
      actualValue,
      notes
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error tracking recommendation impact:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track recommendation impact'
    });
  }
});

// Get recommendation summary
router.get('/recommendations/summary/:businessAccountId', async (req, res) => {
  try {
    const summary = await recommendationEngine.getRecommendationSummary(req.params.businessAccountId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting recommendation summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendation summary'
    });
  }
});

// ========================================
// SIMULATION ENGINE ENDPOINTS
// ========================================

// Create simulation scenario
router.post('/simulations', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await simulationEngine.createSimulation(req.body, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating simulation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create simulation'
    });
  }
});

// Get simulation results
router.get('/simulations/:id/results', async (req, res) => {
  try {
    const results = await simulationEngine.getSimulationResults(req.params.id);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error getting simulation results:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get simulation results'
    });
  }
});

// Get scenarios
router.get('/simulations', async (req, res) => {
  try {
    const { businessAccountId, scenarioType, status, limit } = req.query;
    
    const scenarios = await simulationEngine.getScenarios(
      businessAccountId as string,
      {
        scenarioType: scenarioType as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    console.error('Error getting scenarios:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scenarios'
    });
  }
});

// Compare scenarios
router.post('/simulations/compare', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await simulationEngine.compareScenarios(req.body, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare scenarios'
    });
  }
});

// Delete scenario
router.delete('/simulations/:id', async (req, res) => {
  try {
    const { businessAccountId } = req.query;
    
    await simulationEngine.deleteScenario(req.params.id, businessAccountId as string);

    res.json({
      success: true,
      message: 'Scenario deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete scenario'
    });
  }
});

// ========================================
// ALERTS ENGINE ENDPOINTS
// ========================================

// Create alert rule
router.post('/alerts/rules', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const rule = await alertsEngine.createAlertRule(req.body, userId);

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create alert rule'
    });
  }
});

// Get alert rules
router.get('/alerts/rules', async (req, res) => {
  try {
    const { businessAccountId, severity, isActive, metricName } = req.query;
    
    const rules = await alertsEngine.getAlertRules(
      businessAccountId as string,
      {
        severity: severity as string,
        isActive: isActive ? isActive === 'true' : undefined,
        metricName: metricName as string
      }
    );

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error getting alert rules:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alert rules'
    });
  }
});

// Update alert rule
router.put('/alerts/rules/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const rule = await alertsEngine.updateAlertRule(req.params.id, req.body, userId);

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update alert rule'
    });
  }
});

// Delete alert rule
router.delete('/alerts/rules/:id', async (req, res) => {
  try {
    const { businessAccountId } = req.query;
    
    await alertsEngine.deleteAlertRule(req.params.id, businessAccountId as string);

    res.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete alert rule'
    });
  }
});

// Check alert conditions
router.post('/alerts/check', async (req, res) => {
  try {
    const { businessAccountId } = req.body;
    
    const result = await alertsEngine.checkAlertConditions(businessAccountId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error checking alert conditions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check alert conditions'
    });
  }
});

// Get active alerts
router.get('/alerts/active', async (req, res) => {
  try {
    const { businessAccountId, severity, acknowledged, limit } = req.query;
    
    const alerts = await alertsEngine.getActiveAlerts(
      businessAccountId as string,
      {
        severity: severity as string,
        acknowledged: acknowledged ? acknowledged === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get active alerts'
    });
  }
});

// Acknowledge alert
router.post('/alerts/:id/acknowledge', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { acknowledgmentType, notes } = req.body;
    
    await alertsEngine.acknowledgeAlert(
      req.params.id,
      userId,
      acknowledgmentType,
      notes
    );

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert'
    });
  }
});

// Resolve alert
router.post('/alerts/:id/resolve', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { resolutionNotes } = req.body;
    
    await alertsEngine.resolveAlert(req.params.id, userId, resolutionNotes);

    res.json({
      success: true,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve alert'
    });
  }
});

// Get alert history
router.get('/alerts/history', async (req, res) => {
  try {
    const { businessAccountId, startDate, endDate, severity, limit } = req.query;
    
    const history = await alertsEngine.getAlertHistory(
      businessAccountId as string,
      {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        severity: severity as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting alert history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alert history'
    });
  }
});

// Get alert summary
router.get('/alerts/summary/:businessAccountId', async (req, res) => {
  try {
    const summary = await alertsEngine.getAlertSummary(req.params.businessAccountId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting alert summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alert summary'
    });
  }
});

// ========================================
// DECISION INTEGRATION ENDPOINTS
// ========================================

// Create workflow
router.post('/workflows', async (req: AuthenticatedRequest, res) => {
  try {
    const workflow = await decisionLayer.createWorkflow(req.body);

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow'
    });
  }
});

// Execute workflow step
router.post('/workflows/:id/execute', async (req, res) => {
  try {
    const { action, parameters } = req.body;
    
    const result = await decisionLayer.executeWorkflowStep(req.params.id, action, parameters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing workflow step:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute workflow step'
    });
  }
});

// Get workflows
router.get('/workflows', async (req, res) => {
  try {
    const { businessAccountId, workflowType, status, limit } = req.query;
    
    const workflows = await decisionLayer.getWorkflows(
      businessAccountId as string,
      {
        workflowType: workflowType as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflows'
    });
  }
});

// Record decision outcome
router.post('/outcomes', async (req, res) => {
  try {
    const outcome = await decisionLayer.recordDecisionOutcome(req.body);

    res.json({
      success: true,
      data: outcome
    });
  } catch (error) {
    console.error('Error recording decision outcome:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record decision outcome'
    });
  }
});

// Get dashboard data
router.get('/dashboard/:businessAccountId', async (req, res) => {
  try {
    const dashboardData = await decisionLayer.getDashboardData(req.params.businessAccountId);

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard data'
    });
  }
});

// Execute WhatsApp command
router.post('/whatsapp-command', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { businessAccountId, command, parameters } = req.body;
    
    const result = await decisionLayer.executeWhatsAppCommand(
      businessAccountId,
      command,
      parameters,
      userId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing WhatsApp command:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute WhatsApp command'
    });
  }
});

export default router;

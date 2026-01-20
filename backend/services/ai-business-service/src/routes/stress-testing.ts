import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { StressTestService } from '../services/testing/StressTestService';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize service
const stressTestService = new StressTestService(prisma);

// Middleware to ensure authenticated requests
router.use(authMiddleware);

// ========================================
// STRESS TEST SCENARIOS ENDPOINTS
// ========================================

// Create Stress Test Scenario
router.post('/scenarios', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const scenario = await stressTestService.createStressTestScenario(req.body, userId);

    res.json({
      success: true,
      data: scenario
    });
  } catch (error) {
    console.error('Error creating stress test scenario:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create stress test scenario'
    });
  }
});

// Get Stress Test Scenarios
router.get('/scenarios', async (req: AuthenticatedRequest, res) => {
  try {
    const { scenarioType, status, createdBy, limit } = req.query;
    
    const scenarios = await stressTestService.getStressTestScenarios({
      scenarioType: scenarioType as string,
      status: status as string,
      createdBy: createdBy as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    console.error('Error getting stress test scenarios:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stress test scenarios'
    });
  }
});

// ========================================
// FINANCIAL CLOSE STRESS TEST ENDPOINTS
// ========================================

// Execute Financial Close Stress Test
router.post('/execute/financial-close', async (req: AuthenticatedRequest, res) => {
  try {
    const { scenarioId, businessAccountId, config } = req.body;
    
    const result = await stressTestService.executeFinancialCloseStressTest(
      scenarioId,
      businessAccountId,
      config
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing financial close stress test:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute financial close stress test'
    });
  }
});

// ========================================
// WHATSAPP COMMAND STRESS TEST ENDPOINTS
// ========================================

// Execute WhatsApp Command Stress Test
router.post('/execute/whatsapp-commands', async (req: AuthenticatedRequest, res) => {
  try {
    const { scenarioId, businessAccountId, config } = req.body;
    
    const result = await stressTestService.executeWhatsAppCommandStressTest(
      scenarioId,
      businessAccountId,
      config
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing WhatsApp command stress test:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute WhatsApp command stress test'
    });
  }
});

// ========================================
// FORECAST STRESS TEST ENDPOINTS
// ========================================

// Execute Forecast Stress Test
router.post('/execute/forecast', async (req: AuthenticatedRequest, res) => {
  try {
    const { scenarioId, businessAccountId, config } = req.body;
    
    const result = await stressTestService.executeForecastStressTest(
      scenarioId,
      businessAccountId,
      config
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing forecast stress test:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute forecast stress test'
    });
  }
});

// ========================================
// TEST RESULTS ENDPOINTS
// ========================================

// Get Stress Test Results
router.get('/results', async (req: AuthenticatedRequest, res) => {
  try {
    const { scenarioId, scenarioType, status, limit } = req.query;
    
    const results = await stressTestService.getStressTestResults(
      scenarioId as string,
      {
        scenarioType: scenarioType as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error getting stress test results:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stress test results'
    });
  }
});

// Get Performance Report
router.get('/results/:testId/report', async (req: AuthenticatedRequest, res) => {
  try {
    const report = await stressTestService.generatePerformanceReport(req.params.testId);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate performance report'
    });
  }
});

// ========================================
// MONITORING ENDPOINTS
// ========================================

// Get Stress Test Summary
router.get('/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await stressTestService.getStressTestSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting stress test summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stress test summary'
    });
  }
});

// Refresh Stress Test Views
router.post('/refresh-views', async (req: AuthenticatedRequest, res) => {
  try {
    await stressTestService.refreshStressTestViews();

    res.json({
      success: true,
      message: 'Stress test views refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing stress test views:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh stress test views'
    });
  }
});

// ========================================
// VALIDATION ENDPOINTS
// ========================================

// Validate Data Integrity
router.post('/validate/integrity', async (req: AuthenticatedRequest, res) => {
  try {
    const { testId, businessAccountId } = req.body;
    
    const result = await prisma.$queryRaw`
      SELECT * FROM validate_data_integrity(${testId}, ${businessAccountId})
    ` as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error validating data integrity:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate data integrity'
    });
  }
});

// ========================================
// AUTOMATION ENDPOINTS
// ========================================

// Schedule Stress Test
router.post('/schedule', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { scenarioId, scheduleName, scheduleType, cronExpression, runTime, runDay, runDate } = req.body;
    
    const result = await prisma.$queryRaw`
      INSERT INTO stress_test_schedules (
        scenario_id, schedule_name, schedule_type, cron_expression,
        run_time, run_day, run_date, is_active, created_by, created_at, updated_at
      ) VALUES (
        ${scenarioId},
        ${scheduleName},
        ${scheduleType},
        ${cronExpression || null},
        ${runTime || null},
        ${runDay || null},
        ${runDate || null},
        true,
        ${userId},
        NOW(),
        NOW()
      )
      RETURNING id, schedule_name, schedule_type, is_active, created_at
    ` as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error scheduling stress test:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule stress test'
    });
  }
});

// Get Scheduled Tests
router.get('/schedules', async (req: AuthenticatedRequest, res) => {
  try {
    const { isActive, scheduleType } = req.query;
    
    let query = `
      SELECT 
        sts.id, sts.schedule_name, sts.schedule_type, sts.cron_expression,
        sts.run_time, sts.run_day, sts.run_date, sts.is_active,
        sts.last_run_at, sts.next_run_at, sts.created_by, sts.created_at,
        stsc.scenario_name, stsc.scenario_type
      FROM stress_test_schedules sts
      JOIN stress_test_scenarios stsc ON sts.scenario_id = stsc.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      query += ` AND sts.is_active = $${paramIndex++}`;
      params.push(isActive === 'true');
    }

    if (scheduleType) {
      query += ` AND sts.schedule_type = $${paramIndex++}`;
      params.push(scheduleType);
    }

    query += ` ORDER BY sts.created_at DESC`;

    const schedules = await prisma.$queryRawUnsafe(query, ...params) as any[];

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error getting scheduled tests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scheduled tests'
    });
  }
});

// ========================================
// HEALTH CHECK ENDPOINTS
// ========================================

// System Health Check
router.get('/health', async (req: AuthenticatedRequest, res) => {
  try {
    // Check database connection
    const dbCheck = await prisma.$queryRaw`SELECT 1 as health_check` as any[];
    
    // Check system resources
    const systemCheck = await prisma.$queryRaw`
      SELECT 
        'database' as component,
        CASE WHEN COUNT(*) > 0 THEN 'healthy' ELSE 'unhealthy' END as status
      FROM stress_test_scenarios
    ` as any[];

    // Get recent test results
    const recentTests = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_tests,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tests,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed_tests
      FROM stress_test_scenarios
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ` as any[];

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      components: {
        database: dbCheck.length > 0 ? 'healthy' : 'unhealthy',
        system: systemCheck[0]?.status || 'unknown'
      },
      recentActivity: recentTests[0] || {
        total_tests: 0,
        completed_tests: 0,
        failed_tests: 0
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'System health check failed'
    });
  }
});

export default router;

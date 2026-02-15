import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ExecutiveDashboardService } from '../services/executive/ExecutiveDashboardService';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize service
const executiveService = new ExecutiveDashboardService(prisma);

// Middleware to ensure authenticated requests
router.use(authMiddleware);

// ========================================
// CEO DASHBOARD ENDPOINTS
// ========================================

// Get CEO Dashboard
router.get('/ceo-dashboard/:businessAccountId', async (req: AuthenticatedRequest, res) => {
  try {
    const { businessAccountId } = req.params;
    const { periodId } = req.query;
    
    const dashboardData = await executiveService.getCEODashboard(
      businessAccountId,
      periodId as string
    );

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting CEO dashboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get CEO dashboard'
    });
  }
});

// ========================================
// CFO DASHBOARD ENDPOINTS
// ========================================

// Get CFO Dashboard
router.get('/cfo-dashboard/:businessAccountId', async (req: AuthenticatedRequest, res) => {
  try {
    const { businessAccountId } = req.params;
    const { periodId } = req.query;
    
    const dashboardData = await executiveService.getCFODashboard(
      businessAccountId,
      periodId as string
    );

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting CFO dashboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get CFO dashboard'
    });
  }
});

// ========================================
// NARRATIVE REPORTS ENDPOINTS
// ========================================

// Generate Narrative Report
router.post('/narrative-reports/generate', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const report = await executiveService.generateNarrativeReport(req.body, userId);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating narrative report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate narrative report'
    });
  }
});

// Get Narrative Reports
router.get('/narrative-reports/:businessAccountId', async (req: AuthenticatedRequest, res) => {
  try {
    const { businessAccountId } = req.params;
    const { reportType, language, periodId, limit } = req.query;
    
    const reports = await executiveService.getNarrativeReports(
      businessAccountId,
      {
        reportType: reportType as string,
        language: language as string,
        periodId: periodId as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error getting narrative reports:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get narrative reports'
    });
  }
});

// Get Narrative Report by ID
router.get('/narrative-reports/report/:reportId', async (req: AuthenticatedRequest, res) => {
  try {
    const report = await executiveService.getNarrativeReportById(req.params.reportId);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting narrative report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get narrative report'
    });
  }
});

// ========================================
// EXECUTIVE ACTION ITEMS ENDPOINTS
// ========================================

// Create Action Item
router.post('/action-items', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const actionItem = await executiveService.createActionItem(req.body, userId);

    res.json({
      success: true,
      data: actionItem
    });
  } catch (error) {
    console.error('Error creating action item:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create action item'
    });
  }
});

// Get Action Items
router.get('/action-items/:businessAccountId', async (req: AuthenticatedRequest, res) => {
  try {
    const { businessAccountId } = req.params;
    const { priority, status, category, assignedTo, limit } = req.query;
    
    const actionItems = await executiveService.getActionItems(
      businessAccountId,
      {
        priority: priority as string,
        status: status as string,
        category: category as string,
        assignedTo: assignedTo as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: actionItems
    });
  } catch (error) {
    console.error('Error getting action items:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get action items'
    });
  }
});

// Update Action Item Status
router.put('/action-items/:actionItemId/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { actionItemId } = req.params;
    const { status, progressPercentage, notes } = req.body;
    
    await executiveService.updateActionItemStatus(
      actionItemId,
      status,
      progressPercentage,
      notes
    );

    res.json({
      success: true,
      message: 'Action item status updated successfully'
    });
  } catch (error) {
    console.error('Error updating action item status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update action item status'
    });
  }
});

// ========================================
// EXECUTIVE SUMMARY ENDPOINTS
// ========================================

// Get Executive Summary
router.get('/summary/:businessAccountId', async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await executiveService.getExecutiveSummary(req.params.businessAccountId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting executive summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get executive summary'
    });
  }
});

// ========================================
// SYSTEM MANAGEMENT ENDPOINTS
// ========================================

// Refresh Executive Views
router.post('/refresh-views', async (req: AuthenticatedRequest, res) => {
  try {
    await executiveService.refreshExecutiveViews();

    res.json({
      success: true,
      message: 'Executive views refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing executive views:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh executive views'
    });
  }
});

export default router;

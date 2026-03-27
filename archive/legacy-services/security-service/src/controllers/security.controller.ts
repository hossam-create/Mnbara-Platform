// Security Controller
// Contrôleur de sécurité

import { Request, Response, NextFunction } from 'express';
import { watermarkService } from '../services/watermark.service';
import { customsService } from '../services/customs.service';
import { vulnerabilityService } from '../services/vulnerability.service';
import { patchService } from '../services/patch.service';
import { auditService } from '../services/audit.service';
import { penTestService } from '../services/pentest.service';
import { logger } from '../utils/logger';

// ==========================================
// 🔐 Code Watermarking Controllers
// ==========================================

export const generateWatermark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await watermarkService.generateWatermark(req.body);
    
    if (result.success) {
      await auditService.logFromRequest(req, 'SECURITY_SCAN_STARTED' as any, 'Generate Watermark', `Watermark generated for organization`, 'SUCCESS' as any);
    }
    
    res.json({
      success: result.success,
      data: result.watermark,
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

export const injectWatermark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { watermarkId, code, location } = req.body;
    const result = await watermarkService.injectWatermark(watermarkId, code, location);
    
    res.json({
      success: result.success,
      data: result.watermark,
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

export const verifyWatermark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    const result = await watermarkService.verifyWatermark(code);
    
    await auditService.logFromRequest(req, 'SECURITY_SCAN_STARTED' as any, 'Verify Watermark', 'Watermark verification performed', 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const reportCodeLeak = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { watermarkId, detectionSource, detectionMethod, leakType } = req.body;
    const result = await watermarkService.reportLeak(watermarkId, detectionSource, detectionMethod, leakType);
    
    if (result.success) {
      await auditService.logFromRequest(req, 'SUSPICIOUS_ACTIVITY' as any, 'Report Leak', `Code leak reported: ${result.leakId}`, 'SUCCESS' as any);
    }
    
    res.json({
      success: result.success,
      leakId: result.leakId,
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationWatermarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const watermarks = await watermarkService.getOrganizationWatermarks(organizationId);
    
    res.json({
      success: true,
      data: watermarks
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 📦 Customs Controllers
// ==========================================

export const getCountryWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode } = req.params;
    const result = await customsService.getCountryWarnings(countryCode);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const checkShipmentRequirements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await customsService.checkShipmentRequirements(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const createRegulation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const regulation = await customsService.createRegulation(req.body);
    
    await auditService.logFromRequest(req, 'CONFIG_CHANGE' as any, 'Create Regulation', `Customs regulation created: ${regulation.id}`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: regulation
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomsWarning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warning = await customsService.createWarning(req.body);
    
    res.json({
      success: true,
      data: warning
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveCountries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countries = await customsService.getActiveCountries();
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    next(error);
  }
};

export const searchRegulations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, countryCode } = req.query;
    const regulations = await customsService.searchRegulations(query as string, countryCode as string);
    
    res.json({
      success: true,
      data: regulations
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 🔒 Vulnerability Scanning Controllers
// ==========================================

export const startVulnerabilityScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vulnerabilityService.startScan(req.body);
    
    await auditService.logFromRequest(req, 'SCAN_STARTED' as any, 'Start Vulnerability Scan', `Scan started: ${result.scanId}`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getScanResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    const result = await vulnerabilityService.getScanResults(scanId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const checkDependencies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dependencies, packageManager } = req.body;
    const result = await vulnerabilityService.checkDependencies(dependencies, packageManager);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getScanHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { target } = req.params;
    const { limit } = req.query;
    const history = await vulnerabilityService.getScanHistory(target, parseInt(limit as string) || 10);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const updateVulnerabilityStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vulnId } = req.params;
    const { status, resolutionNotes } = req.body;
    const result = await vulnerabilityService.updateVulnerabilityStatus(vulnId, status, resolutionNotes);
    
    await auditService.logFromRequest(req, 'VULNERABILITY_FOUND' as any, 'Update Vulnerability', `Vulnerability ${vulnId} status updated to ${status}`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getVulnerabilityStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const timeRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;
    
    const stats = await vulnerabilityService.getStatistics(timeRange);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 📋 Patch Management Controllers
// ==========================================

export const checkAvailablePatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { severity, source, product } = req.query;
    const patches = await patchService.checkAvailablePatches({
      severity: severity as string,
      source: source as string,
      product: product as string
    });
    
    res.json({
      success: true,
      data: patches
    });
  } catch (error) {
    next(error);
  }
};

export const createSecurityPatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patch = await patchService.createPatch(req.body);
    
    await auditService.logFromRequest(req, 'PATCH_APPLIED' as any, 'Create Patch', `Security patch created: ${patch.patchId}`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: patch
    });
  } catch (error) {
    next(error);
  }
};

export const requestPatchDeployment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await patchService.requestDeployment(req.body);
    
    await auditService.logFromRequest(req, 'CONFIG_CHANGE' as any, 'Request Deployment', `Patch deployment requested: ${result.deploymentId}`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getDeploymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deploymentId } = req.params;
    const result = await patchService.getDeploymentStatus(deploymentId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const approvePatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patchId } = req.params;
    const { approvedBy, notes } = req.body;
    const result = await patchService.approvePatch(patchId, approvedBy, notes);
    
    await auditService.logFromRequest(req, 'CONFIG_CHANGE' as any, 'Approve Patch', `Patch ${patchId} approved`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const rejectPatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patchId } = req.params;
    const { rejectedBy, reason } = req.body;
    const result = await patchService.rejectPatch(patchId, rejectedBy, reason);
    
    await auditService.logFromRequest(req, 'CONFIG_CHANGE' as any, 'Reject Patch', `Patch ${patchId} rejected: ${reason}`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patches = await patchService.getPendingApprovals();
    
    res.json({
      success: true,
      data: patches
    });
  } catch (error) {
    next(error);
  }
};

export const getPatchComplianceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { environment } = req.params;
    const report = await patchService.getComplianceReport(environment);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 🧪 Penetration Testing Controllers
// ==========================================

export const startPenTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await penTestService.startPenTest(req.body);
    
    await auditService.logFromRequest(req, 'SCAN_STARTED' as any, 'Start Pen Test', `Penetration test started: ${result.testId}`, 'SUCCESS' as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getPenTestResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId } = req.params;
    const result = await penTestService.getPenTestResults(testId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Pen test not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const schedulePenTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await penTestService.schedulePenTest(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 📊 Audit Controllers
// ==========================================

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      eventType,
      actorId,
      targetId,
      riskLevel,
      result,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const logs = await auditService.getLogs({
      eventType: eventType as any,
      actorId: actorId as string,
      targetId: targetId as string,
      riskLevel: riskLevel as any,
      result: result as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    const timeRange = {
      start: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate as string) : new Date()
    };
    
    const metrics = await auditService.getDashboardMetrics(timeRange);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

export const exportAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, format, eventTypes } = req.body;
    
    const logs = await auditService.exportLogs({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format: format || 'json',
      eventTypes: eventTypes
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(logs);
    } else {
      res.json({
        success: true,
        data: logs
      });
    }
  } catch (error) {
    next(error);
  }
};

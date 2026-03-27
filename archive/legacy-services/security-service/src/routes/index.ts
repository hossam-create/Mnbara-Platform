// Security Routes
// Routes de sécurité

import { Router } from 'express';
import * as controller from '../controllers/security.controller';

const router = Router();

// ==========================================
// 🔐 Code Watermarking Routes
// ==========================================

/**
 * @route POST /api/v1/security/watermark/generate
 * @desc Generate a unique watermark for code
 */
router.post('/watermark/generate', controller.generateWatermark);

/**
 * @route POST /api/v1/security/watermark/inject
 * @desc Inject watermark into code
 */
router.post('/watermark/inject', controller.injectWatermark);

/**
 * @route POST /api/v1/security/watermark/verify
 * @desc Verify watermark in code
 */
router.post('/watermark/verify', controller.verifyWatermark);

/**
 * @route POST /api/v1/security/watermark/leak
 * @desc Report a potential code leak
 */
router.post('/watermark/leak', controller.reportCodeLeak);

/**
 * @route GET /api/v1/security/watermark/organization/:organizationId
 * @desc Get all watermarks for an organization
 */
router.get('/watermark/organization/:organizationId', controller.getOrganizationWatermarks);

// ==========================================
// 📦 Customs Routes
// ==========================================

/**
 * @route GET /api/v1/security/customs/warnings/:countryCode
 * @desc Get customs warnings for a country
 */
router.get('/customs/warnings/:countryCode', controller.getCountryWarnings);

/**
 * @route POST /api/v1/security/customs/check
 * @desc Check customs requirements for a shipment
 */
router.post('/customs/check', controller.checkShipmentRequirements);

/**
 * @route POST /api/v1/security/customs/regulation
 * @desc Create a new customs regulation
 */
router.post('/customs/regulation', controller.createRegulation);

/**
 * @route POST /api/v1/security/customs/warning
 * @desc Create a customs warning
 */
router.post('/customs/warning', controller.createCustomsWarning);

/**
 * @route GET /api/v1/security/customs/countries
 * @desc Get all active countries with customs data
 */
router.get('/customs/countries', controller.getActiveCountries);

/**
 * @route GET /api/v1/security/customs/regulations/search
 * @desc Search regulations by keyword
 */
router.get('/customs/regulations/search', controller.searchRegulations);

// ==========================================
// 🔒 Vulnerability Scanning Routes
// ==========================================

/**
 * @route POST /api/v1/security/vulnerability/scan
 * @desc Start a vulnerability scan
 */
router.post('/vulnerability/scan', controller.startVulnerabilityScan);

/**
 * @route GET /api/v1/security/vulnerability/scan/:scanId
 * @desc Get scan results
 */
router.get('/vulnerability/scan/:scanId', controller.getScanResults);

/**
 * @route POST /api/v1/security/vulnerability/dependencies
 * @desc Check dependencies for vulnerabilities
 */
router.post('/vulnerability/dependencies', controller.checkDependencies);

/**
 * @route GET /api/v1/security/vulnerability/history/:target
 * @desc Get scan history for a target
 */
router.get('/vulnerability/history/:target', controller.getScanHistory);

/**
 * @route PATCH /api/v1/security/vulnerability/:vulnId
 * @desc Update vulnerability status
 */
router.patch('/vulnerability/:vulnId', controller.updateVulnerabilityStatus);

/**
 * @route GET /api/v1/security/vulnerability/statistics
 * @desc Get vulnerability statistics
 */
router.get('/vulnerability/statistics', controller.getVulnerabilityStatistics);

// ==========================================
// 📋 Patch Management Routes
// ==========================================

/**
 * @route GET /api/v1/security/patch/available
 * @desc Get available security patches
 */
router.get('/patch/available', controller.checkAvailablePatches);

/**
 * @route POST /api/v1/security/patch
 * @desc Create a security patch record
 */
router.post('/patch', controller.createSecurityPatch);

/**
 * @route POST /api/v1/security/patch/deploy
 * @desc Request patch deployment
 */
router.post('/patch/deploy', controller.requestPatchDeployment);

/**
 * @route GET /api/v1/security/patch/deploy/:deploymentId
 * @desc Get deployment status
 */
router.get('/patch/deploy/:deploymentId', controller.getDeploymentStatus);

/**
 * @route POST /api/v1/security/patch/:patchId/approve
 * @desc Approve a patch
 */
router.post('/patch/:patchId/approve', controller.approvePatch);

/**
 * @route POST /api/v1/security/patch/:patchId/reject
 * @desc Reject a patch
 */
router.post('/patch/:patchId/reject', controller.rejectPatch);

/**
 * @route GET /api/v1/security/patch/pending
 * @desc Get patches pending approval
 */
router.get('/patch/pending', controller.getPendingApprovals);

/**
 * @route GET /api/v1/security/patch/compliance/:environment
 * @desc Get patch compliance report
 */
router.get('/patch/compliance/:environment', controller.getPatchComplianceReport);

// ==========================================
// 🧪 Penetration Testing Routes
// ==========================================

/**
 * @route POST /api/v1/security/pentest/start
 * @desc Start a penetration test
 */
router.post('/pentest/start', controller.startPenTest);

/**
 * @route GET /api/v1/security/pentest/:testId
 * @desc Get pen test results
 */
router.get('/pentest/:testId', controller.getPenTestResults);

/**
 * @route POST /api/v1/security/pentest/schedule
 * @desc Schedule recurring pen test
 */
router.post('/pentest/schedule', controller.schedulePenTest);

// ==========================================
// 📊 Audit Routes
// ==========================================

/**
 * @route GET /api/v1/security/audit/logs
 * @desc Get audit logs with filtering
 */
router.get('/audit/logs', controller.getAuditLogs);

/**
 * @route GET /api/v1/security/audit/metrics
 * @desc Get dashboard metrics
 */
router.get('/audit/metrics', controller.getDashboardMetrics);

/**
 * @route POST /api/v1/security/audit/export
 * @desc Export audit logs
 */
router.post('/audit/export', controller.exportAuditLogs);

export default router;

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { DecisionController } from '../controllers/DecisionController';
import { AuditLogController } from '../controllers/AuditLogController';
import { WebhookController } from '../controllers/WebhookController';
import { authMiddleware } from '../middlewares/auth.placeholder';

/**
 * API v1 Routes - Versioned REST endpoints
 * 
 * Rules:
 * - Versioned under /api/v1
 * - CRUD operations only
 * - NO business logic in routes
 * - Auth middleware placeholder only
 */

export function createV1Router(prisma: PrismaClient): Router {
  const router = Router();

  const decisionController = new DecisionController(prisma);
  const auditLogController = new AuditLogController(prisma);
  const webhookController = new WebhookController(prisma);

  // Apply auth middleware placeholder to all routes except webhooks
  // Webhooks use signature validation instead
  
  // Webhook routes (NO auth middleware - uses signature validation)
  router.post(
    '/webhooks/custodii',
    (req, res) => webhookController.handleWebhook(req, res)
  );

  // Apply auth middleware to remaining routes
  router.use(authMiddleware);

  // Decision routes
  router.post(
    '/decisions',
    (req, res) => decisionController.createDecision(req, res)
  );

  router.get(
    '/decisions/:id',
    (req, res) => decisionController.getDecision(req, res)
  );

  router.get(
    '/decisions/by-decision-id/:decisionId',
    (req, res) => decisionController.getDecisionByDecisionId(req, res)
  );

  router.get(
    '/decisions/asset/:assetType/:assetId',
    (req, res) => decisionController.getDecisionsByAsset(req, res)
  );

  router.get(
    '/decisions',
    (req, res) => decisionController.listDecisions(req, res)
  );

  // Audit log routes
  router.get(
    '/audit-logs/decision/:decisionId',
    (req, res) => auditLogController.getAuditLogs(req, res)
  );

  router.get(
    '/audit-logs',
    (req, res) => auditLogController.queryAuditLogs(req, res)
  );

  return router;
}

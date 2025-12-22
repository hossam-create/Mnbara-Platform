/**
 * Health Controller
 * Health check endpoints for AI Core service
 */

import { Request, Response } from 'express';
import { HealthStatus, HealthCheck } from '../types/ai-core.types';
import { auditLoggerService } from '../services/audit-logger.service';

const SERVICE_VERSION = '1.0.0';
const startTime = Date.now();

export class HealthController {
  /**
   * GET /api/ai-core/health
   * Full health check with all components
   */
  async check(req: Request, res: Response): Promise<void> {
    const checks: HealthCheck[] = [];

    // Check intent classifier
    const intentCheck = this.checkIntentClassifier();
    checks.push(intentCheck);

    // Check trust scorer
    const trustCheck = this.checkTrustScorer();
    checks.push(trustCheck);

    // Check risk assessor
    const riskCheck = this.checkRiskAssessor();
    checks.push(riskCheck);

    // Check decision recommender
    const decisionCheck = this.checkDecisionRecommender();
    checks.push(decisionCheck);

    // Check user matcher
    const matcherCheck = this.checkUserMatcher();
    checks.push(matcherCheck);

    // Check audit logger
    const auditCheck = this.checkAuditLogger();
    checks.push(auditCheck);

    // Determine overall status
    const failedChecks = checks.filter((c) => c.status === 'fail');
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (failedChecks.length === 0) {
      status = 'healthy';
    } else if (failedChecks.length <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const healthStatus: HealthStatus = {
      status,
      version: SERVICE_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
      timestamp: new Date().toISOString(),
    };

    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    res.status(httpStatus).json(healthStatus);
  }

  /**
   * GET /api/ai-core/health/ready
   * Readiness probe for Kubernetes
   */
  async ready(req: Request, res: Response): Promise<void> {
    // Check if all critical services are ready
    const criticalChecks = [
      this.checkIntentClassifier(),
      this.checkTrustScorer(),
      this.checkRiskAssessor(),
    ];

    const allReady = criticalChecks.every((c) => c.status === 'pass');

    if (allReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        failedChecks: criticalChecks.filter((c) => c.status === 'fail'),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/ai-core/health/live
   * Liveness probe for Kubernetes
   */
  async live(req: Request, res: Response): Promise<void> {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
      status: 'alive',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    });
  }

  private checkIntentClassifier(): HealthCheck {
    const start = Date.now();
    try {
      // Simple validation that the service is functional
      const { intentClassifierService } = require('../services/intent-classifier.service');
      const result = intentClassifierService.classify({
        userId: 'health-check',
        context: {},
        signals: { action_keyword: 'buy' },
      });

      return {
        name: 'intent_classifier',
        status: result.type ? 'pass' : 'fail',
        responseTimeMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'intent_classifier',
        status: 'fail',
        responseTimeMs: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  private checkTrustScorer(): HealthCheck {
    const start = Date.now();
    try {
      const { trustScorerService } = require('../services/trust-scorer.service');
      const result = trustScorerService.computeTrustScore({
        userId: 'health-check',
        isEmailVerified: true,
        isPhoneVerified: true,
        is2FAEnabled: false,
        totalTransactions: 10,
        successfulTransactions: 9,
        accountCreatedAt: new Date(),
        averageRating: 4.5,
        totalRatings: 5,
        disputesRaised: 0,
        disputesLost: 0,
        responseRate: 0.9,
        kycLevel: 'basic',
      });

      return {
        name: 'trust_scorer',
        status: typeof result.score === 'number' ? 'pass' : 'fail',
        responseTimeMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'trust_scorer',
        status: 'fail',
        responseTimeMs: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  private checkRiskAssessor(): HealthCheck {
    const start = Date.now();
    try {
      const { riskAssessorService } = require('../services/risk-assessor.service');
      // Just verify the service is importable and has the method
      const hasMethod = typeof riskAssessorService.assessRisk === 'function';

      return {
        name: 'risk_assessor',
        status: hasMethod ? 'pass' : 'fail',
        responseTimeMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'risk_assessor',
        status: 'fail',
        responseTimeMs: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  private checkDecisionRecommender(): HealthCheck {
    const start = Date.now();
    try {
      const { decisionRecommenderService } = require('../services/decision-recommender.service');
      const hasMethod = typeof decisionRecommenderService.recommend === 'function';

      return {
        name: 'decision_recommender',
        status: hasMethod ? 'pass' : 'fail',
        responseTimeMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'decision_recommender',
        status: 'fail',
        responseTimeMs: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  private checkUserMatcher(): HealthCheck {
    const start = Date.now();
    try {
      const { userMatcherService } = require('../services/user-matcher.service');
      const hasMethod = typeof userMatcherService.findMatches === 'function';

      return {
        name: 'user_matcher',
        status: hasMethod ? 'pass' : 'fail',
        responseTimeMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'user_matcher',
        status: 'fail',
        responseTimeMs: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  private checkAuditLogger(): HealthCheck {
    const start = Date.now();
    try {
      const stats = auditLoggerService.getStats();

      return {
        name: 'audit_logger',
        status: 'pass',
        responseTimeMs: Date.now() - start,
        message: `${stats.totalOperations} operations logged`,
      };
    } catch (error) {
      return {
        name: 'audit_logger',
        status: 'fail',
        responseTimeMs: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }
}

export const healthController = new HealthController();

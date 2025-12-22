import { Request, Response, NextFunction } from 'express';
import { AIOpsMonitoringService } from '../services/ai-ops-monitoring.service';
import { AccuracyAnalysisRequest, SellerTimelineRequest, DecisionComparisonRequest } from '../types/ai-ops-monitoring.types';

const aiOpsMonitoringService = new AIOpsMonitoringService();

export class AIOpsMonitoringController {
    
    // GET /api/ai/ops/health - System health and operational status
    async getSystemHealth(req: Request, res: Response, next: NextFunction) {
        try {
            const health = await aiOpsMonitoringService.getMonitoringHealth();
            res.json({
                success: true,
                data: health,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/ai/ops/drift - Drift detection metrics
    async getDriftMetrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = '7d', baseline = 'last_week' } = req.query;
            const driftMetrics = await aiOpsMonitoringService.detectDrift({
                period: period as string,
                baseline: baseline as string
            });
            
            res.json({
                success: true,
                data: driftMetrics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/ai/ops/metrics - General AI performance metrics
    async getAIMetrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = '30d' } = req.query;
            const metrics = await aiOpsMonitoringService.getAIMetrics(period as string);
            
            res.json({
                success: true,
                data: metrics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/ai/ops/accuracy - Accuracy analysis with filtering
    async getAccuracyAnalysis(req: Request, res: Response, next: NextFunction) {
        try {
            const { 
                period = '30d',
                sellerId,
                riskBand,
                recommendationType,
                decisionRule 
            } = req.query;

            const request: AccuracyAnalysisRequest = {
                period: period as string,
                sellerId: sellerId ? parseInt(sellerId as string) : undefined,
                riskBand: riskBand as string,
                recommendationType: recommendationType as string,
                decisionRule: decisionRule as string
            };

            const accuracyMetrics = await aiOpsMonitoringService.analyzeAccuracy(request);
            
            res.json({
                success: true,
                data: accuracyMetrics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/ai/ops/rules/performance - Rule performance metrics
    async getRulesPerformance(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = '30d' } = req.query;
            const performance = await aiOpsMonitoringService.getRulePerformance(period as string);
            
            res.json({
                success: true,
                data: performance,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/ai/ops/sellers/:sellerId/timeline - Seller decision timeline
    async getSellerTimeline(req: Request, res: Response, next: NextFunction) {
        try {
            const { sellerId } = req.params;
            const { 
                period = '90d',
                limit = '50',
                offset = '0'
            } = req.query;

            const request: SellerTimelineRequest = {
                sellerId: parseInt(sellerId),
                period: period as string,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
            };

            const timeline = await aiOpsMonitoringService.getSellerDecisionTimeline(request);
            
            res.json({
                success: true,
                data: timeline,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/ai/ops/sellers/:sellerId/compare - Compare decisions between two timestamps
    async compareSellerDecisions(req: Request, res: Response, next: NextFunction) {
        try {
            const { sellerId } = req.params;
            const { from, to } = req.query;

            if (!from || !to) {
                return res.status(400).json({
                    success: false,
                    error: 'Both "from" and "to" query parameters are required',
                    timestamp: new Date().toISOString()
                });
            }

            const request: DecisionComparisonRequest = {
                sellerId: parseInt(sellerId),
                fromTimestamp: new Date(from as string),
                toTimestamp: new Date(to as string)
            };

            const comparison = await aiOpsMonitoringService.compareDecisions(request);
            
            res.json({
                success: true,
                data: comparison,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/ai/ops/health/score - AI health score
    async getAIHealthScore(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = '7d' } = req.query;
            const healthScore = await aiOpsMonitoringService.calculateAIHealthScore(period as string);
            
            res.json({
                success: true,
                data: healthScore,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }

    // Error handling wrapper for async methods
    private handleError(error: any, res: Response) {
        console.error('AI Ops Monitoring Error:', error);
        
        if (error.message?.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }

        if (error.message?.includes('invalid') || error.message?.includes('Invalid')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
}
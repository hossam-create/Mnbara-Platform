import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { FeatureFlagService } from '../services/future-proofing/FeatureFlagService';
import { AsyncJobService } from '../services/future-proofing/AsyncJobService';
import { ReadReplicaService } from '../services/future-proofing/ReadReplicaService';
import { PerformanceMonitoringService } from '../services/future-proofing/PerformanceMonitoringService';

const router = Router();
const prisma = new PrismaClient();

// Initialize services
const featureFlagService = new FeatureFlagService(prisma);
const asyncJobService = new AsyncJobService(prisma);
const readReplicaService = new ReadReplicaService(prisma);
const performanceMonitoringService = new PerformanceMonitoringService(prisma);

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ========================================
// FEATURE FLAGS ROUTES
// ========================================

// Feature Flag Management
router.post('/feature-flags', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { userId } = req.user;
    const flag = await featureFlagService.createFeatureFlag(req.body, userId);
    res.status(201).json(flag);
  } catch (error) {
    console.error('Error creating feature flag:', error);
    res.status(500).json({ error: 'Failed to create feature flag' });
  }
});

router.get('/feature-flags', async (req, res) => {
  try {
    const flags = await featureFlagService.getFeatureFlags(req.query);
    res.json(flags);
  } catch (error) {
    console.error('Error getting feature flags:', error);
    res.status(500).json({ error: 'Failed to retrieve feature flags' });
  }
});

router.get('/feature-flags/:flagKey', async (req, res) => {
  try {
    const flag = await featureFlagService.getFeatureFlagByKey(req.params.flagKey);
    res.json(flag);
  } catch (error) {
    console.error('Error getting feature flag:', error);
    res.status(404).json({ error: 'Feature flag not found' });
  }
});

router.put('/feature-flags/:flagKey', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { userId } = req.user;
    const flag = await featureFlagService.updateFeatureFlag(req.params.flagKey, req.body, userId);
    res.json(flag);
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

router.post('/feature-flags/:flagKey/activate', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { userId } = req.user;
    await featureFlagService.activateFeatureFlag(req.params.flagKey, userId);
    res.json({ message: 'Feature flag activated successfully' });
  } catch (error) {
    console.error('Error activating feature flag:', error);
    res.status(500).json({ error: 'Failed to activate feature flag' });
  }
});

router.post('/feature-flags/:flagKey/deactivate', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { userId } = req.user;
    await featureFlagService.deactivateFeatureFlag(req.params.flagKey, userId);
    res.json({ message: 'Feature flag deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating feature flag:', error);
    res.status(500).json({ error: 'Failed to deactivate feature flag' });
  }
});

router.post('/feature-flags/:flagKey/archive', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { userId } = req.user;
    await featureFlagService.archiveFeatureFlag(req.params.flagKey, userId);
    res.json({ message: 'Feature flag archived successfully' });
  } catch (error) {
    console.error('Error archiving feature flag:', error);
    res.status(500).json({ error: 'Failed to archive feature flag' });
  }
});

router.delete('/feature-flags/:flagKey', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await featureFlagService.deleteFeatureFlag(req.params.flagKey);
    res.json({ message: 'Feature flag deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({ error: 'Failed to delete feature flag' });
  }
});

// Feature Flag Evaluation
router.post('/feature-flags/:flagKey/evaluate', async (req, res) => {
  try {
    const evaluation = await featureFlagService.evaluateFeatureFlag(req.params.flagKey, req.body);
    res.json(evaluation);
  } catch (error) {
    console.error('Error evaluating feature flag:', error);
    res.status(500).json({ error: 'Failed to evaluate feature flag' });
  }
});

router.post('/feature-flags/:flagKey/check', async (req, res) => {
  try {
    const isEnabled = await featureFlagService.isFeatureEnabled(req.params.flagKey, req.body);
    res.json({ enabled: isEnabled });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

router.post('/feature-flags/bulk-evaluate', async (req, res) => {
  try {
    const { flagKeys } = req.body;
    const evaluations = await featureFlagService.evaluateMultipleFeatureFlags(flagKeys, req.body);
    res.json(evaluations);
  } catch (error) {
    console.error('Error bulk evaluating feature flags:', error);
    res.status(500).json({ error: 'Failed to bulk evaluate feature flags' });
  }
});

// Feature Flag Analytics
router.get('/feature-flags/:flagKey/usage', async (req, res) => {
  try {
    const usage = await featureFlagService.getFeatureFlagUsage(req.params.flagKey);
    res.json(usage);
  } catch (error) {
    console.error('Error getting feature flag usage:', error);
    res.status(500).json({ error: 'Failed to retrieve feature flag usage' });
  }
});

router.get('/feature-flags/:flagKey/history', async (req, res) => {
  try {
    const history = await featureFlagService.getFeatureFlagEvaluationHistory(req.params.flagKey, req.query);
    res.json(history);
  } catch (error) {
    console.error('Error getting feature flag history:', error);
    res.status(500).json({ error: 'Failed to retrieve feature flag history' });
  }
});

router.get('/feature-flags/usage', async (req, res) => {
  try {
    const usage = await featureFlagService.getFeatureFlagUsage();
    res.json(usage);
  } catch (error) {
    console.error('Error getting feature flags usage:', error);
    res.status(500).json({ error: 'Failed to retrieve feature flags usage' });
  }
});

// Feature Flag Search
router.get('/feature-flags/search/:searchTerm', async (req, res) => {
  try {
    const flags = await featureFlagService.searchFeatureFlags(req.params.searchTerm);
    res.json(flags);
  } catch (error) {
    console.error('Error searching feature flags:', error);
    res.status(500).json({ error: 'Failed to search feature flags' });
  }
});

router.post('/feature-flags/views/refresh', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await featureFlagService.refreshFeatureFlagViews();
    res.json({ message: 'Feature flag views refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing feature flag views:', error);
    res.status(500).json({ error: 'Failed to refresh feature flag views' });
  }
});

// ========================================
// ASYNC JOBS ROUTES
// ========================================

// Job Management
router.post('/jobs', async (req, res) => {
  try {
    const { userId } = req.user;
    const job = await asyncJobService.createAsyncJob(req.body, userId);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating async job:', error);
    res.status(500).json({ error: 'Failed to create async job' });
  }
});

router.post('/jobs/heavy-report', async (req, res) => {
  try {
    const { userId } = req.user;
    const job = await asyncJobService.createHeavyReportJob(req.body, userId);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating heavy report job:', error);
    res.status(500).json({ error: 'Failed to create heavy report job' });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await asyncJobService.getAsyncJobs(req.query);
    res.json(jobs);
  } catch (error) {
    console.error('Error getting async jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve async jobs' });
  }
});

router.get('/jobs/:jobId', async (req, res) => {
  try {
    const job = await asyncJobService.getAsyncJobById(req.params.jobId);
    res.json(job);
  } catch (error) {
    console.error('Error getting async job:', error);
    res.status(404).json({ error: 'Async job not found' });
  }
});

router.get('/jobs/pending', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const jobs = await asyncJobService.getPendingJobs(Number(limit));
    res.json(jobs);
  } catch (error) {
    console.error('Error getting pending jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve pending jobs' });
  }
});

router.get('/jobs/running', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const jobs = await asyncJobService.getRunningJobs(Number(limit));
    res.json(jobs);
  } catch (error) {
    console.error('Error getting running jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve running jobs' });
  }
});

router.get('/jobs/correlation/:correlationId', async (req, res) => {
  try {
    const jobs = await asyncJobService.getJobsByCorrelationId(req.params.correlationId);
    res.json(jobs);
  } catch (error) {
    console.error('Error getting jobs by correlation ID:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs by correlation ID' });
  }
});

// Job Processing
router.post('/jobs/:jobId/process', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const result = await asyncJobService.processJob(req.params.jobId);
    res.json(result);
  } catch (error) {
    console.error('Error processing job:', error);
    res.status(500).json({ error: 'Failed to process job' });
  }
});

router.post('/jobs/:jobId/start', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await asyncJobService.startJob(req.params.jobId);
    res.json({ message: 'Job started successfully' });
  } catch (error) {
    console.error('Error starting job:', error);
    res.status(500).json({ error: 'Failed to start job' });
  }
});

router.post('/jobs/:jobId/complete', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { result } = req.body;
    await asyncJobService.completeJob(req.params.jobId, result);
    res.json({ message: 'Job completed successfully' });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ error: 'Failed to complete job' });
  }
});

router.post('/jobs/:jobId/fail', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { errorMessage, errorDetails } = req.body;
    await asyncJobService.failJob(req.params.jobId, errorMessage, errorDetails);
    res.json({ message: 'Job failed successfully' });
  } catch (error) {
    console.error('Error failing job:', error);
    res.status(500).json({ error: 'Failed to fail job' });
  }
});

router.post('/jobs/:jobId/cancel', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await asyncJobService.cancelJob(req.params.jobId);
    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

router.post('/jobs/:jobId/retry', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await asyncJobService.retryJob(req.params.jobId);
    res.json({ message: 'Job retry initiated successfully' });
  } catch (error) {
    console.error('Error retrying job:', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

router.delete('/jobs/:jobId', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await asyncJobService.deleteJob(req.params.jobId);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Job Dependencies
router.post('/jobs/:jobId/dependencies', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { dependsOnJobId, dependencyType } = req.body;
    await asyncJobService.createJobDependency(req.params.jobId, dependsOnJobId, dependencyType);
    res.status(201).json({ message: 'Job dependency created successfully' });
  } catch (error) {
    console.error('Error creating job dependency:', error);
    res.status(500).json({ error: 'Failed to create job dependency' });
  }
});

router.get('/jobs/:jobId/dependencies', async (req, res) => {
  try {
    const dependencies = await asyncJobService.getJobDependencies(req.params.jobId);
    res.json(dependencies);
  } catch (error) {
    console.error('Error getting job dependencies:', error);
    res.status(500).json({ error: 'Failed to retrieve job dependencies' });
  }
});

router.get('/jobs/:jobId/can-run', async (req, res) => {
  try {
    const canRun = await asyncJobService.canJobRun(req.params.jobId);
    res.json({ canRun });
  } catch (error) {
    console.error('Error checking if job can run:', error);
    res.status(500).json({ error: 'Failed to check if job can run' });
  }
});

// Heavy Report Jobs
router.get('/jobs/heavy-reports', async (req, res) => {
  try {
    const jobs = await asyncJobService.getHeavyReportJobs(req.query);
    res.json(jobs);
  } catch (error) {
    console.error('Error getting heavy report jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve heavy report jobs' });
  }
});

// Job Performance Analytics
router.get('/jobs/performance', async (req, res) => {
  try {
    const stats = await asyncJobService.getJobPerformanceStatistics(req.query);
    res.json(stats);
  } catch (error) {
    console.error('Error getting job performance statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve job performance statistics' });
  }
});

router.post('/jobs/views/refresh', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await asyncJobService.refreshAsyncJobViews();
    res.json({ message: 'Async job views refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing async job views:', error);
    res.status(500).json({ error: 'Failed to refresh async job views' });
  }
});

// ========================================
// READ REPLICA ROUTES
// ========================================

// Replica Configuration
router.post('/replicas', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const replica = await readReplicaService.createReadReplicaConfiguration(req.body);
    res.status(201).json(replica);
  } catch (error) {
    console.error('Error creating read replica configuration:', error);
    res.status(500).json({ error: 'Failed to create read replica configuration' });
  }
});

router.get('/replicas', async (req, res) => {
  try {
    const replicas = await readReplicaService.getReadReplicaConfigurations(req.query);
    res.json(replicas);
  } catch (error) {
    console.error('Error getting read replica configurations:', error);
    res.status(500).json({ error: 'Failed to retrieve read replica configurations' });
  }
});

router.get('/replicas/:replicaId', async (req, res) => {
  try {
    const replica = await readReplicaService.getReadReplicaById(req.params.replicaId);
    res.json(replica);
  } catch (error) {
    console.error('Error getting read replica:', error);
    res.status(404).json({ error: 'Read replica configuration not found' });
  }
});

router.put('/replicas/:replicaId', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const replica = await readReplicaService.updateReadReplicaConfiguration(req.params.replicaId, req.body);
    res.json(replica);
  } catch (error) {
    console.error('Error updating read replica configuration:', error);
    res.status(500).json({ error: 'Failed to update read replica configuration' });
  }
});

router.post('/replicas/:replicaId/activate', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await readReplicaService.activateReadReplica(req.params.replicaId);
    res.json({ message: 'Read replica activated successfully' });
  } catch (error) {
    console.error('Error activating read replica:', error);
    res.status(500).json({ error: 'Failed to activate read replica' });
  }
});

router.post('/replicas/:replicaId/deactivate', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await readReplicaService.deactivateReadReplica(req.params.replicaId);
    res.json({ message: 'Read replica deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating read replica:', error);
    res.status(500).json({ error: 'Failed to deactivate read replica' });
  }
});

router.post('/replicas/:replicaId/health-check', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const isHealthy = await readReplicaService.performHealthCheck(req.params.replicaId);
    res.json({ healthy: isHealthy });
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({ error: 'Failed to perform health check' });
  }
});

router.delete('/replicas/:replicaId', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await readReplicaService.deleteReadReplicaConfiguration(req.params.replicaId);
    res.json({ message: 'Read replica configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting read replica configuration:', error);
    res.status(500).json({ error: 'Failed to delete read replica configuration' });
  }
});

// Query Routing Rules
router.post('/query-routing-rules', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const rule = await readReplicaService.createQueryRoutingRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating query routing rule:', error);
    res.status(500).json({ error: 'Failed to create query routing rule' });
  }
});

router.get('/query-routing-rules', async (req, res) => {
  try {
    const rules = await readReplicaService.getQueryRoutingRules(req.query);
    res.json(rules);
  } catch (error) {
    console.error('Error getting query routing rules:', error);
    res.status(500).json({ error: 'Failed to retrieve query routing rules' });
  }
});

router.get('/query-routing-rules/:ruleId', async (req, res) => {
  try {
    const rule = await readReplicaService.getQueryRoutingRuleById(req.params.ruleId);
    res.json(rule);
  } catch (error) {
    console.error('Error getting query routing rule:', error);
    res.status(404).json({ error: 'Query routing rule not found' });
  }
});

router.put('/query-routing-rules/:ruleId', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const rule = await readReplicaService.updateQueryRoutingRule(req.params.ruleId, req.body);
    res.json(rule);
  } catch (error) {
    console.error('Error updating query routing rule:', error);
    res.status(500).json({ error: 'Failed to update query routing rule' });
  }
});

router.post('/query-routing-rules/:ruleId/activate', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await readReplicaService.activateQueryRoutingRule(req.params.ruleId);
    res.json({ message: 'Query routing rule activated successfully' });
  } catch (error) {
    console.error('Error activating query routing rule:', error);
    res.status(500).json({ error: 'Failed to activate query routing rule' });
  }
});

router.post('/query-routing-rules/:ruleId/deactivate', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await readReplicaService.deactivateQueryRoutingRule(req.params.ruleId);
    res.json({ message: 'Query routing rule deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating query routing rule:', error);
    res.status(500).json({ error: 'Failed to deactivate query routing rule' });
  }
});

router.delete('/query-routing-rules/:ruleId', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await readReplicaService.deleteQueryRoutingRule(req.params.ruleId);
    res.json({ message: 'Query routing rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting query routing rule:', error);
    res.status(500).json({ error: 'Failed to delete query routing rule' });
  }
});

// Query Routing
router.post('/query-routing', async (req, res) => {
  try {
    const { queryText, queryType } = req.body;
    const { userId, businessAccountId } = req.user;
    const routing = await readReplicaService.routeQueryToReplica(queryText, queryType, userId, businessAccountId);
    res.json(routing);
  } catch (error) {
    console.error('Error routing query:', error);
    res.status(500).json({ error: 'Failed to route query' });
  }
});

// Replica Analytics
router.get('/replicas/active-healthy', async (req, res) => {
  try {
    const replicas = await readReplicaService.getActiveHealthyReplicas();
    res.json(replicas);
  } catch (error) {
    console.error('Error getting active healthy replicas:', error);
    res.status(500).json({ error: 'Failed to retrieve active healthy replicas' });
  }
});

router.get('/replicas/primary', async (req, res) => {
  try {
    const replica = await readReplicaService.getPrimaryReplica();
    res.json(replica);
  } catch (error) {
    console.error('Error getting primary replica:', error);
    res.status(500).json({ error: 'Failed to retrieve primary replica' });
  }
});

router.get('/replicas/load-statistics', async (req, res) => {
  try {
    const stats = await readReplicaService.getReplicaLoadStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting replica load statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve replica load statistics' });
  }
});

router.post('/replicas/health-checks', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const results = await readReplicaService.performHealthChecks();
    res.json(results);
  } catch (error) {
    console.error('Error performing health checks:', error);
    res.status(500).json({ error: 'Failed to perform health checks' });
  }
});

// Search
router.get('/replicas/search/:searchTerm', async (req, res) => {
  try {
    const replicas = await readReplicaService.searchReadReplicas(req.params.searchTerm);
    res.json(replicas);
  } catch (error) {
    console.error('Error searching read replicas:', error);
    res.status(500).json({ error: 'Failed to search read replicas' });
  }
});

router.get('/query-routing-rules/search/:searchTerm', async (req, res) => {
  try {
    const rules = await readReplicaService.searchQueryRoutingRules(req.params.searchTerm);
    res.json(rules);
  } catch (error) {
    console.error('Error searching query routing rules:', error);
    res.status(500).json({ error: 'Failed to search query routing rules' });
  }
});

// ========================================
// PERFORMANCE MONITORING ROUTES
// ========================================

// Query Performance Logging
router.post('/performance/query', async (req, res) => {
  try {
    await performanceMonitoringService.logQueryPerformance(req.body);
    res.json({ message: 'Query performance logged successfully' });
  } catch (error) {
    console.error('Error logging query performance:', error);
    res.status(500).json({ error: 'Failed to log query performance' });
  }
});

router.get('/performance/query', async (req, res) => {
  try {
    const logs = await performanceMonitoringService.getQueryPerformanceLogs(req.query);
    res.json(logs);
  } catch (error) {
    console.error('Error getting query performance logs:', error);
    res.status(500).json({ error: 'Failed to retrieve query performance logs' });
  }
});

router.get('/performance/query/slow', async (req, res) => {
  try {
    const logs = await performanceMonitoringService.getSlowQueries(req.query);
    res.json(logs);
  } catch (error) {
    console.error('Error getting slow queries:', error);
    res.status(500).json({ error: 'Failed to retrieve slow queries' });
  }
});

router.get('/performance/query/summary', async (req, res) => {
  try {
    const summary = await performanceMonitoringService.getQueryPerformanceSummary(req.query);
    res.json(summary);
  } catch (error) {
    console.error('Error getting query performance summary:', error);
    res.status(500).json({ error: 'Failed to retrieve query performance summary' });
  }
});

// System Metrics
router.post('/performance/system/metrics', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await performanceMonitoringService.collectSystemMetrics(req.body);
    res.json({ message: 'System metrics collected successfully' });
  } catch (error) {
    console.error('Error collecting system metrics:', error);
    res.status(500).json({ error: 'Failed to collect system metrics' });
  }
});

router.get('/performance/system/metrics', async (req, res) => {
  try {
    const metrics = await performanceMonitoringService.getSystemPerformanceMetrics(req.query);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting system performance metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve system performance metrics' });
  }
});

router.get('/performance/system/metrics/latest', async (req, res) => {
  try {
    const metrics = await performanceMonitoringService.getLatestSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting latest system metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve latest system metrics' });
  }
});

// Performance Analytics
router.get('/performance/patterns', async (req, res) => {
  try {
    const { timeRange = 'day' } = req.query;
    const patterns = await performanceMonitoringService.getQueryPatternsAnalysis(timeRange as any);
    res.json(patterns);
  } catch (error) {
    console.error('Error getting query patterns analysis:', error);
    res.status(500).json({ error: 'Failed to retrieve query patterns analysis' });
  }
});

router.get('/performance/trends', async (req, res) => {
  try {
    const { timeRange = 'day' } = req.query;
    const trends = await performanceMonitoringService.getDatabasePerformanceTrends(timeRange as any);
    res.json(trends);
  } catch (error) {
    console.error('Error getting database performance trends:', error);
    res.status(500).json({ error: 'Failed to retrieve database performance trends' });
  }
});

router.get('/performance/slow-queries/top', async (req, res) => {
  try {
    const { limit = 10, timeRange = 'day' } = req.query;
    const queries = await performanceMonitoringService.getTopSlowQueries(Number(limit), timeRange as any);
    res.json(queries);
  } catch (error) {
    console.error('Error getting top slow queries:', error);
    res.status(500).json({ error: 'Failed to retrieve top slow queries' });
  }
});

router.get('/performance/by-user', async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    const performance = await performanceMonitoringService.getQueryPerformanceByUser(
      userId as string, 
      Number(limit)
    );
    res.json(performance);
  } catch (error) {
    console.error('Error getting query performance by user:', error);
    res.status(500).json({ error: 'Failed to retrieve query performance by user' });
  }
});

router.get('/performance/by-business-account', async (req, res) => {
  try {
    const { businessAccountId, limit = 50 } = req.query;
    const performance = await performanceMonitoringService.getQueryPerformanceByBusinessAccount(
      businessAccountId as string, 
      Number(limit)
    );
    res.json(performance);
  } catch (error) {
    console.error('Error getting query performance by business account:', error);
    res.status(500).json({ error: 'Failed to retrieve query performance by business account' });
  }
});

router.get('/performance/alerts', async (req, res) => {
  try {
    const alerts = await performanceMonitoringService.getPerformanceAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error getting performance alerts:', error);
    res.status(500).json({ error: 'Failed to retrieve performance alerts' });
  }
});

router.get('/performance/dashboard', async (req, res) => {
  try {
    const dashboard = await performanceMonitoringService.getPerformanceDashboardData();
    res.json(dashboard);
  } catch (error) {
    console.error('Error getting performance dashboard data:', error);
    res.status(500).json({ error: 'Failed to retrieve performance dashboard data' });
  }
});

router.get('/performance/statistics', async (req, res) => {
  try {
    const { timeRange = 'day' } = req.query;
    const stats = await performanceMonitoringService.getPerformanceStatistics(timeRange as any);
    res.json(stats);
  } catch (error) {
    console.error('Error getting performance statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve performance statistics' });
  }
});

// Performance Management
router.post('/performance/views/refresh', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    await performanceMonitoringService.refreshPerformanceViews();
    res.json({ message: 'Performance views refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing performance views:', error);
    res.status(500).json({ error: 'Failed to refresh performance views' });
  }
});

router.post('/performance/cleanup/logs', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { retentionDays = 30 } = req.body;
    const deletedCount = await performanceMonitoringService.cleanOldPerformanceLogs(retentionDays);
    res.json({ deletedCount, message: 'Old performance logs cleaned successfully' });
  } catch (error) {
    console.error('Error cleaning old performance logs:', error);
    res.status(500).json({ error: 'Failed to clean old performance logs' });
  }
});

router.post('/performance/cleanup/metrics', requireRole(['ADMIN', 'AI']), async (req, res) => {
  try {
    const { retentionDays = 90 } = req.body;
    const deletedCount = await performanceMonitoringService.cleanOldSystemMetrics(retentionDays);
    res.json({ deletedCount, message: 'Old system metrics cleaned successfully' });
  } catch (error) {
    console.error('Error cleaning old system metrics:', error);
    res.status(500).json({ error: 'Failed to clean old system metrics' });
  }
});

export default router;

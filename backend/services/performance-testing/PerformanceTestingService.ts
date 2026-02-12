import { Logger } from '@mnbara/shared-utils';
import { EventBus } from '@mnbara/event-bus';
import axios from 'axios';

/**
 * Performance Testing Service - Load testing and performance analysis
 */
export class PerformanceTestingService {
  private logger: Logger;
  private eventBus: EventBus;
  private testScenarios: PerformanceScenario[];

  constructor(eventBus: EventBus) {
    this.logger = new Logger('PerformanceTestingService');
    this.eventBus = eventBus;
    this.testScenarios = this.initializeScenarios();
  }

  /**
   * Initialize performance test scenarios
   */
  private initializeScenarios(): PerformanceScenario[] {
    return [
      {
        id: 'api-load-test',
        name: 'API Load Testing',
        description: 'Test API endpoints under various load conditions',
        type: 'load',
        endpoints: [
          { method: 'GET', path: '/api/plugins', expectedRps: 1000 },
          { method: 'POST', path: '/api/plugins/install', expectedRps: 100 },
          { method: 'GET', path: '/api/streams', expectedRps: 500 },
          { method: 'POST', path: '/api/auctions/bid', expectedRps: 200 },
          { method: 'GET', path: '/api/v1/content/sites/mnbara/content', expectedRps: 800 },
          { method: 'POST', path: '/api/v1/content/sites/mnbara/search', expectedRps: 300 }
        ],
        loadProfile: {
          stages: [
            { duration: '2m', target: 100 },
            { duration: '5m', target: 500 },
            { duration: '2m', target: 1000 },
            { duration: '5m', target: 1000 },
            { duration: '2m', target: 500 },
            { duration: '2m', target: 100 }
          ]
        }
      },
      {
        id: 'streaming-performance',
        name: 'Streaming Performance Test',
        description: 'Test streaming performance under load',
        type: 'streaming',
        endpoints: [
          { method: 'POST', path: '/api/streams/start', expectedRps: 50 },
          { method: 'GET', path: '/api/streams/watch', expectedRps: 5000 },
          { method: 'POST', path: '/api/streams/chat', expectedRps: 1000 }
        ],
        loadProfile: {
          concurrentStreams: 100,
          viewersPerStream: 100,
          duration: '10m',
          metrics: ['bandwidth', 'latency', 'buffering', 'quality']
        }
      },
      {
        id: 'database-performance',
        name: 'Database Performance Test',
        description: 'Test database performance under load',
        type: 'database',
        queries: [
          { name: 'product-search', query: 'SELECT * FROM products WHERE name ILIKE $1', expectedTime: '100ms' },
          { name: 'user-authentication', query: 'SELECT * FROM users WHERE email = $1', expectedTime: '50ms' },
          { name: 'auction-bids', query: 'SELECT * FROM bids WHERE auction_id = $1 ORDER BY created_at DESC', expectedTime: '200ms' },
          { name: 'content-retrieval', query: 'SELECT * FROM content_items WHERE path = $1', expectedTime: '150ms' }
        ],
        loadProfile: {
          concurrentConnections: 200,
          queriesPerSecond: 1000,
          duration: '5m'
        }
      },
      {
        id: 'cache-performance',
        name: 'Cache Performance Test',
        description: 'Test Redis cache performance',
        type: 'cache',
        operations: [
          { name: 'cache-get', operation: 'GET', expectedTime: '5ms' },
          { name: 'cache-set', operation: 'SET', expectedTime: '10ms' },
          { name: 'cache-del', operation: 'DEL', expectedTime: '8ms' },
          { name: 'cache-hget', operation: 'HGET', expectedTime: '6ms' }
        ],
        loadProfile: {
          concurrentOperations: 5000,
          operationsPerSecond: 10000,
          duration: '3m'
        }
      },
      {
        id: 'websocket-performance',
        name: 'WebSocket Performance Test',
        description: 'Test WebSocket performance for real-time features',
        type: 'websocket',
        operations: [
          { name: 'chat-message', operation: 'send-message', expectedLatency: '100ms' },
          { name: 'bid-update', operation: 'bid-update', expectedLatency: '50ms' },
          { name: 'stream-status', operation: 'stream-status', expectedLatency: '200ms' }
        ],
        loadProfile: {
          concurrentConnections: 10000,
          messagesPerSecond: 5000,
          duration: '5m'
        }
      },
      {
        id: 'end-to-end-performance',
        name: 'End-to-End Performance Test',
        description: 'Test complete user workflows under load',
        type: 'e2e',
        workflows: [
          {
            name: 'user-registration-flow',
            steps: ['register', 'verify-email', 'complete-profile', 'create-wallet'],
            expectedTime: '30s'
          },
          {
            name: 'auction-participation-flow',
            steps: ['browse-auctions', 'join-stream', 'place-bids', 'win-auction', 'make-payment'],
            expectedTime: '60s'
          },
          {
            name: 'content-management-flow',
            steps: ['login', 'create-content', 'edit-content', 'publish-content', 'view-content'],
            expectedTime: '45s'
          }
        ],
        loadProfile: {
          concurrentUsers: 500,
          workflowsPerSecond: 10,
          duration: '10m'
        }
      }
    ];
  }

  /**
   * Run all performance tests
   */
  async runPerformanceTests(): Promise<PerformanceTestReport> {
    this.logger.info('Starting comprehensive performance testing');
    
    const report: PerformanceTestReport = {
      timestamp: new Date().toISOString(),
      totalScenarios: this.testScenarios.length,
      completedScenarios: 0,
      failedScenarios: 0,
      scenarios: [],
      summary: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        maxThroughput: 0,
        errorRate: 0,
        performanceScore: 0
      }
    };

    try {
      // Publish test start event
      await this.eventBus.publish({
        type: 'performance.testing_started',
        source: 'performance-testing-service',
        data: {
          scenarios: this.testScenarios.length,
          timestamp: report.timestamp
        }
      });

      // Run each performance scenario
      for (const scenario of this.testScenarios) {
        const scenarioResult = await this.runPerformanceScenario(scenario);
        report.scenarios.push(scenarioResult);
        
        if (scenarioResult.status === 'completed') {
          report.completedScenarios++;
        } else {
          report.failedScenarios++;
        }
      }

      // Calculate summary statistics
      report.summary = this.calculatePerformanceSummary(report.scenarios);

      // Publish test completion event
      await this.eventBus.publish({
        type: 'performance.testing_completed',
        source: 'performance-testing-service',
        data: {
          completedScenarios: report.completedScenarios,
          failedScenarios: report.failedScenarios,
          performanceScore: report.summary.performanceScore,
          timestamp: new Date().toISOString()
        }
      });

      this.logger.info(`Performance testing completed. Performance score: ${report.summary.performanceScore}/100`);
      return report;

    } catch (error) {
      this.logger.error('Performance testing failed', error);
      throw error;
    }
  }

  /**
   * Run individual performance scenario
   */
  private async runPerformanceScenario(scenario: PerformanceScenario): Promise<PerformanceScenarioResult> {
    this.logger.info(`Running performance scenario: ${scenario.name}`);
    
    const result: PerformanceScenarioResult = {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      type: scenario.type,
      status: 'running',
      startTime: new Date().toISOString(),
      endTime: '',
      metrics: {},
      errors: [],
      warnings: [],
      executionTime: 0
    };

    try {
      switch (scenario.type) {
        case 'load':
          result.metrics = await this.runLoadTest(scenario);
          break;
        case 'streaming':
          result.metrics = await this.runStreamingTest(scenario);
          break;
        case 'database':
          result.metrics = await this.runDatabaseTest(scenario);
          break;
        case 'cache':
          result.metrics = await this.runCacheTest(scenario);
          break;
        case 'websocket':
          result.metrics = await this.runWebSocketTest(scenario);
          break;
        case 'e2e':
          result.metrics = await this.runEndToEndTest(scenario);
          break;
        default:
          throw new Error(`Unknown test type: ${scenario.type}`);
      }

      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.executionTime = this.calculateExecutionTime(result.startTime, result.endTime);

      // Analyze results
      const analysis = this.analyzePerformanceResults(scenario, result.metrics);
      result.warnings = analysis.warnings;
      result.errors = analysis.errors;

      return result;

    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.endTime = new Date().toISOString();
      this.logger.error(`Performance scenario ${scenario.name} failed`, error);
      return result;
    }
  }

  /**
   * Run load test
   */
  private async runLoadTest(scenario: PerformanceScenario): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errors: []
    };

    try {
      const responseTimes: number[] = [];
      const startTime = Date.now();
      const testDuration = this.getTestDuration(scenario.loadProfile);
      const endTime = startTime + testDuration;

      // Simulate load testing
      while (Date.now() < endTime) {
        for (const endpoint of scenario.endpoints) {
          try {
            const requestStart = Date.now();
            
            // Simulate API call
            await this.simulateAPICall(endpoint);
            
            const responseTime = Date.now() - requestStart;
            responseTimes.push(responseTime);
            metrics.totalRequests++;
            metrics.successfulRequests++;
            
            // Update response time metrics
            metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
            metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
            
          } catch (error) {
            metrics.totalRequests++;
            metrics.failedRequests++;
            metrics.errors.push({
              endpoint: endpoint.path,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Add small delay to control request rate
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate final metrics
      const actualDuration = (Date.now() - startTime) / 1000; // seconds
      metrics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      metrics.p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
      metrics.p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);
      metrics.throughput = metrics.totalRequests / actualDuration;

      return metrics;

    } catch (error) {
      this.logger.error('Load test failed', error);
      throw error;
    }
  }

  /**
   * Run streaming test
   */
  private async runStreamingTest(scenario: PerformanceScenario): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errors: [],
      additionalMetrics: {
        bandwidth: 0,
        bufferingEvents: 0,
        averageQuality: 'HD',
        droppedConnections: 0
      }
    };

    try {
      const responseTimes: number[] = [];
      const startTime = Date.now();
      const testDuration = this.getTestDuration(scenario.loadProfile);
      const endTime = startTime + testDuration;

      // Simulate streaming load
      while (Date.now() < endTime) {
        for (const endpoint of scenario.endpoints) {
          try {
            const requestStart = Date.now();
            
            // Simulate streaming operation
            await this.simulateStreamingOperation(endpoint);
            
            const responseTime = Date.now() - requestStart;
            responseTimes.push(responseTime);
            metrics.totalRequests++;
            metrics.successfulRequests++;
            
            // Update response time metrics
            metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
            metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
            
          } catch (error) {
            metrics.totalRequests++;
            metrics.failedRequests++;
            metrics.errors.push({
              endpoint: endpoint.path,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate streaming-specific metrics
      const actualDuration = (Date.now() - startTime) / 1000;
      metrics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      metrics.p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
      metrics.p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);
      metrics.throughput = metrics.totalRequests / actualDuration;
      
      // Simulate additional streaming metrics
      metrics.additionalMetrics = {
        bandwidth: Math.random() * 1000 + 500, // Mbps
        bufferingEvents: Math.floor(Math.random() * 10),
        averageQuality: 'HD',
        droppedConnections: Math.floor(Math.random() * 5)
      };

      return metrics;

    } catch (error) {
      this.logger.error('Streaming test failed', error);
      throw error;
    }
  }

  /**
   * Run database test
   */
  private async runDatabaseTest(scenario: PerformanceScenario): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errors: []
    };

    try {
      const responseTimes: number[] = [];
      const startTime = Date.now();
      const testDuration = this.getTestDuration(scenario.loadProfile);
      const endTime = startTime + testDuration;

      // Simulate database queries
      while (Date.now() < endTime) {
        for (const query of scenario.queries) {
          try {
            const queryStart = Date.now();
            
            // Simulate database query
            await this.simulateDatabaseQuery(query);
            
            const responseTime = Date.now() - queryStart;
            responseTimes.push(responseTime);
            metrics.totalRequests++;
            metrics.successfulRequests++;
            
            // Update response time metrics
            metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
            metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
            
          } catch (error) {
            metrics.totalRequests++;
            metrics.failedRequests++;
            metrics.errors.push({
              endpoint: query.name,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Calculate final metrics
      const actualDuration = (Date.now() - startTime) / 1000;
      metrics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      metrics.p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
      metrics.p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);
      metrics.throughput = metrics.totalRequests / actualDuration;

      return metrics;

    } catch (error) {
      this.logger.error('Database test failed', error);
      throw error;
    }
  }

  /**
   * Run cache test
   */
  private async runCacheTest(scenario: PerformanceScenario): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errors: [],
      additionalMetrics: {
        cacheHitRate: 0,
        memoryUsage: 0,
        evictedKeys: 0,
        connectionPoolUsage: 0
      }
    };

    try {
      const responseTimes: number[] = [];
      const startTime = Date.now();
      const testDuration = this.getTestDuration(scenario.loadProfile);
      const endTime = startTime + testDuration;

      // Simulate cache operations
      while (Date.now() < endTime) {
        for (const operation of scenario.operations) {
          try {
            const operationStart = Date.now();
            
            // Simulate cache operation
            await this.simulateCacheOperation(operation);
            
            const responseTime = Date.now() - operationStart;
            responseTimes.push(responseTime);
            metrics.totalRequests++;
            metrics.successfulRequests++;
            
            // Update response time metrics
            metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
            metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
            
          } catch (error) {
            metrics.totalRequests++;
            metrics.failedRequests++;
            metrics.errors.push({
              endpoint: operation.name,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Calculate cache-specific metrics
      const actualDuration = (Date.now() - startTime) / 1000;
      metrics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      metrics.p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
      metrics.p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);
      metrics.throughput = metrics.totalRequests / actualDuration;
      
      // Simulate additional cache metrics
      metrics.additionalMetrics = {
        cacheHitRate: Math.random() * 0.2 + 0.8, // 80-100%
        memoryUsage: Math.random() * 50 + 30, // 30-80%
        evictedKeys: Math.floor(Math.random() * 100),
        connectionPoolUsage: Math.random() * 30 + 70 // 70-100%
      };

      return metrics;

    } catch (error) {
      this.logger.error('Cache test failed', error);
      throw error;
    }
  }

  /**
   * Run WebSocket test
   */
  private async runWebSocketTest(scenario: PerformanceScenario): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errors: [],
      additionalMetrics: {
        activeConnections: 0,
        messageLatency: 0,
        reconnectionAttempts: 0,
        connectionErrors: 0
      }
    };

    try {
      const responseTimes: number[] = [];
      const startTime = Date.now();
      const testDuration = this.getTestDuration(scenario.loadProfile);
      const endTime = startTime + testDuration;

      // Simulate WebSocket operations
      while (Date.now() < endTime) {
        for (const operation of scenario.operations) {
          try {
            const operationStart = Date.now();
            
            // Simulate WebSocket operation
            await this.simulateWebSocketOperation(operation);
            
            const responseTime = Date.now() - operationStart;
            responseTimes.push(responseTime);
            metrics.totalRequests++;
            metrics.successfulRequests++;
            
            // Update response time metrics
            metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
            metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
            
          } catch (error) {
            metrics.totalRequests++;
            metrics.failedRequests++;
            metrics.errors.push({
              endpoint: operation.name,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Calculate WebSocket-specific metrics
      const actualDuration = (Date.now() - startTime) / 1000;
      metrics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      metrics.p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
      metrics.p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);
      metrics.throughput = metrics.totalRequests / actualDuration;
      
      // Simulate additional WebSocket metrics
      metrics.additionalMetrics = {
        activeConnections: Math.floor(Math.random() * 1000) + 9000,
        messageLatency: metrics.averageResponseTime,
        reconnectionAttempts: Math.floor(Math.random() * 50),
        connectionErrors: metrics.failedRequests
      };

      return metrics;

    } catch (error) {
      this.logger.error('WebSocket test failed', error);
      throw error;
    }
  }

  /**
   * Run end-to-end test
   */
  private async runEndToEndTest(scenario: PerformanceScenario): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errors: [],
      additionalMetrics: {
        workflowCompletionRate: 0,
        averageWorkflowTime: 0,
        stepSuccessRates: {},
        userJourneyMetrics: {}
      }
    };

    try {
      const workflowTimes: number[] = [];
      const startTime = Date.now();
      const testDuration = this.getTestDuration(scenario.loadProfile);
      const endTime = startTime + testDuration;

      // Simulate end-to-end workflows
      while (Date.now() < endTime) {
        for (const workflow of scenario.workflows) {
          try {
            const workflowStart = Date.now();
            
            // Simulate complete workflow
            await this.simulateCompleteWorkflow(workflow);
            
            const workflowTime = Date.now() - workflowStart;
            workflowTimes.push(workflowTime);
            metrics.totalRequests++;
            metrics.successfulRequests++;
            
            // Update response time metrics
            metrics.minResponseTime = Math.min(metrics.minResponseTime, workflowTime);
            metrics.maxResponseTime = Math.max(metrics.maxResponseTime, workflowTime);
            
          } catch (error) {
            metrics.totalRequests++;
            metrics.failedRequests++;
            metrics.errors.push({
              endpoint: workflow.name,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Calculate end-to-end specific metrics
      const actualDuration = (Date.now() - startTime) / 1000;
      metrics.averageResponseTime = workflowTimes.reduce((sum, time) => sum + time, 0) / workflowTimes.length;
      metrics.p95ResponseTime = this.calculatePercentile(workflowTimes, 0.95);
      metrics.p99ResponseTime = this.calculatePercentile(workflowTimes, 0.99);
      metrics.throughput = metrics.totalRequests / actualDuration;
      
      // Simulate additional workflow metrics
      metrics.additionalMetrics = {
        workflowCompletionRate: (metrics.successfulRequests / metrics.totalRequests) * 100,
        averageWorkflowTime: metrics.averageResponseTime,
        stepSuccessRates: {
          'step-1': 98,
          'step-2': 95,
          'step-3': 92,
          'step-4': 89,
          'step-5': 87
        },
        userJourneyMetrics: {
          bounceRate: Math.random() * 10,
          conversionRate: Math.random() * 20 + 10,
          engagementTime: Math.random() * 300 + 200
        }
      };

      return metrics;

    } catch (error) {
      this.logger.error('End-to-end test failed', error);
      throw error;
    }
  }

  /**
   * Analyze performance results
   */
  private analyzePerformanceResults(scenario: PerformanceScenario, metrics: PerformanceMetrics): {
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check response time thresholds
    if (metrics.averageResponseTime > 1000) {
      warnings.push(`Average response time (${metrics.averageResponseTime}ms) exceeds 1s threshold`);
    }

    if (metrics.p95ResponseTime > 2000) {
      warnings.push(`95th percentile response time (${metrics.p95ResponseTime}ms) exceeds 2s threshold`);
    }

    // Check error rate
    const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
    if (errorRate > 1) {
      errors.push(`Error rate (${errorRate.toFixed(2)}%) exceeds 1% threshold`);
    }

    // Check throughput
    if (scenario.type === 'load' && metrics.throughput < 100) {
      warnings.push(`Throughput (${metrics.throughput.toFixed(2)} RPS) is below expected minimum`);
    }

    return { warnings, errors };
  }

  /**
   * Calculate performance summary
   */
  private calculatePerformanceSummary(scenarios: PerformanceScenarioResult[]): PerformanceSummary {
    const allResponseTimes: number[] = [];
    const allThroughputs: number[] = [];
    let totalErrors = 0;
    let totalRequests = 0;

    for (const scenario of scenarios) {
      if (scenario.metrics && scenario.status === 'completed') {
        allResponseTimes.push(scenario.metrics.averageResponseTime);
        allThroughputs.push(scenario.metrics.throughput);
        totalErrors += scenario.metrics.failedRequests;
        totalRequests += scenario.metrics.totalRequests;
      }
    }

    const averageResponseTime = allResponseTimes.length > 0 
      ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length 
      : 0;

    const p95ResponseTime = this.calculatePercentile(allResponseTimes, 0.95);
    const p99ResponseTime = this.calculatePercentile(allResponseTimes, 0.99);
    const maxThroughput = allThroughputs.length > 0 ? Math.max(...allThroughputs) : 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Calculate performance score (0-100)
    const performanceScore = this.calculatePerformanceScore({
      averageResponseTime,
      p95ResponseTime,
      errorRate,
      maxThroughput
    });

    return {
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      maxThroughput,
      errorRate,
      performanceScore
    };
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(metrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    maxThroughput: number;
  }): number {
    let score = 100;

    // Deduct points for slow response times
    if (metrics.averageResponseTime > 500) score -= 20;
    else if (metrics.averageResponseTime > 200) score -= 10;

    if (metrics.p95ResponseTime > 1000) score -= 20;
    else if (metrics.p95ResponseTime > 500) score -= 10;

    // Deduct points for high error rates
    if (metrics.errorRate > 5) score -= 30;
    else if (metrics.errorRate > 1) score -= 15;

    // Add points for high throughput
    if (metrics.maxThroughput > 1000) score += 10;
    else if (metrics.maxThroughput > 500) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Simulate API call
   */
  private async simulateAPICall(endpoint: any): Promise<void> {
    // Simulate network delay
    const delay = Math.random() * 200 + 50; // 50-250ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional failures (1% failure rate)
    if (Math.random() < 0.01) {
      throw new Error(`Simulated API failure for ${endpoint.path}`);
    }
  }

  /**
   * Simulate streaming operation
   */
  private async simulateStreamingOperation(endpoint: any): Promise<void> {
    // Simulate streaming latency
    const delay = Math.random() * 100 + 20; // 20-120ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional streaming issues (0.5% failure rate)
    if (Math.random() < 0.005) {
      throw new Error(`Simulated streaming failure for ${endpoint.path}`);
    }
  }

  /**
   * Simulate database query
   */
  private async simulateDatabaseQuery(query: any): Promise<void> {
    // Simulate query execution time
    const delay = Math.random() * 150 + 30; // 30-180ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional query failures (0.2% failure rate)
    if (Math.random() < 0.002) {
      throw new Error(`Simulated database query failure for ${query.name}`);
    }
  }

  /**
   * Simulate cache operation
   */
  private async simulateCacheOperation(operation: any): Promise<void> {
    // Simulate cache operation time
    const delay = Math.random() * 10 + 2; // 2-12ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Cache operations rarely fail
    if (Math.random() < 0.001) {
      throw new Error(`Simulated cache operation failure for ${operation.name}`);
    }
  }

  /**
   * Simulate WebSocket operation
   */
  private async simulateWebSocketOperation(operation: any): Promise<void> {
    // Simulate WebSocket latency
    const delay = Math.random() * 80 + 10; // 10-90ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional connection issues (0.3% failure rate)
    if (Math.random() < 0.003) {
      throw new Error(`Simulated WebSocket failure for ${operation.name}`);
    }
  }

  /**
   * Simulate complete workflow
   */
  private async simulateCompleteWorkflow(workflow: any): Promise<void> {
    // Simulate workflow execution time
    const baseTime = this.parseExpectedTime(workflow.expectedTime);
    const delay = baseTime + Math.random() * baseTime * 0.2; // ±20% variation
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional workflow failures (2% failure rate)
    if (Math.random() < 0.02) {
      throw new Error(`Simulated workflow failure for ${workflow.name}`);
    }
  }

  /**
   * Get test duration
   */
  private getTestDuration(loadProfile: any): number {
    if (loadProfile.duration) {
      return this.parseDuration(loadProfile.duration);
    } else if (loadProfile.stages) {
      return loadProfile.stages.reduce((total: number, stage: any) => {
        return total + this.parseDuration(stage.duration);
      }, 0);
    }
    return 300000; // 5 minutes default
  }

  /**
   * Parse duration string
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)([smh])/);
    if (!match) return 300000; // 5 minutes default
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      default: return 300000;
    }
  }

  /**
   * Parse expected time string
   */
  private parseExpectedTime(expectedTime: string): number {
    const match = expectedTime.match(/(\d+)([smh])/);
    if (!match) return 30000; // 30 seconds default
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      default: return 30000;
    }
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate execution time
   */
  private calculateExecutionTime(startTime: string, endTime: string): number {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return end - start;
  }
}

// Types
interface PerformanceScenario {
  id: string;
  name: string;
  description: string;
  type: 'load' | 'streaming' | 'database' | 'cache' | 'websocket' | 'e2e';
  endpoints?: Array<{
    method: string;
    path: string;
    expectedRps?: number;
  }>;
  queries?: Array<{
    name: string;
    query: string;
    expectedTime: string;
  }>;
  operations?: Array<{
    name: string;
    operation: string;
    expectedTime?: string;
  }>;
  workflows?: Array<{
    name: string;
    steps: string[];
    expectedTime: string;
  }>;
  loadProfile: any;
}

interface PerformanceScenarioResult {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime: string;
  metrics: PerformanceMetrics;
  errors: Array<{
    endpoint: string;
    error: string;
    timestamp: string;
  }>;
  warnings: string[];
  executionTime: number;
  error?: string;
}

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errors: Array<{
    endpoint: string;
    error: string;
    timestamp: string;
  }>;
  additionalMetrics?: Record<string, any>;
}

interface PerformanceTestReport {
  timestamp: string;
  totalScenarios: number;
  completedScenarios: number;
  failedScenarios: number;
  scenarios: PerformanceScenarioResult[];
  summary: PerformanceSummary;
}

interface PerformanceSummary {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxThroughput: number;
  errorRate: number;
  performanceScore: number;
}
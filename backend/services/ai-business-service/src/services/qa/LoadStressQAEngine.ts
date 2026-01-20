import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for Load & Stress QA validation
export const LoadStressTestSchema = z.object({
  id: z.string().uuid(),
  testName: z.string(),
  category: z.enum(['concurrent_operations', 'performance', 'scalability', 'resource_usage', 'throughput']),
  expectedOutcome: z.string(),
  actualOutcome: z.string().optional(),
  status: z.enum(['pass', 'fail', 'skipped']),
  executionTimeMs: z.number(),
  issues: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  testData: z.any().optional(),
  createdAt: z.date()
});

export type LoadStressTestResult = z.infer<typeof LoadStressTestSchema>;

export class LoadStressQAEngine {
  async runLoadStressQASuite(): Promise<LoadStressTestResult[]> {
    console.log('Starting Load & Stress QA Suite...');
    
    const tests: LoadStressTestResult[] = [];
    
    try {
      // Test 1: Concurrent operations
      const concurrentTests = await this.testConcurrentOperations();
      tests.push(...concurrentTests);
      
      // Test 2: Performance under load
      const performanceTests = await this.testPerformanceUnderLoad();
      tests.push(...performanceTests);
      
      // Test 3: Scalability testing
      const scalabilityTests = await this.testScalability();
      tests.push(...scalabilityTests);
      
      // Test 4: Resource usage monitoring
      const resourceTests = await this.testResourceUsage();
      tests.push(...resourceTests);
      
      // Test 5: Throughput testing
      const throughputTests = await this.testThroughput();
      tests.push(...throughputTests);
      
      // Test 6: Database connection pooling
      const connectionTests = await this.testDatabaseConnectionPooling();
      tests.push(...connectionTests);
      
      // Test 7: Cache performance under load
      const cacheTests = await this.testCachePerformance();
      tests.push(...cacheTests);
      
      // Test 8: API rate limiting under stress
      const rateLimitTests = await this.testRateLimitingUnderStress();
      tests.push(...rateLimitTests);
      
      console.log(`Load & Stress QA Suite completed. ${tests.length} tests executed.`);
      return tests;
      
    } catch (error) {
      console.error('Load & Stress QA Suite failed:', error);
      throw error;
    }
  }

  private async testConcurrentOperations(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 1.1: Concurrent API requests
    const startTime = Date.now();
    try {
      const concurrentResults = await this.simulateConcurrentAPIRequests();
      const successRate = (concurrentResults.successful / concurrentResults.total) * 100;
      const actualOutcome = `${successRate.toFixed(2)}% success rate under concurrent load`;
      const status = successRate >= 95 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Concurrent API Request Handling',
        category: 'concurrent_operations',
        expectedOutcome: '≥95% success rate under concurrent load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Low success rate: ${successRate.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Optimize API endpoint performance',
          'Implement connection pooling',
          'Add load balancing mechanisms'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...concurrentResults, successRate },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Concurrent API Request Handling', 'concurrent_operations', startTime, error));
    }
    
    // Test 1.2: Concurrent database operations
    const startTime2 = Date.now();
    try {
      const dbResults = await this.simulateConcurrentDatabaseOperations();
      const avgResponseTime = dbResults.responseTimes.reduce((a: number, b: number) => a + b, 0) / dbResults.responseTimes.length;
      const actualOutcome = `Average response time: ${avgResponseTime.toFixed(2)}ms under concurrent load`;
      const status = avgResponseTime <= 500 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Concurrent Database Operations',
        category: 'concurrent_operations',
        expectedOutcome: '≤500ms average response time under concurrent load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`High response time: ${avgResponseTime.toFixed(2)}ms`] : [],
        recommendations: status === 'fail' ? [
          'Optimize database queries',
          'Implement database connection pooling',
          'Add database indexing'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...dbResults, avgResponseTime },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Concurrent Database Operations', 'concurrent_operations', startTime2, error));
    }
    
    // Test 1.3: Concurrent forecast recalculation
    const startTime3 = Date.now();
    try {
      const forecastResults = await this.simulateConcurrentForecastRecalculation();
      const completionRate = (forecastResults.completed / forecastResults.total) * 100;
      const actualOutcome = `${completionRate.toFixed(2)}% forecast completion rate under concurrent load`;
      const status = completionRate >= 90 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Concurrent Forecast Recalculation',
        category: 'concurrent_operations',
        expectedOutcome: '≥90% forecast completion rate under concurrent load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime3,
        issues: status === 'fail' ? [`Low completion rate: ${completionRate.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Optimize forecast calculation algorithms',
          'Implement forecast calculation queuing',
          'Add forecast result caching'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...forecastResults, completionRate },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Concurrent Forecast Recalculation', 'concurrent_operations', startTime3, error));
    }
    
    return tests;
  }

  private async testPerformanceUnderLoad(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 2.1: API response time under load
    const startTime = Date.now();
    try {
      const performanceResults = await this.simulateAPIPerformanceUnderLoad();
      const p95ResponseTime = this.calculatePercentile(performanceResults.responseTimes, 95);
      const actualOutcome = `P95 response time: ${p95ResponseTime.toFixed(2)}ms under load`;
      const status = p95ResponseTime <= 1000 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'API Response Time Under Load',
        category: 'performance',
        expectedOutcome: '≤1000ms P95 response time under load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`High P95 response time: ${p95ResponseTime.toFixed(2)}ms`] : [],
        recommendations: status === 'fail' ? [
          'Optimize API endpoint performance',
          'Implement response caching',
          'Add CDN for static content'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...performanceResults, p95ResponseTime },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('API Response Time Under Load', 'performance', startTime, error));
    }
    
    // Test 2.2: Database query performance under load
    const startTime2 = Date.now();
    try {
      const dbPerformanceResults = await this.simulateDatabasePerformanceUnderLoad();
      const avgQueryTime = dbPerformanceResults.queryTimes.reduce((a: number, b: number) => a + b, 0) / dbPerformanceResults.queryTimes.length;
      const actualOutcome = `Average query time: ${avgQueryTime.toFixed(2)}ms under load`;
      const status = avgQueryTime <= 200 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Database Query Performance Under Load',
        category: 'performance',
        expectedOutcome: '≤200ms average query time under load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`High average query time: ${avgQueryTime.toFixed(2)}ms`] : [],
        recommendations: status === 'fail' ? [
          'Optimize database queries',
          'Add query result caching',
          'Implement database query optimization'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...dbPerformanceResults, avgQueryTime },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Database Query Performance Under Load', 'performance', startTime2, error));
    }
    
    return tests;
  }

  private async testScalability(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 3.1: Horizontal scalability
    const startTime = Date.now();
    try {
      const scalabilityResults = await this.simulateHorizontalScalability();
      const throughputRatio = scalabilityResults.highLoadThroughput / scalabilityResults.baselineThroughput;
      const actualOutcome = `Throughput ratio: ${throughputRatio.toFixed(2)}x under increased load`;
      const status = throughputRatio >= 0.8 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Horizontal Scalability',
        category: 'scalability',
        expectedOutcome: '≥0.8x throughput ratio under increased load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Poor scalability: ${throughputRatio.toFixed(2)}x ratio`] : [],
        recommendations: status === 'fail' ? [
          'Implement horizontal scaling strategies',
          'Add load balancing mechanisms',
          'Optimize resource allocation'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...scalabilityResults, throughputRatio },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Horizontal Scalability', 'scalability', startTime, error));
    }
    
    // Test 3.2: Vertical scalability
    const startTime2 = Date.now();
    try {
      const verticalResults = await this.simulateVerticalScalability();
      const performanceImprovement = verticalResults.enhancedPerformance / verticalResults.baselinePerformance;
      const actualOutcome = `Performance improvement: ${performanceImprovement.toFixed(2)}x with enhanced resources`;
      const status = performanceImprovement >= 1.5 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Vertical Scalability',
        category: 'scalability',
        expectedOutcome: '≥1.5x performance improvement with enhanced resources',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`Poor vertical scaling: ${performanceImprovement.toFixed(2)}x improvement`] : [],
        recommendations: status === 'fail' ? [
          'Optimize resource utilization',
          'Implement resource scaling policies',
          'Add performance monitoring'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...verticalResults, performanceImprovement },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Vertical Scalability', 'scalability', startTime2, error));
    }
    
    return tests;
  }

  private async testResourceUsage(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 4.1: CPU usage under load
    const startTime = Date.now();
    try {
      const cpuResults = await this.simulateCPUUsageUnderLoad();
      const maxCPUUsage = Math.max(...cpuResults.usage);
      const actualOutcome = `Max CPU usage: ${maxCPUUsage.toFixed(2)}% under load`;
      const status = maxCPUUsage <= 80 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'CPU Usage Under Load',
        category: 'resource_usage',
        expectedOutcome: '≤80% CPU usage under load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`High CPU usage: ${maxCPUUsage.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Optimize CPU-intensive operations',
          'Implement CPU load balancing',
          'Add CPU monitoring and alerting'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...cpuResults, maxCPUUsage },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('CPU Usage Under Load', 'resource_usage', startTime, error));
    }
    
    // Test 4.2: Memory usage under load
    const startTime2 = Date.now();
    try {
      const memoryResults = await this.simulateMemoryUsageUnderLoad();
      const maxMemoryUsage = Math.max(...memoryResults.usage);
      const actualOutcome = `Max memory usage: ${maxMemoryUsage.toFixed(2)}MB under load`;
      const status = maxMemoryUsage <= 1024 ? 'pass' : 'fail'; // 1GB limit
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Memory Usage Under Load',
        category: 'resource_usage',
        expectedOutcome: '≤1024MB memory usage under load',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`High memory usage: ${maxMemoryUsage.toFixed(2)}MB`] : [],
        recommendations: status === 'fail' ? [
          'Optimize memory allocation',
          'Implement memory caching strategies',
          'Add memory leak detection'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...memoryResults, maxMemoryUsage },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Memory Usage Under Load', 'resource_usage', startTime2, error));
    }
    
    return tests;
  }

  private async testThroughput(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 5.1: API throughput
    const startTime = Date.now();
    try {
      const throughputResults = await this.simulateAPIThroughput();
      const requestsPerSecond = throughputResults.totalRequests / (throughputResults.durationMs / 1000);
      const actualOutcome = `${requestsPerSecond.toFixed(2)} requests/second throughput`;
      const status = requestsPerSecond >= 100 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'API Throughput',
        category: 'throughput',
        expectedOutcome: '≥100 requests/second throughput',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Low throughput: ${requestsPerSecond.toFixed(2)} req/s`] : [],
        recommendations: status === 'fail' ? [
          'Optimize API endpoint performance',
          'Implement request batching',
          'Add API caching mechanisms'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...throughputResults, requestsPerSecond },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('API Throughput', 'throughput', startTime, error));
    }
    
    // Test 5.2: Database throughput
    const startTime2 = Date.now();
    try {
      const dbThroughputResults = await this.simulateDatabaseThroughput();
      const transactionsPerSecond = dbThroughputResults.totalTransactions / (dbThroughputResults.durationMs / 1000);
      const actualOutcome = `${transactionsPerSecond.toFixed(2)} transactions/second database throughput`;
      const status = transactionsPerSecond >= 50 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Database Throughput',
        category: 'throughput',
        expectedOutcome: '≥50 transactions/second database throughput',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`Low database throughput: ${transactionsPerSecond.toFixed(2)} tx/s`] : [],
        recommendations: status === 'fail' ? [
          'Optimize database performance',
          'Implement database connection pooling',
          'Add database query optimization'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...dbThroughputResults, transactionsPerSecond },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Database Throughput', 'throughput', startTime2, error));
    }
    
    return tests;
  }

  private async testDatabaseConnectionPooling(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 6.1: Connection pool efficiency
    const startTime = Date.now();
    try {
      const poolResults = await this.simulateDatabaseConnectionPool();
      const connectionEfficiency = poolResults.successfulConnections / poolResults.totalConnectionAttempts;
      const actualOutcome = `${(connectionEfficiency * 100).toFixed(2)}% connection efficiency`;
      const status = connectionEfficiency >= 0.95 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Database Connection Pool Efficiency',
        category: 'performance',
        expectedOutcome: '≥95% connection efficiency',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Low connection efficiency: ${(connectionEfficiency * 100).toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Optimize connection pool configuration',
          'Implement connection retry logic',
          'Add connection monitoring'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...poolResults, connectionEfficiency },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Database Connection Pool Efficiency', 'performance', startTime, error));
    }
    
    return tests;
  }

  private async testCachePerformance(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 7.1: Cache hit ratio under load
    const startTime = Date.now();
    try {
      const cacheResults = await this.simulateCachePerformance();
      const hitRatio = cacheResults.hits / (cacheResults.hits + cacheResults.misses);
      const actualOutcome = `${(hitRatio * 100).toFixed(2)}% cache hit ratio`;
      const status = hitRatio >= 0.8 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Cache Hit Ratio Under Load',
        category: 'performance',
        expectedOutcome: '≥80% cache hit ratio',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Low cache hit ratio: ${(hitRatio * 100).toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Optimize cache strategy',
          'Implement cache warming',
          'Add cache monitoring'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...cacheResults, hitRatio },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Cache Hit Ratio Under Load', 'performance', startTime, error));
    }
    
    return tests;
  }

  private async testRateLimitingUnderStress(): Promise<LoadStressTestResult[]> {
    const tests: LoadStressTestResult[] = [];
    
    // Test 8.1: Rate limiting effectiveness
    const startTime = Date.now();
    try {
      const rateLimitResults = await this.simulateRateLimitingUnderStress();
      const blockedRequests = rateLimitResults.blockedRequests / rateLimitResults.totalRequests;
      const actualOutcome = `${(blockedRequests * 100).toFixed(2)}% of excess requests blocked`;
      const status = blockedRequests >= 0.9 ? 'pass' : 'fail';
      
      tests.push(LoadStressTestSchema.parse({
        id: uuidv4(),
        testName: 'Rate Limiting Effectiveness Under Stress',
        category: 'throughput',
        expectedOutcome: '≥90% of excess requests blocked',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Poor rate limiting: ${(blockedRequests * 100).toFixed(2)}% blocked`] : [],
        recommendations: status === 'fail' ? [
          'Optimize rate limiting algorithms',
          'Implement distributed rate limiting',
          'Add rate limiting monitoring'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...rateLimitResults, blockedRequests },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Rate Limiting Effectiveness Under Stress', 'throughput', startTime, error));
    }
    
    return tests;
  }

  // Helper simulation methods
  private async simulateConcurrentAPIRequests(): Promise<any> {
    // Simulate 100 concurrent API requests
    return {
      total: 100,
      successful: 97,
      failed: 3,
      responseTimes: [120, 150, 180, 200, 250, 300, 350, 400, 450, 500]
    };
  }

  private async simulateConcurrentDatabaseOperations(): Promise<any> {
    // Simulate concurrent database operations
    return {
      totalOperations: 50,
      responseTimes: [80, 120, 150, 200, 250, 300, 350, 400, 450, 550]
    };
  }

  private async simulateConcurrentForecastRecalculation(): Promise<any> {
    // Simulate concurrent forecast recalculations
    return {
      total: 20,
      completed: 18,
      failed: 2,
      averageTime: 2500
    };
  }

  private async simulateAPIPerformanceUnderLoad(): Promise<any> {
    // Simulate API performance under load
    return {
      totalRequests: 1000,
      responseTimes: Array.from({length: 1000}, () => Math.random() * 1500 + 100)
    };
  }

  private async simulateDatabasePerformanceUnderLoad(): Promise<any> {
    // Simulate database performance under load
    return {
      totalQueries: 500,
      queryTimes: Array.from({length: 500}, () => Math.random() * 300 + 50)
    };
  }

  private async simulateHorizontalScalability(): Promise<any> {
    // Simulate horizontal scalability test
    return {
      baselineThroughput: 100,
      highLoadThroughput: 75,
      nodeCount: 3
    };
  }

  private async simulateVerticalScalability(): Promise<any> {
    // Simulate vertical scalability test
    return {
      baselinePerformance: 100,
      enhancedPerformance: 140,
      resourceIncrease: 2
    };
  }

  private async simulateCPUUsageUnderLoad(): Promise<any> {
    // Simulate CPU usage monitoring
    return {
      usage: [45, 52, 58, 65, 72, 78, 82, 85, 88, 90]
    };
  }

  private async simulateMemoryUsageUnderLoad(): Promise<any> {
    // Simulate memory usage monitoring
    return {
      usage: [512, 640, 768, 896, 1024, 1152, 1280, 1408, 1536, 1664]
    };
  }

  private async simulateAPIThroughput(): Promise<any> {
    // Simulate API throughput test
    return {
      totalRequests: 5000,
      durationMs: 45000,
      successfulRequests: 4850
    };
  }

  private async simulateDatabaseThroughput(): Promise<any> {
    // Simulate database throughput test
    return {
      totalTransactions: 2000,
      durationMs: 35000,
      successfulTransactions: 1950
    };
  }

  private async simulateDatabaseConnectionPool(): Promise<any> {
    // Simulate database connection pool test
    return {
      totalConnectionAttempts: 100,
      successfulConnections: 96,
      failedConnections: 4,
      averageConnectionTime: 25
    };
  }

  private async simulateCachePerformance(): Promise<any> {
    // Simulate cache performance test
    return {
      hits: 850,
      misses: 150,
      averageHitTime: 5,
      averageMissTime: 150
    };
  }

  private async simulateRateLimitingUnderStress(): Promise<any> {
    // Simulate rate limiting under stress
    return {
      totalRequests: 2000,
      blockedRequests: 1750,
      allowedRequests: 250,
      rateLimit: 100
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private createErrorTestResult(testName: string, category: string, startTime: number, error: any): LoadStressTestResult {
    return LoadStressTestSchema.parse({
      id: uuidv4(),
      testName,
      category: category as any,
      expectedOutcome: 'Test execution without errors',
      actualOutcome: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'fail',
      executionTimeMs: Date.now() - startTime,
      issues: [`Test execution error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Fix test implementation', 'Check system dependencies', 'Verify test environment'],
      riskLevel: 'high',
      testData: { error: error instanceof Error ? error.message : 'Unknown error' },
      createdAt: new Date()
    });
  }

  async generateLoadStressCertification(testResults: LoadStressTestResult[]): Promise<{
    certificationId: string;
    timestamp: Date;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      skippedTests: number;
      overallStatus: 'pass' | 'fail' | 'warning';
    };
    categoryResults: {
      [key: string]: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        status: 'pass' | 'fail' | 'warning';
        criticalIssues: string[];
      };
    };
    criticalIssues: string[];
    recommendations: string[];
    nextReviewDate: Date;
  }> {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.status === 'pass').length;
    const failedTests = testResults.filter(t => t.status === 'fail').length;
    const skippedTests = testResults.filter(t => t.status === 'skipped').length;
    
    const criticalIssues = testResults
      .filter(t => t.status === 'fail' && t.riskLevel === 'critical')
      .map(t => `${t.testName}: ${t.issues.join(', ')}`);
    
    const overallStatus = criticalIssues.length > 0 ? 'fail' : 
                         failedTests > 0 ? 'warning' : 'pass';
    
    // Group results by category
    const categoryResults: { [key: string]: any } = {};
    const categories = ['concurrent_operations', 'performance', 'scalability', 'resource_usage', 'throughput'];
    
    categories.forEach(category => {
      const categoryTests = testResults.filter(t => t.category === category);
      const categoryPassed = categoryTests.filter(t => t.status === 'pass').length;
      const categoryFailed = categoryTests.filter(t => t.status === 'fail').length;
      const categoryCritical = categoryTests.filter(t => t.status === 'fail' && t.riskLevel === 'critical');
      
      categoryResults[category] = {
        totalTests: categoryTests.length,
        passedTests: categoryPassed,
        failedTests: categoryFailed,
        status: categoryCritical.length > 0 ? 'fail' : categoryFailed > 0 ? 'warning' : 'pass',
        criticalIssues: categoryCritical.map(t => `${t.testName}: ${t.issues.join(', ')}`)
      };
    });
    
    // Generate recommendations
    const recommendations = [
      ...new Set(testResults.flatMap(t => t.recommendations))
    ].slice(0, 10); // Top 10 recommendations
    
    return {
      certificationId: uuidv4(),
      timestamp: new Date(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        overallStatus
      },
      categoryResults,
      criticalIssues,
      recommendations,
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }
}

import { RealTimeMatcherService } from './real-time-matcher.service';
import { Logger } from '@nestjs/common';

/**
 * Load Testing Script for Real-time Matching Service
 * Simulates high traffic scenarios for performance testing
 */

export class RealTimeMatcherLoadTest {
  private readonly logger = new Logger(RealTimeMatcherLoadTest.name);
  private matcherService: RealTimeMatcherService;
  private testUsers: any[] = [];
  private testResults = {
    totalRequests: 0,
    successfulMatches: 0,
    failedMatches: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    throughput: 0,
    errorRate: 0
  };

  constructor() {
    this.matcherService = new RealTimeMatcherService();
  }

  /**
   * Generate test users with realistic data
   */
  private generateTestUsers(count: number): any[] {
    const users = [];
    const currencies = ['USD/EUR', 'ETH/USDT', 'BTC/USD', 'EUR/USD'];
    const swapTypes: ('buy' | 'sell')[] = ['buy', 'sell'];
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 }, // New York
      { latitude: 51.5074, longitude: -0.1278 },  // London
      { latitude: 35.6762, longitude: 139.6503 },  // Tokyo
      { latitude: 48.8566, longitude: 2.3522 },   // Paris
      { latitude: 34.0522, longitude: -118.2437 } // Los Angeles
    ];

    for (let i = 0; i < count; i++) {
      users.push({
        userId: `test_user_${i}`,
        socketId: `socket_${i}`,
        swapType: swapTypes[i % 2],
        currencyPair: currencies[i % currencies.length],
        amount: Math.random() * 10000 + 100,
        preferredPrice: Math.random() * 0.5 + 0.75, // 0.75-1.25 range
        trustScore: Math.random() * 0.4 + 0.6,      // 0.6-1.0 range
        location: locations[i % locations.length],
        verifications: ['KYC', 'Phone', 'Email'],
        joinedAt: new Date(),
        lastActivity: new Date()
      });
    }

    return users;
  }

  /**
   * Run load test with specified parameters
   */
  async runLoadTest({
    userCount = 100,
    durationMs = 60000, // 1 minute
    requestsPerSecond = 50
  }: {
    userCount?: number;
    durationMs?: number;
    requestsPerSecond?: number;
  } = {}): Promise<void> {
    this.logger.log(`Starting load test with ${userCount} users for ${durationMs}ms`);
    
    this.testUsers = this.generateTestUsers(userCount);
    const startTime = Date.now();
    const endTime = startTime + durationMs;
    
    let currentTime = startTime;
    let requestCount = 0;
    const responseTimes: number[] = [];

    // Run test for specified duration
    while (currentTime < endTime) {
      const batchStart = Date.now();
      
      // Process batch of requests
      const batchPromises = [];
      for (let i = 0; i < requestsPerSecond; i++) {
        const user = this.testUsers[requestCount % userCount];
        batchPromises.push(this.processUserRequest(user));
        requestCount++;
      }

      // Wait for batch completion
      const batchResults = await Promise.allSettled(batchPromises);
      const batchEnd = Date.now();
      const batchTime = batchEnd - batchStart;

      // Collect metrics
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          this.testResults.successfulMatches++;
          responseTimes.push(result.value);
          this.testResults.maxResponseTime = Math.max(this.testResults.maxResponseTime, result.value);
          this.testResults.minResponseTime = Math.min(this.testResults.minResponseTime, result.value);
        } else {
          this.testResults.failedMatches++;
        }
      });

      // Calculate throughput
      const actualRps = (requestsPerSecond * 1000) / Math.max(1, batchTime);
      this.testResults.throughput = (this.testResults.throughput + actualRps) / 2;

      // Wait for next batch if needed
      const elapsed = batchEnd - currentTime;
      const waitTime = Math.max(0, 1000 - elapsed);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      currentTime = Date.now();
    }

    // Calculate final metrics
    this.testResults.totalRequests = requestCount;
    this.testResults.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    this.testResults.errorRate = (this.testResults.failedMatches / requestCount) * 100;

    this.logger.log('Load test completed');
    this.printResults();
  }

  /**
   * Process individual user request
   */
  private async processUserRequest(user: any): Promise<number> {
    const startTime = Date.now();
    
    try {
      // Simulate user joining matching pool
      await this.matcherService.joinMatchingPool(user);
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
      
      const responseTime = Date.now() - startTime;
      return responseTime;
    } catch (error) {
      throw new Error(`Request failed for user ${user.userId}: ${error.message}`);
    }
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n📊 LOAD TEST RESULTS 📊');
    console.log('='.repeat(50));
    console.log(`Total Requests: ${this.testResults.totalRequests}`);
    console.log(`Successful Matches: ${this.testResults.successfulMatches}`);
    console.log(`Failed Matches: ${this.testResults.failedMatches}`);
    console.log(`Error Rate: ${this.testResults.errorRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${this.testResults.averageResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${this.testResults.maxResponseTime}ms`);
    console.log(`Min Response Time: ${this.testResults.minResponseTime}ms`);
    console.log(`Throughput: ${this.testResults.throughput.toFixed(2)} requests/second`);
    console.log('='.repeat(50));
    
    // Performance recommendations
    this.provideRecommendations();
  }

  /**
   * Provide performance recommendations based on test results
   */
  private provideRecommendations(): void {
    console.log('\n🎯 PERFORMANCE RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    if (this.testResults.errorRate > 5) {
      console.log('❌ High error rate detected. Consider:');
      console.log('   - Scaling Redis cluster for distributed matching');
      console.log('   - Implementing request rate limiting');
      console.log('   - Adding circuit breakers for external dependencies');
    }
    
    if (this.testResults.averageResponseTime > 100) {
      console.log('⚠️  Response time above optimal threshold. Consider:');
      console.log('   - Optimizing matching algorithms');
      console.log('   - Implementing caching for user data');
      console.log('   - Using WebSocket compression');
    }
    
    if (this.testResults.throughput < 100) {
      console.log('⚠️  Throughput below expected. Consider:');
      console.log('   - Horizontal scaling of matching services');
      console.log('   - Load balancing across multiple instances');
      console.log('   - Database query optimization');
    }
    
    if (this.testResults.errorRate < 1 && this.testResults.averageResponseTime < 50) {
      console.log('✅ Excellent performance! System ready for production.');
    }
    
    console.log('='.repeat(50));
  }

  /**
   * Run stress test to find breaking point
   */
  async runStressTest(maxUsers: number = 1000): Promise<void> {
    this.logger.log(`Running stress test up to ${maxUsers} users`);
    
    const userCounts = [100, 250, 500, 750, 1000];
    const results: any[] = [];
    
    for (const count of userCounts) {
      if (count > maxUsers) break;
      
      this.logger.log(`Testing with ${count} users...`);
      
      // Reset test results
      this.testResults = {
        totalRequests: 0,
        successfulMatches: 0,
        failedMatches: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        throughput: 0,
        errorRate: 0
      };
      
      await this.runLoadTest({
        userCount: count,
        durationMs: 30000, // 30 seconds per test
        requestsPerSecond: Math.min(100, count / 2)
      });
      
      results.push({
        userCount: count,
        ...this.testResults
      });
    }
    
    this.printStressTestResults(results);
  }

  /**
   * Print stress test results
   */
  private printStressTestResults(results: any[]): void {
    console.log('\n🔥 STRESS TEST RESULTS 🔥');
    console.log('='.repeat(80));
    console.log('Users\tReq/s\tAvg RT\tMax RT\tError%\tStatus');
    console.log('-'.repeat(80));
    
    results.forEach(result => {
      const status = result.errorRate < 5 && result.averageResponseTime < 100 ? '✅' : '❌';
      console.log(
        `${result.userCount}\t${result.throughput.toFixed(1)}\t${result.averageResponseTime.toFixed(1)}ms\t` +
        `${result.maxResponseTime}ms\t${result.errorRate.toFixed(1)}%\t${status}`
      );
    });
    
    console.log('='.repeat(80));
  }
}

// Run tests if executed directly
if (require.main === module) {
  const loadTest = new RealTimeMatcherLoadTest();
  
  // Run basic load test
  loadTest.runLoadTest({
    userCount: 200,
    durationMs: 60000,
    requestsPerSecond: 50
  }).catch(console.error);
  
  // Run stress test
  // loadTest.runStressTest(1000).catch(console.error);
}
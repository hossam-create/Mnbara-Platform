import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for Disaster Recovery QA validation
export const DisasterRecoveryTestSchema = z.object({
  id: z.string().uuid(),
  testName: z.string(),
  category: z.enum(['database_failover', 'snapshot_restore', 'service_outage', 'data_backup', 'recovery_time', 'recovery_point']),
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

export type DisasterRecoveryTestResult = z.infer<typeof DisasterRecoveryTestSchema>;

export class DisasterRecoveryQAEngine {
  async runDisasterRecoveryQASuite(): Promise<DisasterRecoveryTestResult[]> {
    console.log('Starting Disaster Recovery & Resilience QA Suite...');
    
    const tests: DisasterRecoveryTestResult[] = [];
    
    try {
      // Test 1: Database failover testing
      const failoverTests = await this.testDatabaseFailover();
      tests.push(...failoverTests);
      
      // Test 2: Snapshot restore testing
      const snapshotTests = await this.testSnapshotRestore();
      tests.push(...snapshotTests);
      
      // Test 3: Service outage tolerance
      const outageTests = await this.testServiceOutageTolerance();
      tests.push(...outageTests);
      
      // Test 4: Data backup verification
      const backupTests = await this.testDataBackup();
      tests.push(...backupTests);
      
      // Test 5: Recovery time objectives
      const rtoTests = await this.testRecoveryTimeObjectives();
      tests.push(...rtoTests);
      
      // Test 6: Recovery point objectives
      const rpoTests = await this.testRecoveryPointObjectives();
      tests.push(...rpoTests);
      
      // Test 7: High availability testing
      const haTests = await this.testHighAvailability();
      tests.push(...haTests);
      
      // Test 8: Disaster recovery procedures
      const procedureTests = await this.testDisasterRecoveryProcedures();
      tests.push(...procedureTests);
      
      console.log(`Disaster Recovery & Resilience QA Suite completed. ${tests.length} tests executed.`);
      return tests;
      
    } catch (error) {
      console.error('Disaster Recovery & Resilience QA Suite failed:', error);
      throw error;
    }
  }

  private async testDatabaseFailover(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 1.1: Automatic database failover
    const startTime = Date.now();
    try {
      const failoverResult = await this.simulateDatabaseFailover();
      const failoverTime = failoverResult.failoverTimeMs;
      const actualOutcome = `Database failover completed in ${failoverTime}ms`;
      const status = failoverTime <= 30000 ? 'pass' : 'fail'; // 30 seconds
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Automatic Database Failover',
        category: 'database_failover',
        expectedOutcome: 'Database failover completes within 30 seconds',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Slow failover: ${failoverTime}ms`] : [],
        recommendations: status === 'fail' ? [
          'Optimize database failover configuration',
          'Implement connection pooling for failover',
          'Add failover monitoring and alerting'
        ] : [],
        riskLevel: status === 'fail' ? 'critical' : 'low',
        testData: { ...failoverResult, failoverTime },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Automatic Database Failover', 'database_failover', startTime, error));
    }
    
    // Test 1.2: Database connection resilience
    const startTime2 = Date.now();
    try {
      const connectionTest = await this.simulateDatabaseConnectionResilience();
      const connectionSuccessRate = (connectionTest.successfulConnections / connectionTest.totalAttempts) * 100;
      const actualOutcome = `${connectionSuccessRate.toFixed(2)}% connection success rate during failover`;
      const status = connectionSuccessRate >= 95 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Database Connection Resilience',
        category: 'database_failover',
        expectedOutcome: '≥95% connection success rate during failover',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`Low connection success rate: ${connectionSuccessRate.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Implement connection retry logic',
          'Add connection pooling with failover support',
          'Create connection monitoring'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...connectionTest, connectionSuccessRate },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Database Connection Resilience', 'database_failover', startTime2, error));
    }
    
    return tests;
  }

  private async testSnapshotRestore(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 2.1: Database snapshot restore
    const startTime = Date.now();
    try {
      const restoreResult = await this.simulateDatabaseSnapshotRestore();
      const restoreTime = restoreResult.restoreTimeMs;
      const actualOutcome = `Database snapshot restore completed in ${restoreTime}ms`;
      const status = restoreTime <= 300000 ? 'pass' : 'fail'; // 5 minutes
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Database Snapshot Restore',
        category: 'snapshot_restore',
        expectedOutcome: 'Database snapshot restore completes within 5 minutes',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Slow restore: ${restoreTime}ms`] : [],
        recommendations: status === 'fail' ? [
          'Optimize snapshot restore process',
          'Implement incremental restore capabilities',
          'Add restore monitoring and alerting'
        ] : [],
        riskLevel: status === 'fail' ? 'critical' : 'low',
        testData: { ...restoreResult, restoreTime },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Database Snapshot Restore', 'snapshot_restore', startTime, error));
    }
    
    // Test 2.2: Snapshot integrity verification
    const startTime2 = Date.now();
    try {
      const integrityTest = await this.simulateSnapshotIntegrityVerification();
      const integrityScore = (integrityTest.verifiedSnapshots / integrityTest.totalSnapshots) * 100;
      const actualOutcome = `${integrityScore.toFixed(2)}% snapshot integrity verification success`;
      const status = integrityScore >= 100 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Snapshot Integrity Verification',
        category: 'snapshot_restore',
        expectedOutcome: '100% snapshot integrity verification success',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`Snapshot integrity issues: ${integrityScore.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Implement snapshot integrity checks',
          'Add snapshot verification automation',
          'Create snapshot corruption detection'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...integrityTest, integrityScore },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Snapshot Integrity Verification', 'snapshot_restore', startTime2, error));
    }
    
    return tests;
  }

  private async testServiceOutageTolerance(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 3.1: Service outage handling
    const startTime = Date.now();
    try {
      const outageTest = await this.simulateServiceOutage();
      const serviceAvailability = (outageTest.availableServices / outageTest.totalServices) * 100;
      const actualOutcome = `${serviceAvailability.toFixed(2)}% service availability during outage`;
      const status = serviceAvailability >= 80 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Service Outage Tolerance',
        category: 'service_outage',
        expectedOutcome: '≥80% service availability during outage',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Low service availability: ${serviceAvailability.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Implement service redundancy',
          'Add load balancing for high availability',
          'Create service health monitoring'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...outageTest, serviceAvailability },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Service Outage Tolerance', 'service_outage', startTime, error));
    }
    
    // Test 3.2: Graceful degradation
    const startTime2 = Date.now();
    try {
      const degradationTest = await this.simulateGracefulDegradation();
      const degradationScore = degradationTest.degradedServices / degradationTest.totalServices;
      const actualOutcome = `${(degradationScore * 100).toFixed(2)}% services gracefully degraded`;
      const status = degradationScore >= 0.9 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Graceful Service Degradation',
        category: 'service_outage',
        expectedOutcome: '≥90% services gracefully degraded',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`Poor graceful degradation: ${(degradationScore * 100).toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Implement graceful degradation logic',
          'Add service fallback mechanisms',
          'Create degradation monitoring'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...degradationTest, degradationScore },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Graceful Service Degradation', 'service_outage', startTime2, error));
    }
    
    return tests;
  }

  private async testDataBackup(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 4.1: Automated backup execution
    const startTime = Date.now();
    try {
      const backupTest = await this.simulateAutomatedBackup();
      const backupSuccessRate = (backupTest.successfulBackups / backupTest.totalBackups) * 100;
      const actualOutcome = `${backupSuccessRate.toFixed(2)}% automated backup success rate`;
      const status = backupSuccessRate >= 98 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Automated Backup Execution',
        category: 'data_backup',
        expectedOutcome: '≥98% automated backup success rate',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Low backup success rate: ${backupSuccessRate.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Improve backup reliability and monitoring',
          'Implement backup verification checks',
          'Add backup failure alerting'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...backupTest, backupSuccessRate },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Automated Backup Execution', 'data_backup', startTime, error));
    }
    
    // Test 4.2: Backup data integrity
    const startTime2 = Date.now();
    try {
      const integrityTest = await this.simulateBackupDataIntegrity();
      const integrityScore = (integrityTest.validBackups / integrityTest.totalBackups) * 100;
      const actualOutcome = `${integrityScore.toFixed(2)}% backup data integrity`;
      const status = integrityScore >= 99 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Backup Data Integrity',
        category: 'data_backup',
        expectedOutcome: '≥99% backup data integrity',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime2,
        issues: status === 'fail' ? [`Backup integrity issues: ${integrityScore.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Implement backup integrity verification',
          'Add backup checksum validation',
          'Create backup corruption detection'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...integrityTest, integrityScore },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Backup Data Integrity', 'data_backup', startTime2, error));
    }
    
    return tests;
  }

  private async testRecoveryTimeObjectives(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 5.1: RTO compliance
    const startTime = Date.now();
    try {
      const rtoTest = await this.simulateRTOCompliance();
      const rtoCompliance = rtoTest.services.filter((service: any) => service.meetsRTO).length;
      const complianceScore = (rtoCompliance / rtoTest.services.length) * 100;
      const actualOutcome = `${complianceScore.toFixed(2)}% RTO compliance`;
      const status = complianceScore >= 95 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Recovery Time Objective Compliance',
        category: 'recovery_time',
        expectedOutcome: '≥95% RTO compliance',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`RTO compliance issues: ${complianceScore.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Optimize recovery procedures',
          'Implement faster recovery mechanisms',
          'Add RTO monitoring and alerting'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...rtoTest, complianceScore },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Recovery Time Objective Compliance', 'recovery_time', startTime, error));
    }
    
    return tests;
  }

  private async testRecoveryPointObjectives(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 6.1: RPO compliance
    const startTime = Date.now();
    try {
      const rpoTest = await this.simulateRPOCompliance();
      const rpoCompliance = rpoTest.services.filter((service: any) => service.meetsRPO).length;
      const complianceScore = (rpoCompliance / rpoTest.services.length) * 100;
      const actualOutcome = `${complianceScore.toFixed(2)}% RPO compliance`;
      const status = complianceScore >= 95 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Recovery Point Objective Compliance',
        category: 'recovery_point',
        expectedOutcome: '≥95% RPO compliance',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`RPO compliance issues: ${complianceScore.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Increase backup frequency',
          'Implement real-time replication',
          'Add RPO monitoring and alerting'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...rpoTest, complianceScore },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Recovery Point Objective Compliance', 'recovery_point', startTime, error));
    }
    
    return tests;
  }

  private async testHighAvailability(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 7.1: High availability cluster
    const startTime = Date.now();
    try {
      const haTest = await this.simulateHighAvailabilityCluster();
      const availabilityScore = (haTest.availableNodes / haTest.totalNodes) * 100;
      const actualOutcome = `${availabilityScore.toFixed(2)}% cluster availability`;
      const status = availabilityScore >= 99.9 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'High Availability Cluster',
        category: 'service_outage',
        expectedOutcome: '≥99.9% cluster availability',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Low cluster availability: ${availabilityScore.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Implement proper high availability configuration',
          'Add cluster health monitoring',
          'Create automatic node recovery'
        ] : [],
        riskLevel: status === 'fail' ? 'high' : 'low',
        testData: { ...haTest, availabilityScore },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('High Availability Cluster', 'service_outage', startTime, error));
    }
    
    return tests;
  }

  private async testDisasterRecoveryProcedures(): Promise<DisasterRecoveryTestResult[]> {
    const tests: DisasterRecoveryTestResult[] = [];
    
    // Test 8.1: DR procedure documentation
    const startTime = Date.now();
    try {
      const procedureTest = await this.simulateDRProcedureDocumentation();
      const documentedProcedures = procedureTest.procedures.filter((proc: any) => proc.documented).length;
      const documentationScore = (documentedProcedures / procedureTest.procedures.length) * 100;
      const actualOutcome = `${documentationScore.toFixed(2)}% DR procedure documentation`;
      const status = documentationScore >= 100 ? 'pass' : 'fail';
      
      tests.push(DisasterRecoveryTestSchema.parse({
        id: uuidv4(),
        testName: 'Disaster Recovery Procedure Documentation',
        category: 'service_outage',
        expectedOutcome: '100% DR procedure documentation',
        actualOutcome,
        status,
        executionTimeMs: Date.now() - startTime,
        issues: status === 'fail' ? [`Incomplete documentation: ${documentationScore.toFixed(2)}%`] : [],
        recommendations: status === 'fail' ? [
          'Complete DR procedure documentation',
          'Add procedure validation and testing',
          'Create procedure maintenance schedule'
        ] : [],
        riskLevel: status === 'fail' ? 'medium' : 'low',
        testData: { ...procedureTest, documentationScore },
        createdAt: new Date()
      }));
    } catch (error) {
      tests.push(this.createErrorTestResult('Disaster Recovery Procedure Documentation', 'service_outage', startTime, error));
    }
    
    return tests;
  }

  // Helper simulation methods
  private async simulateDatabaseFailover(): Promise<any> {
    return {
      failoverTimeMs: 25000,
      primaryNode: 'db-primary-1',
      failoverNode: 'db-secondary-2',
      successful: true
    };
  }

  private async simulateDatabaseConnectionResilience(): Promise<any> {
    return {
      totalAttempts: 100,
      successfulConnections: 97,
      failedConnections: 3,
      averageRetryTime: 1500
    };
  }

  private async simulateDatabaseSnapshotRestore(): Promise<any> {
    return {
      restoreTimeMs: 240000,
      snapshotSize: '50GB',
      restoredRecords: 1000000,
      successful: true
    };
  }

  private async simulateSnapshotIntegrityVerification(): Promise<any> {
    return {
      totalSnapshots: 10,
      verifiedSnapshots: 10,
      corruptedSnapshots: 0,
      verificationTime: 30000
    };
  }

  private async simulateServiceOutage(): Promise<any> {
    return {
      totalServices: 8,
      availableServices: 7,
      unavailableServices: 1,
      outageDuration: 120000
    };
  }

  private async simulateGracefulDegradation(): Promise<any> {
    return {
      totalServices: 8,
      degradedServices: 8,
      failedServices: 0,
      degradationTime: 30000
    };
  }

  private async simulateAutomatedBackup(): Promise<any> {
    return {
      totalBackups: 30,
      successfulBackups: 29,
      failedBackups: 1,
      averageBackupTime: 45000
    };
  }

  private async simulateBackupDataIntegrity(): Promise<any> {
    return {
      totalBackups: 30,
      validBackups: 30,
      corruptedBackups: 0,
      integrityCheckTime: 60000
    };
  }

  private async simulateRTOCompliance(): Promise<any> {
    return {
      services: [
        { name: 'api-gateway', recoveryTime: 20000, targetRTO: 30000, meetsRTO: true },
        { name: 'database', recoveryTime: 35000, targetRTO: 30000, meetsRTO: false },
        { name: 'auth-service', recoveryTime: 15000, targetRTO: 30000, meetsRTO: true }
      ]
    };
  }

  private async simulateRPOCompliance(): Promise<any> {
    return {
      services: [
        { name: 'database', dataLoss: 2, targetRPO: 5, meetsRPO: true },
        { name: 'file-storage', dataLoss: 8, targetRPO: 5, meetsRPO: false },
        { name: 'cache', dataLoss: 1, targetRPO: 5, meetsRPO: true }
      ]
    };
  }

  private async simulateHighAvailabilityCluster(): Promise<any> {
    return {
      totalNodes: 3,
      availableNodes: 3,
      unavailableNodes: 0,
      clusterHealth: 'healthy'
    };
  }

  private async simulateDRProcedureDocumentation(): Promise<any> {
    return {
      procedures: [
        { name: 'database_failover', documented: true },
        { name: 'service_recovery', documented: true },
        { name: 'data_restore', documented: false }
      ]
    };
  }

  private createErrorTestResult(testName: string, category: string, startTime: number, error: any): DisasterRecoveryTestResult {
    return DisasterRecoveryTestSchema.parse({
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

  async generateDisasterRecoveryCertification(testResults: DisasterRecoveryTestResult[]): Promise<{
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
    const categories = ['database_failover', 'snapshot_restore', 'service_outage', 'data_backup', 'recovery_time', 'recovery_point'];
    
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

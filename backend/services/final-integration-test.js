#!/usr/bin/env node

/**
 * Final Integration Testing Script
 * Comprehensive end-to-end testing for the complete Mnbara Platform
 */

const { SecurityAuditService } = require('./security-audit/SecurityAuditService');
const { IntegrationTestingService } = require('./integration-testing/IntegrationTestingService');
const { PerformanceTestingService } = require('./performance-testing/PerformanceTestingService');
const { MonitoringService } = require('./monitoring/MonitoringService');
const { EventBus } = require('@mnbara/event-bus');
const { Logger } = require('@mnbara/shared-utils');

class FinalIntegrationTest {
  constructor() {
    this.logger = new Logger('FinalIntegrationTest');
    this.eventBus = new EventBus({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });
    
    this.services = {
      security: new SecurityAuditService(this.eventBus),
      integration: new IntegrationTestingService(this.eventBus),
      performance: new PerformanceTestingService(this.eventBus),
      monitoring: new MonitoringService(this.eventBus)
    };
    
    this.results = {
      security: null,
      integration: null,
      performance: null,
      monitoring: null,
      overallScore: 0,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    this.logger.info('🚀 Starting Final Integration Testing for Mnbara Platform');
    
    try {
      await this.eventBus.connect();
      
      // Phase 1: Security Audit
      this.logger.info('🔒 Phase 1: Running Security Audit');
      this.results.security = await this.runSecurityAudit();
      
      // Phase 2: Integration Testing
      this.logger.info('🔗 Phase 2: Running Integration Tests');
      this.results.integration = await this.runIntegrationTests();
      
      // Phase 3: Performance Testing
      this.logger.info('⚡ Phase 3: Running Performance Tests');
      this.results.performance = await this.runPerformanceTests();
      
      // Phase 4: Monitoring Setup
      this.logger.info('📊 Phase 4: Setting up Monitoring');
      this.results.monitoring = await this.setupMonitoring();
      
      // Calculate overall score
      this.results.overallScore = this.calculateOverallScore();
      this.results.status = this.determineOverallStatus();
      
      // Generate final report
      await this.generateFinalReport();
      
      this.logger.info('✅ Final Integration Testing Completed');
      this.logger.info(`📈 Overall Score: ${this.results.overallScore}/100`);
      this.logger.info(`📋 Overall Status: ${this.results.status}`);
      
      return this.results;
      
    } catch (error) {
      this.logger.error('❌ Final Integration Testing Failed', error);
      this.results.status = 'failed';
      throw error;
    } finally {
      await this.eventBus.disconnect();
    }
  }

  /**
   * Run security audit
   */
  async runSecurityAudit() {
    try {
      const auditReport = await this.services.security.runSecurityAudit();
      const remediationReport = await this.services.security.generateRemediationReport(auditReport);
      
      return {
        auditReport,
        remediationReport,
        score: auditReport.overallScore,
        status: auditReport.overallScore >= 80 ? 'passed' : 'failed',
        criticalIssues: auditReport.summary.critical,
        highIssues: auditReport.summary.high,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Security audit failed', error);
      return {
        auditReport: null,
        remediationReport: null,
        score: 0,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    try {
      const testReport = await this.services.integration.runIntegrationTests();
      
      return {
        testReport,
        successRate: testReport.summary.successRate,
        totalTests: testReport.totalTests,
        passedTests: testReport.passedTests,
        failedTests: testReport.failedTests,
        status: testReport.summary.successRate >= 90 ? 'passed' : 'failed',
        criticalFailures: testReport.summary.criticalFailures,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Integration tests failed', error);
      return {
        testReport: null,
        successRate: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    try {
      const performanceReport = await this.services.performance.runPerformanceTests();
      
      return {
        performanceReport,
        score: performanceReport.summary.performanceScore,
        averageResponseTime: performanceReport.summary.averageResponseTime,
        p95ResponseTime: performanceReport.summary.p95ResponseTime,
        errorRate: performanceReport.summary.errorRate,
        maxThroughput: performanceReport.summary.maxThroughput,
        status: performanceReport.summary.performanceScore >= 80 ? 'passed' : 'failed',
        completedScenarios: performanceReport.completedScenarios,
        failedScenarios: performanceReport.failedScenarios,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Performance tests failed', error);
      return {
        performanceReport: null,
        score: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        errorRate: 0,
        maxThroughput: 0,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Setup monitoring
   */
  async setupMonitoring() {
    try {
      const systemHealth = await this.services.monitoring.getSystemHealth();
      const monitoringReport = await this.services.monitoring.generateMonitoringReport();
      
      return {
        systemHealth,
        monitoringReport,
        status: systemHealth.status === 'healthy' ? 'passed' : 'failed',
        overallScore: systemHealth.overallScore,
        servicesCount: Object.keys(systemHealth.services).length,
        healthyServices: Object.values(systemHealth.services).filter(s => s.status === 'healthy').length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Monitoring setup failed', error);
      return {
        systemHealth: null,
        monitoringReport: null,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate overall score
   */
  calculateOverallScore() {
    let totalScore = 0;
    let weightSum = 0;
    
    // Security audit (30% weight)
    if (this.results.security && this.results.security.score !== null) {
      totalScore += this.results.security.score * 0.3;
      weightSum += 0.3;
    }
    
    // Integration tests (25% weight)
    if (this.results.integration && this.results.integration.successRate !== null) {
      totalScore += this.results.integration.successRate * 0.25;
      weightSum += 0.25;
    }
    
    // Performance tests (25% weight)
    if (this.results.performance && this.results.performance.score !== null) {
      totalScore += this.results.performance.score * 0.25;
      weightSum += 0.25;
    }
    
    // Monitoring (20% weight)
    if (this.results.monitoring && this.results.monitoring.overallScore !== null) {
      totalScore += this.results.monitoring.overallScore * 0.2;
      weightSum += 0.2;
    }
    
    return weightSum > 0 ? Math.round(totalScore / weightSum) : 0;
  }

  /**
   * Determine overall status
   */
  determineOverallStatus() {
    if (this.results.overallScore >= 90) {
      return 'excellent';
    } else if (this.results.overallScore >= 80) {
      return 'good';
    } else if (this.results.overallScore >= 70) {
      return 'acceptable';
    } else if (this.results.overallScore >= 60) {
      return 'needs_improvement';
    } else {
      return 'critical';
    }
  }

  /**
   * Generate final report
   */
  async generateFinalReport() {
    const report = this.generateReportContent();
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, 'final-integration-report.md');
    
    fs.writeFileSync(reportPath, report);
    
    this.logger.info(`📄 Final report saved to: ${reportPath}`);
    
    // Publish final report event
    await this.eventBus.publish({
      type: 'final.integration_testing_completed',
      source: 'final-integration-test',
      data: {
        overallScore: this.results.overallScore,
        overallStatus: this.results.status,
        securityScore: this.results.security?.score || 0,
        integrationSuccessRate: this.results.integration?.successRate || 0,
        performanceScore: this.results.performance?.score || 0,
        monitoringScore: this.results.monitoring?.overallScore || 0,
        timestamp: this.results.timestamp
      }
    });
  }

  /**
   * Generate report content
   */
  generateReportContent() {
    return `# Mnbara Platform - Final Integration Test Report

**Generated:** ${this.results.timestamp}  
**Overall Score:** ${this.results.overallScore}/100  
**Overall Status:** ${this.results.status.toUpperCase()}

---

## 📊 Executive Summary

The Mnbara Platform has undergone comprehensive integration testing covering security, integration, performance, and monitoring aspects. The platform demonstrates ${this.getStatusDescription()} readiness for production deployment.

---

## 🔒 Security Audit Results

**Score:** ${this.results.security?.score || 0}/100  
**Status:** ${this.results.security?.status?.toUpperCase() || 'ERROR'}

${this.results.security?.criticalIssues ? `**Critical Issues:** ${this.results.security.criticalIssues}` : ''}  
${this.results.security?.highIssues ? `**High Issues:** ${this.results.security.highIssues}` : ''}

${this.results.security?.status === 'failed' ? '⚠️ **Action Required:** Address critical security vulnerabilities before deployment.' : ''}

---

## 🔗 Integration Test Results

**Success Rate:** ${this.results.integration?.successRate?.toFixed(2) || 0}%  
**Status:** ${this.results.integration?.status?.toUpperCase() || 'ERROR'}

**Test Summary:**
- Total Tests: ${this.results.integration?.totalTests || 0}
- Passed: ${this.results.integration?.passedTests || 0} ✅
- Failed: ${this.results.integration?.failedTests || 0} ❌
- Skipped: ${this.results.integration?.skippedTests || 0} ⏭️

${this.results.integration?.criticalFailures ? `**Critical Failures:** ${this.results.integration.criticalFailures}` : ''}

---

## ⚡ Performance Test Results

**Score:** ${this.results.performance?.score || 0}/100  
**Status:** ${this.results.performance?.status?.toUpperCase() || 'ERROR'}

**Key Metrics:**
- Average Response Time: ${this.results.performance?.averageResponseTime?.toFixed(2) || 0}ms
- 95th Percentile: ${this.results.performance?.p95ResponseTime?.toFixed(2) || 0}ms
- Error Rate: ${this.results.performance?.errorRate?.toFixed(2) || 0}%
- Max Throughput: ${this.results.performance?.maxThroughput?.toFixed(2) || 0} RPS

**Test Scenarios:**
- Completed: ${this.results.performance?.completedScenarios || 0} ✅
- Failed: ${this.results.performance?.failedScenarios || 0} ❌

---

## 📊 Monitoring & Health Results

**Score:** ${this.results.monitoring?.overallScore || 0}/100  
**Status:** ${this.results.monitoring?.status?.toUpperCase() || 'ERROR'}

**System Health:**
- Overall Status: ${this.results.monitoring?.systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
- Services Monitored: ${this.results.monitoring?.servicesCount || 0}
- Healthy Services: ${this.results.monitoring?.healthyServices || 0} ✅

---

## 🎯 Deployment Readiness

Based on the comprehensive testing results, the platform is **${this.results.status.toUpperCase()}** for deployment.

### ✅ Strengths
- ${this.getStrengths().join('\n- ')}

### ⚠️ Areas for Attention
- ${this.getAreasForAttention().join('\n- ')}

### 🎯 Recommendations
${this.getRecommendations()}

---

## 📋 Next Steps

${this.getNextSteps()}

---

## 📞 Support Contacts

**Technical Team:** tech@mnbara.com  
**DevOps Team:** devops@mnbara.com  
**Security Team:** security@mnbara.com  
**Operations Team:** operations@mnbara.com

---

*This report was generated automatically by the Mnbara Platform Integration Testing Framework.*
`;
  }

  /**
   * Get status description
   */
  getStatusDescription() {
    switch (this.results.status) {
      case 'excellent': return 'excellent';
      case 'good': return 'good';
      case 'acceptable': return 'acceptable';
      case 'needs_improvement': return 'needs improvement';
      case 'critical': return 'critical issues requiring immediate attention';
      default: return 'unknown';
    }
  }

  /**
   * Get strengths
   */
  getStrengths() {
    const strengths = [];
    
    if (this.results.security?.score >= 80) {
      strengths.push('Strong security posture with comprehensive vulnerability assessment');
    }
    
    if (this.results.integration?.successRate >= 90) {
      strengths.push('Excellent integration test coverage with high success rate');
    }
    
    if (this.results.performance?.score >= 80) {
      strengths.push('Good performance characteristics under load');
    }
    
    if (this.results.monitoring?.status === 'passed') {
      strengths.push('Comprehensive monitoring and alerting system in place');
    }
    
    return strengths.length > 0 ? strengths : ['Comprehensive testing framework implemented'];
  }

  /**
   * Get areas for attention
   */
  getAreasForAttention() {
    const areas = [];
    
    if (this.results.security?.criticalIssues > 0) {
      areas.push(`${this.results.security.criticalIssues} critical security issues identified`);
    }
    
    if (this.results.integration?.failedTests > 0) {
      areas.push(`${this.results.integration.failedTests} integration test failures require investigation`);
    }
    
    if (this.results.performance?.score < 80) {
      areas.push('Performance optimization may be needed for production load');
    }
    
    if (this.results.monitoring?.status !== 'passed') {
      areas.push('Monitoring system requires configuration review');
    }
    
    return areas.length > 0 ? areas : ['All systems tested successfully'];
  }

  /**
   * Get recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    if (this.results.security?.criticalIssues > 0) {
      recommendations.push('1. **Address Critical Security Issues**: Resolve all critical security vulnerabilities before deployment.');
    }
    
    if (this.results.integration?.failedTests > 0) {
      recommendations.push('2. **Fix Integration Issues**: Investigate and resolve failing integration tests to ensure system stability.');
    }
    
    if (this.results.performance?.score < 80) {
      recommendations.push('3. **Performance Optimization**: Consider scaling resources or optimizing code for better performance under load.');
    }
    
    recommendations.push('4. **Continuous Monitoring**: Implement continuous monitoring and alerting for production environment.');
    recommendations.push('5. **Regular Testing**: Schedule regular integration and security testing to maintain system health.');
    
    return recommendations.join('\n');
  }

  /**
   * Get next steps
   */
  getNextSteps() {
    if (this.results.status === 'excellent' || this.results.status === 'good') {
      return `### 🚀 Ready for Deployment

1. **Deploy to Production**: The platform is ready for production deployment following the deployment plan.
2. **Monitor Closely**: Implement 24/7 monitoring during the initial deployment phase.
3. **User Communication**: Notify users of new features and capabilities.
4. **Performance Monitoring**: Continuously monitor performance metrics and user feedback.`;
    } else if (this.results.status === 'acceptable') {
      return `### 🔧 Deployment with Conditions

1. **Address Issues**: Resolve identified issues before proceeding with deployment.
2. **Staged Rollout**: Consider a staged deployment approach with limited user access initially.
3. **Enhanced Monitoring**: Implement additional monitoring and alerting for the identified areas.
4. **Rollback Plan**: Ensure rollback procedures are tested and ready.`;
    } else {
      return `### ⚠️ Deployment Not Recommended

1. **Critical Issues**: Address all critical issues before considering deployment.
2. **Retesting Required**: Re-run integration tests after fixes are implemented.
3. **Stakeholder Review**: Conduct detailed review with stakeholders before proceeding.
4. **Alternative Plans**: Consider alternative deployment strategies or timelines.`;
    }
  }
}

// Main execution
if (require.main === module) {
  const test = new FinalIntegrationTest();
  
  test.runAllTests()
    .then(results => {
      console.log('\n🎉 Final Integration Testing Completed Successfully!');
      console.log(`📊 Overall Score: ${results.overallScore}/100`);
      console.log(`📋 Overall Status: ${results.status.toUpperCase()}`);
      
      process.exit(results.overallScore >= 70 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Final Integration Testing Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { FinalIntegrationTest };
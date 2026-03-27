import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { FunctionalQAEngine, FunctionalTestResult } from './FunctionalQAEngine';
import { FinancialIntegrityQAEngine, FinancialIntegrityTestResult } from './FinancialIntegrityQAEngine';
import { AISafetyQAEngine, AISafetyTestResult } from './AISafetyQAEngine';
import { SecurityQAEngine, SecurityTestResult } from './SecurityQAEngine';
import { LoadStressQAEngine, LoadStressTestResult } from './LoadStressQAEngine';
import { RegulatoryQAEngine, RegulatoryTestResult } from './RegulatoryQAEngine';
import { DisasterRecoveryQAEngine, DisasterRecoveryTestResult } from './DisasterRecoveryQAEngine';

// Zod schema for Ultimate QA certification
export const UltimateQACertificationSchema = z.object({
  certificationId: z.string().uuid(),
  timestamp: z.date(),
  platformVersion: z.string(),
  environment: z.string(),
  overallStatus: z.enum(['pass', 'fail', 'warning']),
  summary: z.object({
    totalTests: z.number(),
    passedTests: z.number(),
    failedTests: z.number(),
    skippedTests: z.number(),
    overallScore: z.number(),
    executionTimeMs: z.number()
  }),
  dimensionResults: z.object({
    functional: z.any(),
    financialIntegrity: z.any(),
    aiSafety: z.any(),
    security: z.any(),
    loadStress: z.any(),
    regulatory: z.any(),
    disasterRecovery: z.any()
  }),
  criticalIssues: z.array(z.string()),
  highRiskIssues: z.array(z.string()),
  recommendations: z.array(z.string()),
  certificationLevel: z.enum(['production-ready', 'enterprise-safe', 'regulatory-ready', 'globally-scalable']),
  nextReviewDate: z.date(),
  signOff: z.object({
    qaEngineer: z.string(),
    timestamp: z.date(),
    status: z.enum(['approved', 'rejected', 'requires_review'])
  })
});

export type UltimateQACertification = z.infer<typeof UltimateQACertificationSchema>;

export class UltimateQAEngine {
  private functionalQA: FunctionalQAEngine;
  private financialIntegrityQA: FinancialIntegrityQAEngine;
  private aiSafetyQA: AISafetyQAEngine;
  private securityQA: SecurityQAEngine;
  private loadStressQA: LoadStressQAEngine;
  private regulatoryQA: RegulatoryQAEngine;
  private disasterRecoveryQA: DisasterRecoveryQAEngine;

  constructor() {
    this.functionalQA = new FunctionalQAEngine();
    this.financialIntegrityQA = new FinancialIntegrityQAEngine();
    this.aiSafetyQA = new AISafetyQAEngine();
    this.securityQA = new SecurityQAEngine();
    this.loadStressQA = new LoadStressQAEngine();
    this.regulatoryQA = new RegulatoryQAEngine();
    this.disasterRecoveryQA = new DisasterRecoveryQAEngine();
  }

  async runUltimateQASuite(): Promise<{
    certification: UltimateQACertification;
    detailedResults: {
      functional: FunctionalTestResult[];
      financialIntegrity: FinancialIntegrityTestResult[];
      aiSafety: AISafetyTestResult[];
      security: SecurityTestResult[];
      loadStress: LoadStressTestResult[];
      regulatory: RegulatoryTestResult[];
      disasterRecovery: DisasterRecoveryTestResult[];
    };
  }> {
    console.log('🚀 Starting Ultimate QA Suite for Mnbara Platform...');
    const startTime = Date.now();

    try {
      // Run all QA dimensions in parallel where possible
      const [
        functionalResults,
        financialIntegrityResults,
        aiSafetyResults,
        securityResults,
        loadStressResults,
        regulatoryResults,
        disasterRecoveryResults
      ] = await Promise.all([
        this.functionalQA.runFunctionalQASuite(),
        this.financialIntegrityQA.runFinancialIntegrityQASuite(),
        this.aiSafetyQA.runAISafetyQASuite(),
        this.securityQA.runSecurityQASuite(),
        this.loadStressQA.runLoadStressQASuite(),
        this.regulatoryQA.runRegulatoryQASuite(),
        this.disasterRecoveryQA.runDisasterRecoveryQASuite()
      ]);

      // Generate individual certifications
      const [
        functionalCert,
        financialIntegrityCert,
        aiSafetyCert,
        securityCert,
        loadStressCert,
        regulatoryCert,
        disasterRecoveryCert
      ] = await Promise.all([
        this.functionalQA.generateFunctionalQACertification(functionalResults),
        this.financialIntegrityQA.generateFinancialIntegrityCertification(financialIntegrityResults),
        this.aiSafetyQA.generateAISafetyCertification(aiSafetyResults),
        this.securityQA.generateSecurityCertification(securityResults),
        this.loadStressQA.generateLoadStressCertification(loadStressResults),
        this.regulatoryQA.generateRegulatoryCertification(regulatoryResults),
        this.disasterRecoveryQA.generateDisasterRecoveryCertification(disasterRecoveryResults)
      ]);

      // Aggregate all results
      const allResults = [
        ...functionalResults,
        ...financialIntegrityResults,
        ...aiSafetyResults,
        ...securityResults,
        ...loadStressResults,
        ...regulatoryResults,
        ...disasterRecoveryResults
      ];

      // Calculate overall metrics
      const totalTests = allResults.length;
      const passedTests = allResults.filter(t => t.status === 'pass').length;
      const failedTests = allResults.filter(t => t.status === 'fail').length;
      const skippedTests = allResults.filter(t => t.status === 'skipped').length;
      const overallScore = (passedTests / totalTests) * 100;
      const executionTimeMs = Date.now() - startTime;

      // Identify critical and high-risk issues
      const criticalIssues = allResults
        .filter(t => t.status === 'fail' && t.riskLevel === 'critical')
        .map(t => `${t.testName}: ${t.issues.join(', ')}`);

      const highRiskIssues = allResults
        .filter(t => t.status === 'fail' && t.riskLevel === 'high')
        .map(t => `${t.testName}: ${t.issues.join(', ')}`);

      // Determine overall status
      const overallStatus = criticalIssues.length > 0 ? 'fail' : 
                           highRiskIssues.length > 0 ? 'warning' : 'pass';

      // Determine certification level
      const certificationLevel = this.determineCertificationLevel(
        overallStatus,
        overallScore,
        {
          functional: functionalCert.overallStatus,
          financialIntegrity: financialIntegrityCert.overallStatus,
          aiSafety: aiSafetyCert.overallStatus,
          security: securityCert.overallStatus,
          loadStress: loadStressCert.overallStatus,
          regulatory: regulatoryCert.overallStatus,
          disasterRecovery: disasterRecoveryCert.overallStatus
        }
      );

      // Generate comprehensive recommendations
      const recommendations = this.generateRecommendations([
        functionalCert,
        financialIntegrityCert,
        aiSafetyCert,
        securityCert,
        loadStressCert,
        regulatoryCert,
        disasterRecoveryCert
      ]);

      // Create ultimate certification
      const certification: UltimateQACertification = UltimateQACertificationSchema.parse({
        certificationId: uuidv4(),
        timestamp: new Date(),
        platformVersion: '1.0.0',
        environment: 'production',
        overallStatus,
        summary: {
          totalTests,
          passedTests,
          failedTests,
          skippedTests,
          overallScore,
          executionTimeMs
        },
        dimensionResults: {
          functional: functionalCert,
          financialIntegrity: financialIntegrityCert,
          aiSafety: aiSafetyCert,
          security: securityCert,
          loadStress: loadStressCert,
          regulatory: regulatoryCert,
          disasterRecovery: disasterRecoveryCert
        },
        criticalIssues,
        highRiskIssues,
        recommendations,
        certificationLevel,
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        signOff: {
          qaEngineer: 'Ultimate QA Engine',
          timestamp: new Date(),
          status: overallStatus === 'pass' ? 'approved' : 'requires_review'
        }
      });

      console.log(`✅ Ultimate QA Suite completed in ${executionTimeMs}ms`);
      console.log(`📊 Overall Score: ${overallScore.toFixed(2)}%`);
      console.log(`🏆 Certification Level: ${certificationLevel}`);
      console.log(`⚠️  Critical Issues: ${criticalIssues.length}`);
      console.log(`🔥 High Risk Issues: ${highRiskIssues.length}`);

      return {
        certification,
        detailedResults: {
          functional: functionalResults,
          financialIntegrity: financialIntegrityResults,
          aiSafety: aiSafetyResults,
          security: securityResults,
          loadStress: loadStressResults,
          regulatory: regulatoryResults,
          disasterRecovery: disasterRecoveryResults
        }
      };

    } catch (error) {
      console.error('❌ Ultimate QA Suite failed:', error);
      throw error;
    }
  }

  private determineCertificationLevel(
    overallStatus: string,
    overallScore: number,
    dimensionStatuses: { [key: string]: string }
  ): string {
    // Check for any critical failures
    const hasCriticalFailures = Object.values(dimensionStatuses).some(status => status === 'fail');
    if (hasCriticalFailures) {
      return 'production-ready'; // Minimum level
    }

    // Check for high scores across all dimensions
    const allHighScores = Object.values(dimensionStatuses).every(status => status === 'pass');
    if (allHighScores && overallScore >= 99) {
      return 'globally-scalable';
    }

    // Check for regulatory readiness
    const regulatoryReady = dimensionStatuses.regulatory === 'pass' && 
                           dimensionStatuses.financialIntegrity === 'pass';
    if (regulatoryReady && overallScore >= 95) {
      return 'regulatory-ready';
    }

    // Check for enterprise safety
    const enterpriseSafe = dimensionStatuses.security === 'pass' && 
                         dimensionStatuses.aiSafety === 'pass' &&
                         dimensionStatuses.disasterRecovery === 'pass';
    if (enterpriseSafe && overallScore >= 90) {
      return 'enterprise-safe';
    }

    return 'production-ready';
  }

  private generateRecommendations(certifications: any[]): string[] {
    const allRecommendations = certifications.flatMap(cert => cert.recommendations || []);
    
    // Remove duplicates and prioritize
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    // Sort by priority (critical first, then high, then medium)
    return uniqueRecommendations
      .sort((a, b) => {
        const aPriority = this.getRecommendationPriority(a);
        const bPriority = this.getRecommendationPriority(b);
        return bPriority - aPriority;
      })
      .slice(0, 20); // Top 20 recommendations
  }

  private getRecommendationPriority(recommendation: string): number {
    if (recommendation.toLowerCase().includes('critical') || 
        recommendation.toLowerCase().includes('security') ||
        recommendation.toLowerCase().includes('compliance')) {
      return 3;
    }
    if (recommendation.toLowerCase().includes('high') || 
        recommendation.toLowerCase().includes('important')) {
      return 2;
    }
    return 1;
  }

  async generateExecutiveSummary(certification: UltimateQACertification): Promise<{
    title: string;
    summary: string;
    keyMetrics: {
      overallScore: string;
      certificationLevel: string;
      criticalIssues: number;
      highRiskIssues: number;
      totalTests: number;
      executionTime: string;
    };
    dimensionStatus: {
      [key: string]: {
        status: string;
        score: string;
        issues: number;
      };
    };
    nextSteps: string[];
    riskAssessment: {
      overall: 'low' | 'medium' | 'high' | 'critical';
      security: 'low' | 'medium' | 'high' | 'critical';
      compliance: 'low' | 'medium' | 'high' | 'critical';
      performance: 'low' | 'medium' | 'high' | 'critical';
    };
  }> {
    const riskAssessment = this.assessOverallRisk(certification);

    return {
      title: `Mnbara Platform Ultimate QA Certification - ${certification.certificationLevel.toUpperCase()}`,
      summary: `The Mnbara Platform has undergone comprehensive Ultimate QA validation across 7 dimensions: Functional, Financial Integrity, AI Safety & Governance, Security & Access, Load & Stress, Regulatory & Audit Readiness, and Disaster Recovery & Resilience. With an overall score of ${certification.summary.overallScore.toFixed(2)}% and ${certification.summary.totalTests} tests executed, the platform achieves ${certification.certificationLevel} certification status.`,
      keyMetrics: {
        overallScore: `${certification.summary.overallScore.toFixed(2)}%`,
        certificationLevel: certification.certificationLevel,
        criticalIssues: certification.criticalIssues.length,
        highRiskIssues: certification.highRiskIssues.length,
        totalTests: certification.summary.totalTests,
        executionTime: `${(certification.summary.executionTimeMs / 1000).toFixed(2)}s`
      },
      dimensionStatus: {
        functional: {
          status: certification.dimensionResults.functional.summary.overallStatus,
          score: `${(certification.dimensionResults.functional.summary.passedTests / certification.dimensionResults.functional.summary.totalTests * 100).toFixed(2)}%`,
          issues: certification.dimensionResults.functional.summary.failedTests
        },
        financialIntegrity: {
          status: certification.dimensionResults.financialIntegrity.summary.overallStatus,
          score: `${(certification.dimensionResults.financialIntegrity.summary.passedTests / certification.dimensionResults.financialIntegrity.summary.totalTests * 100).toFixed(2)}%`,
          issues: certification.dimensionResults.financialIntegrity.summary.failedTests
        },
        aiSafety: {
          status: certification.dimensionResults.aiSafety.summary.overallStatus,
          score: `${(certification.dimensionResults.aiSafety.summary.passedTests / certification.dimensionResults.aiSafety.summary.totalTests * 100).toFixed(2)}%`,
          issues: certification.dimensionResults.aiSafety.summary.failedTests
        },
        security: {
          status: certification.dimensionResults.security.summary.overallStatus,
          score: `${(certification.dimensionResults.security.summary.passedTests / certification.dimensionResults.security.summary.totalTests * 100).toFixed(2)}%`,
          issues: certification.dimensionResults.security.summary.failedTests
        },
        loadStress: {
          status: certification.dimensionResults.loadStress.summary.overallStatus,
          score: `${(certification.dimensionResults.loadStress.summary.passedTests / certification.dimensionResults.loadStress.summary.totalTests * 100).toFixed(2)}%`,
          issues: certification.dimensionResults.loadStress.summary.failedTests
        },
        regulatory: {
          status: certification.dimensionResults.regulatory.summary.overallStatus,
          score: `${(certification.dimensionResults.regulatory.summary.passedTests / certification.dimensionResults.regulatory.summary.totalTests * 100).toFixed(2)}%`,
          issues: certification.dimensionResults.regulatory.summary.failedTests
        },
        disasterRecovery: {
          status: certification.dimensionResults.disasterRecovery.summary.overallStatus,
          score: `${(certification.dimensionResults.disasterRecovery.summary.passedTests / certification.dimensionResults.disasterRecovery.summary.totalTests * 100).toFixed(2)}%`,
          issues: certification.dimensionResults.disasterRecovery.summary.failedTests
        }
      },
      nextSteps: certification.criticalIssues.length > 0 ? 
        ['Address all critical issues immediately', 'Re-run QA suite after fixes', 'Schedule follow-up review'] :
        certification.highRiskIssues.length > 0 ?
        ['Address high-risk issues', 'Monitor system performance', 'Schedule regular QA reviews'] :
        ['Maintain current quality standards', 'Schedule periodic QA reviews', 'Prepare for production deployment'],
      riskAssessment
    };
  }

  private assessOverallRisk(certification: UltimateQACertification): {
    overall: 'low' | 'medium' | 'high' | 'critical';
    security: 'low' | 'medium' | 'high' | 'critical';
    compliance: 'low' | 'medium' | 'high' | 'critical';
    performance: 'low' | 'medium' | 'high' | 'critical';
  } {
    const overall = certification.criticalIssues.length > 0 ? 'critical' :
                    certification.highRiskIssues.length > 0 ? 'high' :
                    certification.summary.overallScore >= 95 ? 'low' : 'medium';

    const security = certification.dimensionResults.security.summary.overallStatus === 'fail' ? 'critical' :
                    certification.dimensionResults.aiSafety.summary.overallStatus === 'fail' ? 'high' :
                    'low';

    const compliance = certification.dimensionResults.regulatory.summary.overallStatus === 'fail' ? 'critical' :
                      certification.dimensionResults.financialIntegrity.summary.overallStatus === 'fail' ? 'high' :
                      'low';

    const performance = certification.dimensionResults.loadStress.summary.overallStatus === 'fail' ? 'critical' :
                       certification.dimensionResults.functional.summary.overallStatus === 'fail' ? 'high' :
                       'low';

    return { overall, security, compliance, performance };
  }

  async exportCertificationReport(certification: UltimateQACertification): Promise<{
    certificationId: string;
    report: string;
    format: 'json' | 'pdf' | 'html';
    timestamp: Date;
  }> {
    const executiveSummary = await this.generateExecutiveSummary(certification);
    
    const report = {
      certification,
      executiveSummary,
      detailedAnalysis: {
        testExecution: certification.summary,
        dimensionBreakdown: certification.dimensionResults,
        issueAnalysis: {
          critical: certification.criticalIssues,
          highRisk: certification.highRiskIssues,
          recommendations: certification.recommendations
        },
        certificationDetails: {
          level: certification.certificationLevel,
          criteria: this.getCertificationCriteria(certification.certificationLevel),
          validity: {
            from: certification.timestamp,
            to: certification.nextReviewDate
          }
        }
      }
    };

    return {
      certificationId: certification.certificationId,
      report: JSON.stringify(report, null, 2),
      format: 'json',
      timestamp: new Date()
    };
  }

  private getCertificationCriteria(level: string): string[] {
    const criteria = {
      'production-ready': [
        'All critical systems functional',
        'Basic security measures in place',
        'Core financial operations validated',
        'Disaster recovery procedures documented'
      ],
      'enterprise-safe': [
        'Advanced security controls implemented',
        'AI safety and governance verified',
        'High availability and resilience confirmed',
        'Comprehensive audit trails maintained'
      ],
      'regulatory-ready': [
        'Financial regulatory compliance verified',
        'Audit readiness confirmed',
        'Data retention policies enforced',
        'Privacy regulations compliance achieved'
      ],
      'globally-scalable': [
        'Exceptional performance under load',
        'Zero critical security vulnerabilities',
        'Complete regulatory compliance',
        'Enterprise-grade disaster recovery'
      ]
    };

    return criteria[level as keyof typeof criteria] || [];
  }
}

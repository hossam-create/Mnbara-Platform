import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const ComplianceScreeningSchema = z.object({
  paymentId: z.string().uuid(),
  screeningType: z.enum(['sanctions', 'aml', 'kyc', 'pep', 'adverse_media', 'risk_corridor', 'high_risk_country']),
  screeningResult: z.enum(['clear', 'flagged', 'blocked', 'requires_review']),
  confidenceScore: z.number().int().min(0).max(100),
  riskFactors: z.array(z.any()).default([]),
  matchedEntities: z.array(z.any()).default([]),
  screeningRulesApplied: z.array(z.any()).default([]),
  reviewerId: z.string().uuid().optional(),
  reviewNotes: z.string().optional()
});

const PaymentAnomalySchema = z.object({
  businessAccountId: z.string().uuid(),
  paymentId: z.string().uuid().optional(),
  anomalyType: z.enum(['unusual_amount', 'delayed_processing', 'high_fees', 'suspicious_route', 'fx_anomaly', 'timing_anomaly', 'compliance_risk', 'other']),
  anomalySeverity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1),
  detectedValue: z.number().optional(),
  expectedValue: z.number().optional(),
  variancePercentage: z.number().optional(),
  detectionRules: z.array(z.any()).default([])
});

export interface ComplianceScreening {
  id: string;
  paymentId: string;
  screeningType: string;
  screeningResult: string;
  confidenceScore: number;
  riskFactors: any[];
  matchedEntities: any[];
  screeningRulesApplied: any[];
  reviewerId?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface RiskCorridor {
  sourceCountry: string;
  destinationCountry: string;
  riskLevel: string;
  riskFactors: string[];
  complianceRequirements: string[];
  recommendedActions: string[];
  lastAssessed: Date;
}

export interface SanctionsCheck {
  entityName: string;
  entityType: string;
  sanctionList: string;
  sanctionType: string;
  confidenceScore: number;
  matchedFields: string[];
  additionalInfo: any;
}

export interface AMLRiskAssessment {
  paymentId: string;
  riskScore: number;
  riskFactors: {
    amountRisk: number;
    frequencyRisk: number;
    geographicRisk: number;
    timingRisk: number;
    entityRisk: number;
    behaviorRisk: number;
  };
  overallRiskLevel: string;
  recommendations: string[];
  requiresEnhancedDueDiligence: boolean;
}

export interface ComplianceDashboard {
  businessAccountId: string;
  totalPayments: number;
  screenedPayments: number;
  flaggedPayments: number;
  blockedPayments: number;
  highRiskCorridors: number;
  sanctionsHits: number;
  amlFlags: number;
  averageRiskScore: number;
  complianceScore: number;
  lastUpdated: Date;
}

export class ComplianceRiskEngine {
  // Compliance Screening
  async screenPayment(data: z.infer<typeof ComplianceScreeningSchema>): Promise<ComplianceScreening> {
    const validated = ComplianceScreeningSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO compliance_screening_results (
        id,
        payment_id,
        screening_type,
        screening_result,
        confidence_score,
        risk_factors,
        matched_entities,
        screening_rules_applied,
        reviewer_id,
        review_notes,
        created_at
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.paymentId}::uuid,
        ${validated.screeningType}::varchar,
        ${validated.screeningResult}::varchar,
        ${validated.confidenceScore}::integer,
        ${JSON.stringify(validated.riskFactors)}::jsonb,
        ${JSON.stringify(validated.matchedEntities)}::jsonb,
        ${JSON.stringify(validated.screeningRulesApplied)}::jsonb,
        ${validated.reviewerId || null}::uuid,
        ${validated.reviewNotes || null}::text,
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;
    
    const screeningId = (result as any)[0]?.id;
    return this.getComplianceScreening(screeningId);
  }

  async getComplianceScreening(screeningId: string): Promise<ComplianceScreening> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        payment_id as "paymentId",
        screening_type as "screeningType",
        screening_result as "screeningResult",
        confidence_score as "confidenceScore",
        risk_factors as "riskFactors",
        matched_entities as "matchedEntities",
        screening_rules_applied as "screeningRulesApplied",
        reviewer_id as "reviewerId",
        review_notes as "reviewNotes",
        reviewed_at as "reviewedAt",
        created_at as "createdAt"
      FROM compliance_screening_results
      WHERE id = ${screeningId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getComplianceScreenings(paymentId: string): Promise<ComplianceScreening[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        payment_id as "paymentId",
        screening_type as "screeningType",
        screening_result as "screeningResult",
        confidence_score as "confidenceScore",
        risk_factors as "riskFactors",
        matched_entities as "matchedEntities",
        screening_rules_applied as "screeningRulesApplied",
        reviewer_id as "reviewerId",
        review_notes as "reviewNotes",
        reviewed_at as "reviewedAt",
        created_at as "createdAt"
      FROM compliance_screening_results
      WHERE payment_id = ${paymentId}::uuid
      ORDER BY created_at DESC
    `;
    
    return result as ComplianceScreening[];
  }

  // Sanctions Screening
  async checkSanctions(entityName: string, entityType: string, countries: string[]): Promise<SanctionsCheck[]> {
    const sanctionsChecks: SanctionsCheck[] = [];
    
    // This would integrate with real sanctions lists (OFAC, UN, EU, etc.)
    // For now, simulate sanctions checking
    const sanctionLists = ['OFAC', 'UN', 'EU', 'HMT'];
    
    for (const sanctionList of sanctionLists) {
      const isMatch = this.simulateSanctionsCheck(entityName, sanctionList);
      
      if (isMatch) {
        sanctionsChecks.push({
          entityName,
          entityType,
          sanctionList,
          sanctionType: 'entity_sanction',
          confidenceScore: 85,
          matchedFields: ['name'],
          additionalInfo: {
            sanctionDate: '2023-01-15',
            sanctionReason: 'Proliferation activities'
          }
        });
      }
    }
    
    return sanctionsChecks;
  }

  // Risk Corridor Analysis
  async analyzeRiskCorridor(sourceCountry: string, destinationCountry: string): Promise<RiskCorridor> {
    // Risk corridor data would come from regulatory intelligence
    const riskCorridors: Record<string, RiskCorridor> = {
      'US-IR': {
        sourceCountry: 'US',
        destinationCountry: 'IR',
        riskLevel: 'critical',
        riskFactors: ['Sanctions', 'High regulatory scrutiny', 'Limited banking relationships'],
        complianceRequirements: ['OFAC license required', 'Enhanced due diligence', 'Transaction monitoring'],
        recommendedActions: ['Avoid if possible', 'Obtain legal counsel', 'Enhanced compliance procedures'],
        lastAssessed: new Date()
      },
      'US-KP': {
        sourceCountry: 'US',
        destinationCountry: 'KP',
        riskLevel: 'critical',
        riskFactors: ['UN sanctions', 'US sanctions', 'Limited financial access'],
        complianceRequirements: ['UN approval', 'OFAC compliance', 'Enhanced monitoring'],
        recommendedActions: ['Prohibited', 'Seek alternatives', 'Legal review required'],
        lastAssessed: new Date()
      },
      'RU-UA': {
        sourceCountry: 'RU',
        destinationCountry: 'UA',
        riskLevel: 'high',
        riskFactors: ['Sanctions', 'Political risk', 'Banking restrictions'],
        complianceRequirements: ['Enhanced due diligence', 'Regulatory approval', 'Monitoring'],
        recommendedActions: ['High scrutiny required', 'Consider alternatives', 'Legal compliance'],
        lastAssessed: new Date()
      }
    };
    
    const corridorKey = `${sourceCountry}-${destinationCountry}`;
    return riskCorridors[corridorKey] || {
      sourceCountry,
      destinationCountry,
      riskLevel: 'low',
      riskFactors: [],
      complianceRequirements: ['Standard due diligence'],
      recommendedActions: ['Normal processing'],
      lastAssessed: new Date()
    };
  }

  // AML Risk Assessment
  async assessAMLRisk(paymentId: string, paymentAmount: number, sourceCountry: string, destinationCountry: string, entityHistory: any[]): Promise<AMLRiskAssessment> {
    // Calculate individual risk factors
    const amountRisk = this.calculateAmountRisk(paymentAmount);
    const frequencyRisk = this.calculateFrequencyRisk(entityHistory);
    const geographicRisk = this.calculateGeographicRisk(sourceCountry, destinationCountry);
    const timingRisk = this.calculateTimingRisk(new Date());
    const entityRisk = this.calculateEntityRisk(entityHistory);
    const behaviorRisk = this.calculateBehaviorRisk(entityHistory);
    
    // Calculate overall risk score
    const riskFactors = {
      amountRisk,
      frequencyRisk,
      geographicRisk,
      timingRisk,
      entityRisk,
      behaviorRisk
    };
    
    const overallRiskScore = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / Object.keys(riskFactors).length;
    
    const overallRiskLevel = this.determineRiskLevel(overallRiskScore);
    const requiresEnhancedDueDiligence = overallRiskScore > 70;
    
    const recommendations = this.generateAMLRecommendations(riskFactors, overallRiskLevel);
    
    return {
      paymentId,
      riskScore: overallRiskScore,
      riskFactors,
      overallRiskLevel,
      recommendations,
      requiresEnhancedDueDiligence
    };
  }

  // Payment Anomaly Detection
  async detectPaymentAnomalies(businessAccountId: string): Promise<any[]> {
    const paymentsResult = await prisma.$queryRaw`
      SELECT 
        id,
        payment_reference as "paymentReference",
        original_amount as "originalAmount",
        total_fees as "totalFees",
        fx_rate_applied as "fxRateApplied",
        fx_spread as "fxSpread",
        source_country_code as "sourceCountryCode",
        destination_country_code as "destinationCountryCode",
        payment_method as "paymentMethod",
        correspondent_bank as "correspondentBank",
        initiated_date as "initiatedDate",
        processed_date as "processedDate",
        settled_date as "settledDate"
      FROM cross_border_payments
      WHERE business_account_id = ${businessAccountId}::uuid
        AND status IN ('completed', 'failed')
      ORDER BY initiated_date DESC
      LIMIT 1000
    `;
    
    const payments = paymentsResult as any[];
    const anomalies = [];
    
    // Detect unusual amounts
    const amountAnomalies = this.detectAmountAnomalies(payments);
    anomalies.push(...amountAnomalies);
    
    // Detect processing delays
    const delayAnomalies = this.detectProcessingDelays(payments);
    anomalies.push(...delayAnomalies);
    
    // Detect high fees
    const feeAnomalies = this.detectHighFees(payments);
    anomalies.push(...feeAnomalies);
    
    // Detect suspicious routes
    const routeAnomalies = this.detectSuspiciousRoutes(payments);
    anomalies.push(...routeAnomalies);
    
    // Detect FX anomalies
    const fxAnomalies = this.detectFXAnomalies(payments);
    anomalies.push(...fxAnomalies);
    
    return anomalies;
  }

  // Compliance Dashboard
  async getComplianceDashboard(businessAccountId: string): Promise<ComplianceDashboard> {
    const paymentsResult = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status IN ('completed', 'failed', 'cancelled') THEN 1 END) as screened_payments,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM compliance_screening_results csr 
          WHERE csr.payment_id = cb.id AND csr.screening_result = 'flagged'
        ) THEN 1 END) as flagged_payments,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM compliance_screening_results csr 
          WHERE csr.payment_id = cb.id AND csr.screening_result = 'blocked'
        ) THEN 1 END) as blocked_payments,
        AVG(cb.risk_score) as average_risk_score
      FROM cross_border_payments cb
      WHERE cb.business_account_id = ${businessAccountId}::uuid
    `;
    
    const paymentStats = (paymentsResult as any)[0] || {};
    
    // Get high-risk corridors count
    const corridorsResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT source_country_code || '-' || destination_country_code) as high_risk_corridors
      FROM cross_border_payments cb
      WHERE cb.business_account_id = ${businessAccountId}::uuid
        AND cb.risk_score > 70
    `;
    
    const corridorStats = (corridorsResult as any)[0] || {};
    
    // Get compliance screening stats
    const screeningResult = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_screenings,
        COUNT(CASE WHEN screening_type = 'sanctions' AND screening_result = 'flagged' THEN 1 END) as sanctions_hits,
        COUNT(CASE WHEN screening_type = 'aml' AND screening_result = 'flagged' THEN 1 END) as aml_flags
      FROM compliance_screening_results csr
      WHERE csr.payment_id IN (
        SELECT id FROM cross_border_payments cb 
        WHERE cb.business_account_id = ${businessAccountId}::uuid
      )
    `;
    
    const screeningStats = (screeningResult as any)[0] || {};
    
    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(
      paymentStats.total_payments || 0,
      screeningStats.total_screenings || 0,
      paymentStats.flagged_payments || 0,
      paymentStats.blocked_payments || 0
    );
    
    return {
      businessAccountId,
      totalPayments: paymentStats.total_payments || 0,
      screenedPayments: paymentStats.screened_payments || 0,
      flaggedPayments: paymentStats.flagged_payments || 0,
      blockedPayments: paymentStats.blocked_payments || 0,
      highRiskCorridors: corridorStats.high_risk_corridors || 0,
      sanctionsHits: screeningStats.sanctions_hits || 0,
      amlFlags: screeningStats.aml_flags || 0,
      averageRiskScore: paymentStats.average_risk_score || 0,
      complianceScore,
      lastUpdated: new Date()
    };
  }

  // Helper Methods
  private simulateSanctionsCheck(entityName: string, sanctionList: string): boolean {
    // This would integrate with real sanctions databases
    // For simulation, check against known sanctioned entities
    const sanctionedEntities = [
      'IRAN CENTRAL BANK',
      'NORTH KOREA SHIPPING',
      'RUSSIAN DEFENSE MINISTRY'
    ];
    
    return sanctionedEntities.some(entity => 
      entityName.toUpperCase().includes(entity.toUpperCase())
    );
  }

  private calculateAmountRisk(amount: number): number {
    // Risk increases with amount
    if (amount > 1000000) return 90;
    if (amount > 500000) return 75;
    if (amount > 100000) return 60;
    if (amount > 50000) return 40;
    if (amount > 10000) return 25;
    return 10;
  }

  private calculateFrequencyRisk(entityHistory: any[]): number {
    if (entityHistory.length === 0) return 50;
    
    const recentTransactions = entityHistory.filter(t => {
      const transactionDate = new Date(t.date);
      const daysSince = (new Date().getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    
    if (recentTransactions.length > 50) return 80;
    if (recentTransactions.length > 20) return 60;
    if (recentTransactions.length > 10) return 40;
    if (recentTransactions.length > 5) return 25;
    return 15;
  }

  private calculateGeographicRisk(sourceCountry: string, destinationCountry: string): number {
    // High-risk countries
    const highRiskCountries = ['IR', 'KP', 'RU', 'SY', 'MM', 'SD', 'YE'];
    const mediumRiskCountries = ['AF', 'IQ', 'SO', 'LY', 'CI'];
    
    let risk = 0;
    
    if (highRiskCountries.includes(sourceCountry) || highRiskCountries.includes(destinationCountry)) {
      risk += 80;
    } else if (mediumRiskCountries.includes(sourceCountry) || mediumRiskCountries.includes(destinationCountry)) {
      risk += 50;
    } else {
      risk += 20;
    }
    
    return risk;
  }

  private calculateTimingRisk(transactionDate: Date): number {
    const hour = transactionDate.getHours();
    const dayOfWeek = transactionDate.getDay();
    
    let risk = 0;
    
    // Outside business hours
    if (hour < 9 || hour > 17) {
      risk += 30;
    }
    
    // Weekend transactions
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      risk += 40;
    }
    
    // Late night transactions
    if (hour < 6 || hour > 22) {
      risk += 50;
    }
    
    return risk;
  }

  private calculateEntityRisk(entityHistory: any[]): number {
    if (entityHistory.length === 0) return 50;
    
    // Check for previous compliance issues
    const complianceIssues = entityHistory.filter(e => e.complianceFlagged);
    const complianceRisk = Math.min((complianceIssues.length / entityHistory.length) * 100, 90);
    
    return complianceRisk;
  }

  private calculateBehaviorRisk(entityHistory: any[]): number {
    if (entityHistory.length < 2) return 30;
    
    // Analyze transaction patterns
    const amounts = entityHistory.map(e => e.amount);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // High variance in amounts is suspicious
    const coefficientOfVariation = standardDeviation / avgAmount;
    
    if (coefficientOfVariation > 2) return 70;
    if (coefficientOfVariation > 1.5) return 50;
    if (coefficientOfVariation > 1) return 30;
    return 15;
  }

  private determineRiskLevel(riskScore: number): string {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private generateAMLRecommendations(riskFactors: any, overallRiskLevel: string): string[] {
    const recommendations = [];
    
    if (riskFactors.amountRisk > 70) {
      recommendations.push('High amount detected - require enhanced due diligence');
    }
    
    if (riskFactors.geographicRisk > 60) {
      recommendations.push('High-risk geographic corridor - additional documentation required');
    }
    
    if (riskFactors.timingRisk > 50) {
      recommendations.push('Unusual timing pattern - review transaction legitimacy');
    }
    
    if (riskFactors.entityRisk > 60) {
      recommendations.push('Entity has compliance history - enhanced monitoring required');
    }
    
    if (overallRiskLevel === 'critical') {
      recommendations.push('Critical risk level - consider blocking transaction');
    }
    
    return recommendations;
  }

  private detectAmountAnomalies(payments: any[]): any[] {
    const amounts = payments.map(p => p.originalAmount);
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const standardDeviation = Math.sqrt(amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length);
    
    const anomalies = [];
    for (const payment of payments) {
      const zScore = Math.abs((payment.originalAmount - mean) / standardDeviation);
      if (zScore > 3) { // More than 3 standard deviations from mean
        anomalies.push({
          paymentId: payment.id,
          anomalyType: 'unusual_amount',
          severity: zScore > 4 ? 'high' : 'medium',
          description: `Amount ${payment.originalAmount} is ${zScore.toFixed(1)} standard deviations from mean`,
          detectedValue: payment.originalAmount,
          expectedValue: mean
        });
      }
    }
    
    return anomalies;
  }

  private detectProcessingDelays(payments: any[]): any[] {
    const anomalies = [];
    
    for (const payment of payments) {
      if (payment.processedDate && payment.initiatedDate) {
        const processingHours = (new Date(payment.processedDate).getTime() - new Date(payment.initiatedDate).getTime()) / (1000 * 60 * 60);
        
        if (processingHours > 72) { // More than 3 days
          anomalies.push({
            paymentId: payment.id,
            anomalyType: 'delayed_processing',
            severity: processingHours > 168 ? 'critical' : 'high',
            description: `Processing took ${processingHours.toFixed(1)} hours`,
            detectedValue: processingHours,
            expectedValue: 24
          });
        }
      }
    }
    
    return anomalies;
  }

  private detectHighFees(payments: any[]): any[] {
    const anomalies = [];
    
    for (const payment of payments) {
      const feePercentage = (payment.totalFees / payment.originalAmount) * 100;
      
      if (feePercentage > 5) { // More than 5% in fees
        anomalies.push({
          paymentId: payment.id,
          anomalyType: 'high_fees',
          severity: feePercentage > 10 ? 'high' : 'medium',
          description: `Fee percentage ${feePercentage.toFixed(2)}% is unusually high`,
          detectedValue: feePercentage,
          expectedValue: 2
        });
      }
    }
    
    return anomalies;
  }

  private detectSuspiciousRoutes(payments: any[]): any[] {
    const routeCounts = {};
    
    for (const payment of payments) {
      const route = `${payment.sourceCountryCode}-${payment.destinationCountryCode}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    }
    
    const anomalies = [];
    for (const [route, count] of Object.entries(routeCounts)) {
      if (count > 100) { // More than 100 payments to same route
        anomalies.push({
          anomalyType: 'suspicious_route',
          severity: 'medium',
          description: `Route ${route} has ${count} transactions`,
          detectedValue: count,
          expectedValue: 50
        });
      }
    }
    
    return anomalies;
  }

  private detectFXAnomalies(payments: any[]): any[] {
    const anomalies = [];
    
    for (const payment of payments) {
      if (payment.fxSpread > 0.01) { // More than 1% spread
        anomalies.push({
          paymentId: payment.id,
          anomalyType: 'fx_anomaly',
          severity: payment.fxSpread > 0.02 ? 'high' : 'medium',
          description: `FX spread ${payment.fxSpread} is unusually high`,
          detectedValue: payment.fxSpread,
          expectedValue: 0.005
        });
      }
    }
    
    return anomalies;
  }

  private calculateComplianceScore(totalPayments: number, totalScreenings: number, flaggedPayments: number, blockedPayments: number): number {
    if (totalPayments === 0) return 100;
    
    const screeningRate = (totalScreenings / totalPayments) * 100;
    const flagRate = (flaggedPayments / totalScreenings) * 100;
    const blockRate = (blockedPayments / totalScreenings) * 100;
    
    // Higher score for lower flag and block rates
    let score = 100;
    
    if (flagRate > 10) score -= (flagRate - 10) * 2;
    if (blockRate > 5) score -= (blockRate - 5) * 3;
    if (screeningRate < 95) score -= (95 - screeningRate) * 0.5;
    
    return Math.max(0, Math.min(100, score));
  }
}

// AI-OPS-006: Controlled AI Change & Rollback Framework Service

import { PrismaClient } from '@prisma/client';
import {
  AIChangeProposal,
  Approval,
  ShadowEvaluationResult,
  SafetyImpactAnalysis,
  AIVersion,
  VersionDiff,
  ChangeProposalRequest,
  ShadowEvaluationRequest,
  ApprovalRequest,
  RollbackRequest,
  QuorumRules
} from '../types/ai-ops-change.types';

const prisma = new PrismaClient();

export class AIOpsChangeService {
  
  private readonly QUORUM_RULES: QuorumRules = {
    requiredApprovals: 2,
    requiredRoles: ['SENIOR_REVIEWER', 'MANAGER', 'DIRECTOR'],
    minSeniorityLevel: 2,
    authorCannotApprove: true,
    mandatoryReviewers: ['CHIEF_RISK_OFFICER']
  };

  /**
   * Create a new AI change proposal
   */
  async createChangeProposal(request: ChangeProposalRequest): Promise<AIChangeProposal> {
    try {
      // Generate semantic version
      const latestVersion = await this.getLatestAIVersion();
      const newVersion = this.generateNextVersion(latestVersion?.version);

      const proposal = await prisma.aiChangeProposal.create({
        data: {
          version: newVersion,
          title: request.title,
          description: request.description,
          scope: request.scope,
          riskLevel: request.riskLevel,
          priority: request.priority,
          affectedComponents: request.affectedComponents,
          changeDetails: request.changeDetails,
          dependencies: request.dependencies,
          rollbackPlan: request.rollbackPlan,
          authorId: request.authorId,
          authorRole: request.authorRole,
          status: 'DRAFT',
          auditTrail: {
            create: [{
              timestamp: new Date(),
              action: 'PROPOSAL_CREATED',
              actorId: request.authorId,
              actorRole: request.authorRole,
              details: { request }
            }]
          }
        },
        include: {
          auditTrail: true
        }
      });

      return this.mapToAIChangeProposal(proposal);

    } catch (error) {
      throw new Error(`Failed to create change proposal: ${error.message}`);
    }
  }

  /**
   * Submit a proposal for review
   */
  async submitProposal(proposalId: string, authorId: string): Promise<AIChangeProposal> {
    try {
      const proposal = await prisma.aiChangeProposal.update({
        where: { id: proposalId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          auditTrail: {
            create: [{
              timestamp: new Date(),
              action: 'PROPOSAL_SUBMITTED',
              actorId: authorId,
              actorRole: 'AUTHOR',
              details: { proposalId }
            }]
          }
        },
        include: {
          auditTrail: true,
          approvers: true
        }
      });

      // Initialize approval workflow
      await this.initializeApprovalWorkflow(proposalId);

      return this.mapToAIChangeProposal(proposal);

    } catch (error) {
      throw new Error(`Failed to submit proposal: ${error.message}`);
    }
  }

  /**
   * Run shadow evaluation for a proposal
   */
  async runShadowEvaluation(proposalId: string, request: ShadowEvaluationRequest): Promise<ShadowEvaluationResult> {
    try {
      const proposal = await prisma.aiChangeProposal.findUnique({
        where: { id: proposalId },
        include: { changeDetails: true }
      });

      if (!proposal) {
        throw new Error(`Proposal not found: ${proposalId}`);
      }

      // Simulate shadow evaluation (would integrate with actual AI system)
      const evaluationResult: ShadowEvaluationResult = {
        id: `eval_${Date.now()}`,
        proposalId,
        evaluationType: request.evaluationType,
        riskDelta: this.calculateRiskDelta(),
        escalationDelta: this.calculateEscalationDelta(),
        recommendationShifts: this.calculateRecommendationShifts(),
        falsePositiveImpact: this.calculateFalsePositiveImpact(),
        falseNegativeImpact: this.calculateFalseNegativeImpact(),
        truePositiveImpact: this.calculateTruePositiveImpact(),
        trueNegativeImpact: this.calculateTrueNegativeImpact(),
        sampleSize: request.sampleSize || 1000,
        confidence: 0.85,
        statisticalSignificance: true,
        metricsByRiskBand: this.calculateMetricsByRiskBand(),
        metricsBySellerSegment: this.calculateMetricsBySellerSegment(),
        executedAt: new Date(),
        durationMs: 5000 // 5 seconds simulation
      };

      // Update proposal status
      await prisma.aiChangeProposal.update({
        where: { id: proposalId },
        data: {
          status: 'SHADOW_EVALUATION',
          shadowEvaluation: evaluationResult,
          auditTrail: {
            create: [{
              timestamp: new Date(),
              action: 'SHADOW_EVALUATION_COMPLETED',
              actorId: 'SYSTEM',
              actorRole: 'SYSTEM',
              details: { evaluationResult }
            }]
          }
        }
      });

      return evaluationResult;

    } catch (error) {
      throw new Error(`Failed to run shadow evaluation: ${error.message}`);
    }
  }

  /**
   * Perform safety and impact analysis
   */
  async performSafetyAnalysis(proposalId: string): Promise<SafetyImpactAnalysis> {
    try {
      const proposal = await prisma.aiChangeProposal.findUnique({
        where: { id: proposalId },
        include: { shadowEvaluation: true }
      });

      if (!proposal || !proposal.shadowEvaluation) {
        throw new Error(`Proposal or shadow evaluation not found: ${proposalId}`);
      }

      const safetyAnalysis: SafetyImpactAnalysis = {
        riskInflationIndex: this.calculateRiskInflationIndex(proposal.shadowEvaluation),
        stabilityIndex: this.calculateStabilityIndex(proposal.shadowEvaluation),
        cascadeEffect: this.calculateCascadeEffect(proposal.shadowEvaluation),
        buyerProtectionVariance: this.calculateBuyerProtectionVariance(proposal.shadowEvaluation),
        riskFlags: this.identifyRiskFlags(proposal.shadowEvaluation),
        overallSafetyScore: this.calculateOverallSafetyScore(proposal.shadowEvaluation),
        recommendation: this.determineSafetyRecommendation(proposal.shadowEvaluation),
        analyzedAt: new Date()
      };

      // Update proposal
      await prisma.aiChangeProposal.update({
        where: { id: proposalId },
        data: {
          status: 'APPROVAL_PENDING',
          safetyAnalysis,
          auditTrail: {
            create: [{
              timestamp: new Date(),
              action: 'SAFETY_ANALYSIS_COMPLETED',
              actorId: 'SYSTEM',
              actorRole: 'SYSTEM',
              details: { safetyAnalysis }
            }]
          }
        }
      });

      return safetyAnalysis;

    } catch (error) {
      throw new Error(`Failed to perform safety analysis: ${error.message}`);
    }
  }

  /**
   * Process approval decision
   */
  async processApproval(proposalId: string, request: ApprovalRequest): Promise<AIChangeProposal> {
    try {
      const proposal = await prisma.aiChangeProposal.findUnique({
        where: { id: proposalId },
        include: { approvers: true, author: true }
      });

      if (!proposal) {
        throw new Error(`Proposal not found: ${proposalId}`);
      }

      // Check if author is trying to approve their own proposal
      if (this.QUORUM_RULES.authorCannotApprove && request.approverId === proposal.authorId) {
        throw new Error('Author cannot approve their own proposal');
      }

      // Record approval decision
      const approval: Approval = {
        approverId: request.approverId,
        approverRole: request.approverRole,
        decision: request.decision,
        comments: request.comments,
        timestamp: new Date(),
        required: this.isApprovalRequired(request.approverRole)
      };

      await prisma.approval.create({
        data: {
          proposalId,
          ...approval
        }
      });

      // Check if quorum is reached
      const currentApprovals = await prisma.approval.count({
        where: { 
          proposalId, 
          decision: 'APPROVED',
          required: true 
        }
      });

      let newStatus = proposal.status;
      if (currentApprovals >= this.QUORUM_RULES.requiredApprovals) {
        newStatus = 'APPROVED';
      }

      const updatedProposal = await prisma.aiChangeProposal.update({
        where: { id: proposalId },
        data: {
          status: newStatus,
          approvedAt: newStatus === 'APPROVED' ? new Date() : undefined,
          auditTrail: {
            create: [{
              timestamp: new Date(),
              action: 'APPROVAL_DECISION',
              actorId: request.approverId,
              actorRole: request.approverRole,
              details: { approval }
            }]
          }
        },
        include: {
          auditTrail: true,
          approvers: true
        }
      });

      return this.mapToAIChangeProposal(updatedProposal);

    } catch (error) {
      throw new Error(`Failed to process approval: ${error.message}`);
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackVersion(versionId: string, request: RollbackRequest): Promise<AIVersion> {
    try {
      const version = await prisma.aIVersion.findUnique({
        where: { id: versionId }
      });

      if (!version) {
        throw new Error(`Version not found: ${versionId}`);
      }

      const rolledBackVersion = await prisma.aIVersion.update({
        where: { id: versionId },
        data: {
          status: 'ROLLED_BACK',
          auditTrail: {
            create: [{
              timestamp: new Date(),
              action: 'VERSION_ROLLBACK',
              actorId: request.executedBy,
              actorRole: 'OPERATOR',
              details: { 
                reason: request.reason,
                emergency: request.emergency,
                rolledBackFrom: version.version
              }
            }]
          }
        },
        include: {
          auditTrail: true
        }
      });

      return this.mapToAIVersion(rolledBackVersion);

    } catch (error) {
      throw new Error(`Failed to rollback version: ${error.message}`);
    }
  }

  /**
   * Get all AI versions
   */
  async getAIVersions(): Promise<AIVersion[]> {
    try {
      const versions = await prisma.aIVersion.findMany({
        orderBy: { deployedAt: 'desc' },
        include: {
          auditTrail: true
        }
      });

      return versions.map(version => this.mapToAIVersion(version));

    } catch (error) {
      throw new Error(`Failed to get AI versions: ${error.message}`);
    }
  }

  // Helper methods for shadow evaluation simulation
  private calculateRiskDelta(): number {
    return Math.random() * 0.2 - 0.1; // -10% to +10%
  }

  private calculateEscalationDelta(): number {
    return Math.random() * 0.15 - 0.075; // -7.5% to +7.5%
  }

  private calculateRecommendationShifts(): Record<string, number> {
    return {
      'ESCALATE': Math.random() * 0.1 - 0.05,
      'MONITOR': Math.random() * 0.08 - 0.04,
      'APPROVE': Math.random() * 0.12 - 0.06
    };
  }

  private calculateFalsePositiveImpact(): number {
    return Math.random() * 0.1 - 0.05;
  }

  private calculateFalseNegativeImpact(): number {
    return Math.random() * 0.08 - 0.04;
  }

  private calculateTruePositiveImpact(): number {
    return Math.random() * 0.05 - 0.025;
  }

  private calculateTrueNegativeImpact(): number {
    return Math.random() * 0.06 - 0.03;
  }

  private calculateMetricsByRiskBand(): Record<string, any> {
    return {
      'LOW': { riskDelta: Math.random() * 0.1 - 0.05, escalationRateChange: Math.random() * 0.08 - 0.04, sampleSize: 250 },
      'MEDIUM': { riskDelta: Math.random() * 0.12 - 0.06, escalationRateChange: Math.random() * 0.1 - 0.05, sampleSize: 400 },
      'HIGH': { riskDelta: Math.random() * 0.15 - 0.075, escalationRateChange: Math.random() * 0.12 - 0.06, sampleSize: 300 }
    };
  }

  private calculateMetricsBySellerSegment(): Record<string, any> {
    return {
      'NEW_SELLER': { riskDelta: Math.random() * 0.15 - 0.075, impactScore: 70, sampleSize: 200 },
      'ESTABLISHED': { riskDelta: Math.random() * 0.08 - 0.04, impactScore: 30, sampleSize: 600 },
      'HIGH_RISK': { riskDelta: Math.random() * 0.2 - 0.1, impactScore: 90, sampleSize: 150 }
    };
  }

  // Helper methods for safety analysis
  private calculateRiskInflationIndex(evaluation: any): number {
    return Math.max(0, Math.min(100, 50 + evaluation.riskDelta * 500));
  }

  private calculateStabilityIndex(evaluation: any): number {
    return Math.max(0, Math.min(100, 80 - Math.abs(evaluation.riskDelta) * 400));
  }

  private calculateCascadeEffect(evaluation: any): number {
    return Math.max(0, Math.min(100, evaluation.falseNegativeImpact * 800));
  }

  private calculateBuyerProtectionVariance(evaluation: any): number {
    return Math.max(0, Math.min(100, evaluation.falsePositiveImpact * 600));
  }

  private identifyRiskFlags(evaluation: any): any[] {
    const flags = [];
    
    if (evaluation.falseNegativeImpact > 0.05) {
      flags.push({
        type: 'CASCADE_EFFECT',
        severity: 'HIGH',
        description: 'Increased false negatives may lead to undetected risks',
        evidence: ['False negative impact exceeds threshold'],
        mitigation: 'Adjust risk thresholds or add additional safeguards'
      });
    }

    if (evaluation.riskDelta > 0.08) {
      flags.push({
        type: 'RISK_INFLATION',
        severity: 'MEDIUM',
        description: 'Significant increase in overall risk scoring',
        evidence: ['Overall risk delta exceeds acceptable range'],
        mitigation: 'Review risk calculation methodology'
      });
    }

    return flags;
  }

  private calculateOverallSafetyScore(evaluation: any): number {
    const riskInflation = this.calculateRiskInflationIndex(evaluation);
    const stability = this.calculateStabilityIndex(evaluation);
    const cascade = this.calculateCascadeEffect(evaluation);
    const buyerProtection = this.calculateBuyerProtectionVariance(evaluation);
    
    return Math.max(0, Math.min(100, (stability * 0.4 + (100 - riskInflation) * 0.3 + (100 - cascade) * 0.2 + (100 - buyerProtection) * 0.1)));
  }

  private determineSafetyRecommendation(evaluation: any): 'SAFE' | 'WITH_CAUTION' | 'UNSAFE' | 'CRITICAL' {
    const score = this.calculateOverallSafetyScore(evaluation);
    
    if (score >= 80) return 'SAFE';
    if (score >= 60) return 'WITH_CAUTION';
    if (score >= 40) return 'UNSAFE';
    return 'CRITICAL';
  }

  // Helper methods for approval workflow
  private async initializeApprovalWorkflow(proposalId: string): Promise<void> {
    // Create required approval entries based on quorum rules
    const requiredApprovers = this.QUORUM_RULES.requiredRoles.map(role => ({
      proposalId,
      approverRole: role,
      decision: 'PENDING',
      required: true,
      timestamp: new Date()
    }));

    await prisma.approval.createMany({
      data: requiredApprovers
    });
  }

  private isApprovalRequired(role: string): boolean {
    return this.QUORUM_RULES.requiredRoles.includes(role);
  }

  // Version management helpers
  private async getLatestAIVersion(): Promise<any> {
    return await prisma.aIVersion.findFirst({
      orderBy: { deployedAt: 'desc' }
    });
  }

  private generateNextVersion(currentVersion?: string): string {
    if (!currentVersion) return '1.0.0';
    
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  // Mapping helpers
  private mapToAIChangeProposal(dbProposal: any): AIChangeProposal {
    return {
      id: dbProposal.id,
      version: dbProposal.version,
      title: dbProposal.title,
      description: dbProposal.description,
      scope: dbProposal.scope,
      riskLevel: dbProposal.riskLevel,
      priority: dbProposal.priority,
      affectedComponents: dbProposal.affectedComponents,
      changeDetails: dbProposal.changeDetails,
      dependencies: dbProposal.dependencies,
      rollbackPlan: dbProposal.rollbackPlan,
      status: dbProposal.status,
      createdAt: dbProposal.createdAt,
      updatedAt: dbProposal.updatedAt,
      submittedAt: dbProposal.submittedAt,
      approvedAt: dbProposal.approvedAt,
      deployedAt: dbProposal.deployedAt,
      authorId: dbProposal.authorId,
      authorRole: dbProposal.authorRole,
      approvers: dbProposal.approvers?.map((a: any) => ({
        approverId: a.approverId,
        approverRole: a.approverRole,
        decision: a.decision,
        comments: a.comments,
        timestamp: a.timestamp,
        required: a.required
      })) || [],
      shadowEvaluation: dbProposal.shadowEvaluation,
      safetyAnalysis: dbProposal.safetyAnalysis,
      auditTrail: dbProposal.auditTrail?.map((a: any) => ({
        timestamp: a.timestamp,
        action: a.action,
        actorId: a.actorId,
        actorRole: a.actorRole,
        details: a.details
      })) || []
    };
  }

  private mapToAIVersion(dbVersion: any): AIVersion {
    return {
      id: dbVersion.id,
      version: dbVersion.version,
      description: dbVersion.description,
      changeProposalId: dbVersion.changeProposalId,
      deployedAt: dbVersion.deployedAt,
      deployedBy: dbVersion.deployedBy,
      status: dbVersion.status,
      performanceScore: dbVersion.performanceScore,
      stabilityScore: dbVersion.stabilityScore,
      rollbackReady: dbVersion.rollbackReady,
      auditTrail: dbVersion.auditTrail?.map((a: any) => ({
        timestamp: a.timestamp,
        action: a.action,
        actorId: a.actorId,
        actorRole: a.actorRole,
        details: a.details
      })) || []
    };
  }
}
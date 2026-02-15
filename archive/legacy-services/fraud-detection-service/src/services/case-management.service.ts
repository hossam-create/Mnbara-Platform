// Case Management Service
// خدمة إدارة الحالات - Fraud case management and resolution workflow

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CaseCreationInput {
  title: string;
  description: string;
  caseType: CaseType;
  priority: CasePriority;
  userId?: string;
  orderId?: string;
  transactionId?: string;
  estimatedLoss?: number;
  potentialLoss?: number;
  openedBy: string;
}

export interface CaseUpdateInput {
  status?: CaseStatus;
  priority?: CasePriority;
  assignedTo?: string;
  teamMembers?: string[];
  resolution?: string;
  resolutionAr?: string;
  actionsTaken?: Record<string, any>;
  preventiveMeasures?: Record<string, any>;
  fraudConfirmed?: boolean;
  amountRecovered?: number;
  estimatedLoss?: number;
  potentialLoss?: number;
  slaDeadline?: Date;
}

export interface CaseNoteInput {
  content: string;
  authorId: string;
  authorName: string;
  isInternal?: boolean;
}

export interface CaseResult {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  caseType: CaseType;
  priority: CasePriority;
  status: CaseStatus;
  overallRiskScore: number;
  estimatedLoss?: number;
  assignedTo?: string;
  teamMembers: string[];
  openedAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  slaDeadline?: Date;
  resolution?: string;
  userId?: string;
  orderId?: string;
  transactionId?: string;
  alertCount: number;
}

export type CaseType = 
  | 'PAYMENT_FRAUD' 
  | 'ACCOUNT_TAKEOVER' 
  | 'IDENTITY_FRAUD' 
  | 'CHARGEBACK' 
  | 'REFUND_ABUSE' 
  | 'PROMO_ABUSE' 
  | 'VELOCITY_ABUSE' 
  | 'SUSPICIOUS_ACTIVITY' 
  | 'POLICY_VIOLATION' 
  | 'INVESTIGATION';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export class CaseManagementService {
  // Generate case number
  private generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `FC-${year}-${random}`;
  }

  // Create new case
  async createCase(input: CaseCreationInput): Promise<CaseResult> {
    const caseNumber = this.generateCaseNumber();
    const now = new Date();
    
    // Calculate SLA deadline based on priority
    const slaHours = this.getSlaHours(input.priority);
    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    try {
      const fraudCase = await (prisma as any).fraudCase?.create({
        data: {
          caseNumber,
          title: input.title,
          description: input.description,
          caseType: input.caseType,
          priority: input.priority,
          status: 'OPEN',
          overallRiskScore: input.estimatedLoss || 50,
          estimatedLoss: input.estimatedLoss,
          potentialLoss: input.potentialLoss,
          assignedTo: null,
          teamMembers: [input.openedBy],
          openedAt: now,
          updatedAt: now,
          slaDeadline,
          userId: input.userId,
          orderId: input.orderId,
          transactionId: input.transactionId
        }
      });

      // Create initial note
      await this.addNote(fraudCase?.id || caseNumber, {
        content: `Case opened: ${input.description}`,
        authorId: input.openedBy,
        authorName: 'System',
        isInternal: true
      });

      return this.formatCaseResult(fraudCase);
    } catch (error) {
      console.error('Error creating case:', error);
      // Return mock result
      return {
        id: `case_${Date.now()}`,
        caseNumber,
        title: input.title,
        description: input.description,
        caseType: input.caseType,
        priority: input.priority,
        status: 'OPEN',
        overallRiskScore: input.estimatedLoss || 50,
        estimatedLoss: input.estimatedLoss,
        teamMembers: [input.openedBy],
        openedAt: now,
        updatedAt: now,
        slaDeadline,
        alertCount: 0
      };
    }
  }

  // Get case by ID
  async getCase(caseId: string): Promise<CaseResult | null> {
    try {
      const fraudCase = await (prisma as any).fraudCase?.findUnique({
        where: { id: caseId }
      });

      if (!fraudCase) return null;

      return this.formatCaseResult(fraudCase);
    } catch (error) {
      console.error('Error getting case:', error);
      return null;
    }
  }

  // Get case by case number
  async getCaseByNumber(caseNumber: string): Promise<CaseResult | null> {
    try {
      const fraudCase = await (prisma as any).fraudCase?.findUnique({
        where: { caseNumber }
      });

      if (!fraudCase) return null;

      return this.formatCaseResult(fraudCase);
    } catch (error) {
      console.error('Error getting case by number:', error);
      return null;
    }
  }

  // Update case
  async updateCase(caseId: string, input: CaseUpdateInput, updatedBy: string): Promise<CaseResult | null> {
    try {
      const updateData: any = {
        ...input,
        updatedAt: new Date()
      };

      // If status is being changed to resolved/closed
      if (input.status === 'RESOLVED' || input.status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }

      const fraudCase = await (prisma as any).fraudCase?.update({
        where: { id: caseId },
        data: updateData
      });

      // Add note about update
      await this.addNote(caseId, {
        content: `Case updated by ${updatedBy}`,
        authorId: updatedBy,
        authorName: 'System',
        isInternal: true
      });

      return this.formatCaseResult(fraudCase);
    } catch (error) {
      console.error('Error updating case:', error);
      return null;
    }
  }

  // Add note to case
  async addNote(caseId: string, input: CaseNoteInput): Promise<string> {
    try {
      const note = await (prisma as any).caseNote?.create({
        data: {
          caseId,
          content: input.content,
          authorId: input.authorId,
          authorName: input.authorName,
          isInternal: input.isInternal !== false
        }
      });
      return note?.id || Date.now().toString();
    } catch (error) {
      console.error('Error adding note:', error);
      return Date.now().toString();
    }
  }

  // Get case notes
  async getCaseNotes(caseId: string, includeInternal: boolean = true): Promise<any[]> {
    try {
      const where: any = { caseId };
      if (!includeInternal) {
        where.isInternal = false;
      }

      const notes = await (prisma as any).caseNote?.findMany({
        where,
        orderBy: { createdAt: 'asc' }
      });

      return notes || [];
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  // Get cases by status
  async getCasesByStatus(status: CaseStatus, limit: number = 50): Promise<CaseResult[]> {
    try {
      const cases = await (prisma as any).fraudCase?.findMany({
        where: { status },
        orderBy: [{ priority: 'desc' }, { openedAt: 'asc' }],
        take: limit
      });

      return (cases || []).map((c: any) => this.formatCaseResult(c));
    } catch (error) {
      console.error('Error getting cases by status:', error);
      return [];
    }
  }

  // Get cases assigned to user
  async getCasesByAssignee(userId: string): Promise<CaseResult[]> {
    try {
      const cases = await (prisma as any).fraudCase?.findMany({
        where: {
          OR: [
            { assignedTo: userId },
            { teamMembers: { has: userId } }
          ],
          status: { notIn: ['RESOLVED', 'CLOSED'] }
        },
        orderBy: [{ priority: 'desc' }, { openedAt: 'asc' }]
      });

      return (cases || []).map((c: any) => this.formatCaseResult(c));
    } catch (error) {
      console.error('Error getting cases by assignee:', error);
      return [];
    }
  }

  // Get pending review queue
  async getReviewQueue(filters?: {
    status?: CaseStatus[];
    priority?: CasePriority[];
    caseType?: CaseType[];
    assignedTo?: string;
  }): Promise<CaseResult[]> {
    try {
      const where: any = {
        status: { notIn: ['RESOLVED', 'CLOSED'] }
      };

      if (filters?.status?.length) {
        where.status = { in: filters.status };
      }
      if (filters?.priority?.length) {
        where.priority = { in: filters.priority };
      }
      if (filters?.caseType?.length) {
        where.caseType = { in: filters.caseType };
      }
      if (filters?.assignedTo) {
        where.assignedTo = filters.assignedTo;
      }

      const cases = await (prisma as any).fraudCase?.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { slaDeadline: 'asc' }, { openedAt: 'asc' }],
        take: 100
      });

      return (cases || []).map((c: any) => this.formatCaseResult(c));
    } catch (error) {
      console.error('Error getting review queue:', error);
      return [];
    }
  }

  // Escalate case
  async escalateCase(caseId: string, reason: string, escalatedTo: string): Promise<CaseResult | null> {
    try {
      const fraudCase = await (prisma as any).fraudCase?.update({
        where: { id: caseId },
        data: {
          status: 'ESCALATED',
          updatedAt: new Date()
        }
      });

      await this.addNote(caseId, {
        content: `Case escalated to ${escalatedTo}. Reason: ${reason}`,
        authorId: escalatedTo,
        authorName: 'System',
        isInternal: true
      });

      return this.formatCaseResult(fraudCase);
    } catch (error) {
      console.error('Error escalating case:', error);
      return null;
    }
  }

  // Resolve case
  async resolveCase(
    caseId: string,
    resolution: string,
    resolutionAr: string,
    actionsTaken: Record<string, any>,
    resolvedBy: string
  ): Promise<CaseResult | null> {
    try {
      const fraudCase = await (prisma as any).fraudCase?.update({
        where: { id: caseId },
        data: {
          status: 'RESOLVED',
          resolution,
          resolutionAr,
          actionsTaken,
          updatedAt: new Date(),
          resolvedAt: new Date()
        }
      });

      await this.addNote(caseId, {
        content: `Case resolved by ${resolvedBy}: ${resolution}`,
        authorId: resolvedBy,
        authorName: 'System',
        isInternal: true
      });

      return this.formatCaseResult(fraudCase);
    } catch (error) {
      console.error('Error resolving case:', error);
      return null;
    }
  }

  // Link alert to case
  async linkAlert(caseId: string, alertId: string): Promise<boolean> {
    try {
      await (prisma as any).fraudAlert?.update({
        where: { id: alertId },
        data: { caseId }
      });
      return true;
    } catch (error) {
      console.error('Error linking alert:', error);
      return false;
    }
  }

  // Get case statistics
  async getCaseStatistics(dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    escalated: number;
    avgResolutionTime: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byRiskLevel: Record<string, number>;
  }> {
    try {
      const where: any = {};
      if (dateFrom || dateTo) {
        where.openedAt = {};
        if (dateFrom) where.openedAt.gte = dateFrom;
        if (dateTo) where.openedAt.lte = dateTo;
      }

      const cases = await (prisma as any).fraudCase?.findMany({ where });

      const stats = {
        total: cases?.length || 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        escalated: 0,
        avgResolutionTime: 0,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byRiskLevel: {} as Record<string, number>
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;

      for (const caseItem of cases || []) {
        // Count by status
        switch (caseItem.status) {
          case 'OPEN': stats.open++; break;
          case 'IN_PROGRESS': stats.inProgress++; break;
          case 'RESOLVED': 
          case 'CLOSED': 
            stats.resolved++; 
            // Calculate resolution time
            if (caseItem.resolvedAt) {
              const resolutionTime = new Date(caseItem.resolvedAt).getTime() - new Date(caseItem.openedAt).getTime();
              totalResolutionTime += resolutionTime;
              resolvedCount++;
            }
            break;
          case 'ESCALATED': stats.escalated++; break;
        }

        // Count by type
        stats.byType[caseItem.caseType] = (stats.byType[caseItem.caseType] || 0) + 1;

        // Count by priority
        stats.byPriority[caseItem.priority] = (stats.byPriority[caseItem.priority] || 0) + 1;

        // Count by risk level
        const riskLevel = this.getRiskLevelFromScore(caseItem.overallRiskScore);
        stats.byRiskLevel[riskLevel] = (stats.byRiskLevel[riskLevel] || 0) + 1;
      }

      stats.avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting case statistics:', error);
      return {
        total: 0, open: 0, inProgress: 0, resolved: 0, escalated: 0,
        avgResolutionTime: 0, byType: {}, byPriority: {}, byRiskLevel: {}
      };
    }
  }

  // Helper: Get SLA hours based on priority
  private getSlaHours(priority: CasePriority): number {
    switch (priority) {
      case 'CRITICAL': return 2;
      case 'URGENT': return 4;
      case 'HIGH': return 8;
      case 'MEDIUM': return 24;
      case 'LOW': return 72;
      default: return 24;
    }
  }

  // Helper: Get risk level from score
  private getRiskLevelFromScore(score: number): string {
    if (score < 30) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 70) return 'HIGH';
    return 'CRITICAL';
  }

  // Helper: Format case result
  private formatCaseResult(caseData: any): CaseResult {
    return {
      id: caseData?.id || '',
      caseNumber: caseData?.caseNumber || '',
      title: caseData?.title || '',
      description: caseData?.description || '',
      caseType: caseData?.caseType || 'INVESTIGATION',
      priority: caseData?.priority || 'MEDIUM',
      status: caseData?.status || 'OPEN',
      overallRiskScore: caseData?.overallRiskScore || 0,
      estimatedLoss: caseData?.estimatedLoss,
      assignedTo: caseData?.assignedTo,
      teamMembers: caseData?.teamMembers || [],
      openedAt: caseData?.openedAt || new Date(),
      updatedAt: caseData?.updatedAt || new Date(),
      resolvedAt: caseData?.resolvedAt,
      slaDeadline: caseData?.slaDeadline,
      resolution: caseData?.resolution,
      userId: caseData?.userId,
      orderId: caseData?.orderId,
      transactionId: caseData?.transactionId,
      alertCount: 0
    };
  }
}

export const caseManagementService = new CaseManagementService();

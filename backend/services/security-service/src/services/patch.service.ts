// Security Patch Management Service
// Service de gestion des correctifs de sécurité

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { logger, patchLogger } from '../utils/logger';
import { PrismaClient, PatchDeploymentRequest, PatchUrgency } from '@prisma/client';

const prisma = new PrismaClient();

export class PatchService {
  private readonly nvdApiKey?: string;
  private readonly alertEmail?: string;

  constructor() {
    this.nvdApiKey = process.env.NVD_API_KEY;
    this.alertEmail = process.env.ALERT_EMAIL;
  }

  /**
   * Check for available security patches
   */
  async checkAvailablePatches(filters?: {
    severity?: string;
    source?: string;
    product?: string;
  }) {
    const where: any = {
      isActive: true,
      availability: 'AVAILABLE'
    };

    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.source) {
      where.source = filters.source;
    }
    if (filters?.product) {
      where.affectedProducts = { has: filters.product };
    }

    const patches = await prisma.securityPatch.findMany({
      where,
      orderBy: [
        { isCritical: 'desc' },
        { cvssScore: 'desc' },
        { releaseDate: 'desc' }
      ]
    });

    return patches.map(p => this.mapPatchToResult(p));
  }

  /**
   * Get patches for a specific CVE
   */
  async getPatchForCve(cveId: string) {
    return prisma.securityPatch.findFirst({
      where: {
        cveId,
        isActive: true
      }
    });
  }

  /**
   * Create a new security patch record
   */
  async createPatch(data: {
    source: string;
    title: string;
    description: string;
    severity: string;
    cvssScore?: number;
    cveId?: string;
    affectedProducts: string[];
    affectedVersions: string[];
    fixedVersions: string[];
    patchUrl?: string;
    releaseDate?: Date;
    patchType: string;
    isCritical?: boolean;
  }) {
    const patchId = `PATCH-${uuidv4().substring(0, 8).toUpperCase()}`;

    const urgency = this.calculateUrgency(data.severity, data.cvssScore, data.isCritical);

    const patch = await prisma.securityPatch.create({
      data: {
        patchId,
        source: data.source as any,
        title: data.title,
        description: data.description,
        severity: data.severity as any,
        cvssScore: data.cvssScore,
        cveId: data.cveId,
        affectedProducts: data.affectedProducts,
        affectedVersions: data.affectedVersions,
        fixedVersions: data.fixedVersions,
        patchUrl: data.patchUrl,
        releaseDate: data.releaseDate,
        patchType: data.patchType as any,
        isCritical: data.isCritical || false,
        urgency
      }
    });

    patchLogger.info(`Patch created: ${patchId}`, {
      title: data.title,
      severity: data.severity,
      urgency
    });

    // Send critical patch alerts
    if (urgency === 'CRITICAL' || urgency === 'HIGH') {
      await this.sendCriticalPatchAlert(patch);
    }

    return patch;
  }

  /**
   * Request patch deployment
   */
  async requestDeployment(request: PatchDeploymentRequest) {
    const deploymentId = `DEPLOY-${uuidv4().substring(0, 8).toUpperCase()}`;

    const deployment = await prisma.patchDeployment.create({
      data: {
        deploymentId,
        patchId: request.patchId,
        environment: request.environment,
        targetSystem: request.targetSystem,
        status: 'PENDING' as any,
        deployedBy: request.deployMethod,
        deploymentMethod: request.deployMethod
      }
    });

    // Trigger async deployment
    this.executeDeployment(deploymentId, request);

    return { deploymentId, status: 'PENDING' };
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string) {
    const deployment = await prisma.patchDeployment.findUnique({
      where: { deploymentId },
      include: {
        patch: true
      }
    });

    if (!deployment) return null;

    return {
      deploymentId: deployment.deploymentId,
      patchId: deployment.patchId,
      environment: deployment.environment,
      status: deployment.status,
      startedAt: deployment.startedAt,
      completedAt: deployment.completedAt,
      durationMs: deployment.durationMs,
      success: deployment.success,
      error: deployment.errorMessage,
      rollbackPerformed: deployment.rollbackPerformed
    };
  }

  /**
   * Approve a patch for deployment
   */
  async approvePatch(patchId: string, approvedBy: string, notes?: string) {
    return prisma.securityPatch.update({
      where: { patchId },
      data: {
        approvalStatus: 'APPROVED' as any,
        reviewedBy: approvedBy,
        reviewedAt: new Date(),
        reviewNotes: notes
      }
    });
  }

  /**
   * Reject a patch
   */
  async rejectPatch(patchId: string, rejectedBy: string, reason: string) {
    return prisma.securityPatch.update({
      where: { patchId },
      data: {
        approvalStatus: 'REJECTED' as any,
        reviewedBy: rejectedBy,
        reviewedAt: new Date(),
        reviewNotes: reason
      }
    });
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    return prisma.securityPatch.findMany({
      where: {
        approvalStatus: 'PENDING',
        isActive: true
      },
      orderBy: [
        { isCritical: 'desc' },
        { cvssScore: 'desc' }
      ]
    });
  }

  /**
   * Update patch deployment status
   */
  async updateDeploymentStatus(
    deploymentId: string,
    status: string,
    details?: { error?: string; logs?: string }
  ) {
    const updateData: any = {
      status: status as any
    };

    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
    }

    if (status === 'SUCCESS' || status === 'FAILED' || status === 'ROLLED_BACK') {
      updateData.completedAt = new Date();
      updateData.durationMs = Date.now() - new Date().getTime();
    }

    if (status === 'SUCCESS') {
      updateData.success = true;
      // Update patch deployment tracking
      const deployment = await prisma.patchDeployment.findUnique({ where: { deploymentId } });
      if (deployment) {
        await prisma.securityPatch.update({
          where: { patchId: deployment.patchId },
          data: {
            deployedTo: { push: deployment.environment }
          }
        });
      }
    }

    if (status === 'FAILED') {
      updateData.success = false;
      updateData.errorMessage = details?.error;
    }

    if (details?.logs) {
      updateData.logs = details.logs;
    }

    const deployment = await prisma.patchDeployment.update({
      where: { deploymentId },
      data: updateData
    });

    patchLogger.deployment(
      deployment.patchId,
      deployment.environment,
      status
    );

    return deployment;
  }

  /**
   * Get patch compliance report
   */
  async getComplianceReport(environment: string) {
    const recentPatches = await prisma.securityPatch.findMany({
      where: {
        isActive: true,
        OR: [
          { approvalStatus: 'APPROVED' },
          { approvalStatus: 'EMERGENCY_APPROVED' },
          { isCritical: true }
        ]
      },
      orderBy: { releaseDate: 'desc' },
      take: 50
    });

    const deployedPatches = await prisma.patchDeployment.findMany({
      where: {
        environment,
        status: 'SUCCESS' as any,
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: { patchId: true }
    });

    const deployedPatchIds = new Set(deployedPatches.map(p => p.patchId));

    const compliance = recentPatches.map(p => ({
      patchId: p.patchId,
      title: p.title,
      severity: p.severity,
      isCritical: p.isCritical,
      dueDate: p.dueDate,
      deployed: deployedPatchIds.has(p.patchId),
      deploymentStatus: deployedPatchIds.has(p.patchId) ? 'DEPLOYED' : 'PENDING',
      overdue: p.dueDate && new Date() > p.dueDate
    }));

    const totalRequired = compliance.length;
    const totalDeployed = compliance.filter(c => c.deployed).length;
    const criticalPending = compliance.filter(c => c.isCritical && !c.deployed);
    const overdue = compliance.filter(c => c.overdue);

    return {
      environment,
      totalPatches: totalRequired,
      deployed: totalDeployed,
      pending: totalRequired - totalDeployed,
      complianceRate: totalRequired > 0 ? (totalDeployed / totalRequired) * 100 : 100,
      criticalPending: criticalPending.length,
      overdueCount: overdue.length,
      patches: compliance,
      generatedAt: new Date()
    };
  }

  // Private helper methods

  private async executeDeployment(deploymentId: string, request: PatchDeploymentRequest): Promise<void> {
    try {
      await this.updateDeploymentStatus(deploymentId, 'IN_PROGRESS');

      // TODO: Implement actual deployment logic
      // This could involve:
      // - SSH commands to servers
      // - Kubernetes deployments
      // - Docker image updates
      // - Package manager updates

      patchLogger.info(`Executing deployment: ${deploymentId}`, {
        patchId: request.patchId,
        environment: request.environment
      });

      // Simulate deployment (replace with actual logic)
      await new Promise(resolve => setTimeout(resolve, 2000));

      await this.updateDeploymentStatus(deploymentId, 'SUCCESS');
    } catch (error) {
      await this.updateDeploymentStatus(deploymentId, 'FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private calculateUrgency(severity: string, cvssScore?: number, isCritical?: boolean): PatchUrgency {
    if (isCritical) return PatchUrgency.CRITICAL;
    
    if (cvssScore) {
      if (cvssScore >= 9.0) return PatchUrgency.CRITICAL;
      if (cvssScore >= 7.0) return PatchUrgency.HIGH;
      if (cvssScore >= 4.0) return PatchUrgency.MEDIUM;
      return PatchUrgency.LOW;
    }

    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return PatchUrgency.CRITICAL;
      case 'HIGH':
        return PatchUrgency.HIGH;
      case 'MEDIUM':
        return PatchUrgency.MEDIUM;
      case 'LOW':
        return PatchUrgency.LOW;
      default:
        return PatchUrgency.INFORMATIONAL;
    }
  }

  private mapPatchToResult(patch: any) {
    return {
      patchId: patch.patchId,
      title: patch.title,
      severity: patch.severity,
      cvssScore: patch.cvssScore,
      affectedSystems: patch.affectedProducts,
      fixedVersions: patch.fixedVersions,
      patchAvailable: patch.availability === 'AVAILABLE',
      patchUrl: patch.patchUrl,
      releaseDate: patch.releaseDate,
      urgency: patch.urgency,
      recommendations: [patch.remediation || 'Apply patch as soon as possible']
    };
  }

  private async sendCriticalPatchAlert(patch: any): Promise<void> {
    if (!this.alertEmail) {
      logger.warn('Alert email not configured');
      return;
    }

    // TODO: Implement email sending
    logger.info(`Critical patch alert would be sent to ${this.alertEmail}`, {
      patchId: patch.patchId,
      title: patch.title,
      severity: patch.severity
    });
  }
}

export const patchService = new PatchService();

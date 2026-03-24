// ============================================================
// PHASE 4.4.5 — MANUAL RESOLUTION SERVICE
// Dual-approval workflow for reconciliation resolution
// All actions logged in Command Log
// NO direct balance edits — uses existing escrow service
// ============================================================

import { PrismaClient, ResolutionAction, ResolutionCommandStatus, ResolutionEventType, ReconciliationResolution } from '@prisma/client';
import { escrowService } from './escrow.service';

const prisma = new PrismaClient();

// ============================================================
// TYPES
// ============================================================

interface InitiateResolutionCommandRequest {
  reconciliationItemId: string;
  action: ResolutionAction;
  initiatedBy: string;
  reason: string;
  operatorNotes?: string;
  
  // For MANUAL_ESCROW_RELEASE
  escrowId?: string;
  releaseAmount?: bigint;
  releaseToWalletId?: string;
}

interface ApproveCommandRequest {
  commandId: string;
  approvedBy: string;
  notes?: string;
}

interface RejectCommandRequest {
  commandId: string;
  rejectedBy: string;
  reason: string;
}

interface AttachNoteRequest {
  reconciliationItemId: string;
  notes: string;
  attachedBy: string;
}

// ============================================================
// MANUAL RESOLUTION SERVICE
// ============================================================

export const manualResolutionService = {
  /**
   * Initiate a resolution command (requires dual approval for critical actions).
   * 
   * @param request - Command initiation request
   * @returns Created command
   */
  async initiateCommand(request: InitiateResolutionCommandRequest) {
    const {
      reconciliationItemId,
      action,
      initiatedBy,
      reason,
      operatorNotes,
      escrowId,
      releaseAmount,
      releaseToWalletId,
    } = request;

    // Validate reconciliation item exists
    const item = await prisma.reconciliationItem.findUnique({
      where: { id: reconciliationItemId },
    });

    if (!item) {
      throw new Error('Reconciliation item not found');
    }

    // Validate action-specific requirements
    if (action === ResolutionAction.MANUAL_ESCROW_RELEASE) {
      if (!escrowId || !releaseAmount || !releaseToWalletId) {
        throw new Error('Manual escrow release requires escrowId, releaseAmount, and releaseToWalletId');
      }

      // Validate escrow exists
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Validate escrow is in correct state
      if (escrow.status !== 'FUNDED' && escrow.status !== 'DISPUTED') {
        throw new Error(`Cannot release escrow in status: ${escrow.status}`);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Create command
      const command = await tx.reconciliationResolutionCommand.create({
        data: {
          reconciliationItemId,
          action,
          initiatedBy,
          reason,
          operatorNotes,
          status: this.requiresDualApproval(action)
            ? ResolutionCommandStatus.PENDING_APPROVAL
            : ResolutionCommandStatus.APPROVED, // Auto-approve non-critical actions
          escrowId,
          releaseAmount,
          releaseToWalletId,
        },
      });

      // Log command initiation
      await this.logEvent(tx, {
        commandId: command.id,
        reconciliationItemId,
        eventType: ResolutionEventType.COMMAND_INITIATED,
        actor: initiatedBy,
        action,
        notes: reason,
        metadata: {
          requiresDualApproval: this.requiresDualApproval(action),
        },
      });

      // If auto-approved, execute immediately
      if (command.status === ResolutionCommandStatus.APPROVED) {
        await this.executeCommand(command.id, tx);
      }

      return command;
    });
  },

  /**
   * Approve a pending command (second admin approval).
   * 
   * @param request - Approval request
   * @returns Updated command
   */
  async approveCommand(request: ApproveCommandRequest) {
    const { commandId, approvedBy, notes } = request;

    const command = await prisma.reconciliationResolutionCommand.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      throw new Error('Command not found');
    }

    if (command.status !== ResolutionCommandStatus.PENDING_APPROVAL) {
      throw new Error(`Cannot approve command in status: ${command.status}`);
    }

    // Prevent self-approval
    if (command.initiatedBy === approvedBy) {
      throw new Error('Cannot approve your own command (dual approval required)');
    }

    return await prisma.$transaction(async (tx) => {
      // Update command
      const updatedCommand = await tx.reconciliationResolutionCommand.update({
        where: { id: commandId },
        data: {
          status: ResolutionCommandStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
      });

      // Log approval
      await this.logEvent(tx, {
        commandId,
        reconciliationItemId: command.reconciliationItemId,
        eventType: ResolutionEventType.COMMAND_APPROVED,
        actor: approvedBy,
        action: command.action,
        notes,
        metadata: {
          initiatedBy: command.initiatedBy,
        },
      });

      // Execute command
      await this.executeCommand(commandId, tx);

      return updatedCommand;
    });
  },

  /**
   * Reject a pending command.
   * 
   * @param request - Rejection request
   * @returns Updated command
   */
  async rejectCommand(request: RejectCommandRequest) {
    const { commandId, rejectedBy, reason } = request;

    const command = await prisma.reconciliationResolutionCommand.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      throw new Error('Command not found');
    }

    if (command.status !== ResolutionCommandStatus.PENDING_APPROVAL) {
      throw new Error(`Cannot reject command in status: ${command.status}`);
    }

    return await prisma.$transaction(async (tx) => {
      // Update command
      const updatedCommand = await tx.reconciliationResolutionCommand.update({
        where: { id: commandId },
        data: {
          status: ResolutionCommandStatus.REJECTED,
          rejectedBy,
          rejectedAt: new Date(),
        },
      });

      // Log rejection
      await this.logEvent(tx, {
        commandId,
        reconciliationItemId: command.reconciliationItemId,
        eventType: ResolutionEventType.COMMAND_REJECTED,
        actor: rejectedBy,
        action: command.action,
        notes: reason,
        metadata: {
          initiatedBy: command.initiatedBy,
        },
      });

      return updatedCommand;
    });
  },

  /**
   * Attach an operator note to a reconciliation item.
   * This is a simple action that doesn't require approval.
   * 
   * @param request - Note attachment request
   */
  async attachNote(request: AttachNoteRequest) {
    const { reconciliationItemId, notes, attachedBy } = request;

    const item = await prisma.reconciliationItem.findUnique({
      where: { id: reconciliationItemId },
    });

    if (!item) {
      throw new Error('Reconciliation item not found');
    }

    return await prisma.$transaction(async (tx) => {
      // Update item with notes
      const updatedItem = await tx.reconciliationItem.update({
        where: { id: reconciliationItemId },
        data: {
          notes: item.notes ? `${item.notes}\n\n[${new Date().toISOString()}] ${attachedBy}:\n${notes}` : notes,
        },
      });

      // Log note attachment
      await this.logEvent(tx, {
        reconciliationItemId,
        eventType: ResolutionEventType.NOTE_ATTACHED,
        actor: attachedBy,
        notes,
      });

      return updatedItem;
    });
  },

  /**
   * Execute an approved command.
   * 
   * @param commandId - Command ID
   * @param tx - Prisma transaction client
   */
  async executeCommand(commandId: string, tx: any) {
    const command = await tx.reconciliationResolutionCommand.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      throw new Error('Command not found');
    }

    if (command.status !== ResolutionCommandStatus.APPROVED) {
      throw new Error(`Cannot execute command in status: ${command.status}`);
    }

    try {
      let executionResult: string;

      switch (command.action) {
        case ResolutionAction.ACKNOWLEDGE:
          executionResult = await this.executeAcknowledge(command, tx);
          break;

        case ResolutionAction.ATTACH_NOTE:
          executionResult = await this.executeAttachNote(command, tx);
          break;

        case ResolutionAction.ESCALATE_TO_DISPUTE:
          executionResult = await this.executeEscalateToDispute(command, tx);
          break;

        case ResolutionAction.MANUAL_ESCROW_RELEASE:
          executionResult = await this.executeManualEscrowRelease(command, tx);
          break;

        default:
          throw new Error(`Unknown action: ${command.action}`);
      }

      // Mark command as executed
      await tx.reconciliationResolutionCommand.update({
        where: { id: commandId },
        data: {
          status: ResolutionCommandStatus.EXECUTED,
          executedAt: new Date(),
          executionResult,
        },
      });

      // Log execution
      await this.logEvent(tx, {
        commandId,
        reconciliationItemId: command.reconciliationItemId,
        eventType: ResolutionEventType.COMMAND_EXECUTED,
        actor: 'system',
        action: command.action,
        notes: executionResult,
      });

    } catch (error: any) {
      // Mark command as failed
      await tx.reconciliationResolutionCommand.update({
        where: { id: commandId },
        data: {
          status: ResolutionCommandStatus.FAILED,
          executionResult: error.message,
        },
      });

      // Log failure
      await this.logEvent(tx, {
        commandId,
        reconciliationItemId: command.reconciliationItemId,
        eventType: ResolutionEventType.COMMAND_FAILED,
        actor: 'system',
        action: command.action,
        notes: error.message,
      });

      throw error;
    }
  },

  /**
   * Execute ACKNOWLEDGE action.
   */
  async executeAcknowledge(command: any, tx: any): Promise<string> {
    await tx.reconciliationItem.update({
      where: { id: command.reconciliationItemId },
      data: {
        resolution: ReconciliationResolution.MANUAL_ACTION,
        resolvedAt: new Date(),
        resolvedBy: command.approvedBy || command.initiatedBy,
      },
    });

    return 'Reconciliation item acknowledged';
  },

  /**
   * Execute ATTACH_NOTE action.
   */
  async executeAttachNote(command: any, tx: any): Promise<string> {
    const item = await tx.reconciliationItem.findUnique({
      where: { id: command.reconciliationItemId },
    });

    await tx.reconciliationItem.update({
      where: { id: command.reconciliationItemId },
      data: {
        notes: item.notes
          ? `${item.notes}\n\n${command.operatorNotes}`
          : command.operatorNotes,
      },
    });

    return 'Operator note attached';
  },

  /**
   * Execute ESCALATE_TO_DISPUTE action.
   */
  async executeEscalateToDispute(command: any, tx: any): Promise<string> {
    const item = await tx.reconciliationItem.findUnique({
      where: { id: command.reconciliationItemId },
    });

    // Get escrow
    const escrow = await tx.escrow.findUnique({
      where: { id: item.escrowId },
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Update escrow to DISPUTED status
    await tx.escrow.update({
      where: { id: escrow.id },
      data: {
        status: 'DISPUTED',
        disputedAt: new Date(),
        disputeReason: command.reason,
      },
    });

    // Update reconciliation item
    await tx.reconciliationItem.update({
      where: { id: command.reconciliationItemId },
      data: {
        resolution: ReconciliationResolution.MANUAL_ACTION,
        resolvedAt: new Date(),
        resolvedBy: command.approvedBy || command.initiatedBy,
        notes: `Escalated to dispute: ${command.reason}`,
      },
    });

    // Log escalation
    await this.logEvent(tx, {
      reconciliationItemId: command.reconciliationItemId,
      eventType: ResolutionEventType.ESCALATED,
      actor: command.approvedBy || command.initiatedBy,
      notes: `Escrow ${escrow.id} escalated to dispute`,
      metadata: {
        escrowId: escrow.id,
        reason: command.reason,
      },
    });

    return `Escrow ${escrow.id} escalated to dispute`;
  },

  /**
   * Execute MANUAL_ESCROW_RELEASE action.
   * Uses existing escrow service to maintain consistency.
   */
  async executeManualEscrowRelease(command: any, tx: any): Promise<string> {
    if (!command.escrowId || !command.releaseAmount || !command.releaseToWalletId) {
      throw new Error('Missing required fields for manual escrow release');
    }

    // Get escrow
    const escrow = await tx.escrow.findUnique({
      where: { id: command.escrowId },
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Determine release type (to seller or refund to buyer)
    const isRefund = command.releaseToWalletId === escrow.buyerWalletId;

    // Get system wallet (escrow holds funds here)
    const systemWallet = await tx.wallet.findFirst({
      where: {
        ownerType: 'SYSTEM',
        currency: escrow.currency,
      },
    });

    if (!systemWallet) {
      throw new Error('System wallet not found');
    }

    // Use escrow service to release or refund
    // Note: This is called within the transaction, so we need to pass tx
    if (isRefund) {
      // Refund to buyer
      await escrowService.refundEscrow({
        escrowId: command.escrowId,
        systemWalletId: systemWallet.id,
        triggeredBy: command.approvedBy || command.initiatedBy,
        reason: `Manual reconciliation refund: ${command.reason}`,
        requestId: `manual_refund_${command.id}`,
      });
    } else {
      // Release to seller
      await escrowService.releaseEscrow({
        escrowId: command.escrowId,
        systemWalletId: systemWallet.id,
        triggeredBy: command.approvedBy || command.initiatedBy,
        requestId: `manual_release_${command.id}`,
      });
    }

    // Update reconciliation item
    await tx.reconciliationItem.update({
      where: { id: command.reconciliationItemId },
      data: {
        resolution: ReconciliationResolution.MANUAL_ACTION,
        resolvedAt: new Date(),
        resolvedBy: command.approvedBy || command.initiatedBy,
        notes: `Manual escrow ${isRefund ? 'refund' : 'release'} executed`,
      },
    });

    return `Escrow ${command.escrowId} ${isRefund ? 'refunded' : 'released'} successfully`;
  },

  /**
   * Log an event to the command log.
   */
  async logEvent(tx: any, event: {
    commandId?: string;
    reconciliationItemId: string;
    eventType: ResolutionEventType;
    actor: string;
    action?: ResolutionAction;
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    metadata?: any;
  }) {
    await tx.reconciliationCommandLog.create({
      data: {
        commandId: event.commandId,
        reconciliationItemId: event.reconciliationItemId,
        eventType: event.eventType,
        actor: event.actor,
        action: event.action,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        notes: event.notes,
        metadata: event.metadata,
      },
    });
  },

  /**
   * Determine if an action requires dual approval.
   */
  requiresDualApproval(action: ResolutionAction): boolean {
    switch (action) {
      case ResolutionAction.MANUAL_ESCROW_RELEASE:
      case ResolutionAction.ESCALATE_TO_DISPUTE:
        return true; // Critical actions require dual approval

      case ResolutionAction.ACKNOWLEDGE:
      case ResolutionAction.ATTACH_NOTE:
        return false; // Non-critical actions auto-approve

      default:
        return true; // Default to requiring approval
    }
  },

  /**
   * Get pending commands awaiting approval.
   */
  async getPendingCommands() {
    return await prisma.reconciliationResolutionCommand.findMany({
      where: {
        status: ResolutionCommandStatus.PENDING_APPROVAL,
      },
      orderBy: {
        initiatedAt: 'asc',
      },
    });
  },

  /**
   * Get command log for a reconciliation item.
   */
  async getCommandLog(reconciliationItemId: string) {
    return await prisma.reconciliationCommandLog.findMany({
      where: {
        reconciliationItemId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  },

  /**
   * Get command details.
   */
  async getCommand(commandId: string) {
    return await prisma.reconciliationResolutionCommand.findUnique({
      where: { id: commandId },
    });
  },
};

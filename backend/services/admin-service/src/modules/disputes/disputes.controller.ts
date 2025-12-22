/**
 * Disputes Controller
 * Requirements: 12.1, 12.2, 12.3, 12.4, 17.1, 17.2, 17.3
 * Admin endpoints for dispute resolution
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import {
  DisputeFiltersDto,
  UpdateDisputeStatusDto,
  ResolveDisputeDto,
  AddMessageDto,
  EscrowReleaseDto,
  EscrowRefundDto,
} from './disputes.dto';

// Note: In production, use proper auth guard
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@Controller('admin/disputes')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  /**
   * Get paginated list of disputes
   * Requirements: 12.1, 17.1 - Display pending disputes with order info
   */
  @Get()
  async getDisputes(@Query() filters: DisputeFiltersDto) {
    return this.disputesService.getDisputes(filters);
  }

  /**
   * Get single dispute with full details
   * Requirements: 12.2, 17.2 - Display full order and dispute info
   */
  @Get(':disputeId')
  async getDispute(@Param('disputeId') disputeId: string) {
    return this.disputesService.getDispute(disputeId);
  }

  /**
   * Update dispute status
   * Requirements: 12.3
   */
  @Patch(':disputeId/status')
  async updateStatus(
    @Param('disputeId') disputeId: string,
    @Body() dto: UpdateDisputeStatusDto,
    @Request() req: any
  ) {
    const adminId = req.user?.id || 'system';
    return this.disputesService.updateStatus(disputeId, dto.status, adminId);
  }

  /**
   * Resolve dispute with escrow action
   * Requirements: 12.3, 12.4, 17.3 - Implement dispute resolution with escrow release/refund
   */
  @Post(':disputeId/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req: any
  ) {
    const adminId = req.user?.id || 'system';
    const adminName = req.user?.fullName || req.user?.email || 'Admin';
    return this.disputesService.resolveDispute(disputeId, dto, adminId, adminName);
  }

  /**
   * Trigger escrow release to seller
   * Requirements: 12.3 - Implement escrow release trigger
   */
  @Post(':disputeId/escrow/release')
  @HttpCode(HttpStatus.OK)
  async triggerEscrowRelease(
    @Param('disputeId') disputeId: string,
    @Body() dto: EscrowReleaseDto,
    @Request() req: any
  ) {
    // This endpoint allows manual escrow release if needed
    // The main resolution flow handles this automatically
    const adminId = req.user?.id || 'system';
    const dispute = await this.disputesService.getDispute(disputeId);
    
    if (!dispute.order.escrowId) {
      return { success: false, message: 'No escrow associated with this order' };
    }

    // Resolve with release_seller outcome
    const result = await this.disputesService.resolveDispute(
      disputeId,
      { outcome: 'release_seller' as any, notes: 'Manual escrow release triggered' },
      adminId,
      req.user?.fullName || 'Admin'
    );

    return {
      success: result.escrowAction?.status === 'success',
      transactionId: result.escrowAction?.transactionId,
      message: result.escrowAction?.message || 'Escrow release processed',
    };
  }

  /**
   * Trigger escrow refund to buyer
   * Requirements: 12.3 - Implement escrow refund trigger
   */
  @Post(':disputeId/escrow/refund')
  @HttpCode(HttpStatus.OK)
  async triggerEscrowRefund(
    @Param('disputeId') disputeId: string,
    @Body() dto: EscrowRefundDto,
    @Request() req: any
  ) {
    const adminId = req.user?.id || 'system';
    const dispute = await this.disputesService.getDispute(disputeId);
    
    if (!dispute.order.escrowId) {
      return { success: false, message: 'No escrow associated with this order' };
    }

    // Determine if partial or full refund
    const outcome = dto.amount && dto.amount < dispute.order.amount
      ? 'partial_refund'
      : 'refund_buyer';

    const result = await this.disputesService.resolveDispute(
      disputeId,
      {
        outcome: outcome as any,
        amount: dto.amount,
        notes: 'Manual escrow refund triggered',
      },
      adminId,
      req.user?.fullName || 'Admin'
    );

    return {
      success: result.escrowAction?.status === 'success',
      transactionId: result.escrowAction?.transactionId,
      message: result.escrowAction?.message || 'Escrow refund processed',
    };
  }

  /**
   * Add message to dispute
   */
  @Post(':disputeId/messages')
  async addMessage(
    @Param('disputeId') disputeId: string,
    @Body() dto: AddMessageDto,
    @Request() req: any
  ) {
    const adminId = req.user?.id || 'system';
    const adminName = req.user?.fullName || req.user?.email || 'Admin';
    return this.disputesService.addMessage(disputeId, dto.message, adminId, adminName);
  }

  /**
   * Get audit logs for a dispute
   * Requirements: 12.4 - Log resolution action for audit
   */
  @Get(':disputeId/audit-logs')
  async getAuditLogs(@Param('disputeId') disputeId: string) {
    return this.disputesService.getAuditLogs(disputeId);
  }
}

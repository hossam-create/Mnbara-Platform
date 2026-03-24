import {
  Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { DisputeRole, DisputeReason, DisputeResolution, DisputeStatus } from '@prisma/client';

@ApiTags('Disputes')
@Controller('api/v1/disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a dispute' })
  async openDispute(@Body() body: {
    escrowId: string; initiatedBy: string; initiatorRole: string;
    reason: string; description: string; evidence?: any[];
  }) {
    if (!body.escrowId || !body.initiatedBy || !body.initiatorRole || !body.reason || !body.description) {
      throw new BadRequestException('All fields are required');
    }

    const dispute = await this.disputeService.openDispute({
      escrowId: body.escrowId, initiatedBy: body.initiatedBy,
      initiatorRole: body.initiatorRole as DisputeRole,
      reason: body.reason as DisputeReason,
      description: body.description, evidence: body.evidence,
    });

    return { success: true, message: 'Dispute opened successfully', messageAr: 'تم فتح النزاع بنجاح', data: dispute };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user disputes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getUserDisputes(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.disputeService.getUserDisputes(userId, {
      status: status as DisputeStatus | undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return { success: true, data: result };
  }

  @Get(':disputeId')
  @ApiOperation({ summary: 'Get dispute by ID' })
  async getDispute(@Param('disputeId') disputeId: string) {
    const dispute = await this.disputeService.getDispute(disputeId);
    return { success: true, data: dispute };
  }

  @Post(':disputeId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add message to dispute' })
  async addMessage(
    @Param('disputeId') disputeId: string,
    @Body() body: { senderId: string; senderRole: string; message: string; attachments?: string[]; isInternal?: boolean },
  ) {
    if (!body.senderId || !body.senderRole || !body.message) {
      throw new BadRequestException('senderId, senderRole, and message are required');
    }

    const newMessage = await this.disputeService.addMessage({
      disputeId, senderId: body.senderId,
      senderRole: body.senderRole as DisputeRole,
      message: body.message, attachments: body.attachments, isInternal: body.isInternal,
    });

    return { success: true, message: 'Message added', messageAr: 'تمت إضافة الرسالة', data: newMessage };
  }

  @Post(':disputeId/evidence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add evidence to dispute' })
  async addEvidence(@Param('disputeId') disputeId: string, @Body() body: { evidence: any }) {
    if (!body.evidence) throw new BadRequestException('Evidence is required');
    const dispute = await this.disputeService.addEvidence(disputeId, body.evidence);
    return { success: true, message: 'Evidence added', messageAr: 'تمت إضافة الدليل', data: dispute };
  }

  @Post(':disputeId/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate dispute' })
  async escalateDispute(@Param('disputeId') disputeId: string, @Body() body: { reason: string }) {
    if (!body.reason) throw new BadRequestException('Reason is required');
    const dispute = await this.disputeService.escalateDispute(disputeId, body.reason);
    return { success: true, message: 'Dispute escalated', messageAr: 'تم تصعيد النزاع', data: dispute };
  }

  @Post(':disputeId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve dispute (Admin only)' })
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() body: {
      resolution: string; resolvedBy: string; resolutionNote: string;
      buyerRefund?: string; sellerPayout?: string;
    },
  ) {
    if (!body.resolution || !body.resolvedBy || !body.resolutionNote) {
      throw new BadRequestException('resolution, resolvedBy, and resolutionNote are required');
    }

    const dispute = await this.disputeService.resolveDispute({
      disputeId, resolution: body.resolution as DisputeResolution,
      resolvedBy: body.resolvedBy, resolutionNote: body.resolutionNote,
      buyerRefund: body.buyerRefund ? parseFloat(body.buyerRefund) : undefined,
      sellerPayout: body.sellerPayout ? parseFloat(body.sellerPayout) : undefined,
    });

    return { success: true, message: 'Dispute resolved', messageAr: 'تم حل النزاع', data: dispute };
  }
}

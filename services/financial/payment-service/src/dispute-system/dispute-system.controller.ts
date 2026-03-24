import { Controller, Post, Get, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DisputeSystemService } from './dispute-system.service';

@ApiTags('Dispute System')
@Controller('api/dispute-system')
export class DisputeSystemController {
  constructor(private readonly disputeService: DisputeSystemService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create dispute ticket' })
  async createTicket(@Body() body: any) {
    return { success: true, data: await this.disputeService.createDisputeTicket(body) };
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get dispute tickets' })
  async getTickets(@Query() query: any) {
    return { success: true, data: await this.disputeService.getDisputeTickets(query) };
  }

  @Get('tickets/:ticketId')
  @ApiOperation({ summary: 'Get dispute ticket' })
  async getTicket(@Param('ticketId') ticketId: string) {
    return { success: true, data: await this.disputeService.getDisputeTicket(ticketId) };
  }

  @Put('tickets/:ticketId/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(@Param('ticketId') ticketId: string, @Body() body: any) {
    return { success: true, data: await this.disputeService.updateTicketStatus(ticketId, body.status) };
  }

  @Post('tickets/:ticketId/messages')
  @ApiOperation({ summary: 'Add dispute message' })
  async addMessage(@Param('ticketId') ticketId: string, @Body() body: any) {
    return { success: true, data: await this.disputeService.addDisputeMessage(ticketId, body) };
  }

  @Get('tickets/:ticketId/messages')
  @ApiOperation({ summary: 'Get dispute messages' })
  async getMessages(@Param('ticketId') ticketId: string) {
    return { success: true, data: await this.disputeService.getDisputeMessages(ticketId) };
  }

  @Post('tickets/:ticketId/evidence')
  @ApiOperation({ summary: 'Add evidence' })
  async addEvidence(@Param('ticketId') ticketId: string, @Body() body: any) {
    return { success: true, data: await this.disputeService.addEvidence(ticketId, body) };
  }

  @Get('tickets/:ticketId/evidence')
  @ApiOperation({ summary: 'Get dispute evidence' })
  async getEvidence(@Param('ticketId') ticketId: string) {
    return { success: true, data: await this.disputeService.getDisputeEvidence(ticketId) };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get dispute categories' })
  async getCategories() { return { success: true, data: await this.disputeService.getDisputeCategories() }; }

  @Get('sla-rules')
  @ApiOperation({ summary: 'Get SLA rules' })
  async getSLARules() { return { success: true, data: await this.disputeService.getSLARules() }; }

  @Get('analytics')
  @ApiOperation({ summary: 'Get dispute analytics' })
  async getAnalytics() { return { success: true, data: await this.disputeService.getDisputeAnalytics() }; }

  @Get('agent-performance')
  @ApiOperation({ summary: 'Get agent performance' })
  async getAgentPerformance() { return { success: true, data: await this.disputeService.getAgentPerformance() }; }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dispute dashboard' })
  async getDashboard() { return { success: true, data: await this.disputeService.getDisputeDashboard() }; }

  @Post('trigger-sla-check')
  @ApiOperation({ summary: 'Trigger SLA compliance check' })
  async triggerSLA() { return { success: true, data: await this.disputeService.triggerSLACompliance() }; }
}

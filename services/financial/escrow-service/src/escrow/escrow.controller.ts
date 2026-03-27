import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';
import { DisputeEscrowDto } from './dto/dispute-escrow.dto';

@ApiTags('Escrow')
@ApiBearerAuth()
@Controller('api/v1/escrow')
export class EscrowController {
  constructor(private escrowService: EscrowService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new escrow account' })
  @ApiResponse({ status: 201, description: 'Escrow created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or escrow already exists' })
  async createEscrow(@Body() createEscrowDto: CreateEscrowDto) {
    return this.escrowService.createEscrow(createEscrowDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escrow account by ID' })
  @ApiResponse({ status: 200, description: 'Escrow found' })
  @ApiResponse({ status: 404, description: 'Escrow not found' })
  async getEscrow(@Param('id') id: string) {
    return this.escrowService.getEscrow(id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get escrow account by transaction ID' })
  @ApiResponse({ status: 200, description: 'Escrow found' })
  @ApiResponse({ status: 404, description: 'Escrow not found' })
  async getEscrowByTransaction(@Param('transactionId') transactionId: string) {
    return this.escrowService.getEscrowByTransaction(transactionId);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release escrow funds' })
  @ApiResponse({ status: 200, description: 'Escrow released successfully' })
  @ApiResponse({ status: 400, description: 'Cannot release escrow in current status' })
  @ApiResponse({ status: 404, description: 'Escrow not found' })
  async releaseEscrow(@Param('id') id: string, @Body() releaseEscrowDto: ReleaseEscrowDto) {
    return this.escrowService.releaseEscrow(id, releaseEscrowDto);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund escrow funds' })
  @ApiResponse({ status: 200, description: 'Escrow refunded successfully' })
  @ApiResponse({ status: 400, description: 'Cannot refund escrow in current status' })
  @ApiResponse({ status: 404, description: 'Escrow not found' })
  async refundEscrow(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.escrowService.refundEscrow(id, body.reason);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Initiate a dispute on escrow' })
  @ApiResponse({ status: 201, description: 'Dispute created successfully' })
  @ApiResponse({ status: 400, description: 'Cannot dispute escrow in current status' })
  @ApiResponse({ status: 404, description: 'Escrow not found' })
  async disputeEscrow(
    @Param('id') id: string,
    @Body() body: { initiatedBy: string; dispute: DisputeEscrowDto },
  ) {
    return this.escrowService.disputeEscrow(id, body.initiatedBy, body.dispute);
  }

  @Patch('dispute/:disputeId/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  @ApiResponse({ status: 400, description: 'Cannot resolve dispute in current status' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() body: { resolution: string; resolutionAmount: number; resolvedBy: string },
  ) {
    return this.escrowService.resolveDispute(
      disputeId,
      body.resolution,
      body.resolutionAmount,
      body.resolvedBy,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List escrow accounts' })
  @ApiResponse({ status: 200, description: 'List of escrow accounts' })
  async listEscrows(
    @Query('buyerId') buyerId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('status') status?: string,
  ) {
    return this.escrowService.listEscrows(buyerId, sellerId, status);
  }
}

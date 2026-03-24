import {
  Controller, Get, Post, Body, Param, HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';

@ApiTags('Escrow')
@Controller('api/v1/escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return { status: 'healthy', service: 'escrow-service', timestamp: new Date().toISOString() };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new escrow transaction' })
  async createEscrow(@Body() body: any) {
    const escrow = await this.escrowService.createTransaction(body);
    return { success: true, data: escrow };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escrow by ID' })
  async getEscrow(@Param('id') id: string) {
    const escrow = await this.escrowService.getEscrowById(id);
    if (!escrow) throw new NotFoundException('Escrow not found');
    return { success: true, data: escrow };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get escrow status' })
  async getStatus(@Param('id') id: string) {
    const status = await this.escrowService.getTransactionStatus(id);
    return { success: true, data: { status } };
  }

  @Post(':id/signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add signature to escrow' })
  async addSignature(@Param('id') id: string, @Body() body: any) {
    await this.escrowService.addSignature(id, body);
    return { success: true, message: 'Signature added successfully' };
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock escrow transaction' })
  async lockTransaction(@Param('id') id: string, @Body() body: any) {
    await this.escrowService.lockTransaction(id, body.buyerId, body);
    return { success: true, message: 'Transaction locked successfully' };
  }

  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release funds to seller' })
  async releaseTransaction(@Param('id') id: string, @Body() body: { buyerId: string }) {
    await this.escrowService.releaseTransaction(id, body.buyerId);
    return { success: true, message: 'Funds released successfully' };
  }

  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate dispute' })
  async initiateDispute(@Param('id') id: string, @Body() body: any) {
    await this.escrowService.initiateDispute(id, body);
    return { success: true, message: 'Dispute initiated successfully' };
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve dispute' })
  async resolveDispute(@Param('id') id: string, @Body() body: any) {
    await this.escrowService.resolveDispute(id, body);
    return { success: true, message: 'Dispute resolved successfully' };
  }
}

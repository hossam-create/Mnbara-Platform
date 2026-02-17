import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import {
  CreateEscrowRequestDto,
  CreateAndFundEscrowRequestDto,
  FundEscrowRequestDto,
  ReleaseEscrowRequestDto,
  RefundEscrowRequestDto,
  DisputeEscrowRequestDto,
  EscrowResponseDto,
  EscrowTransferResponseDto,
  EscrowReferenceType,
} from '../dto/escrow.dto';

@ApiTags('Escrow')
@Controller('escrow')
export class EscrowController {
  private readonly logger = new Logger(EscrowController.name);

  constructor(private readonly escrowService: EscrowService) {}

  // ============================================================
  // CREATE ESCROW
  // ============================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new escrow' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Escrow created successfully',
    type: EscrowResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Escrow already exists' })
  async createEscrow(
    @Body(new ValidationPipe()) request: CreateEscrowRequestDto,
  ): Promise<EscrowResponseDto> {
    this.logger.log(`Creating escrow for buyer ${request.buyerWalletId}`);
    return this.escrowService.createEscrow(request);
  }

  // ============================================================
  // CREATE AND FUND ESCROW (ATOMIC)
  // ============================================================

  @Post('create-and-fund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and fund escrow in one atomic operation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Escrow created and funded successfully',
    type: EscrowTransferResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data or insufficient balance' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Wallet not found' })
  async createAndFundEscrow(
    @Body(new ValidationPipe()) request: CreateAndFundEscrowRequestDto,
  ): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Creating and funding escrow for buyer ${request.buyerWalletId}`);
    return this.escrowService.createAndFundEscrow(request);
  }

  // ============================================================
  // FUND ESCROW
  // ============================================================

  @Post('fund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund an existing escrow' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow funded successfully',
    type: EscrowTransferResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data or insufficient balance' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Escrow or wallet not found' })
  async fundEscrow(
    @Body(new ValidationPipe()) request: FundEscrowRequestDto,
  ): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Funding escrow: ${request.escrowId}`);
    return this.escrowService.fundEscrow(request);
  }

  // ============================================================
  // RELEASE ESCROW
  // ============================================================

  @Post('release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release escrow funds to seller' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow released successfully',
    type: EscrowTransferResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Escrow not found or not funded' })
  async releaseEscrow(
    @Body(new ValidationPipe()) request: ReleaseEscrowRequestDto,
  ): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Releasing escrow: ${request.escrowId}`);
    return this.escrowService.releaseEscrow(request);
  }

  // ============================================================
  // REFUND ESCROW
  // ============================================================

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund escrow funds to buyer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow refunded successfully',
    type: EscrowTransferResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Escrow not found or not funded' })
  async refundEscrow(
    @Body(new ValidationPipe()) request: RefundEscrowRequestDto,
  ): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Refunding escrow: ${request.escrowId}`);
    return this.escrowService.refundEscrow(request);
  }

  // ============================================================
  // DISPUTE ESCROW
  // ============================================================

  @Post('dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispute an escrow' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow disputed successfully',
    type: EscrowResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Escrow not found' })
  async disputeEscrow(
    @Body(new ValidationPipe()) request: DisputeEscrowRequestDto,
  ): Promise<EscrowResponseDto> {
    this.logger.log(`Disputing escrow: ${request.escrowId}`);
    return this.escrowService.disputeEscrow(request);
  }

  // ============================================================
  // GET ESCROW BY ID
  // ============================================================

  @Get(':id')
  @ApiOperation({ summary: 'Get escrow by ID' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow found',
    type: EscrowResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Escrow not found' })
  async getEscrow(@Param('id') id: string): Promise<EscrowResponseDto | null> {
    this.logger.log(`Getting escrow: ${id}`);
    return this.escrowService.getEscrow(id);
  }

  // ============================================================
  // GET ESCROWS BY USER WALLET
  // ============================================================

  @Get('user/:walletId')
  @ApiOperation({ summary: 'Get escrows by user wallet ID' })
  @ApiParam({ name: 'walletId', description: 'User wallet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of escrows',
    type: [EscrowResponseDto],
  })
  async getEscrowsByUser(@Param('walletId') walletId: string): Promise<EscrowResponseDto[]> {
    this.logger.log(`Getting escrows for user wallet: ${walletId}`);
    return this.escrowService.getEscrowsByUser(walletId);
  }

  // ============================================================
  // GET ESCROWS BY REFERENCE
  // ============================================================

  @Get('reference/:referenceType/:referenceId')
  @ApiOperation({ summary: 'Get escrows by reference type and ID' })
  @ApiParam({ name: 'referenceType', description: 'Reference type (ORDER, AUCTION, etc.)' })
  @ApiParam({ name: 'referenceId', description: 'Reference ID' })
  @ApiQuery({ name: 'type', enum: EscrowReferenceType, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of escrows',
    type: [EscrowResponseDto],
  })
  async getEscrowsByReference(
    @Param('referenceType') referenceType: EscrowReferenceType,
    @Param('referenceId') referenceId: string,
  ): Promise<EscrowResponseDto[]> {
    this.logger.log(`Getting escrows by reference: ${referenceType} ${referenceId}`);
    return this.escrowService.getEscrowsByReference(referenceType, referenceId);
  }
}
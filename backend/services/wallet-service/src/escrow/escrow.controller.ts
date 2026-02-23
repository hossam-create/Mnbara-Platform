import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Logger, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { 
  CreateEscrowRequestDto, 
  CreateAndFundEscrowRequestDto, 
  FundEscrowRequestDto, 
  ReleaseEscrowRequestDto, 
  RefundEscrowRequestDto, 
  DisputeEscrowRequestDto,
  EscrowResponseDto
} from '../dto/escrow.dto';

@ApiTags('escrow')
@Controller('escrow')
@ApiBearerAuth()
export class EscrowController {
  private readonly logger = new Logger(EscrowController.name);

  constructor(private readonly escrowService: EscrowService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Escrow (Unfunded)' })
  @ApiResponse({ status: 201, description: 'Escrow created' })
  async create(
    @Body() dto: CreateEscrowRequestDto,
    @Headers('x-user-id') userId: string
  ) {
    // Ideally get user from AuthGuard
    return await this.escrowService.createEscrow(dto, userId || 'system');
  }

  @Post('create-and-fund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and Fund Escrow Atomically' })
  @ApiResponse({ status: 201, description: 'Escrow created and funded' })
  async createAndFund(@Body() dto: CreateAndFundEscrowRequestDto) {
    return await this.escrowService.createAndFundEscrow(dto);
  }

  @Post('fund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund Existing Escrow' })
  @ApiResponse({ status: 200, description: 'Escrow funded' })
  async fund(@Body() dto: FundEscrowRequestDto) {
    return await this.escrowService.fundEscrow(dto);
  }

  @Post('release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release Escrow to Seller' })
  async release(@Body() dto: ReleaseEscrowRequestDto) {
    return await this.escrowService.releaseEscrow(dto);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund Escrow to Buyer' })
  async refund(@Body() dto: RefundEscrowRequestDto) {
    return await this.escrowService.refundEscrow(dto);
  }

  @Post('dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispute Escrow' })
  async dispute(@Body() dto: DisputeEscrowRequestDto) {
    return await this.escrowService.disputeEscrow(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Escrow Details' })
  async get(@Param('id') id: string) {
    return await this.escrowService.getEscrow(id);
  }
}
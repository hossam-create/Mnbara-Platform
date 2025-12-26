import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { P2PSwapService, SwapOffer, SwapExecution } from './p2p-swap.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../types/user.types';

export class CreateSwapOfferDto {
  fromUser: string;
  toUser: string;
  offerAmount: string;
  offerCurrency: string;
  requestAmount: string;
  requestCurrency: string;
  expiresInHours?: number;
}

@Controller('api/p2p-swap')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.VERIFIED_USER, UserRole.ADMIN)
export class P2PSwapController {
  constructor(private readonly p2pSwapService: P2PSwapService) {}

  /**
   * إنشاء عرض تبادل جديد
   * POST /api/p2p-swap/offer
   */
  @Post('offer')
  async createSwapOffer(@Body() createSwapOfferDto: CreateSwapOfferDto): Promise<SwapOffer> {
    try {
      return await this.p2pSwapService.createSwapOffer(createSwapOfferDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create swap offer',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * قبول عرض تبادل
   * POST /api/p2p-swap/offer/:offerId/accept
   */
  @Post('offer/:offerId/accept')
  async acceptSwapOffer(
    @Param('offerId') offerId: string,
    @Body('acceptorUserId') acceptorUserId: string
  ): Promise<SwapExecution> {
    try {
      return await this.p2pSwapService.acceptSwapOffer(offerId, acceptorUserId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to accept swap offer',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * الحصول على عروض التبادل المتاحة للمستخدم
   * GET /api/p2p-swap/offers/:userId
   */
  @Get('offers/:userId')
  async getAvailableOffers(@Param('userId') userId: string): Promise<SwapOffer[]> {
    try {
      return await this.p2pSwapService.getAvailableSwapOffers(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch swap offers',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * تحديث حالة التبادل (للاستخدام الداخلي أو webhooks)
   * POST /api/p2p-swap/execution/:swapId/status
   */
  @Post('execution/:swapId/status')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM)
  async updateSwapStatus(
    @Param('swapId') swapId: string,
    @Body('status') status: 'confirmed' | 'failed',
    @Body('txHash') txHash?: string
  ): Promise<void> {
    try {
      await this.p2pSwapService.updateSwapStatus(swapId, status, txHash);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update swap status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
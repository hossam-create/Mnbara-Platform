import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { AuctionBlockchainService } from '../auction/auction-blockchain.service';

@Controller('api/blockchain/escrow')
export class EscrowController {
  constructor(private readonly escrowService: AuctionBlockchainService) {}

  /**
   * Lock funds in escrow
   * POST /api/blockchain/escrow/lock-funds
   */
  @Post('lock-funds')
  async lockFunds(@Body() body: {
    auctionId: number;
    buyer: string;
    seller: string;
    amount: string;
    useNativeToken?: boolean;
  }) {
    try {
      const { auctionId, buyer, seller, amount, useNativeToken = true } = body;

      const result = await this.escrowService.lockFunds(
        auctionId,
        buyer,
        seller,
        amount,
        useNativeToken
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Release funds to seller
   * POST /api/blockchain/escrow/release-funds
   */
  @Post('release-funds')
  async releaseFunds(@Body() body: { auctionId: number }) {
    try {
      const { auctionId } = body;

      const result = await this.escrowService.releaseFunds(auctionId);

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refund buyer
   * POST /api/blockchain/escrow/refund
   */
  @Post('refund')
  async refundBuyer(@Body() body: { auctionId: number }) {
    try {
      const { auctionId } = body;

      const result = await this.escrowService.refundBuyer(auctionId);

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Raise dispute
   * POST /api/blockchain/escrow/raise-dispute
   */
  @Post('raise-dispute')
  async raiseDispute(@Body() body: {
    auctionId: number;
    reason: string;
    initiator: string;
  }) {
    try {
      const { auctionId, reason, initiator } = body;

      const result = await this.escrowService.raiseDispute(
        auctionId,
        reason,
        initiator
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Resolve dispute (admin only)
   * POST /api/blockchain/escrow/resolve-dispute
   */
  @Post('resolve-dispute')
  async resolveDispute(@Body() body: {
    auctionId: number;
    favorBuyer: boolean;
  }) {
    try {
      const { auctionId, favorBuyer } = body;

      const result = await this.escrowService.resolveDispute(
        auctionId,
        favorBuyer
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get escrow details
   * GET /api/blockchain/escrow/:auctionId
   */
  @Get(':auctionId')
  async getEscrow(@Param('auctionId') auctionId: string) {
    try {
      const escrow = await this.escrowService.getEscrow(Number(auctionId));

      if (!escrow) {
        throw new HttpException('Escrow not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        escrow
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get escrow statistics
   * GET /api/blockchain/escrow/stats
   */
  @Get('stats/all')
  async getStats() {
    try {
      const stats = await this.escrowService.getStats();

      if (!stats) {
        throw new HttpException('Failed to fetch stats', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        success: true,
        stats
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

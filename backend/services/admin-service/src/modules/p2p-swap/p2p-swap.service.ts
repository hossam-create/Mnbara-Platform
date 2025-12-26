import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BlockchainService } from '../../services/blockchain.service';
import { ContractsService } from '../../services/contracts.service';
import { PrismaService } from '../../database/database.service';

export interface SwapOffer {
  offerId: string;
  fromUser: string;
  toUser: string;
  offerAmount: string;
  offerCurrency: string;
  requestAmount: string;
  requestCurrency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

export interface SwapExecution {
  swapId: string;
  offerId: string;
  fromUser: string;
  toUser: string;
  amountFrom: string;
  amountTo: string;
  currencyFrom: string;
  currencyTo: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
}

@Injectable()
export class P2PSwapService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly contractsService: ContractsService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * إنشاء عرض تبادل جديد بين مستخدمين
   */
  async createSwapOffer(offerData: {
    fromUser: string;
    toUser: string;
    offerAmount: string;
    offerCurrency: string;
    requestAmount: string;
    requestCurrency: string;
    expiresInHours?: number;
  }): Promise<SwapOffer> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (offerData.expiresInHours || 24));

      const swapOffer = await this.prisma.swapOffer.create({
        data: {
          fromUser: offerData.fromUser,
          toUser: offerData.toUser,
          offerAmount: offerData.offerAmount,
          offerCurrency: offerData.offerCurrency,
          requestAmount: offerData.requestAmount,
          requestCurrency: offerData.requestCurrency,
          status: 'pending',
          expiresAt
        }
      });

      return {
        offerId: swapOffer.id,
        fromUser: swapOffer.fromUser,
        toUser: swapOffer.toUser,
        offerAmount: swapOffer.offerAmount,
        offerCurrency: swapOffer.offerCurrency,
        requestAmount: swapOffer.requestAmount,
        requestCurrency: swapOffer.requestCurrency,
        status: swapOffer.status as any,
        createdAt: swapOffer.createdAt,
        expiresAt: swapOffer.expiresAt
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create swap offer: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * قبول عرض تبادل وتنفيذه على Blockchain
   */
  async acceptSwapOffer(offerId: string, acceptorUserId: string): Promise<SwapExecution> {
    try {
      // التحقق من صحة العرض
      const offer = await this.prisma.swapOffer.findUnique({
        where: { id: offerId, status: 'pending' }
      });

      if (!offer) {
        throw new HttpException('Swap offer not found or already processed', HttpStatus.NOT_FOUND);
      }

      if (offer.toUser !== acceptorUserId) {
        throw new HttpException('You are not the intended recipient of this offer', HttpStatus.FORBIDDEN);
      }

      if (offer.expiresAt < new Date()) {
        throw new HttpException('Swap offer has expired', HttpStatus.BAD_REQUEST);
      }

      // تنفيذ التبادل على Blockchain
      const swapResult = await this.executeBlockchainSwap({
        fromUser: offer.fromUser,
        toUser: offer.toUser,
        amountFrom: offer.offerAmount,
        currencyFrom: offer.offerCurrency,
        amountTo: offer.requestAmount,
        currencyTo: offer.requestCurrency
      });

      // تحديث حالة العرض
      await this.prisma.swapOffer.update({
        where: { id: offerId },
        data: { status: 'accepted' }
      });

      // حفظ تفاصيل التنفيذ
      const swapExecution = await this.prisma.swapExecution.create({
        data: {
          offerId: offerId,
          fromUser: offer.fromUser,
          toUser: offer.toUser,
          amountFrom: offer.offerAmount,
          amountTo: offer.requestAmount,
          currencyFrom: offer.offerCurrency,
          currencyTo: offer.requestCurrency,
          txHash: swapResult.txHash,
          status: 'pending'
        }
      });

      return {
        swapId: swapExecution.id,
        offerId: swapExecution.offerId,
        fromUser: swapExecution.fromUser,
        toUser: swapExecution.toUser,
        amountFrom: swapExecution.amountFrom,
        amountTo: swapExecution.amountTo,
        currencyFrom: swapExecution.currencyFrom,
        currencyTo: swapExecution.currencyTo,
        txHash: swapExecution.txHash,
        status: swapExecution.status as any,
        createdAt: swapExecution.createdAt
      };
    } catch (error) {
      throw new HttpException(
        `Failed to accept swap offer: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * تنفيذ التبادل على Blockchain باستخدام العقود الذكية
   */
  private async executeBlockchainSwap(swapData: {
    fromUser: string;
    toUser: string;
    amountFrom: string;
    currencyFrom: string;
    amountTo: string;
    currencyTo: string;
  }): Promise<{ success: boolean; txHash: string; error?: string }> {
    try {
      // هنا سيتم تنفيذ التبادل الفعلي على Blockchain
      // باستخدام العقود الذكية الموجودة في contractsService
      
      const txHash = await this.contractsService.executeSwap({
        from: swapData.fromUser,
        to: swapData.toUser,
        amountIn: swapData.amountFrom,
        currencyIn: swapData.currencyFrom,
        amountOut: swapData.amountTo,
        currencyOut: swapData.currencyTo
      });

      return { success: true, txHash };
    } catch (error) {
      return { 
        success: false, 
        txHash: '', 
        error: `Blockchain swap failed: ${error.message}` 
      };
    }
  }

  /**
   * الحصول على عروض التبادل المتاحة لمستخدم معين
   */
  async getAvailableSwapOffers(userId: string): Promise<SwapOffer[]> {
    try {
      const offers = await this.prisma.swapOffer.findMany({
        where: {
          toUser: userId,
          status: 'pending',
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      return offers.map(offer => ({
        offerId: offer.id,
        fromUser: offer.fromUser,
        toUser: offer.toUser,
        offerAmount: offer.offerAmount,
        offerCurrency: offer.offerCurrency,
        requestAmount: offer.requestAmount,
        requestCurrency: offer.requestCurrency,
        status: offer.status as any,
        createdAt: offer.createdAt,
        expiresAt: offer.expiresAt
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to fetch swap offers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * تحديث حالة تنفيذ التبادل بناءً على تأكيد Blockchain
   */
  async updateSwapStatus(swapId: string, status: 'confirmed' | 'failed', txHash?: string): Promise<void> {
    try {
      await this.prisma.swapExecution.update({
        where: { id: swapId },
        data: { 
          status,
          ...(txHash && { txHash })
        }
      });
    } catch (error) {
      throw new HttpException(
        `Failed to update swap status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
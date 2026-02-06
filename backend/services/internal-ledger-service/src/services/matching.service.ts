// ============================================================
// Matching Service - Buyer/Seller Matching Algorithm
// Matches buyer requests with seller offers based on price and priority
// ============================================================

import { PrismaClient, BuyRequest as PrismaBuyRequest, SellOffer as PrismaSellOffer } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  BuyRequest,
  BuyRequestStatus,
  SellOffer,
  SellOfferStatus,
  CreateBuyRequestInput,
  CreateSellOfferInput,
  MatchingSettlement,
  SettlementStatus,
} from '../types/ledger.types';
import { ledgerService } from './ledger.service';
import { complianceService } from './compliance.service';
import { auditService } from './audit.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Fee configuration
const DEFAULT_PLATFORM_FEE_RATE = new Decimal('0.02'); // 2%
const DEFAULT_PROCESSING_FEE_RATE = new Decimal('0.029'); // 2.9%
const DEFAULT_PROCESSING_FEE_FIXED = new Decimal('0.30'); // $0.30

export class MatchingService {
  /**
   * Create a new buy request
   */
  async createBuyRequest(input: CreateBuyRequestInput): Promise<BuyRequest> {
    logger.info('Creating buy request', {
      userId: input.userId,
      currency: input.currency,
      amount: input.amount.toString(),
      maxPricePerUnit: input.maxPricePerUnit.toString(),
    });

    // Check compliance for user
    const complianceCheck = await complianceService.performTransactionCheck(
      input.userId,
      input.amount
    );

    if (!complianceCheck.passed) {
      throw new Error(`Compliance check failed: ${complianceCheck.reason}`);
    }

    const request = await prisma.buyRequest.create({
      data: {
        userId: input.userId,
        currency: input.currency,
        amount: input.amount,
        maxPricePerUnit: input.maxPricePerUnit,
        totalMaxAmount: input.amount.times(input.maxPricePerUnit),
        status: BuyRequestStatus.OPEN,
        priority: input.priority || 1,
        matchedAmount: new Decimal(0),
        matchedOfferIds: [],
        expiresAt: input.expiresAt,
      },
    });

    await auditService.log({
      action: 'BUY_REQUEST_CREATED',
      entityType: 'BuyRequest',
      entityId: request.id,
      userId: input.userId,
      newValues: input as any,
    });

    // Try to match immediately
    await this.runMatching(request.id, input.currency);

    return this.mapToBuyRequest(request);
  }

  /**
   * Create a new sell offer
   */
  async createSellOffer(input: CreateSellOfferInput): Promise<SellOffer> {
    logger.info('Creating sell offer', {
      userId: input.userId,
      currency: input.currency,
      amount: input.amount.toString(),
      minPricePerUnit: input.minPricePerUnit.toString(),
    });

    // Check compliance for user
    const complianceCheck = await complianceService.performTransactionCheck(
      input.userId,
      input.amount
    );

    if (!complianceCheck.passed) {
      throw new Error(`Compliance check failed: ${complianceCheck.reason}`);
    }

    const offer = await prisma.sellOffer.create({
      data: {
        userId: input.userId,
        currency: input.currency,
        amount: input.amount,
        minPricePerUnit: input.minPricePerUnit,
        totalMinAmount: input.amount.times(input.minPricePerUnit),
        status: SellOfferStatus.OPEN,
        priority: input.priority || 1,
        matchedAmount: new Decimal(0),
        matchedRequestIds: [],
        expiresAt: input.expiresAt,
      },
    });

    await auditService.log({
      action: 'SELL_OFFER_CREATED',
      entityType: 'SellOffer',
      entityId: offer.id,
      userId: input.userId,
      newValues: input as any,
    });

    // Try to match immediately
    await this.runMatchingForOffer(offer.id, input.currency);

    return this.mapToSellOffer(offer);
  }

  /**
   * Run matching algorithm for a currency
   */
  async runMatching(buyRequestId: string, currency: string): Promise<void> {
    logger.info('Running matching algorithm', { buyRequestId, currency });

    const buyRequest = await prisma.buyRequest.findUnique({
      where: { id: buyRequestId },
    });

    if (!buyRequest || buyRequest.status !== BuyRequestStatus.OPEN) {
      logger.debug('Buy request not available for matching', { buyRequestId });
      return;
    }

    // Find matching sell offers
    const matchingOffers = await this.findMatchingOffers(buyRequest);

    if (matchingOffers.length === 0) {
      logger.debug('No matching offers found', { buyRequestId });
      return;
    }

    // Execute matches
    for (const offer of matchingOffers) {
      if (buyRequest.status === BuyRequestStatus.FULLY_MATCHED) {
        break;
      }

      const matchResult = await this.executeMatch(buyRequest, offer);
      if (matchResult.success) {
        // Update buy request
        const updatedBuyRequest = await prisma.buyRequest.findUnique({
          where: { id: buyRequestId },
        });

        if (updatedBuyRequest) {
          buyRequest.status =
            updatedBuyRequest.matchedAmount.equals(updatedBuyRequest.amount)
              ? BuyRequestStatus.FULLY_MATCHED
              : BuyRequestStatus.PARTIALLY_MATCHED;
        }
      }
    }
  }

  /**
   * Run matching for a specific sell offer
   */
  async runMatchingForOffer(sellOfferId: string, currency: string): Promise<void> {
    logger.info('Running matching for sell offer', { sellOfferId, currency });

    const sellOffer = await prisma.sellOffer.findUnique({
      where: { id: sellOfferId },
    });

    if (!sellOffer || sellOffer.status !== SellOfferStatus.OPEN) {
      logger.debug('Sell offer not available for matching', { sellOfferId });
      return;
    }

    // Find matching buy requests
    const matchingRequests = await this.findMatchingRequests(sellOffer);

    if (matchingRequests.length === 0) {
      logger.debug('No matching requests found', { sellOfferId });
      return;
    }

    // Execute matches
    for (const request of matchingRequests) {
      if (sellOffer.status === SellOfferStatus.FULLY_MATCHED) {
        break;
      }

      await this.executeMatch(request, sellOffer);
    }
  }

  /**
   * Find matching sell offers for a buy request
   */
  private async findMatchingOffers(
    buyRequest: PrismaBuyRequest
  ): Promise<PrismaSellOffer[]> {
    // Find offers where:
    // 1. Status is OPEN
    // 2. Currency matches
    // 3. minPricePerUnit <= buyer's maxPricePerUnit
    // 4. Has available amount
    // 5. Not expired

    const offers = await prisma.sellOffer.findMany({
      where: {
        status: SellOfferStatus.OPEN,
        currency: buyRequest.currency,
        minPricePerUnit: {
          lte: buyRequest.maxPricePerUnit,
        },
        amount: {
          gt: prisma.sellOffer.fields.matchedAmount, // Has remaining amount
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { minPricePerUnit: 'asc' }, // Cheapest offers first
        { priority: 'desc' }, // Higher priority first
        { createdAt: 'asc' }, // FIFO for same price
      ],
      take: 10, // Limit to top 10 matches
    });

    // Filter out fully matched offers
    return offers.filter(
      (offer) => offer.amount.minus(ooffer.matchedAmount).greaterThan(0)
    );
  }

  /**
   * Find matching buy requests for a sell offer
   */
  private async findMatchingRequests(
    sellOffer: PrismaSellOffer
  ): Promise<PrismaBuyRequest[]> {
    // Find requests where:
    // 1. Status is OPEN
    // 2. Currency matches
    // 3. maxPricePerUnit >= seller's minPricePerUnit
    // 4. Has remaining amount
    // 5. Not expired

    const requests = await prisma.buyRequest.findMany({
      where: {
        status: BuyRequestStatus.OPEN,
        currency: sellOffer.currency,
        maxPricePerUnit: {
          gte: sellOffer.minPricePerUnit,
        },
        amount: {
          gt: prisma.buyRequest.fields.matchedAmount, // Has remaining amount
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { maxPricePerUnit: 'desc' }, // Highest price first
        { priority: 'desc' }, // Higher priority first
        { createdAt: 'asc' }, // FIFO for same price
      ],
      take: 10, // Limit to top 10 matches
    });

    // Filter out fully matched requests
    return requests.filter(
      (request) => request.amount.minus(request.matchedAmount).greaterThan(0)
    );
  }

  /**
   * Execute a match between buy request and sell offer
   */
  private async executeMatch(
    buyRequest: PrismaBuyRequest,
    sellOffer: PrismaSellOffer
  ): Promise<{ success: boolean; error?: string }> {
    logger.info('Executing match', {
      buyRequestId: buyRequest.id,
      sellOfferId: sellOffer.id,
    });

    try {
      // Calculate match amount
      const buyerRemaining = buyRequest.amount.minus(buyRequest.matchedAmount);
      const sellerRemaining = sellOffer.amount.minus(sellOffer.matchedAmount);
      const matchAmount = Decimal.min(buyerRemaining, sellerRemaining);

      if (matchAmount.lessThanOrEqualTo(0)) {
        return { success: false, error: 'No amount available for matching' };
      }

      // Determine price (use the midpoint or the seller's price since they're sorted)
      const matchPrice = sellOffer.minPricePerUnit;

      // Calculate totals
      const totalAmount = matchAmount.times(matchPrice);

      // Calculate fees
      const platformFee = totalAmount.times(DEFAULT_PLATFORM_FEE_RATE);
      const processingFee = totalAmount
        .times(DEFAULT_PROCESSING_FEE_RATE)
        .plus(DEFAULT_PROCESSING_FEE_FIXED);
      const totalFees = platformFee.plus(processingFee);
      const netAmount = totalAmount.minus(totalFees);

      // Create settlement
      const settlement = await this.createSettlement({
        buyerId: buyRequest.userId,
        sellerId: sellOffer.userId,
        buyRequestId: buyRequest.id,
        sellOfferId: sellOffer.id,
        currency: buyRequest.currency,
        amount: matchAmount,
        pricePerUnit: matchPrice,
        platformFeeRate: DEFAULT_PLATFORM_FEE_RATE,
        processingFeeRate: DEFAULT_PROCESSING_FEE_RATE,
      });

      // Update matched amounts
      const newBuyerMatched = buyRequest.matchedAmount.plus(matchAmount);
      const newSellerMatched = sellOffer.matchedAmount.plus(matchAmount);

      // Update buy request status
      const newBuyStatus =
        newBuyerMatched.equals(buyRequest.amount)
          ? BuyRequestStatus.FULLY_MATCHED
          : BuyRequestStatus.PARTIALLY_MATCHED;

      // Update sell offer status
      const newSellStatus =
        newSellerMatched.equals(sellOffer.amount)
          ? SellOfferStatus.FULLY_MATCHED
          : SellOfferStatus.PARTIALLY_MATCHED;

      await prisma.$transaction([
        prisma.buyRequest.update({
          where: { id: buyRequest.id },
          data: {
            matchedAmount: newBuyerMatched,
            status: newBuyStatus,
            matchedOfferIds: [...buyRequest.matchedOfferIds, sellOffer.id],
          },
        }),
        prisma.sellOffer.update({
          where: { id: sellOffer.id },
          data: {
            matchedAmount: newSellerMatched,
            status: newSellStatus,
            matchedRequestIds: [...sellOffer.matchedRequestIds, buyRequest.id],
          },
        }),
      ]);

      logger.info('Match executed successfully', {
        buyRequestId: buyRequest.id,
        sellOfferId: sellOffer.id,
        matchAmount: matchAmount.toString(),
        pricePerUnit: matchPrice.toString(),
        totalAmount: totalAmount.toString(),
        netAmount: netAmount.toString(),
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Match execution failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Create a settlement record
   */
  private async createSettlement(
    input: {
      buyerId: number;
      sellerId: number;
      buyRequestId: string;
      sellOfferId: string;
      currency: string;
      amount: Decimal;
      pricePerUnit: Decimal;
      platformFeeRate?: Decimal;
      processingFeeRate?: Decimal;
    }
  ): Promise<MatchingSettlement> {
    const totalAmount = input.amount.times(input.pricePerUnit);
    const platformFee = totalAmount.times(
      input.platformFeeRate || DEFAULT_PLATFORM_FEE_RATE
    );
    const processingFee = totalAmount
      .times(input.processingFeeRate || DEFAULT_PROCESSING_FEE_RATE)
      .plus(DEFAULT_PROCESSING_FEE_FIXED);
    const totalFees = platformFee.plus(processingFee);

    const settlement = await prisma.matchingSettlement.create({
      data: {
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        buyRequestId: input.buyRequestId,
        sellOfferId: input.sellOfferId,
        currency: input.currency,
        amount: input.amount,
        pricePerUnit: input.pricePerUnit,
        totalAmount,
        platformFee,
        processingFee,
        totalFees,
        status: SettlementStatus.COMPLETED,
        processedAt: new Date(),
        completedAt: new Date(),
        settlementRef: `SETT-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    await auditService.log({
      action: 'SETTLEMENT_CREATED',
      entityType: 'MatchingSettlement',
      entityId: settlement.id,
      userId: input.buyerId,
      metadata: {
        sellerId: input.sellerId,
        amount: input.amount.toString(),
        pricePerUnit: input.pricePerUnit.toString(),
        totalFees: totalFees.toString(),
      },
    });

    return this.mapToSettlement(settlement);
  }

  /**
   * Get buy requests for a user
   */
  async getBuyRequests(
    userId: number,
    status?: BuyRequestStatus
  ): Promise<BuyRequest[]> {
    const requests = await prisma.buyRequest.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => this.mapToBuyRequest(r));
  }

  /**
   * Get sell offers for a user
   */
  async getSellOffers(
    userId: number,
    status?: SellOfferStatus
  ): Promise<SellOffer[]> {
    const offers = await prisma.sellOffer.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return offers.map((o) => this.mapToSellOffer(o));
  }

  /**
   * Get settlements for a user
   */
  async getSettlements(
    userId: number,
    status?: SettlementStatus
  ): Promise<MatchingSettlement[]> {
    const settlements = await prisma.matchingSettlement.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return settlements.map((s) => this.mapToSettlement(s));
  }

  /**
   * Cancel a buy request
   */
  async cancelBuyRequest(requestId: string, userId: number): Promise<void> {
    const request = await prisma.buyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Buy request not found');
    }

    if (request.userId !== userId) {
      throw new Error('Not authorized to cancel this request');
    }

    if (request.status !== BuyRequestStatus.OPEN) {
      throw new Error('Only open requests can be cancelled');
    }

    await prisma.buyRequest.update({
      where: { id: requestId },
      data: { status: BuyRequestStatus.CANCELLED },
    });

    await auditService.log({
      action: 'BUY_REQUEST_CANCELLED',
      entityType: 'BuyRequest',
      entityId: requestId,
      userId,
    });
  }

  /**
   * Cancel a sell offer
   */
  async cancelSellOffer(offerId: string, userId: number): Promise<void> {
    const offer = await prisma.sellOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new Error('Sell offer not found');
    }

    if (offer.userId !== userId) {
      throw new Error('Not authorized to cancel this offer');
    }

    if (offer.status !== SellOfferStatus.OPEN) {
      throw new Error('Only open offers can be cancelled');
    }

    await prisma.sellOffer.update({
      where: { id: offerId },
      data: { status: SellOfferStatus.CANCELLED },
    });

    await auditService.log({
      action: 'SELL_OFFER_CANCELLED',
      entityType: 'SellOffer',
      entityId: offerId,
      userId,
    });
  }

  /**
   * Map Prisma model to BuyRequest interface
   */
  private mapToBuyRequest(request: PrismaBuyRequest): BuyRequest {
    return {
      id: request.id,
      userId: request.userId,
      currency: request.currency,
      amount: new Decimal(request.amount.toString()),
      maxPricePerUnit: new Decimal(request.maxPricePerUnit.toString()),
      totalMaxAmount: new Decimal(request.totalMaxAmount.toString()),
      status: request.status as BuyRequestStatus,
      priority: request.priority,
      matchedAmount: new Decimal(request.matchedAmount.toString()),
      matchedOfferIds: request.matchedOfferIds,
      expiresAt: request.expiresAt || undefined,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  /**
   * Map Prisma model to SellOffer interface
   */
  private mapToSellOffer(offer: PrismaSellOffer): SellOffer {
    return {
      id: offer.id,
      userId: offer.userId,
      currency: offer.currency,
      amount: new Decimal(offer.amount.toString()),
      minPricePerUnit: new Decimal(offer.minPricePerUnit.toString()),
      totalMinAmount: new Decimal(offer.totalMinAmount.toString()),
      status: offer.status as SellOfferStatus,
      priority: offer.priority,
      matchedAmount: new Decimal(offer.matchedAmount.toString()),
      matchedRequestIds: offer.matchedRequestIds,
      expiresAt: offer.expiresAt || undefined,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }

  /**
   * Map Prisma model to MatchingSettlement interface
   */
  private mapToSettlement(settlement: any): MatchingSettlement {
    return {
      id: settlement.id,
      buyerId: settlement.buyerId,
      sellerId: settlement.sellerId,
      buyRequestId: settlement.buyRequestId,
      sellOfferId: settlement.sellOfferId,
      currency: settlement.currency,
      amount: new Decimal(settlement.amount.toString()),
      pricePerUnit: new Decimal(settlement.pricePerUnit.toString()),
      totalAmount: new Decimal(settlement.totalAmount.toString()),
      platformFee: new Decimal(settlement.platformFee.toString()),
      processingFee: new Decimal(settlement.processingFee.toString()),
      totalFees: new Decimal(settlement.totalFees.toString()),
      status: settlement.status as SettlementStatus,
      processedAt: settlement.processedAt || undefined,
      completedAt: settlement.completedAt || undefined,
      settlementRef: settlement.settlementRef || undefined,
    };
  }
}

export const matchingService = new MatchingService();

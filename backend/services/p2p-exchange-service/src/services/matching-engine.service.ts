// ============================================================
// Matching Engine Service
// Automatic and manual matching of exchange requests
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  ExchangeStatus,
  MatchType,
  MatchStatus,
  SettlementMethod,
} from '../types/enums';
import {
  ExchangeMatch,
  MatchScore,
  CompatibleRequest,
  ManualAcceptInput,
} from '../types/exchange-match.types';
import {
  ExchangeRequestNotFoundError,
  InvalidExchangeStatusError,
  InsufficientSecurityDepositError,
} from '../errors/ExchangeErrors';

export class MatchingEngineService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run automatic matching algorithm
   * Called by cron job every 30 seconds
   */
  async runMatching(): Promise<number> {
    let matchCount = 0;

    // Get all open requests
    const openRequests = await this.prisma.exchangeRequest.findMany({
      where: {
        status: ExchangeStatus.OPEN,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Try to match each request
    for (const request of openRequests) {
      try {
        // Find compatible counter-requests
        const compatibleRequests = await this.findCompatibleRequests(request.id);

        if (compatibleRequests.length === 0) {
          continue;
        }

        // Calculate match scores
        const scoredRequests = compatibleRequests.map((counterRequest) => ({
          counterRequest,
          score: this.calculateMatchScore(request, counterRequest),
        }));

        // Sort by score (highest first)
        scoredRequests.sort((a, b) => b.score.minus(a.score).toNumber());

        // Try to create match with best candidate
        const bestMatch = scoredRequests[0];
        if (bestMatch.score.gte(70)) {
          // Minimum score threshold
          await this.createMatch(
            request.id,
            bestMatch.counterRequest.id,
            MatchType.AUTOMATIC,
            bestMatch.score
          );
          matchCount++;
        }
      } catch (error) {
        console.error(`Error matching request ${request.id}:`, error);
        // Continue with next request
      }
    }

    return matchCount;
  }

  /**
   * Find compatible counter-requests for a given request
   */
  async findCompatibleRequests(requestId: number): Promise<CompatibleRequest[]> {
    const request = await this.prisma.exchangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new ExchangeRequestNotFoundError(requestId);
    }

    // Find counter-requests with inverse currency pair
    const counterRequests = await this.prisma.exchangeRequest.findMany({
      where: {
        status: ExchangeStatus.OPEN,
        fromCurrency: request.toCurrency,
        toCurrency: request.fromCurrency,
        expiresAt: { gt: new Date() },
        userId: { not: request.userId }, // Can't match with self
      },
    });

    // Filter compatible requests
    const compatible: CompatibleRequest[] = [];

    for (const counterRequest of counterRequests) {
      // Check if amounts are compatible (within 10% tolerance)
      const requestToAmount = request.toAmount;
      const counterFromAmount = new Decimal(counterRequest.fromAmount);
      const amountDiff = requestToAmount
        .minus(counterFromAmount)
        .abs()
        .div(requestToAmount);

      if (amountDiff.lte(0.1)) {
        // Within 10% tolerance
        compatible.push({
          id: counterRequest.id,
          userId: counterRequest.userId,
          fromCurrency: counterRequest.fromCurrency,
          toCurrency: counterRequest.toCurrency,
          fromAmount: new Decimal(counterRequest.fromAmount),
          toAmount: new Decimal(counterRequest.toAmount),
          desiredRate: new Decimal(counterRequest.desiredRate),
          trustLevel: counterRequest.trustLevel,
          securityDeposit: new Decimal(counterRequest.securityDeposit),
          createdAt: counterRequest.createdAt,
        });
      }
    }

    return compatible;
  }

  /**
   * Calculate match score between two requests
   * Score: 0-100 (higher is better)
   */
  calculateMatchScore(
    request: any,
    counterRequest: CompatibleRequest
  ): Decimal {
    let score = new Decimal(0);

    // 1. Rate compatibility (40 points max)
    const requestRate = new Decimal(request.desiredRate);
    const counterRate = new Decimal(counterRequest.desiredRate);
    const inverseCounterRate = new Decimal(1).div(counterRate);
    const rateDiff = requestRate.minus(inverseCounterRate).abs().div(requestRate);

    if (rateDiff.lte(0.01)) {
      // Within 1%
      score = score.plus(40);
    } else if (rateDiff.lte(0.03)) {
      // Within 3%
      score = score.plus(30);
    } else if (rateDiff.lte(0.05)) {
      // Within 5%
      score = score.plus(20);
    } else {
      score = score.plus(10);
    }

    // 2. Amount compatibility (30 points max)
    const requestToAmount = new Decimal(request.toAmount);
    const counterFromAmount = counterRequest.fromAmount;
    const amountDiff = requestToAmount
      .minus(counterFromAmount)
      .abs()
      .div(requestToAmount);

    if (amountDiff.lte(0.01)) {
      // Within 1%
      score = score.plus(30);
    } else if (amountDiff.lte(0.05)) {
      // Within 5%
      score = score.plus(20);
    } else {
      score = score.plus(10);
    }

    // 3. Trust level compatibility (20 points max)
    const trustLevelDiff = Math.abs(request.trustLevel - counterRequest.trustLevel);
    if (trustLevelDiff === 0) {
      score = score.plus(20);
    } else if (trustLevelDiff === 1) {
      score = score.plus(15);
    } else if (trustLevelDiff === 2) {
      score = score.plus(10);
    } else {
      score = score.plus(5);
    }

    // 4. Time factor (10 points max)
    // Older requests get higher priority
    const requestAge = Date.now() - request.createdAt.getTime();
    const counterAge = Date.now() - counterRequest.createdAt.getTime();
    const avgAge = (requestAge + counterAge) / 2;
    const ageHours = avgAge / (1000 * 60 * 60);

    if (ageHours >= 24) {
      score = score.plus(10);
    } else if (ageHours >= 12) {
      score = score.plus(7);
    } else if (ageHours >= 6) {
      score = score.plus(5);
    } else {
      score = score.plus(3);
    }

    return score;
  }

  /**
   * Create a match between two requests
   */
  async createMatch(
    requestId: number,
    counterRequestId: number,
    matchType: MatchType,
    matchScore: Decimal
  ): Promise<ExchangeMatch> {
    // Validate both requests
    await this.validateMatch(requestId, counterRequestId);

    // Determine settlement method
    const request = await this.prisma.exchangeRequest.findUnique({
      where: { id: requestId },
    });
    const counterRequest = await this.prisma.exchangeRequest.findUnique({
      where: { id: counterRequestId },
    });

    let settlementMethod = SettlementMethod.INTERNAL;
    const maxAmount = Decimal.max(
      new Decimal(request!.fromAmount),
      new Decimal(counterRequest!.fromAmount)
    );

    if (maxAmount.gte(5000)) {
      settlementMethod = SettlementMethod.EXTERNAL_MANDATORY;
    } else if (request!.protectionFee || counterRequest!.protectionFee) {
      settlementMethod = SettlementMethod.EXTERNAL_OPTIONAL;
    }

    // Create match in transaction
    const match = await this.prisma.$transaction(async (tx) => {
      // Update request statuses
      await tx.exchangeRequest.update({
        where: { id: requestId },
        data: {
          status: ExchangeStatus.MATCHED,
          matchedAt: new Date(),
        },
      });

      await tx.exchangeRequest.update({
        where: { id: counterRequestId },
        data: {
          status: ExchangeStatus.MATCHED,
          matchedAt: new Date(),
        },
      });

      // Create match record
      const createdMatch = await tx.exchangeMatch.create({
        data: {
          requestId,
          counterRequestId,
          matchType,
          matchScore,
          status: MatchStatus.PENDING,
          settlementMethod,
        },
      });

      // TODO: Lock escrow (internal or external)
      // TODO: Notify both users
      // TODO: Start timeout timer

      return createdMatch;
    });

    return this.mapToExchangeMatch(match);
  }

  /**
   * Manual accept - user accepts a marketplace offer
   */
  async manualAccept(input: ManualAcceptInput): Promise<ExchangeMatch> {
    const { userId, requestId, counterRequestId } = input;

    // Verify user owns the request
    const request = await this.prisma.exchangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Validate match
    await this.validateMatch(requestId, counterRequestId);

    // Calculate match score
    const counterRequest = await this.prisma.exchangeRequest.findUnique({
      where: { id: counterRequestId },
    });

    const matchScore = this.calculateMatchScore(request, {
      id: counterRequest!.id,
      userId: counterRequest!.userId,
      fromCurrency: counterRequest!.fromCurrency,
      toCurrency: counterRequest!.toCurrency,
      fromAmount: new Decimal(counterRequest!.fromAmount),
      toAmount: new Decimal(counterRequest!.toAmount),
      desiredRate: new Decimal(counterRequest!.desiredRate),
      trustLevel: counterRequest!.trustLevel,
      securityDeposit: new Decimal(counterRequest!.securityDeposit),
      createdAt: counterRequest!.createdAt,
    });

    // Create match
    return this.createMatch(
      requestId,
      counterRequestId,
      MatchType.MANUAL,
      matchScore
    );
  }

  /**
   * Validate that two requests can be matched
   */
  async validateMatch(
    requestId: number,
    counterRequestId: number
  ): Promise<void> {
    // Get both requests
    const request = await this.prisma.exchangeRequest.findUnique({
      where: { id: requestId },
    });
    const counterRequest = await this.prisma.exchangeRequest.findUnique({
      where: { id: counterRequestId },
    });

    if (!request) {
      throw new ExchangeRequestNotFoundError(requestId);
    }
    if (!counterRequest) {
      throw new ExchangeRequestNotFoundError(counterRequestId);
    }

    // Check status
    if (request.status !== ExchangeStatus.OPEN) {
      throw new InvalidExchangeStatusError(requestId, request.status, 'OPEN');
    }
    if (counterRequest.status !== ExchangeStatus.OPEN) {
      throw new InvalidExchangeStatusError(
        counterRequestId,
        counterRequest.status,
        'OPEN'
      );
    }

    // Check expiration
    const now = new Date();
    if (request.expiresAt <= now) {
      throw new Error(`Request ${requestId} has expired`);
    }
    if (counterRequest.expiresAt <= now) {
      throw new Error(`Request ${counterRequestId} has expired`);
    }

    // Check currency pair compatibility
    if (
      request.fromCurrency !== counterRequest.toCurrency ||
      request.toCurrency !== counterRequest.fromCurrency
    ) {
      throw new Error('Currency pairs are not compatible');
    }

    // Check security deposits
    const requestDeposit = new Decimal(request.securityDeposit);
    const counterDeposit = new Decimal(counterRequest.securityDeposit);
    const requestAmount = new Decimal(request.fromAmount);
    const counterAmount = new Decimal(counterRequest.fromAmount);

    if (requestDeposit.lt(requestAmount.mul(0.1))) {
      throw new InsufficientSecurityDepositError(
        request.userId,
        requestDeposit,
        requestAmount.mul(0.1)
      );
    }
    if (counterDeposit.lt(counterAmount.mul(0.1))) {
      throw new InsufficientSecurityDepositError(
        counterRequest.userId,
        counterDeposit,
        counterAmount.mul(0.1)
      );
    }

    // Check if already matched
    const existingMatch = await this.prisma.exchangeMatch.findFirst({
      where: {
        OR: [
          { requestId },
          { counterRequestId: requestId },
          { requestId: counterRequestId },
          { counterRequestId },
        ],
      },
    });

    if (existingMatch) {
      throw new Error('One or both requests are already matched');
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private mapToExchangeMatch(data: any): ExchangeMatch {
    return {
      id: data.id,
      requestId: data.requestId,
      counterRequestId: data.counterRequestId,
      matchType: data.matchType,
      matchScore: new Decimal(data.matchScore),
      status: data.status,
      escrowHoldId: data.escrowHoldId,
      externalEscrowId: data.externalEscrowId,
      settlementMethod: data.settlementMethod,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

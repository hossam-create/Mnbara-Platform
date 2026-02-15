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

// Cache for request lookups to avoid repeated queries
interface RequestCache {
  [key: number]: any;
}

export class MatchingEngineService {
  private requestCache: RequestCache = {};
  private cacheExpiry: number = 5000; // 5 seconds
  private lastCacheTime: number = 0;

  constructor(private prisma: PrismaClient) {}

  /**
   * Run automatic matching algorithm (OPTIMIZED)
   * Called by cron job every 30 seconds
   * Performance target: < 5 seconds for 1000+ requests
   */
  async runMatching(): Promise<number> {
    const startTime = Date.now();
    let matchCount = 0;

    // Clear cache if expired
    if (Date.now() - this.lastCacheTime > this.cacheExpiry) {
      this.requestCache = {};
      this.lastCacheTime = Date.now();
    }

    // Get all open requests with minimal data (optimized query)
    const openRequests = await this.prisma.exchangeRequest.findMany({
      where: {
        status: ExchangeStatus.OPEN,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
        fromCurrency: true,
        toCurrency: true,
        fromAmount: true,
        toAmount: true,
        desiredRate: true,
        trustLevel: true,
        securityDeposit: true,
        protectionFee: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 500, // Limit to prevent timeout
    });

    // Group requests by currency pair for faster lookup
    const requestsByPair = this.groupRequestsByPair(openRequests);

    // Try to match each request
    for (const request of openRequests) {
      try {
        // Skip if already matched in this run
        if (this.requestCache[request.id]?.matched) {
          continue;
        }

        // Find compatible counter-requests (optimized)
        const compatibleRequests = this.findCompatibleRequestsSync(
          request,
          requestsByPair
        );

        if (compatibleRequests.length === 0) {
          continue;
        }

        // Calculate match scores (optimized)
        const bestMatch = this.findBestMatch(request, compatibleRequests);

        if (bestMatch && bestMatch.score >= 70) {
          // Minimum score threshold
          await this.createMatch(
            request.id,
            bestMatch.counterRequest.id,
            MatchType.AUTOMATIC,
            new Decimal(bestMatch.score)
          );

          // Mark both as matched in cache
          this.requestCache[request.id] = { matched: true };
          this.requestCache[bestMatch.counterRequest.id] = { matched: true };

          matchCount++;
        }
      } catch (error) {
        console.error(`Error matching request ${request.id}:`, error);
        // Continue with next request
      }

      // Check timeout to prevent exceeding 5 seconds
      if (Date.now() - startTime > 4500) {
        console.warn(
          `Matching engine timeout: processed ${matchCount} matches in ${Date.now() - startTime}ms`
        );
        break;
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `Matching engine completed: ${matchCount} matches in ${duration}ms`
    );

    return matchCount;
  }

  /**
   * Group requests by currency pair for O(1) lookup
   */
  private groupRequestsByPair(
    requests: any[]
  ): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    for (const request of requests) {
      const pair = `${request.fromCurrency}-${request.toCurrency}`;
      if (!grouped.has(pair)) {
        grouped.set(pair, []);
      }
      grouped.get(pair)!.push(request);
    }

    return grouped;
  }

  /**
   * Find compatible counter-requests (OPTIMIZED - synchronous)
   * Uses in-memory filtering instead of database queries
   */
  private findCompatibleRequestsSync(
    request: any,
    requestsByPair: Map<string, any[]>
  ): CompatibleRequest[] {
    // Look for inverse currency pair
    const inversePair = `${request.toCurrency}-${request.fromCurrency}`;
    const counterRequests = requestsByPair.get(inversePair) || [];

    const compatible: CompatibleRequest[] = [];
    const requestToAmount = Number(request.toAmount);
    const tolerance = requestToAmount * 0.1; // 10% tolerance

    for (const counterRequest of counterRequests) {
      // Skip self-matches
      if (counterRequest.userId === request.userId) {
        continue;
      }

      // Skip if already matched in this run
      if (this.requestCache[counterRequest.id]?.matched) {
        continue;
      }

      // Fast numeric comparison (avoid Decimal for this check)
      const counterFromAmount = Number(counterRequest.fromAmount);
      const amountDiff = Math.abs(requestToAmount - counterFromAmount);

      if (amountDiff <= tolerance) {
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
   * Find best match from compatible requests (OPTIMIZED)
   * Returns early without calculating all scores
   */
  private findBestMatch(
    request: any,
    compatibleRequests: CompatibleRequest[]
  ): { counterRequest: CompatibleRequest; score: number } | null {
    let bestMatch: { counterRequest: CompatibleRequest; score: number } | null =
      null;
    let bestScore = 0;

    for (const counterRequest of compatibleRequests) {
      const score = this.calculateMatchScoreFast(request, counterRequest);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { counterRequest, score };
      }

      // Early exit if perfect score
      if (score >= 95) {
        break;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score (OPTIMIZED - fast numeric version)
   * Uses integers instead of Decimal for speed
   */
  private calculateMatchScoreFast(request: any, counterRequest: CompatibleRequest): number {
    let score = 0;

    // 1. Rate compatibility (40 points max) - fast numeric comparison
    const requestRate = Number(request.desiredRate);
    const counterRate = Number(counterRequest.desiredRate);
    const inverseCounterRate = 1 / counterRate;
    const rateDiff = Math.abs(requestRate - inverseCounterRate) / requestRate;

    if (rateDiff <= 0.01) {
      score += 40;
    } else if (rateDiff <= 0.03) {
      score += 30;
    } else if (rateDiff <= 0.05) {
      score += 20;
    } else {
      score += 10;
    }

    // 2. Amount compatibility (30 points max) - fast numeric comparison
    const requestToAmount = Number(request.toAmount);
    const counterFromAmount = Number(counterRequest.fromAmount);
    const amountDiff = Math.abs(requestToAmount - counterFromAmount) / requestToAmount;

    if (amountDiff <= 0.01) {
      score += 30;
    } else if (amountDiff <= 0.05) {
      score += 20;
    } else {
      score += 10;
    }

    // 3. Trust level compatibility (20 points max)
    const trustLevelDiff = Math.abs(request.trustLevel - counterRequest.trustLevel);
    if (trustLevelDiff === 0) {
      score += 20;
    } else if (trustLevelDiff === 1) {
      score += 15;
    } else if (trustLevelDiff === 2) {
      score += 10;
    } else {
      score += 5;
    }

    // 4. Time factor (10 points max) - older requests get priority
    const requestAge = Date.now() - request.createdAt.getTime();
    const counterAge = Date.now() - counterRequest.createdAt.getTime();
    const avgAge = (requestAge + counterAge) / 2;
    const ageHours = avgAge / (1000 * 60 * 60);

    if (ageHours >= 24) {
      score += 10;
    } else if (ageHours >= 12) {
      score += 7;
    } else if (ageHours >= 6) {
      score += 5;
    } else {
      score += 3;
    }

    return score;
  }

  /**
   * Find compatible counter-requests for a given request (LEGACY - for manual accept)
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
   * Calculate match score between two requests (LEGACY - uses Decimal)
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
        request.fromCurrency,
        requestAmount.mul(0.1).toString(),
        requestDeposit.toString()
      );
    }
    if (counterDeposit.lt(counterAmount.mul(0.1))) {
      throw new InsufficientSecurityDepositError(
        counterRequest.userId,
        counterRequest.fromCurrency,
        counterAmount.mul(0.1).toString(),
        counterDeposit.toString()
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

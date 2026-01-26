// ============================================================
// Exchange Request Service
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  ExchangeRequest,
  CreateExchangeRequestInput,
  UpdateExchangeRequestInput,
  RequestFilters,
  CreateRequestResult,
} from '../types/exchange-request.types';
import { ExchangeStatus } from '../types/enums';
import {
  ExchangeRequestNotFoundError,
  InvalidExchangeStatusError,
  ExchangeRequestExpiredError,
  InvalidAmountError,
  InvalidCurrencyPairError,
} from '../errors/ExchangeErrors';

export class ExchangeRequestService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create new exchange request
   */
  async createRequest(input: CreateExchangeRequestInput): Promise<CreateRequestResult> {
    // Validate input
    this.validateCreateInput(input);

    // Calculate toAmount based on desiredRate or market rate
    const rate = input.desiredRate || new Decimal(1); // TODO: Get from FX provider
    const toAmount = input.fromAmount.mul(rate);

    // Calculate fees
    const platformFee = this.calculatePlatformFee(input.fromAmount);
    const protectionFee = new Decimal(2); // TODO: Calculate based on amount

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + input.expiresIn);

    // Get user's trust level (TODO: from TrustLevelService)
    const trustLevel = 1;

    // Get security deposit requirement (TODO: from SecurityDepositService)
    const securityDeposit = new Decimal(10);

    // Create request
    const request = await this.prisma.exchangeRequest.create({
      data: {
        userId: input.userId,
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        fromAmount: input.fromAmount,
        toAmount,
        desiredRate: input.desiredRate || rate,
        platformFee,
        protectionFee: input.useExternalEscrow ? protectionFee : null,
        status: ExchangeStatus.OPEN,
        trustLevel,
        securityDeposit,
        expiresAt,
      },
    });

    // Estimate match time (TODO: based on market depth)
    const estimatedMatchTime = 30; // minutes

    return {
      request: this.mapToExchangeRequest(request),
      estimatedMatchTime,
    };
  }

  /**
   * Get request by ID
   */
  async getRequest(requestId: number): Promise<ExchangeRequest> {
    const request = await this.prisma.exchangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new ExchangeRequestNotFoundError(requestId);
    }

    return this.mapToExchangeRequest(request);
  }

  /**
   * Get user's requests
   */
  async getUserRequests(
    userId: number,
    filters?: RequestFilters
  ): Promise<ExchangeRequest[]> {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.fromCurrency) {
      where.fromCurrency = filters.fromCurrency;
    }
    if (filters?.toCurrency) {
      where.toCurrency = filters.toCurrency;
    }

    const requests = await this.prisma.exchangeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.page ? (filters.page - 1) * (filters.limit || 50) : 0,
    });

    return requests.map(this.mapToExchangeRequest);
  }

  /**
   * Get open requests (marketplace)
   */
  async getOpenRequests(filters?: RequestFilters): Promise<ExchangeRequest[]> {
    const where: any = { status: ExchangeStatus.OPEN };

    if (filters?.fromCurrency) {
      where.fromCurrency = filters.fromCurrency;
    }
    if (filters?.toCurrency) {
      where.toCurrency = filters.toCurrency;
    }
    if (filters?.minAmount) {
      where.fromAmount = { gte: filters.minAmount };
    }
    if (filters?.maxAmount) {
      where.fromAmount = { ...where.fromAmount, lte: filters.maxAmount };
    }
    if (filters?.minTrustLevel) {
      where.trustLevel = { gte: filters.minTrustLevel };
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (filters?.sortBy === 'rate') {
      orderBy = { desiredRate: filters.sortOrder || 'asc' };
    } else if (filters?.sortBy === 'amount') {
      orderBy = { fromAmount: filters.sortOrder || 'desc' };
    }

    const requests = await this.prisma.exchangeRequest.findMany({
      where,
      orderBy,
      take: filters?.limit || 50,
      skip: filters?.page ? (filters.page - 1) * (filters.limit || 50) : 0,
    });

    return requests.map(this.mapToExchangeRequest);
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: number, userId: number): Promise<void> {
    const request = await this.getRequest(requestId);

    // Verify ownership
    if (request.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Verify status
    if (![ExchangeStatus.OPEN, ExchangeStatus.MATCHED].includes(request.status)) {
      throw new InvalidExchangeStatusError(
        requestId,
        request.status,
        'OPEN or MATCHED'
      );
    }

    // Update status
    await this.prisma.exchangeRequest.update({
      where: { id: requestId },
      data: { status: ExchangeStatus.CANCELLED },
    });

    // TODO: Release escrow if MATCHED
    // TODO: Notify counter-party if MATCHED
  }

  /**
   * Update request status
   */
  async updateStatus(requestId: number, status: ExchangeStatus): Promise<void> {
    await this.prisma.exchangeRequest.update({
      where: { id: requestId },
      data: {
        status,
        matchedAt: status === ExchangeStatus.MATCHED ? new Date() : undefined,
        completedAt: status === ExchangeStatus.COMPLETED ? new Date() : undefined,
      },
    });
  }

  /**
   * Check and expire old requests
   */
  async expireOldRequests(): Promise<void> {
    const now = new Date();

    const expiredRequests = await this.prisma.exchangeRequest.findMany({
      where: {
        status: ExchangeStatus.OPEN,
        expiresAt: { lte: now },
      },
    });

    for (const request of expiredRequests) {
      await this.prisma.exchangeRequest.update({
        where: { id: request.id },
        data: { status: ExchangeStatus.EXPIRED },
      });

      // TODO: Notify user
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private validateCreateInput(input: CreateExchangeRequestInput): void {
    // Validate amount
    if (input.fromAmount.lte(0)) {
      throw new InvalidAmountError(
        input.fromAmount.toString(),
        'Amount must be positive'
      );
    }

    // Validate currencies
    if (input.fromCurrency === input.toCurrency) {
      throw new InvalidCurrencyPairError(input.fromCurrency, input.toCurrency);
    }

    // Validate expiration
    if (input.expiresIn < 1 || input.expiresIn > 168) {
      throw new Error('Expiration must be between 1 and 168 hours');
    }
  }

  private calculatePlatformFee(amount: Decimal): Decimal {
    // Fee structure:
    // < $300: 1.5%
    // $300 - $1000: 1.0%
    // > $1000: 0.5%
    if (amount.lt(300)) {
      return amount.mul(0.015);
    } else if (amount.lt(1000)) {
      return amount.mul(0.01);
    } else {
      return amount.mul(0.005);
    }
  }

  private mapToExchangeRequest(data: any): ExchangeRequest {
    return {
      id: data.id,
      userId: data.userId,
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      fromAmount: new Decimal(data.fromAmount),
      toAmount: new Decimal(data.toAmount),
      desiredRate: new Decimal(data.desiredRate),
      actualRate: data.actualRate ? new Decimal(data.actualRate) : null,
      platformFee: new Decimal(data.platformFee),
      protectionFee: data.protectionFee ? new Decimal(data.protectionFee) : null,
      status: data.status,
      trustLevel: data.trustLevel,
      securityDeposit: new Decimal(data.securityDeposit),
      expiresAt: data.expiresAt,
      matchedAt: data.matchedAt,
      completedAt: data.completedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferStatus, MatchType, MatchStatus } from '@prisma/client';

@Injectable()
export class MatchingEngineService implements OnModuleDestroy {
  private readonly logger = new Logger(MatchingEngineService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly MATCH_INTERVAL = 5000;

  constructor(private readonly prisma: PrismaService) {}

  onModuleDestroy() {
    this.stop();
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.processMatching(), this.MATCH_INTERVAL);
    this.logger.log('🔄 Matching Engine started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.logger.log('⏹️ Matching Engine stopped');
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  private async processMatching() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingRequests = await this.prisma.transferRequest.findMany({
        where: {
          status: { in: [TransferStatus.PENDING, TransferStatus.MATCHING] },
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      for (const request of pendingRequests) {
        await this.findMatchesForRequest(request);
      }

      await this.cleanupExpiredRequests();
    } catch (error) {
      this.logger.error('Matching error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async findMatchesForRequest(request: any) {
    const counterRequests = await this.prisma.transferRequest.findMany({
      where: {
        id: { not: request.id },
        status: { in: [TransferStatus.PENDING, TransferStatus.MATCHING] },
        expiresAt: { gt: new Date() },
        senderCountry: request.recipientCountry,
        recipientCountry: request.senderCountry,
        senderCurrency: request.recipientCurrency,
        recipientCurrency: request.senderCurrency,
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const counter of counterRequests) {
      const matchScore = this.calculateMatchScore(request, counter);
      if (matchScore >= 70) {
        await this.createMatch(request, counter, matchScore);
      }
    }
  }

  private calculateMatchScore(request: any, counter: any): number {
    let score = 0;

    const requestAmount = Number(request.sendAmount);
    const counterReceive = Number(counter.receiveAmount);
    const amountDiff = Math.abs(requestAmount - counterReceive) / requestAmount;

    if (amountDiff === 0) score += 40;
    else if (amountDiff <= 0.1) score += 35;
    else if (amountDiff <= 0.25) score += 25;
    else if (amountDiff <= 0.5) score += 15;

    const timeDiff = Math.abs(
      new Date(request.createdAt).getTime() - new Date(counter.createdAt).getTime(),
    );
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff <= 1) score += 30;
    else if (hoursDiff <= 6) score += 25;
    else if (hoursDiff <= 24) score += 15;
    else score += 5;

    if (request.senderCountry === counter.recipientCountry &&
        request.recipientCountry === counter.senderCountry) {
      score += 30;
    }

    return Math.min(score, 100);
  }

  private async createMatch(request: any, counter: any, matchScore: number) {
    const existingMatch = await this.prisma.settlementMatch.findUnique({
      where: {
        requestId_counterRequestId: {
          requestId: request.id,
          counterRequestId: counter.id,
        },
      },
    });

    if (existingMatch) return;

    const requestAmount = Number(request.sendAmount);
    const counterReceive = Number(counter.receiveAmount);
    let matchType: MatchType;
    let matchedAmount: number;

    if (Math.abs(requestAmount - counterReceive) / requestAmount <= 0.01) {
      matchType = MatchType.EXACT;
      matchedAmount = requestAmount;
    } else if (requestAmount < counterReceive) {
      matchType = MatchType.PARTIAL;
      matchedAmount = requestAmount;
    } else {
      matchType = MatchType.PARTIAL;
      matchedAmount = counterReceive;
    }

    await this.prisma.settlementMatch.create({
      data: {
        requestId: request.id,
        counterRequestId: counter.id,
        matchScore,
        matchType,
        matchedAmount,
        remainingAmount: Math.abs(requestAmount - counterReceive),
        status: MatchStatus.PROPOSED,
      },
    });

    await this.prisma.transferRequest.updateMany({
      where: { id: { in: [request.id, counter.id] } },
      data: { status: TransferStatus.MATCHING },
    });

    this.logger.log(`✅ Match found: ${request.id} <-> ${counter.id} (Score: ${matchScore})`);
  }

  private async cleanupExpiredRequests() {
    await this.prisma.transferRequest.updateMany({
      where: {
        status: { in: [TransferStatus.PENDING, TransferStatus.MATCHING] },
        expiresAt: { lt: new Date() },
      },
      data: { status: TransferStatus.EXPIRED },
    });
  }

  async executeMatch(matchId: string) {
    const match = await this.prisma.settlementMatch.findUnique({
      where: { id: matchId },
      include: { request: true, counterRequest: true },
    });

    if (!match || match.status !== MatchStatus.ACCEPTED) {
      throw new Error('Match not found or not accepted');
    }

    await this.prisma.settlementMatch.update({
      where: { id: matchId },
      data: { status: MatchStatus.EXECUTING },
    });

    await this.prisma.settlementLedger.create({
      data: {
        matchId,
        senderId: match.request.senderId,
        recipientId: match.counterRequest.senderId,
        sentAmount: match.matchedAmount,
        sentCurrency: match.request.senderCurrency,
        receivedAmount: match.matchedAmount,
        receivedCurrency: match.request.recipientCurrency,
        exchangeRate: match.request.exchangeRate,
        platformFee: match.request.platformFee,
        status: 'PROCESSING',
      },
    });

    await this.prisma.transferRequest.updateMany({
      where: { id: { in: [match.requestId, match.counterRequestId] } },
      data: { status: TransferStatus.PROCESSING, matchedAt: new Date() },
    });

    return match;
  }

  async completeSettlement(matchId: string) {
    const match = await this.prisma.settlementMatch.update({
      where: { id: matchId },
      data: { status: MatchStatus.COMPLETED, executedAt: new Date() },
    });

    await this.prisma.settlementLedger.updateMany({
      where: { matchId },
      data: { status: 'SETTLED', settledAt: new Date() },
    });

    await this.prisma.transferRequest.updateMany({
      where: { id: { in: [match.requestId, match.counterRequestId] } },
      data: { status: TransferStatus.COMPLETED, completedAt: new Date() },
    });

    const request = await this.prisma.transferRequest.findUnique({
      where: { id: match.requestId },
    });

    if (request) {
      await this.prisma.transferCorridor.updateMany({
        where: { fromCountry: request.senderCountry, toCountry: request.recipientCountry },
        data: {
          totalTransfers: { increment: 1 },
          totalVolume: { increment: Number(match.matchedAmount) },
        },
      });
    }

    return match;
  }
}

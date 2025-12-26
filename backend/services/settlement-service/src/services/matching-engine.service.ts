import { PrismaClient, TransferStatus, MatchType, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchCandidate {
  requestId: string;
  counterRequestId: string;
  matchScore: number;
  matchType: MatchType;
  matchedAmount: number;
}

/**
 * محرك المطابقة اللحظية
 * يبحث عن طلبات تحويل متعاكسة ويطابقها
 */
export class MatchingEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly MATCH_INTERVAL = 5000; // 5 ثواني

  /**
   * بدء محرك المطابقة
   */
  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.processMatching();
    }, this.MATCH_INTERVAL);

    console.log('🔄 Matching Engine started');
  }

  /**
   * إيقاف محرك المطابقة
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('⏹️ Matching Engine stopped');
  }

  /**
   * التحقق من حالة المحرك
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * معالجة المطابقات
   */
  private async processMatching() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // الحصول على الطلبات المعلقة
      const pendingRequests = await prisma.transferRequest.findMany({
        where: {
          status: { in: [TransferStatus.PENDING, TransferStatus.MATCHING] },
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'asc' },
        take: 100
      });

      for (const request of pendingRequests) {
        await this.findMatchesForRequest(request);
      }

      // تنظيف الطلبات المنتهية
      await this.cleanupExpiredRequests();

    } catch (error) {
      console.error('Matching error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * البحث عن مطابقات لطلب معين
   */
  private async findMatchesForRequest(request: any) {
    // البحث عن طلبات معاكسة
    // مثال: شخص يريد إرسال USD من أمريكا إلى مصر (EGP)
    // نبحث عن شخص يريد إرسال EGP من مصر إلى أمريكا (USD)
    
    const counterRequests = await prisma.transferRequest.findMany({
      where: {
        id: { not: request.id },
        status: { in: [TransferStatus.PENDING, TransferStatus.MATCHING] },
        expiresAt: { gt: new Date() },
        // الاتجاه المعاكس
        senderCountry: request.recipientCountry,
        recipientCountry: request.senderCountry,
        senderCurrency: request.recipientCurrency,
        recipientCurrency: request.senderCurrency
      },
      orderBy: { createdAt: 'asc' }
    });

    for (const counter of counterRequests) {
      const matchScore = this.calculateMatchScore(request, counter);
      
      if (matchScore >= 70) { // الحد الأدنى للمطابقة
        await this.createMatch(request, counter, matchScore);
      }
    }
  }

  /**
   * حساب نسبة التطابق
   */
  private calculateMatchScore(request: any, counter: any): number {
    let score = 0;

    // تطابق المبلغ (40 نقطة)
    const requestAmount = Number(request.sendAmount);
    const counterReceive = Number(counter.receiveAmount);
    const amountDiff = Math.abs(requestAmount - counterReceive) / requestAmount;
    
    if (amountDiff === 0) {
      score += 40; // تطابق تام
    } else if (amountDiff <= 0.1) {
      score += 35; // فرق 10%
    } else if (amountDiff <= 0.25) {
      score += 25; // فرق 25%
    } else if (amountDiff <= 0.5) {
      score += 15; // فرق 50%
    }

    // تطابق التوقيت (30 نقطة)
    const timeDiff = Math.abs(
      new Date(request.createdAt).getTime() - new Date(counter.createdAt).getTime()
    );
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff <= 1) {
      score += 30;
    } else if (hoursDiff <= 6) {
      score += 25;
    } else if (hoursDiff <= 24) {
      score += 15;
    } else {
      score += 5;
    }

    // تطابق الممر (30 نقطة)
    if (request.senderCountry === counter.recipientCountry &&
        request.recipientCountry === counter.senderCountry) {
      score += 30;
    }

    return Math.min(score, 100);
  }

  /**
   * إنشاء مطابقة
   */
  private async createMatch(request: any, counter: any, matchScore: number) {
    // التحقق من عدم وجود مطابقة سابقة
    const existingMatch = await prisma.settlementMatch.findUnique({
      where: {
        requestId_counterRequestId: {
          requestId: request.id,
          counterRequestId: counter.id
        }
      }
    });

    if (existingMatch) return;

    // تحديد نوع المطابقة
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

    // إنشاء المطابقة
    await prisma.settlementMatch.create({
      data: {
        requestId: request.id,
        counterRequestId: counter.id,
        matchScore,
        matchType,
        matchedAmount,
        remainingAmount: Math.abs(requestAmount - counterReceive),
        status: MatchStatus.PROPOSED
      }
    });

    // تحديث حالة الطلبات
    await prisma.transferRequest.updateMany({
      where: { id: { in: [request.id, counter.id] } },
      data: { status: TransferStatus.MATCHING }
    });

    console.log(`✅ Match found: ${request.id} <-> ${counter.id} (Score: ${matchScore})`);
  }

  /**
   * تنظيف الطلبات المنتهية
   */
  private async cleanupExpiredRequests() {
    await prisma.transferRequest.updateMany({
      where: {
        status: { in: [TransferStatus.PENDING, TransferStatus.MATCHING] },
        expiresAt: { lt: new Date() }
      },
      data: { status: TransferStatus.EXPIRED }
    });
  }

  /**
   * تنفيذ مطابقة مقبولة
   */
  async executeMatch(matchId: string) {
    const match = await prisma.settlementMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true
      }
    });

    if (!match || match.status !== MatchStatus.ACCEPTED) {
      throw new Error('Match not found or not accepted');
    }

    // تحديث حالة المطابقة
    await prisma.settlementMatch.update({
      where: { id: matchId },
      data: { status: MatchStatus.EXECUTING }
    });

    // إنشاء سجل في دفتر الأستاذ
    await prisma.settlementLedger.create({
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
        status: 'PROCESSING'
      }
    });

    // تحديث حالة الطلبات
    await prisma.transferRequest.updateMany({
      where: { id: { in: [match.requestId, match.counterRequestId] } },
      data: { 
        status: TransferStatus.PROCESSING,
        matchedAt: new Date()
      }
    });

    return match;
  }

  /**
   * إكمال التسوية
   */
  async completeSettlement(matchId: string) {
    const match = await prisma.settlementMatch.update({
      where: { id: matchId },
      data: { 
        status: MatchStatus.COMPLETED,
        executedAt: new Date()
      }
    });

    // تحديث دفتر الأستاذ
    await prisma.settlementLedger.updateMany({
      where: { matchId },
      data: { 
        status: 'SETTLED',
        settledAt: new Date()
      }
    });

    // تحديث الطلبات
    await prisma.transferRequest.updateMany({
      where: { id: { in: [match.requestId, match.counterRequestId] } },
      data: { 
        status: TransferStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    // تحديث إحصائيات الممر
    const request = await prisma.transferRequest.findUnique({
      where: { id: match.requestId }
    });

    if (request) {
      await prisma.transferCorridor.updateMany({
        where: {
          fromCountry: request.senderCountry,
          toCountry: request.recipientCountry
        },
        data: {
          totalTransfers: { increment: 1 },
          totalVolume: { increment: Number(match.matchedAmount) }
        }
      });
    }

    return match;
  }
}

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface PlatformOrderData {
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  totalAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency?: string;
  items?: any[];
  shippingAddress?: any;
  billingAddress?: any;
  notes?: string;
}

export interface PlatformCommissionData {
  orderId: string;
  commissionType: 'PLATFORM_FEE' | 'SERVICE_FEE' | 'TRANSACTION_FEE' | 'REFERRAL_BONUS';
  commissionRate: number;
  baseAmount: number;
  commissionAmount: number;
  recipientType: 'PLATFORM' | 'SELLER' | 'REFERRER';
  recipientId?: string;
  description?: string;
}

export interface PlatformRefundData {
  orderId: string;
  refundNumber: string;
  originalAmount: number;
  refundAmount: number;
  refundReason: string;
  refundType: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'CHARGEBACK';
  notes?: string;
}

export interface PlatformPayoutData {
  payoutNumber: string;
  recipientType: 'SELLER' | 'AFFILIATE' | 'EMPLOYEE' | 'VENDOR';
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  payoutAmount: number;
  payoutMethod: 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE' | 'CHECK';
  bankAccount?: any;
  scheduledDate?: Date;
  notes?: string;
}

export class PlatformEventService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Handle order completion event
   */
  async handleOrderCompleted(
    businessAccountId: string,
    orderData: PlatformOrderData,
    userId: string
  ): Promise<any> {
    try {
      // Create platform order record
      const order = await this.prisma.platformOrder.create({
        data: {
          businessAccountId,
          orderNumber: orderData.orderNumber,
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          totalAmount: orderData.totalAmount,
          commissionAmount: orderData.commissionAmount,
          netAmount: orderData.netAmount,
          currency: orderData.currency || 'USD',
          status: 'COMPLETED',
          orderDate: new Date(),
          completedAt: new Date(),
          items: orderData.items || [],
          shippingAddress: orderData.shippingAddress || {},
          billingAddress: orderData.billingAddress || {},
          notes: orderData.notes
        }
      });

      // Create platform event for order completion
      const eventId = await this.createPlatformEvent(
        businessAccountId,
        'ORDER_COMPLETED',
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          commissionAmount: order.commissionAmount,
          netAmount: order.netAmount,
          customerName: order.customerName,
          completedAt: order.completedAt
        },
        'PLATFORM',
        order.id,
        'ORDER',
        order.id
      );

      // Process the event to create journal entry
      await this.processPlatformEvent(eventId);

      // If commission amount > 0, create commission event
      if (order.commissionAmount > 0) {
        await this.handleCommissionEarned(
          businessAccountId,
          {
            orderId: order.id,
            commissionType: 'PLATFORM_FEE',
            commissionRate: order.commissionAmount / order.totalAmount,
            baseAmount: order.totalAmount,
            commissionAmount: order.commissionAmount,
            recipientType: 'PLATFORM',
            description: `Platform commission for order ${order.orderNumber}`
          },
          userId
        );
      }

      logger.info(`Order completion event processed: ${order.orderNumber}`, {
        orderId: order.id,
        businessAccountId,
        totalAmount: order.totalAmount,
        commissionAmount: order.commissionAmount,
        userId
      });

      return order;
    } catch (error) {
      logger.error('Failed to handle order completion event:', error);
      throw error;
    }
  }

  /**
   * Handle commission earned event
   */
  async handleCommissionEarned(
    businessAccountId: string,
    commissionData: PlatformCommissionData,
    userId: string
  ): Promise<any> {
    try {
      // Create commission record
      const commission = await this.prisma.platformCommission.create({
        data: {
          businessAccountId,
          orderId: commissionData.orderId,
          commissionType: commissionData.commissionType,
          commissionRate: commissionData.commissionRate,
          baseAmount: commissionData.baseAmount,
          commissionAmount: commissionData.commissionAmount,
          currency: 'USD',
          status: 'PENDING',
          calculatedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          recipientType: commissionData.recipientType,
          recipientId: commissionData.recipientId,
          description: commissionData.description
        }
      });

      // Create platform event for commission
      const eventId = await this.createPlatformEvent(
        businessAccountId,
        'COMMISSION_EARNED',
        {
          commissionId: commission.id,
          orderId: commission.orderId,
          commissionType: commission.commissionType,
          commissionAmount: commission.commissionAmount,
          baseAmount: commission.baseAmount,
          commissionRate: commission.commissionRate,
          calculatedAt: commission.calculatedAt
        },
        'PLATFORM',
        commission.id,
        'COMMISSION',
        commission.id
      );

      // Process the event to create journal entry
      await this.processPlatformEvent(eventId);

      logger.info(`Commission earned event processed: ${commission.id}`, {
        commissionId: commission.id,
        businessAccountId,
        commissionAmount: commission.commissionAmount,
        userId
      });

      return commission;
    } catch (error) {
      logger.error('Failed to handle commission earned event:', error);
      throw error;
    }
  }

  /**
   * Handle refund processed event
   */
  async handleRefundProcessed(
    businessAccountId: string,
    refundData: PlatformRefundData,
    userId: string
  ): Promise<any> {
    try {
      // Create refund record
      const refund = await this.prisma.platformRefund.create({
        data: {
          businessAccountId,
          orderId: refundData.orderId,
          refundNumber: refundData.refundNumber,
          originalAmount: refundData.originalAmount,
          refundAmount: refundData.refundAmount,
          refundReason: refundData.refundReason,
          refundType: refundData.refundType,
          status: 'PROCESSED',
          customerRefundedAt: new Date(),
          platformProcessedAt: new Date(),
          notes: refundData.notes
        }
      });

      // Create platform event for refund
      const eventId = await this.createPlatformEvent(
        businessAccountId,
        'REFUND_PROCESSED',
        {
          refundId: refund.id,
          refundNumber: refund.refundNumber,
          originalAmount: refund.originalAmount,
          refundAmount: refund.refundAmount,
          refundReason: refund.refundReason,
          refundType: refund.refundType,
          customerRefundedAt: refund.customerRefundedAt
        },
        'PLATFORM',
        refund.id,
        'REFUND',
        refund.id
      );

      // Process the event to create journal entry
      await this.processPlatformEvent(eventId);

      logger.info(`Refund processed event: ${refund.refundNumber}`, {
        refundId: refund.id,
        businessAccountId,
        refundAmount: refund.refundAmount,
        userId
      });

      return refund;
    } catch (error) {
      logger.error('Failed to handle refund processed event:', error);
      throw error;
    }
  }

  /**
   * Handle payout sent event
   */
  async handlePayoutSent(
    businessAccountId: string,
    payoutData: PlatformPayoutData,
    userId: string
  ): Promise<any> {
    try {
      // Create payout record
      const payout = await this.prisma.platformPayout.create({
        data: {
          businessAccountId,
          payoutNumber: payoutData.payoutNumber,
          recipientType: payoutData.recipientType,
          recipientId: payoutData.recipientId,
          recipientName: payoutData.recipientName,
          recipientEmail: payoutData.recipientEmail,
          payoutAmount: payoutData.payoutAmount,
          payoutMethod: payoutData.payoutMethod,
          payoutStatus: 'PROCESSED',
          scheduledDate: payoutData.scheduledDate || new Date(),
          processedDate: new Date(),
          bankAccount: payoutData.bankAccount || {},
          notes: payoutData.notes
        }
      });

      // Create platform event for payout
      const eventId = await this.createPlatformEvent(
        businessAccountId,
        'PAYOUT_SENT',
        {
          payoutId: payout.id,
          payoutNumber: payout.payoutNumber,
          recipientType: payout.recipientType,
          recipientName: payout.recipientName,
          payoutAmount: payout.payoutAmount,
          payoutMethod: payout.payoutMethod,
          processedDate: payout.processedDate
        },
        'PLATFORM',
        payout.id,
        'PAYOUT',
        payout.id
      );

      // Process the event to create journal entry
      await this.processPlatformEvent(eventId);

      logger.info(`Payout sent event processed: ${payout.payoutNumber}`, {
        payoutId: payout.id,
        businessAccountId,
        payoutAmount: payout.payoutAmount,
        recipientName: payout.recipientName,
        userId
      });

      return payout;
    } catch (error) {
      logger.error('Failed to handle payout sent event:', error);
      throw error;
    }
  }

  /**
   * Create platform event
   */
  private async createPlatformEvent(
    businessAccountId: string,
    eventType: string,
    eventData: any,
    sourceSystem: string = 'PLATFORM',
    sourceEventId?: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<string> {
    const event = await this.prisma.platformEvent.create({
      data: {
        businessAccountId,
        eventType: eventType as any,
        eventData: eventData,
        sourceSystem,
        sourceEventId,
        referenceType,
        referenceId,
        status: 'PENDING'
      }
    });

    // Queue the event for processing
    await this.prisma.eventProcessingQueue.create({
      data: {
        platformEventId: event.id,
        priority: 1,
        scheduledAt: new Date()
      }
    });

    return event.id;
  }

  /**
   * Process platform event and create journal entry
   */
  private async processPlatformEvent(eventId: string): Promise<void> {
    try {
      // Get the platform event
      const event = await this.prisma.platformEvent.findUnique({
        where: { id: eventId }
      });

      if (!event || event.status !== 'PENDING') {
        return;
      }

      // Get accounting mapping for this event type
      const mapping = await this.prisma.accountingEventMapping.findFirst({
        where: {
          eventType: event.eventType as any,
          businessAccountId: event.businessAccountId,
          isActive: true
        }
      });

      if (!mapping) {
        await this.prisma.platformEvent.update({
          where: { id: eventId },
          data: {
            status: 'FAILED' as any,
            errorMessage: 'No accounting mapping found'
          }
        });
        return;
      }

      // Get fiscal period for current date
      const fiscalPeriod = await this.prisma.fiscalPeriod.findFirst({
        where: {
          businessAccountId: event.businessAccountId,
          status: 'OPEN' as any,
          periodStart: { lte: new Date() },
          periodEnd: { gte: new Date() }
        }
      });

      if (!fiscalPeriod) {
        await this.prisma.platformEvent.update({
          where: { id: eventId },
          data: {
            status: 'FAILED' as any,
            errorMessage: 'No open fiscal period found'
          }
        });
        return;
      }

      // Generate journal entry number
      const entryNumber = await this.generateEntryNumber(event.businessAccountId, new Date());

      // Create journal entry
      const journalEntry = await this.prisma.journalEntry.create({
        data: {
          businessAccountId: event.businessAccountId,
          fiscalPeriodId: fiscalPeriod.id,
          entryNumber,
          entryDate: new Date(),
          description: this.formatDescription(mapping.descriptionTemplate, event.eventData),
          referenceType: event.referenceType,
          referenceId: event.referenceId,
          status: 'DRAFT' as any,
          totalDebits: 0,
          totalCredits: 0
        }
      });

      // Create journal entry lines based on event type and data
      await this.createJournalEntryLines(journalEntry.id, mapping, event);

      // Update journal entry totals
      const lines = await this.prisma.journalEntryLine.findMany({
        where: { journalEntryId: journalEntry.id }
      });

      const totalDebits = lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
      const totalCredits = lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);

      await this.prisma.journalEntry.update({
        where: { id: journalEntry.id },
        data: {
          totalDebits,
          totalCredits,
          status: mapping.autoPost ? 'POSTED' as any : 'DRAFT' as any,
          postedAt: mapping.autoPost ? new Date() : null
        }
      });

      // Update account balances if auto-posted
      if (mapping.autoPost) {
        await this.updateAccountBalances(journalEntry.id);
      }

      // Update platform event status
      await this.prisma.platformEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSED' as any,
          journalEntryId: journalEntry.id,
          processedAt: new Date()
        }
      });

    } catch (error) {
      logger.error(`Failed to process platform event ${eventId}:`, error);
      
      await this.prisma.platformEvent.update({
        where: { id: eventId },
        data: {
          status: 'FAILED' as any,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Create journal entry lines based on event and mapping
   */
  private async createJournalEntryLines(
    journalEntryId: string,
    mapping: any,
    event: any
  ): Promise<void> {
    const eventData = event.eventData;

    if (event.eventType === 'ORDER_COMPLETED') {
      // Revenue entry: Debit Accounts Receivable, Credit Sales Revenue
      await this.prisma.journalEntryLine.createMany({
        data: [
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.debitAccountId,
            lineNumber: 1,
            description: 'Revenue from order completion',
            debitAmount: eventData.totalAmount,
            creditAmount: 0
          },
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.creditAccountId,
            lineNumber: 2,
            description: 'Sales revenue',
            debitAmount: 0,
            creditAmount: eventData.totalAmount
          }
        ]
      });

    } else if (event.eventType === 'COMMISSION_EARNED') {
      // Commission entry: Debit Commission Expense, Credit Commission Liability
      await this.prisma.journalEntryLine.createMany({
        data: [
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.debitAccountId,
            lineNumber: 1,
            description: 'Platform commission expense',
            debitAmount: eventData.commissionAmount,
            creditAmount: 0
          },
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.creditAccountId,
            lineNumber: 2,
            description: 'Commission liability',
            debitAmount: 0,
            creditAmount: eventData.commissionAmount
          }
        ]
      });

    } else if (event.eventType === 'REFUND_PROCESSED') {
      // Refund entry: Debit Sales Revenue (contra), Credit Cash
      await this.prisma.journalEntryLine.createMany({
        data: [
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.debitAccountId,
            lineNumber: 1,
            description: 'Sales revenue reversal for refund',
            debitAmount: eventData.refundAmount,
            creditAmount: 0
          },
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.creditAccountId,
            lineNumber: 2,
            description: 'Refund processed',
            debitAmount: 0,
            creditAmount: eventData.refundAmount
          }
        ]
      });

    } else if (event.eventType === 'PAYOUT_SENT') {
      // Payout entry: Debit Payout Expense, Credit Cash
      await this.prisma.journalEntryLine.createMany({
        data: [
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.debitAccountId,
            lineNumber: 1,
            description: `Payout to ${eventData.recipientName}`,
            debitAmount: eventData.payoutAmount,
            creditAmount: 0
          },
          {
            id: this.generateId(),
            journalEntryId,
            accountId: mapping.creditAccountId,
            lineNumber: 2,
            description: 'Cash reduction for payout',
            debitAmount: 0,
            creditAmount: eventData.payoutAmount
          }
        ]
      });
    }
  }

  /**
   * Update account balances after posting journal entry
   */
  private async updateAccountBalances(journalEntryId: string): Promise<void> {
    const journalEntry = await this.prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { lines: true, fiscalPeriod: true }
    });

    if (!journalEntry) return;

    const { businessAccountId, fiscalPeriodId } = journalEntry;

    for (const line of journalEntry.lines) {
      const existingBalance = await this.prisma.accountBalance.findUnique({
        where: {
          businessAccountId_accountId_fiscalPeriodId: {
            businessAccountId,
            accountId: line.accountId,
            fiscalPeriodId
          }
        }
      });

      const debitAmount = Number(line.debitAmount);
      const creditAmount = Number(line.creditAmount);
      const netChange = debitAmount - creditAmount;

      if (existingBalance) {
        await this.prisma.accountBalance.update({
          where: {
            businessAccountId_accountId_fiscalPeriodId: {
              businessAccountId,
              accountId: line.accountId,
              fiscalPeriodId
            }
          },
          data: {
            netChange: existingBalance.netChange + netChange,
            debitTotal: existingBalance.debitTotal + debitAmount,
            creditTotal: existingBalance.creditTotal + creditAmount,
            closingBalance: existingBalance.openingBalance + existingBalance.netChange + netChange,
            lastUpdated: new Date()
          }
        });
      } else {
        await this.prisma.accountBalance.create({
          data: {
            businessAccountId,
            accountId: line.accountId,
            fiscalPeriodId,
            openingBalance: 0,
            netChange,
            debitTotal: debitAmount,
            creditTotal: creditAmount,
            closingBalance: netChange
          }
        });
      }
    }
  }

  /**
   * Generate unique journal entry number
   */
  private async generateEntryNumber(businessAccountId: string, date: Date): Promise<string> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const count = await this.prisma.journalEntry.count({
      where: {
        businessAccountId,
        entryDate: date
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `JE-${dateStr}-${sequence}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Format description with event data
   */
  private formatDescription(template: string, eventData: any): string {
    return template.replace(/{event_data}/g, JSON.stringify(eventData));
  }

  /**
   * Get platform events for business
   */
  async getPlatformEvents(
    businessAccountId: string,
    filters: {
      eventType?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<any> {
    const where: any = {
      businessAccountId
    };

    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.platformEvent.findMany({
        where,
        include: {
          journalEntry: {
            select: {
              id: true,
              entryNumber: true,
              status: true,
              postedAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 50),
        take: filters.limit || 50
      }),
      this.prisma.platformEvent.count({ where })
    ]);

    return {
      events,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 50,
        total,
        pages: Math.ceil(total / (filters.limit || 50))
      }
    };
  }

  /**
   * Get accounting event mappings for business
   */
  async getAccountingMappings(businessAccountId: string): Promise<any[]> {
    return await this.prisma.accountingEventMapping.findMany({
      where: {
        businessAccountId,
        isActive: true
      },
      include: {
        debitAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            accountType: true
          }
        },
        creditAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            accountType: true
          }
        }
      },
      orderBy: {
        eventType: 'asc'
      }
    });
  }

  /**
   * Update accounting event mapping
   */
  async updateAccountingMapping(
    businessAccountId: string,
    eventType: string,
    mappingData: {
      debitAccountId: string;
      creditAccountId: string;
      descriptionTemplate: string;
      autoPost?: boolean;
    }
  ): Promise<any> {
    return await this.prisma.accountingEventMapping.upsert({
      where: {
        businessAccountId_eventType: {
          businessAccountId,
          eventType
        }
      },
      update: mappingData,
      create: {
        businessAccountId,
        eventType,
        ...mappingData,
        isActive: true,
        priority: 1
      },
      include: {
        debitAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true
          }
        },
        creditAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true
          }
        }
      }
    });
  }
}

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export class EventProcessor {
  constructor(private prisma: PrismaClient) {}

  /**
   * Process events from the queue
   */
  async processEventQueue(): Promise<void> {
    try {
      // Get next events to process
      const events = await this.prisma.eventProcessingQueue.findMany({
        where: {
          queueStatus: 'PENDING',
          scheduledAt: { lte: new Date() }
        },
        include: {
          platformEvent: true
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' }
        ],
        take: 10 // Process up to 10 events at a time
      });

      for (const queueItem of events) {
        await this.processEvent(queueItem);
      }
    } catch (error) {
      logger.error('Error processing event queue:', error);
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(queueItem: any): Promise<void> {
    try {
      // Update queue status to processing
      await this.prisma.eventProcessingQueue.update({
        where: { id: queueItem.id },
        data: {
          queueStatus: 'PROCESSING',
          lastAttemptAt: new Date(),
          attempts: queueItem.attempts + 1
        }
      });

      // Process the platform event
      const success = await this.processPlatformEvent(queueItem.platformEvent);

      if (success) {
        // Mark as completed
        await this.prisma.eventProcessingQueue.update({
          where: { id: queueItem.id },
          data: {
            queueStatus: 'COMPLETED'
          }
        });
      } else {
        // Mark as failed or retry
        await this.handleFailedEvent(queueItem);
      }
    } catch (error) {
      logger.error(`Error processing event ${queueItem.id}:`, error);
      await this.handleFailedEvent(queueItem, error);
    }
  }

  /**
   * Process platform event and create journal entry
   */
  private async processPlatformEvent(event: any): Promise<boolean> {
    try {
      // Get accounting mapping for this event type
      const mapping = await this.prisma.accountingEventMapping.findFirst({
        where: {
          eventType: event.eventType,
          businessAccountId: event.businessAccountId,
          isActive: true
        }
      });

      if (!mapping) {
        await this.prisma.platformEvent.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            errorMessage: 'No accounting mapping found'
          }
        });
        return false;
      }

      // Get fiscal period for current date
      const fiscalPeriod = await this.prisma.fiscalPeriod.findFirst({
        where: {
          businessAccountId: event.businessAccountId,
          status: 'OPEN',
          periodStart: { lte: new Date() },
          periodEnd: { gte: new Date() }
        }
      });

      if (!fiscalPeriod) {
        await this.prisma.platformEvent.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            errorMessage: 'No open fiscal period found'
          }
        });
        return false;
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
          status: 'DRAFT',
          totalDebits: 0,
          totalCredits: 0
        }
      });

      // Create journal entry lines
      await this.createJournalEntryLines(journalEntry.id, mapping, event);

      // Update journal entry totals
      const lines = await this.prisma.journalEntryLine.findMany({
        where: { journalEntryId: journalEntry.id }
      });

      const totalDebits = lines.reduce((sum: number, line: any) => sum + Number(line.debitAmount), 0);
      const totalCredits = lines.reduce((sum: number, line: any) => sum + Number(line.creditAmount), 0);

      await this.prisma.journalEntry.update({
        where: { id: journalEntry.id },
        data: {
          totalDebits,
          totalCredits,
          status: mapping.autoPost ? 'POSTED' : 'DRAFT',
          postedAt: mapping.autoPost ? new Date() : null
        }
      });

      // Update account balances if auto-posted
      if (mapping.autoPost) {
        await this.updateAccountBalances(journalEntry.id);
      }

      // Update platform event status
      await this.prisma.platformEvent.update({
        where: { id: event.id },
        data: {
          status: 'PROCESSED',
          journalEntryId: journalEntry.id,
          processedAt: new Date()
        }
      });

      logger.info(`Successfully processed platform event: ${event.eventType}`, {
        eventId: event.id,
        businessAccountId: event.businessAccountId,
        journalEntryId: journalEntry.id
      });

      return true;
    } catch (error) {
      logger.error(`Failed to process platform event ${event.id}:`, error);
      
      await this.prisma.platformEvent.update({
        where: { id: event.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return false;
    }
  }

  /**
   * Handle failed event processing
   */
  private async handleFailedEvent(queueItem: any, error?: any): Promise<void> {
    const maxAttempts = queueItem.maxAttempts || 3;
    
    if (queueItem.attempts >= maxAttempts) {
      // Max attempts reached, mark as failed
      await this.prisma.eventProcessingQueue.update({
        where: { id: queueItem.id },
        data: {
          queueStatus: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Max attempts reached'
        }
      });

      // Update platform event status
      await this.prisma.platformEvent.update({
        where: { id: queueItem.platformEventId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Processing failed after max attempts'
        }
      });
    } else {
      // Retry later
      const retryDelay = Math.pow(2, queueItem.attempts) * 1000; // Exponential backoff
      const nextAttemptAt = new Date(Date.now() + retryDelay);

      await this.prisma.eventProcessingQueue.update({
        where: { id: queueItem.id },
        data: {
          queueStatus: 'PENDING',
          nextAttemptAt,
          errorMessage: error instanceof Error ? error.message : 'Processing failed, will retry'
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
   * Get queue statistics
   */
  async getQueueStatistics(businessAccountId?: string): Promise<any> {
    const whereClause = businessAccountId ? {
      platformEvent: {
        businessAccountId
      }
    } : {};

    const [pending, processing, completed, failed] = await Promise.all([
      this.prisma.eventProcessingQueue.count({
        where: { ...whereClause, queueStatus: 'PENDING' }
      }),
      this.prisma.eventProcessingQueue.count({
        where: { ...whereClause, queueStatus: 'PROCESSING' }
      }),
      this.prisma.eventProcessingQueue.count({
        where: { ...whereClause, queueStatus: 'COMPLETED' }
      }),
      this.prisma.eventProcessingQueue.count({
        where: { ...whereClause, queueStatus: 'FAILED' }
      })
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed
    };
  }

  /**
   * Retry failed events
   */
  async retryFailedEvents(businessAccountId?: string): Promise<number> {
    const whereClause: any = {
      queueStatus: 'FAILED'
    };

    if (businessAccountId) {
      whereClause.platformEvent = {
        businessAccountId
      };
    }

    const failedEvents = await this.prisma.eventProcessingQueue.findMany({
      where: whereClause,
      include: {
        platformEvent: true
      },
      orderBy: {
        lastAttemptAt: 'desc'
      },
      take: 50 // Limit to 50 events per retry batch
    });

    let retriedCount = 0;

    for (const event of failedEvents) {
      // Reset attempts and status
      await this.prisma.eventProcessingQueue.update({
        where: { id: event.id },
        data: {
          queueStatus: 'PENDING',
          attempts: 0,
          nextAttemptAt: new Date(),
          errorMessage: null
        }
      });

      // Reset platform event status
      await this.prisma.platformEvent.update({
        where: { id: event.platformEventId },
        data: {
          status: 'PENDING',
          errorMessage: null
        }
      });

      retriedCount++;
    }

    logger.info(`Retried ${retriedCount} failed events`, {
      businessAccountId,
      retriedCount
    });

    return retriedCount;
  }

  /**
   * Clear old completed events from queue
   */
  async clearCompletedEvents(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.eventProcessingQueue.deleteMany({
      where: {
        queueStatus: 'COMPLETED',
        lastAttemptAt: { lt: cutoffDate }
      }
    });

    logger.info(`Cleared ${result.count} old completed events from queue`, {
      olderThanDays,
      clearedCount: result.count
    });

    return result.count;
  }
}

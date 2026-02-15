import cron from 'node-cron';
import { prisma } from '../index';
import { logger } from './logger';
import { processSettlementBatch } from './settlementProcessor';

// Settlement cron job - runs every hour at minute 0
export const startSettlementCron = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting settlement batch processing cron job');
    
    try {
      // Find pending settlement batches
      const pendingBatches = await prisma.settlement.findMany({
        where: {
          status: 'pending',
        },
        include: {
          items: true,
        },
      });

      logger.info(`Found ${pendingBatches.length} pending settlement batches to process`);

      for (const batch of pendingBatches) {
        try {
          await processSettlementBatch(batch.id);
          logger.info(`Successfully processed settlement batch ${batch.id}`);
        } catch (error) {
          logger.error(`Failed to process settlement batch ${batch.id}:`, error);
          
          // Update batch status to failed
          await prisma.settlement.update({
            where: { id: batch.id },
            data: {
              status: 'failed',
              processedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      logger.error('Settlement cron job failed:', error instanceof Error ? error.message : String(error));
    }
  });

  logger.info('Settlement cron job started - runs every hour at minute 0');
};

// Daily settlement reconciliation - runs at 2 AM
export const startSettlementReconciliation = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting daily settlement reconciliation');
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Find all processed settlement batches from yesterday
      const processedBatches = await prisma.settlement.findMany({
        where: {
          status: 'completed',
          processedAt: {
            gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            lt: new Date(),
          },
        },
        include: {
          items: true,
        },
      });

      logger.info(`Found ${processedBatches.length} processed settlement batches for reconciliation`);

      // Reconcile each batch
      for (const batch of processedBatches) {
        try {
          await reconcileSettlementBatch(batch);
          logger.info(`Successfully reconciled settlement batch ${batch.id}`);
        } catch (error) {
          logger.error(`Failed to reconcile settlement batch ${batch.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Settlement reconciliation failed:', error);
    }
  });

  logger.info('Settlement reconciliation cron job started - runs daily at 2 AM');
};

// Reconcile a settlement batch
const reconcileSettlementBatch = async (batch: any) => {
  // Check if all transactions in the batch are properly settled
  const unsettledTransactions = batch.transactions.filter((t: any) => t.status !== 'SETTLED');
  
  if (unsettledTransactions.length === 0) {
    // All transactions are settled, mark batch as reconciled
    await prisma.settlement.update({
      where: { id: batch.id },
      data: {
        status: 'reconciled',
      },
    });
  } else {
    logger.warn(`Settlement batch ${batch.id} has ${unsettledTransactions.length} unsettled transactions`);
  }
};

// Start both cron jobs
export const initializeSettlementJobs = () => {
  startSettlementCron();
  startSettlementReconciliation();
};
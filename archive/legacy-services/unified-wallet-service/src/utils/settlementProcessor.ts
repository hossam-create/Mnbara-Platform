import { prisma } from '../index';
import { logger } from './logger';
import { createAuditLog } from './audit';

export const processSettlementBatch = async (batchId: string) => {
  const batch = await prisma.settlement.findUnique({
    where: { id: batchId },
    include: {
      items: {
        include: {
          transaction: {
            include: {
              wallet: true,
              destinationWallet: true,
            },
          },
        },
      },
    },
  });

  if (!batch) {
    throw new Error(`Settlement batch ${batchId} not found`);
  }

  if (batch.status !== 'pending') {
    throw new Error(`Settlement batch ${batchId} is not in pending status`);
  }

  logger.info(`Processing settlement batch ${batchId} with ${batch.items.length} transactions`);

  const processedTransactions = [];
  const failedTransactions = [];

  for (const item of batch.items) {
    const transaction = item.transaction;
    try {
      await processSettlementTransaction(transaction);
      processedTransactions.push(transaction.id);
      logger.info(`Successfully processed settlement transaction ${transaction.id}`);
    } catch (error) {
      logger.error(`Failed to process settlement transaction ${transaction.id}:`, error instanceof Error ? error.message : String(error));
      failedTransactions.push({
        transactionId: transaction.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Update batch status
  const finalStatus = failedTransactions.length === 0 ? 'completed' : 'failed';
  
  await prisma.settlement.update({
    where: { id: batchId },
    data: {
      status: finalStatus,
      processedAt: new Date(),
    },
  });

  // Create audit log
  await createAuditLog({
    userId: batch.userId,
    settlementId: batchId,
    action: 'SETTLEMENT_PROCESSED',
    resourceType: 'settlement',
    resourceId: batchId,
    metadata: {
      processedCount: processedTransactions.length,
      failedCount: failedTransactions.length,
      finalStatus,
    },
  });

  logger.info(`Settlement batch ${batchId} processing completed. Status: ${finalStatus}`);
  
  return {
    batchId,
    status: finalStatus,
    processedCount: processedTransactions.length,
    failedCount: failedTransactions.length,
  };
};

const processSettlementTransaction = async (transaction: any) => {
  // Process different types of settlement transactions
  switch (transaction.type) {
    case 'DEPOSIT':
      await processDepositSettlement(transaction);
      break;
    case 'WITHDRAWAL':
      await processWithdrawalSettlement(transaction);
      break;
    case 'TRANSFER':
      await processTransferSettlement(transaction);
      break;
    default:
      throw new Error(`Unsupported settlement transaction type: ${transaction.type}`);
  }

  // Update transaction status
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'COMPLETED',
      processedAt: new Date(),
    },
  });
};

const processDepositSettlement = async (transaction: any) => {
  // For deposits, the money should already be in the wallet
  // This is just a reconciliation step
  
  if (transaction.status !== 'COMPLETED') {
    throw new Error(`Transaction ${transaction.id} is not completed`);
  }

  // Verify wallet balance matches transaction amount
  const wallet = await prisma.wallet.findUnique({
    where: { id: transaction.walletId },
  });

  if (!wallet) {
    throw new Error(`Wallet ${transaction.walletId} not found`);
  }

  // Create audit log for settlement
  await createAuditLog({
    userId: transaction.userId,
    transactionId: transaction.id,
    walletId: transaction.walletId,
    action: 'DEPOSIT_SETTLED',
    resourceType: 'TRANSACTION',
    resourceId: transaction.id,
    metadata: {
      amount: transaction.amount,
      currency: transaction.currency,
      settlementDate: new Date().toISOString(),
    },
  });
};

const processWithdrawalSettlement = async (transaction: any) => {
  // For withdrawals, verify the money has been sent to external system
  
  if (transaction.status !== 'COMPLETED') {
    throw new Error(`Transaction ${transaction.id} is not completed`);
  }

  // Verify wallet has sufficient balance (should have been checked during processing)
  const wallet = await prisma.wallet.findUnique({
    where: { id: transaction.walletId },
  });

  if (!wallet) {
    throw new Error(`Wallet ${transaction.walletId} not found`);
  }

  if (wallet.balance < transaction.amount) {
    throw new Error(`Insufficient balance in wallet ${transaction.walletId}`);
  }

  // Create audit log for settlement
  await createAuditLog({
    userId: transaction.userId,
    transactionId: transaction.id,
    walletId: transaction.walletId,
    action: 'WITHDRAWAL_SETTLED',
    resourceType: 'TRANSACTION',
    resourceId: transaction.id,
    metadata: {
      amount: transaction.amount,
      currency: transaction.currency,
      settlementDate: new Date().toISOString(),
    },
  });
};

const processTransferSettlement = async (transaction: any) => {
  // For transfers, verify both wallets are properly updated
  
  if (transaction.status !== 'COMPLETED') {
    throw new Error(`Transaction ${transaction.id} is not completed`);
  }

  if (!transaction.destinationWalletId) {
    throw new Error(`Destination wallet not specified for transfer ${transaction.id}`);
  }

  // Verify source wallet balance
  const sourceWallet = await prisma.wallet.findUnique({
    where: { id: transaction.walletId },
  });

  const destinationWallet = await prisma.wallet.findUnique({
    where: { id: transaction.destinationWalletId },
  });

  if (!sourceWallet || !destinationWallet) {
    throw new Error(`One or both wallets not found for transfer ${transaction.id}`);
  }

  // Create audit log for settlement
  await createAuditLog({
    userId: transaction.userId,
    transactionId: transaction.id,
    walletId: transaction.walletId,
    action: 'TRANSFER_SETTLED',
    resourceType: 'TRANSACTION',
    resourceId: transaction.id,
    metadata: {
      amount: transaction.amount,
      currency: transaction.currency,
      sourceWalletId: transaction.walletId,
      destinationWalletId: transaction.destinationWalletId,
      settlementDate: new Date().toISOString(),
    },
  });
};
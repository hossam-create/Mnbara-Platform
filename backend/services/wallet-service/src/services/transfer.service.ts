import { PrismaClient, Currency, TransferStatus } from '@prisma/client';
import { forexService } from './forex.service';

const prisma = new PrismaClient();

export const transferService = {
  // تحويل بين المستخدمين - Transfer between users
  async createTransfer(data: {
    fromUserId: string;
    toUserId: string;
    fromCurrency: Currency;
    toCurrency: Currency;
    amount: number;
    note?: string;
  }) {
    const { fromUserId, toUserId, fromCurrency, toCurrency, amount, note } = data;

    // Get sender wallet
    const fromWallet = await prisma.wallet.findUnique({
      where: { userId: fromUserId },
      include: { balances: true }
    });

    if (!fromWallet) {
      throw new Error('Sender wallet not found');
    }

    // Get receiver wallet
    const toWallet = await prisma.wallet.findUnique({
      where: { userId: toUserId },
      include: { balances: true }
    });

    if (!toWallet) {
      throw new Error('Receiver wallet not found');
    }

    // Check sender balance
    const fromBalance = fromWallet.balances.find(b => b.currency === fromCurrency);
    if (!fromBalance || Number(fromBalance.availableBalance) < amount) {
      throw new Error('Insufficient balance');
    }

    // Calculate conversion if different currencies
    let toAmount = amount;
    let exchangeRate = 1;
    let fee = 0;

    if (fromCurrency !== toCurrency) {
      const conversion = await forexService.convert(fromCurrency, toCurrency, amount);
      toAmount = conversion.to.amount;
      exchangeRate = conversion.rate;
      fee = conversion.fee.amount;
    }

    // Create transfer record
    const transfer = await prisma.transfer.create({
      data: {
        fromWalletId: fromWallet.id,
        fromCurrency,
        fromAmount: amount,
        toUserId,
        toCurrency,
        toAmount,
        exchangeRate,
        fee,
        note,
        status: 'PROCESSING'
      }
    });

    // Update balances
    const toBalance = toWallet.balances.find(b => b.currency === toCurrency);
    if (!toBalance) {
      throw new Error('Receiver currency not supported');
    }

    await prisma.$transaction([
      // Deduct from sender
      prisma.walletBalance.update({
        where: { id: fromBalance.id },
        data: {
          balance: { decrement: amount },
          availableBalance: { decrement: amount }
        }
      }),
      // Add to receiver
      prisma.walletBalance.update({
        where: { id: toBalance.id },
        data: {
          balance: { increment: toAmount },
          availableBalance: { increment: toAmount }
        }
      }),
      // Create sender transaction
      prisma.walletTransaction.create({
        data: {
          walletId: fromWallet.id,
          type: 'TRANSFER_OUT',
          currency: fromCurrency,
          amount: -amount,
          toCurrency,
          toAmount,
          exchangeRate,
          fee,
          feeCurrency: toCurrency,
          balanceAfter: Number(fromBalance.balance) - amount,
          status: 'COMPLETED',
          referenceId: transfer.id,
          referenceType: 'transfer',
          description: `Transfer to ${toUserId}`,
          descriptionAr: `تحويل إلى ${toUserId}`,
          completedAt: new Date()
        }
      }),
      // Create receiver transaction
      prisma.walletTransaction.create({
        data: {
          walletId: toWallet.id,
          type: 'TRANSFER_IN',
          currency: toCurrency,
          amount: toAmount,
          balanceAfter: Number(toBalance.balance) + toAmount,
          status: 'COMPLETED',
          referenceId: transfer.id,
          referenceType: 'transfer',
          description: `Transfer from ${fromUserId}`,
          descriptionAr: `تحويل من ${fromUserId}`,
          completedAt: new Date()
        }
      }),
      // Update transfer status
      prisma.transfer.update({
        where: { id: transfer.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
    ]);

    return {
      transferId: transfer.id,
      from: {
        userId: fromUserId,
        currency: fromCurrency,
        amount
      },
      to: {
        userId: toUserId,
        currency: toCurrency,
        amount: toAmount
      },
      exchangeRate,
      fee,
      status: 'COMPLETED'
    };
  },

  // الحصول على تحويل - Get transfer
  async getTransfer(transferId: string) {
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        fromWallet: {
          select: { userId: true }
        }
      }
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return transfer;
  },

  // الحصول على تحويلات المستخدم - Get user transfers
  async getUserTransfers(userId: string, options: {
    type?: 'sent' | 'received' | 'all';
    status?: TransferStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const { type = 'all', status, limit = 20, offset = 0 } = options;

    const where: any = {};
    
    if (type === 'sent') {
      where.fromWalletId = wallet.id;
    } else if (type === 'received') {
      where.toUserId = userId;
    } else {
      where.OR = [
        { fromWalletId: wallet.id },
        { toUserId: userId }
      ];
    }

    if (status) {
      where.status = status;
    }

    const transfers = await prisma.transfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        fromWallet: {
          select: { userId: true }
        }
      }
    });

    const total = await prisma.transfer.count({ where });

    return {
      transfers: transfers.map(t => ({
        ...t,
        direction: t.fromWalletId === wallet.id ? 'sent' : 'received'
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  },

  // حساب رسوم التحويل - Calculate transfer fee
  async calculateFee(
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: number
  ) {
    if (fromCurrency === toCurrency) {
      return {
        fee: 0,
        feeCurrency: fromCurrency,
        feePercentage: 0,
        toAmount: amount
      };
    }

    const conversion = await forexService.convert(fromCurrency, toCurrency, amount);
    
    return {
      fee: conversion.fee.amount,
      feeCurrency: toCurrency,
      feePercentage: conversion.fee.percentage,
      toAmount: conversion.to.amount,
      exchangeRate: conversion.rate
    };
  }
};

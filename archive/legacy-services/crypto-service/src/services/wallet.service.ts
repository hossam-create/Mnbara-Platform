import { PrismaClient, CryptoCurrency } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Generate mock addresses (in production, use actual crypto libraries)
const generateAddress = (currency: CryptoCurrency): string => {
  const prefixes: Record<CryptoCurrency, string> = {
    BTC: '1',
    ETH: '0x',
    USDC: '0x',
    USDT: '0x'
  };
  const randomHex = uuidv4().replace(/-/g, '');
  return `${prefixes[currency]}${randomHex}`;
};

export const walletService = {
  // إنشاء محفظة جديدة - Create new wallet
  async createWallet(userId: string) {
    const existingWallet = await prisma.cryptoWallet.findUnique({
      where: { userId }
    });

    if (existingWallet) {
      throw new Error('Wallet already exists for this user');
    }

    const wallet = await prisma.cryptoWallet.create({
      data: {
        userId,
        btcAddress: generateAddress('BTC'),
        ethAddress: generateAddress('ETH'),
        usdcAddress: generateAddress('USDC'),
        usdtAddress: generateAddress('USDT')
      }
    });

    return wallet;
  },

  // الحصول على المحفظة - Get wallet
  async getWallet(userId: string) {
    const wallet = await prisma.cryptoWallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  },

  // الحصول على الرصيد - Get balance
  async getBalance(userId: string) {
    const wallet = await prisma.cryptoWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get current exchange rates
    const rates = await prisma.exchangeRate.findMany({
      where: {
        currency: { in: ['BTC', 'ETH', 'USDC', 'USDT'] }
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['currency']
    });

    const rateMap = rates.reduce((acc, rate) => {
      acc[rate.currency] = Number(rate.priceUsd);
      return acc;
    }, {} as Record<string, number>);

    const balances = {
      BTC: {
        amount: Number(wallet.btcBalance),
        usdValue: Number(wallet.btcBalance) * (rateMap.BTC || 43000),
        address: wallet.btcAddress
      },
      ETH: {
        amount: Number(wallet.ethBalance),
        usdValue: Number(wallet.ethBalance) * (rateMap.ETH || 2200),
        address: wallet.ethAddress
      },
      USDC: {
        amount: Number(wallet.usdcBalance),
        usdValue: Number(wallet.usdcBalance) * (rateMap.USDC || 1),
        address: wallet.usdcAddress
      },
      USDT: {
        amount: Number(wallet.usdtBalance),
        usdValue: Number(wallet.usdtBalance) * (rateMap.USDT || 1),
        address: wallet.usdtAddress
      },
      fiat: {
        amount: Number(wallet.fiatBalance),
        currency: wallet.fiatCurrency
      }
    };

    const totalUsdValue = 
      balances.BTC.usdValue + 
      balances.ETH.usdValue + 
      balances.USDC.usdValue + 
      balances.USDT.usdValue +
      balances.fiat.amount;

    return {
      walletId: wallet.id,
      balances,
      totalUsdValue,
      updatedAt: wallet.updatedAt
    };
  },

  // الحصول على عنوان الإيداع - Get deposit address
  async getDepositAddress(userId: string, currency: CryptoCurrency) {
    const wallet = await prisma.cryptoWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const addressMap: Record<CryptoCurrency, string | null> = {
      BTC: wallet.btcAddress,
      ETH: wallet.ethAddress,
      USDC: wallet.usdcAddress,
      USDT: wallet.usdtAddress
    };

    return {
      currency,
      address: addressMap[currency],
      network: currency === 'BTC' ? 'Bitcoin' : 'Ethereum',
      minDeposit: currency === 'BTC' ? 0.0001 : currency === 'ETH' ? 0.001 : 1,
      confirmationsRequired: currency === 'BTC' ? 3 : 12
    };
  },

  // تحديث الرصيد - Update balance (internal use)
  async updateBalance(
    walletId: string, 
    currency: CryptoCurrency, 
    amount: number, 
    operation: 'add' | 'subtract'
  ) {
    const balanceField = {
      BTC: 'btcBalance',
      ETH: 'ethBalance',
      USDC: 'usdcBalance',
      USDT: 'usdtBalance'
    }[currency];

    const wallet = await prisma.cryptoWallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const currentBalance = Number(wallet[balanceField as keyof typeof wallet]);
    const newBalance = operation === 'add' 
      ? currentBalance + amount 
      : currentBalance - amount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    return prisma.cryptoWallet.update({
      where: { id: walletId },
      data: {
        [balanceField]: newBalance
      }
    });
  },

  // الحصول على تاريخ المعاملات - Get transaction history
  async getTransactionHistory(userId: string, options: {
    currency?: CryptoCurrency;
    limit?: number;
    offset?: number;
  } = {}) {
    const wallet = await prisma.cryptoWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const { currency, limit = 20, offset = 0 } = options;

    const transactions = await prisma.cryptoTransaction.findMany({
      where: {
        walletId: wallet.id,
        ...(currency && { currency })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.cryptoTransaction.count({
      where: {
        walletId: wallet.id,
        ...(currency && { currency })
      }
    });

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }
};

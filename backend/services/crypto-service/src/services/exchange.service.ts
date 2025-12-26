import { PrismaClient, CryptoCurrency } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Mock exchange rates (in production, fetch from real APIs)
const MOCK_RATES: Record<CryptoCurrency, number> = {
  BTC: 43500,
  ETH: 2250,
  USDC: 1.00,
  USDT: 1.00
};

// Fiat conversion rates to USD
const FIAT_RATES: Record<string, number> = {
  USD: 1,
  SAR: 0.2667,  // 1 SAR = 0.2667 USD
  AED: 0.2723,  // 1 AED = 0.2723 USD
  EGP: 0.0324,  // 1 EGP = 0.0324 USD
  EUR: 1.10,    // 1 EUR = 1.10 USD
  GBP: 1.27     // 1 GBP = 1.27 USD
};

export const exchangeService = {
  // الحصول على أسعار الصرف الحالية - Get current exchange rates
  async getCurrentRates() {
    // In production, fetch from Coinbase/Binance API
    const rates = await Promise.all(
      Object.entries(MOCK_RATES).map(async ([currency, priceUsd]) => {
        // Add some random variation for realism
        const variation = 1 + (Math.random() - 0.5) * 0.02; // ±1%
        const adjustedPrice = priceUsd * variation;
        
        return {
          currency: currency as CryptoCurrency,
          priceUsd: adjustedPrice,
          priceSar: adjustedPrice / FIAT_RATES.SAR,
          priceAed: adjustedPrice / FIAT_RATES.AED,
          priceEgp: adjustedPrice / FIAT_RATES.EGP,
          change24h: (Math.random() - 0.5) * 10, // Random -5% to +5%
          volume24h: Math.random() * 1000000000,
          marketCap: adjustedPrice * (currency === 'BTC' ? 19500000 : currency === 'ETH' ? 120000000 : 30000000000)
        };
      })
    );

    return rates;
  },

  // حفظ أسعار الصرف - Save exchange rates
  async saveRates() {
    const rates = await this.getCurrentRates();
    
    const savedRates = await Promise.all(
      rates.map(rate => 
        prisma.exchangeRate.create({
          data: {
            currency: rate.currency,
            priceUsd: rate.priceUsd,
            priceSar: rate.priceSar,
            priceAed: rate.priceAed,
            priceEgp: rate.priceEgp,
            change24h: rate.change24h,
            volume24h: rate.volume24h,
            marketCap: rate.marketCap
          }
        })
      )
    );

    return savedRates;
  },

  // الحصول على سعر عملة محددة - Get specific currency rate
  async getRate(currency: CryptoCurrency) {
    const rate = await prisma.exchangeRate.findFirst({
      where: { currency },
      orderBy: { createdAt: 'desc' }
    });

    if (!rate) {
      // Return mock rate if no saved rate
      return {
        currency,
        priceUsd: MOCK_RATES[currency],
        priceSar: MOCK_RATES[currency] / FIAT_RATES.SAR,
        priceAed: MOCK_RATES[currency] / FIAT_RATES.AED,
        priceEgp: MOCK_RATES[currency] / FIAT_RATES.EGP,
        change24h: 0,
        updatedAt: new Date()
      };
    }

    return rate;
  },

  // تحويل بين العملات - Convert between currencies
  async convert(
    fromCurrency: CryptoCurrency | 'USD',
    toCurrency: CryptoCurrency | 'USD',
    amount: number
  ) {
    let fromUsd: number;
    let toUsd: number;

    if (fromCurrency === 'USD') {
      fromUsd = 1;
    } else {
      const fromRate = await this.getRate(fromCurrency);
      fromUsd = Number(fromRate.priceUsd);
    }

    if (toCurrency === 'USD') {
      toUsd = 1;
    } else {
      const toRate = await this.getRate(toCurrency);
      toUsd = Number(toRate.priceUsd);
    }

    const usdAmount = amount * fromUsd;
    const convertedAmount = usdAmount / toUsd;

    // Platform fee: 0.5%
    const fee = convertedAmount * 0.005;
    const finalAmount = convertedAmount - fee;

    return {
      from: {
        currency: fromCurrency,
        amount
      },
      to: {
        currency: toCurrency,
        amount: finalAmount,
        beforeFee: convertedAmount
      },
      exchangeRate: fromUsd / toUsd,
      fee: {
        amount: fee,
        percentage: 0.5
      },
      usdValue: usdAmount
    };
  },

  // الحصول على تاريخ الأسعار - Get price history
  async getPriceHistory(currency: CryptoCurrency, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await prisma.exchangeRate.findMany({
      where: {
        currency,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        priceUsd: true,
        createdAt: true
      }
    });

    // If no history, generate mock data
    if (history.length === 0) {
      const mockHistory = [];
      const basePrice = MOCK_RATES[currency];
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = 1 + (Math.random() - 0.5) * 0.1;
        mockHistory.push({
          priceUsd: basePrice * variation,
          createdAt: date
        });
      }
      
      return mockHistory;
    }

    return history;
  },

  // حساب تكلفة الشبكة - Calculate network fee
  async getNetworkFee(currency: CryptoCurrency) {
    // Mock network fees (in production, fetch from blockchain)
    const fees: Record<CryptoCurrency, { low: number; medium: number; high: number }> = {
      BTC: { low: 0.00001, medium: 0.00005, high: 0.0001 },
      ETH: { low: 0.001, medium: 0.003, high: 0.005 },
      USDC: { low: 0.001, medium: 0.003, high: 0.005 }, // ETH gas
      USDT: { low: 0.001, medium: 0.003, high: 0.005 }  // ETH gas
    };

    const rate = await this.getRate(currency);
    const fee = fees[currency];

    return {
      currency,
      fees: {
        low: {
          amount: fee.low,
          usdValue: fee.low * Number(rate.priceUsd),
          estimatedTime: '60 minutes'
        },
        medium: {
          amount: fee.medium,
          usdValue: fee.medium * Number(rate.priceUsd),
          estimatedTime: '30 minutes'
        },
        high: {
          amount: fee.high,
          usdValue: fee.high * Number(rate.priceUsd),
          estimatedTime: '10 minutes'
        }
      }
    };
  }
};

import { PrismaClient, Currency } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Mock exchange rates (in production, fetch from real APIs like OpenExchangeRates)
const BASE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  EGP: 30.90,
  JPY: 142.50,
  CNY: 7.15,
  INR: 83.20,
  TRY: 29.50
};

export const forexService = {
  // الحصول على جميع أسعار الصرف - Get all exchange rates
  async getAllRates(baseCurrency: Currency = 'USD') {
    const baseRate = BASE_RATES[baseCurrency];
    
    const rates = Object.entries(BASE_RATES).map(([currency, rate]) => {
      const convertedRate = rate / baseRate;
      const variation = 1 + (Math.random() - 0.5) * 0.002; // ±0.1% variation
      
      return {
        baseCurrency,
        quoteCurrency: currency as Currency,
        rate: convertedRate * variation,
        bid: convertedRate * variation * 0.999,
        ask: convertedRate * variation * 1.001,
        change24h: (Math.random() - 0.5) * 2,
        high24h: convertedRate * 1.01,
        low24h: convertedRate * 0.99
      };
    });

    return rates;
  },

  // الحصول على سعر صرف محدد - Get specific exchange rate
  async getRate(baseCurrency: Currency, quoteCurrency: Currency) {
    const baseRate = BASE_RATES[baseCurrency];
    const quoteRate = BASE_RATES[quoteCurrency];
    
    const rate = quoteRate / baseRate;
    const variation = 1 + (Math.random() - 0.5) * 0.002;
    
    return {
      baseCurrency,
      quoteCurrency,
      rate: rate * variation,
      bid: rate * variation * 0.999,
      ask: rate * variation * 1.001,
      spread: 0.002,
      timestamp: new Date()
    };
  },

  // حفظ أسعار الصرف - Save exchange rates
  async saveRates() {
    const rates = await this.getAllRates('USD');
    
    const savedRates = await Promise.all(
      rates.map(rate => 
        prisma.forexRate.create({
          data: {
            baseCurrency: rate.baseCurrency,
            quoteCurrency: rate.quoteCurrency,
            rate: rate.rate,
            bid: rate.bid,
            ask: rate.ask,
            change24h: rate.change24h,
            high24h: rate.high24h,
            low24h: rate.low24h
          }
        })
      )
    );

    return savedRates;
  },

  // تحويل مبلغ - Convert amount
  async convert(
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: number,
    includeSpread: boolean = true
  ) {
    const rate = await this.getRate(fromCurrency, toCurrency);
    
    // Use ask rate for buying (user pays more)
    const effectiveRate = includeSpread ? rate.ask : rate.rate;
    const convertedAmount = amount * effectiveRate;
    
    // Platform fee: 0.3%
    const fee = convertedAmount * 0.003;
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
      rate: effectiveRate,
      fee: {
        amount: fee,
        currency: toCurrency,
        percentage: 0.3
      },
      spread: rate.spread,
      timestamp: new Date()
    };
  },

  // الحصول على تاريخ الأسعار - Get rate history
  async getRateHistory(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    days: number = 30
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await prisma.forexRate.findMany({
      where: {
        baseCurrency,
        quoteCurrency,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        rate: true,
        high24h: true,
        low24h: true,
        createdAt: true
      }
    });

    // If no history, generate mock data
    if (history.length === 0) {
      const mockHistory = [];
      const baseRate = BASE_RATES[quoteCurrency] / BASE_RATES[baseCurrency];
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = 1 + (Math.random() - 0.5) * 0.05;
        mockHistory.push({
          rate: baseRate * variation,
          high24h: baseRate * variation * 1.01,
          low24h: baseRate * variation * 0.99,
          createdAt: date
        });
      }
      
      return mockHistory;
    }

    return history;
  },

  // حساب أفضل سعر - Calculate best rate
  async getBestRate(
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: number
  ) {
    const rate = await this.getRate(fromCurrency, toCurrency);
    
    // Tiered pricing based on amount
    let discount = 0;
    if (amount >= 100000) {
      discount = 0.002; // 0.2% discount for large amounts
    } else if (amount >= 10000) {
      discount = 0.001; // 0.1% discount
    }

    const effectiveRate = rate.ask * (1 - discount);
    
    return {
      standardRate: rate.ask,
      bestRate: effectiveRate,
      discount: discount * 100,
      savings: amount * rate.ask * discount,
      tier: amount >= 100000 ? 'VIP' : amount >= 10000 ? 'Premium' : 'Standard'
    };
  },

  // تنبيه سعر الصرف - Rate alert
  async checkRateAlerts() {
    // In production, check user-defined rate alerts
    // and send notifications when triggered
    const alerts = await prisma.autoConversion.findMany({
      where: {
        isActive: true,
        triggerType: { in: ['RATE_ABOVE', 'RATE_BELOW'] }
      },
      include: { wallet: true }
    });

    const triggeredAlerts = [];

    for (const alert of alerts) {
      const rate = await this.getRate(alert.fromCurrency, alert.toCurrency);
      const currentRate = rate.rate;
      const threshold = Number(alert.triggerValue);

      if (
        (alert.triggerType === 'RATE_ABOVE' && currentRate > threshold) ||
        (alert.triggerType === 'RATE_BELOW' && currentRate < threshold)
      ) {
        triggeredAlerts.push({
          alertId: alert.id,
          userId: alert.wallet.userId,
          fromCurrency: alert.fromCurrency,
          toCurrency: alert.toCurrency,
          currentRate,
          threshold,
          triggerType: alert.triggerType
        });
      }
    }

    return triggeredAlerts;
  }
};

import { Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

// Mock exchange rates (in production, fetch from real APIs like OpenExchangeRates)
const BASE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  EGP: 30.90,
  JPY: 142.50,
  CNY: 7.15,
  INR: 83.20,
  TRY: 29.50,
};

@Injectable()
export class ForexService {
  constructor(private readonly prisma: PrismaService) {}

  // الحصول على جميع أسعار الصرف - Get all exchange rates
  async getAllRates(baseCurrency: string = 'USD') {
    const baseRate = BASE_RATES[baseCurrency] || 1;
    
    const rates = Object.entries(BASE_RATES).map(([currency, rate]) => {
      const convertedRate = rate / baseRate;
      const variation = 1 + (Math.random() - 0.5) * 0.002; // ±0.1% variation
      
      return {
        baseCurrency,
        quoteCurrency: currency,
        rate: convertedRate * variation,
        bid: convertedRate * variation * 0.999,
        ask: convertedRate * variation * 1.001,
        change24h: (Math.random() - 0.5) * 2,
        high24h: convertedRate * 1.01,
        low24h: convertedRate * 0.99
      };
    });

    return rates;
  }

  // الحصول على سعر صرف محدد - Get specific exchange rate
  async getRate(baseCurrency: string, quoteCurrency: string) {
    const baseRate = BASE_RATES[baseCurrency] || 1;
    const quoteRate = BASE_RATES[quoteCurrency] || 1;
    
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
  }

  // تحويل مبلغ - Convert amount
  async convert(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    includeSpread: boolean = true
  ) {
    const rate = await this.getRate(fromCurrency, toCurrency);
    
    // Use ask rate for buying (user pays more)
    const effectiveRate = includeSpread ? rate.ask : rate.rate;
    const convertedAmount = amount * effectiveRate;
    
    // Platform fee: 0.3%
    const feeAmount = convertedAmount * 0.003;
    const finalAmount = convertedAmount - feeAmount;

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
        amount: feeAmount,
        currency: toCurrency,
        percentage: 0.3
      },
      spread: rate.spread,
      timestamp: new Date()
    };
  }

  // حساب أفضل سعر - Calculate best rate
  async getBestRate(
    fromCurrency: string,
    toCurrency: string,
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
  }
}

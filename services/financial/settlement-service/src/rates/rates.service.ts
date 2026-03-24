import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getExchangeRate(fromCurrency: string, toCurrency: string) {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrency, toCurrency, validUntil: { gt: new Date() } },
      orderBy: { validFrom: 'desc' },
    });

    if (rate) return rate;

    const reverseRate = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrency: toCurrency, toCurrency: fromCurrency, validUntil: { gt: new Date() } },
      orderBy: { validFrom: 'desc' },
    });

    if (reverseRate) {
      return {
        ...reverseRate,
        fromCurrency,
        toCurrency,
        midRate: 1 / Number(reverseRate.midRate),
        buyRate: 1 / Number(reverseRate.sellRate),
        sellRate: 1 / Number(reverseRate.buyRate),
      };
    }

    return this.getDefaultRate(fromCurrency, toCurrency);
  }

  private getDefaultRate(from: string, to: string) {
    const rates: Record<string, number> = {
      USD_EGP: 30.9, USD_SAR: 3.75, USD_AED: 3.67, USD_EUR: 0.92,
      USD_GBP: 0.79, EUR_USD: 1.09, GBP_USD: 1.27, SAR_EGP: 8.24, AED_EGP: 8.42,
    };

    const key = `${from}_${to}`;
    const reverseKey = `${to}_${from}`;
    let midRate = rates[key];
    if (!midRate && rates[reverseKey]) midRate = 1 / rates[reverseKey];
    if (!midRate) midRate = 1;

    return {
      fromCurrency: from, toCurrency: to, midRate,
      buyRate: midRate * 0.995, sellRate: midRate * 1.005, source: 'default',
    };
  }

  async getAllRates() {
    return this.prisma.exchangeRate.findMany({
      where: { validUntil: { gt: new Date() } },
      orderBy: { fromCurrency: 'asc' },
    });
  }

  async updateRate(data: {
    fromCurrency: string; toCurrency: string; midRate: number;
    source?: string; validHours?: number;
  }) {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + (data.validHours || 1));
    const spread = 0.005;

    return this.prisma.exchangeRate.create({
      data: {
        fromCurrency: data.fromCurrency, toCurrency: data.toCurrency,
        midRate: data.midRate, buyRate: data.midRate * (1 - spread),
        sellRate: data.midRate * (1 + spread), source: data.source || 'manual', validUntil,
      },
    });
  }

  async getRateHistory(fromCurrency: string, toCurrency: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.exchangeRate.findMany({
      where: { fromCurrency, toCurrency, validFrom: { gte: startDate } },
      orderBy: { validFrom: 'asc' },
    });
  }
}

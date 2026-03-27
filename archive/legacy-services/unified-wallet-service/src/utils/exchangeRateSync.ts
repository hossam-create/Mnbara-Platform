import cron from 'node-cron';
import { Decimal } from 'decimal.js';
import { prisma } from '../index';
import { logger } from './logger';
import { Currency } from '@prisma/client';

// Exchange rate providers configuration
const EXCHANGE_RATE_PROVIDERS = {
  primary: {
    name: 'exchangerate-api',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    apiKey: process.env.EXCHANGE_RATE_API_KEY,
  },
  fallback: {
    name: 'fixer',
    url: 'https://api.fixer.io/latest',
    apiKey: process.env.FIXER_API_KEY,
  },
};

// Supported currencies for our system
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

// Exchange rate sync job - runs every hour
export const startExchangeRateSync = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting exchange rate sync');
    
    try {
      await syncExchangeRates();
      logger.info('Exchange rate sync completed successfully');
    } catch (error) {
      logger.error('Exchange rate sync failed:', error);
    }
  });

  logger.info('Exchange rate sync cron job started - runs every hour');
};

// Sync exchange rates from external providers
const syncExchangeRates = async () => {
  let rates = null;
  
  // Try primary provider first
  try {
    rates = await fetchRatesFromProvider(EXCHANGE_RATE_PROVIDERS.primary);
    logger.info('Successfully fetched rates from primary provider');
  } catch (error) {
    logger.warn('Primary provider failed, trying fallback:', error);
    
    // Try fallback provider
    try {
      rates = await fetchRatesFromProvider(EXCHANGE_RATE_PROVIDERS.fallback);
      logger.info('Successfully fetched rates from fallback provider');
    } catch (fallbackError) {
      logger.error('Both exchange rate providers failed:', fallbackError);
      throw new Error('Failed to fetch exchange rates from all providers');
    }
  }

  if (!rates) {
    throw new Error('No exchange rates available');
  }

  // Update exchange rates in database
  await updateExchangeRates(rates);
};

// Fetch rates from a specific provider
const fetchRatesFromProvider = async (provider: any) => {
  const url = provider.apiKey 
    ? `${provider.url}?access_key=${provider.apiKey}`
    : provider.url;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as any;
  
  // Normalize response format (different providers have different formats)
  if (provider.name === 'exchangerate-api') {
    return data.rates;
  } else if (provider.name === 'fixer') {
    return data.rates;
  }
  
  return data.rates;
};

// Update exchange rates in database
const updateExchangeRates = async (rates: Record<string, number>) => {
  const baseCurrency = 'USD';
  
  // Filter to only supported currencies
  const supportedRates = Object.fromEntries(
    Object.entries(rates).filter(([currency]) => 
      SUPPORTED_CURRENCIES.includes(currency)
    )
  );

  // Update each currency pair
  for (const [targetCurrency, rate] of Object.entries(supportedRates)) {
    if (targetCurrency === baseCurrency) continue;
    
    try {
      const targetCurrencyEnum = targetCurrency as Currency;
      
      // Check if exchange rate already exists (find first active rate)
      const existingRate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: Currency.USD,
          toCurrency: targetCurrencyEnum,
          isActive: true,
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (existingRate) {
        // Update existing rate
        await prisma.exchangeRate.update({
          where: { id: existingRate.id },
          data: {
            rate,
            inverseRate: 1 / rate,
            source: 'external_api',
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new rate
        await prisma.exchangeRate.create({
          data: {
            userId: 'system', // System user for automated rates
            fromCurrency: Currency.USD,
            toCurrency: targetCurrencyEnum,
            rate,
            inverseRate: 1 / rate,
            source: 'external_api',
            isActive: true,
          },
        });
      }

      // Also create the inverse rate
      const inverseRate = 1 / rate;
      
      const existingInverseRate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: targetCurrencyEnum,
          toCurrency: Currency.USD,
          isActive: true,
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (existingInverseRate) {
        await prisma.exchangeRate.update({
          where: { id: existingInverseRate.id },
          data: {
            rate: inverseRate,
            inverseRate: rate,
            source: 'external_api',
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.exchangeRate.create({
          data: {
            userId: 'system', // System user for automated rates
            fromCurrency: targetCurrencyEnum,
            toCurrency: Currency.USD,
            rate: inverseRate,
            inverseRate: rate,
            source: 'external_api',
            isActive: true,
          },
        });
      }

      logger.info(`Updated exchange rate: ${baseCurrency} → ${targetCurrency} = ${rate}`);
      
    } catch (error) {
      logger.error(`Failed to update exchange rate for ${targetCurrency}:`, error instanceof Error ? error.message : String(error));
    }
  }
};

// Manual exchange rate update (for admin use)
export const updateManualExchangeRate = async (
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  updatedBy: string
) => {
  try {
    const fromCurrencyEnum = fromCurrency as Currency;
    const toCurrencyEnum = toCurrency as Currency;
    
    const existingRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: fromCurrencyEnum,
        toCurrency: toCurrencyEnum,
        isActive: true,
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (existingRate) {
      await prisma.exchangeRate.update({
        where: { id: existingRate.id },
        data: {
          rate,
          source: 'manual',
        },
      });
    } else {
      await prisma.exchangeRate.create({
        data: {
          userId: updatedBy,
          fromCurrency: fromCurrencyEnum,
          toCurrency: toCurrencyEnum,
          rate,
          inverseRate: new Decimal(1).div(rate).toDecimalPlaces(8),
          source: 'manual',
        },
      });
    }

    logger.info(`Manually updated exchange rate: ${fromCurrency} → ${toCurrency} = ${rate} by user ${updatedBy}`);
    
  } catch (error) {
    logger.error(`Failed to manually update exchange rate:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
};
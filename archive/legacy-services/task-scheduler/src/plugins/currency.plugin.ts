// Currency Plugin - Update currency exchange rates
import { Plugin, ExecutionContext, PluginResult } from '../types/task.types';
import axios from 'axios';

export class CurrencyPlugin implements Plugin {
  name = 'currency-updater';
  description = 'Update currency exchange rates from OpenExchangeRates';

  async execute(params: any, context: ExecutionContext): Promise<PluginResult> {
    try {
      context.logger.info('Starting currency update');

      const provider = params.provider || 'openexchangerates';
      const baseCurrency = params.baseCurrency || 'USD';

      let rates: any;

      if (provider === 'openexchangerates') {
        rates = await this.fetchFromOpenExchangeRates(baseCurrency, context);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      // Update database
      await this.updateDatabase(rates, context);

      context.logger.info(`Updated ${Object.keys(rates).length} currency rates`);

      return {
        success: true,
        data: {
          provider,
          baseCurrency,
          ratesCount: Object.keys(rates).length,
          rates
        }
      };

    } catch (error: any) {
      context.logger.error(`Currency plugin failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async fetchFromOpenExchangeRates(baseCurrency: string, context: ExecutionContext) {
    const apiKey = process.env.OPENEXCHANGERATES_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENEXCHANGERATES_API_KEY not configured');
    }

    context.logger.info(`Fetching rates from OpenExchangeRates (base: ${baseCurrency})`);

    const response = await axios.get('https://openexchangerates.org/api/latest.json', {
      params: {
        app_id: apiKey,
        base: baseCurrency
      }
    });

    return response.data.rates;
  }

  private async updateDatabase(rates: any, context: ExecutionContext) {
    context.logger.info('Updating currency rates in database');

    // TODO: Update your database with the rates
    // Example:
    // await prisma.currencyRate.createMany({
    //   data: Object.entries(rates).map(([currency, rate]) => ({
    //     currency,
    //     rate: rate as number,
    //     updatedAt: new Date()
    //   }))
    // });

    context.logger.info('Database updated successfully');
  }
}

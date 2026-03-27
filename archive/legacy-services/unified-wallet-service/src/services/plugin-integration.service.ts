import { PluginManager } from '@mnbara/plugin-manager';
import { HookSystem } from '@mnbara/hook-system';
import { PluginMarketplace } from '@mnbara/plugin-marketplace';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class PluginIntegrationService {
  private pluginManager: PluginManager;
  private hookSystem: HookSystem;
  private marketplace: PluginMarketplace;
  private static instance: PluginIntegrationService;

  private constructor(private prisma: PrismaClient) {
    this.hookSystem = new HookSystem();
    this.pluginManager = new PluginManager(prisma, this.hookSystem, {
      pluginDirectory: './plugins',
      enableSandbox: true,
      enableMarketplace: true,
      autoRegisterHooks: true,
    });
    this.marketplace = new PluginMarketplace(prisma);
    this.initializeHooks();
  }

  static getInstance(prisma: PrismaClient): PluginIntegrationService {
    if (!PluginIntegrationService.instance) {
      PluginIntegrationService.instance = new PluginIntegrationService(prisma);
    }
    return PluginIntegrationService.instance;
  }

  private initializeHooks() {
    // Wallet-related hooks
    this.hookSystem.registerHook('wallet:created', 'Fired when a new wallet is created');
    this.hookSystem.registerHook('wallet:updated', 'Fired when wallet details are updated');
    this.hookSystem.registerHook('wallet:deleted', 'Fired when a wallet is deleted');

    // Transaction-related hooks
    this.hookSystem.registerHook('transaction:initiated', 'Fired when a transaction is initiated');
    this.hookSystem.registerHook('transaction:completed', 'Fired when a transaction is completed');
    this.hookSystem.registerHook('transaction:failed', 'Fired when a transaction fails');
    this.hookSystem.registerHook('transaction:refunded', 'Fired when a transaction is refunded');

    // Payout-related hooks
    this.hookSystem.registerHook('payout:created', 'Fired when a payout is created');
    this.hookSystem.registerHook('payout:processed', 'Fired when a payout is processed');
    this.hookSystem.registerHook('payout:failed', 'Fired when a payout fails');

    // KYC-related hooks
    this.hookSystem.registerHook('kyc:submitted', 'Fired when KYC is submitted');
    this.hookSystem.registerHook('kyc:approved', 'Fired when KYC is approved');
    this.hookSystem.registerHook('kyc:rejected', 'Fired when KYC is rejected');

    // Exchange-related hooks
    this.hookSystem.registerHook('exchange:rate_updated', 'Fired when exchange rates are updated');

    // Settlement-related hooks
    this.hookSystem.registerHook('settlement:initiated', 'Fired when settlement is initiated');
    this.hookSystem.registerHook('settlement:completed', 'Fired when settlement is completed');
    this.hookSystem.registerHook('settlement:failed', 'Fired when settlement fails');

    // System-wide hooks
    this.hookSystem.registerHook('system:maintenance', 'Fired during system maintenance');
    this.hookSystem.registerHook('system:alert', 'Fired for system alerts');

    logger.info('Plugin hooks initialized for unified wallet service');
  }

  // Wallet hooks
  async onWalletCreated(walletData: any) {
    try {
      await this.hookSystem.executeHooks('wallet:created', walletData);
      logger.info(`Plugin hook executed: wallet:created for wallet ${walletData.id}`);
    } catch (error) {
      logger.error('Error executing wallet:created hook:', error);
    }
  }

  async onWalletUpdated(walletData: any) {
    try {
      await this.hookSystem.executeHooks('wallet:updated', walletData);
      logger.info(`Plugin hook executed: wallet:updated for wallet ${walletData.id}`);
    } catch (error) {
      logger.error('Error executing wallet:updated hook:', error);
    }
  }

  async onWalletDeleted(walletData: any) {
    try {
      await this.hookSystem.executeHooks('wallet:deleted', walletData);
      logger.info(`Plugin hook executed: wallet:deleted for wallet ${walletData.id}`);
    } catch (error) {
      logger.error('Error executing wallet:deleted hook:', error);
    }
  }

  // Transaction hooks
  async onTransactionInitiated(transactionData: any) {
    try {
      await this.hookSystem.executeHooks('transaction:initiated', transactionData);
      logger.info(`Plugin hook executed: transaction:initiated for transaction ${transactionData.id}`);
    } catch (error) {
      logger.error('Error executing transaction:initiated hook:', error);
    }
  }

  async onTransactionCompleted(transactionData: any) {
    try {
      await this.hookSystem.executeHooks('transaction:completed', transactionData);
      logger.info(`Plugin hook executed: transaction:completed for transaction ${transactionData.id}`);
    } catch (error) {
      logger.error('Error executing transaction:completed hook:', error);
    }
  }

  async onTransactionFailed(transactionData: any) {
    try {
      await this.hookSystem.executeHooks('transaction:failed', transactionData);
      logger.info(`Plugin hook executed: transaction:failed for transaction ${transactionData.id}`);
    } catch (error) {
      logger.error('Error executing transaction:failed hook:', error);
    }
  }

  async onTransactionRefunded(transactionData: any) {
    try {
      await this.hookSystem.executeHooks('transaction:refunded', transactionData);
      logger.info(`Plugin hook executed: transaction:refunded for transaction ${transactionData.id}`);
    } catch (error) {
      logger.error('Error executing transaction:refunded hook:', error);
    }
  }

  // Payout hooks
  async onPayoutCreated(payoutData: any) {
    try {
      await this.hookSystem.executeHooks('payout:created', payoutData);
      logger.info(`Plugin hook executed: payout:created for payout ${payoutData.id}`);
    } catch (error) {
      logger.error('Error executing payout:created hook:', error);
    }
  }

  async onPayoutProcessed(payoutData: any) {
    try {
      await this.hookSystem.executeHooks('payout:processed', payoutData);
      logger.info(`Plugin hook executed: payout:processed for payout ${payoutData.id}`);
    } catch (error) {
      logger.error('Error executing payout:processed hook:', error);
    }
  }

  async onPayoutFailed(payoutData: any) {
    try {
      await this.hookSystem.executeHooks('payout:failed', payoutData);
      logger.info(`Plugin hook executed: payout:failed for payout ${payoutData.id}`);
    } catch (error) {
      logger.error('Error executing payout:failed hook:', error);
    }
  }

  // KYC hooks
  async onKYCSubmitted(kycData: any) {
    try {
      await this.hookSystem.executeHooks('kyc:submitted', kycData);
      logger.info(`Plugin hook executed: kyc:submitted for user ${kycData.userId}`);
    } catch (error) {
      logger.error('Error executing kyc:submitted hook:', error);
    }
  }

  async onKYCApproved(kycData: any) {
    try {
      await this.hookSystem.executeHooks('kyc:approved', kycData);
      logger.info(`Plugin hook executed: kyc:approved for user ${kycData.userId}`);
    } catch (error) {
      logger.error('Error executing kyc:approved hook:', error);
    }
  }

  async onKYCRejected(kycData: any) {
    try {
      await this.hookSystem.executeHooks('kyc:rejected', kycData);
      logger.info(`Plugin hook executed: kyc:rejected for user ${kycData.userId}`);
    } catch (error) {
      logger.error('Error executing kyc:rejected hook:', error);
    }
  }

  // Exchange hooks
  async onExchangeRateUpdated(rateData: any) {
    try {
      await this.hookSystem.executeHooks('exchange:rate_updated', rateData);
      logger.info('Plugin hook executed: exchange:rate_updated');
    } catch (error) {
      logger.error('Error executing exchange:rate_updated hook:', error);
    }
  }

  // Settlement hooks
  async onSettlementInitiated(settlementData: any) {
    try {
      await this.hookSystem.executeHooks('settlement:initiated', settlementData);
      logger.info(`Plugin hook executed: settlement:initiated for settlement ${settlementData.id}`);
    } catch (error) {
      logger.error('Error executing settlement:initiated hook:', error);
    }
  }

  async onSettlementCompleted(settlementData: any) {
    try {
      await this.hookSystem.executeHooks('settlement:completed', settlementData);
      logger.info(`Plugin hook executed: settlement:completed for settlement ${settlementData.id}`);
    } catch (error) {
      logger.error('Error executing settlement:completed hook:', error);
    }
  }

  async onSettlementFailed(settlementData: any) {
    try {
      await this.hookSystem.executeHooks('settlement:failed', settlementData);
      logger.info(`Plugin hook executed: settlement:failed for settlement ${settlementData.id}`);
    } catch (error) {
      logger.error('Error executing settlement:failed hook:', error);
    }
  }

  // System hooks
  async onSystemMaintenance(maintenanceData: any) {
    try {
      await this.hookSystem.executeHooks('system:maintenance', maintenanceData);
      logger.info('Plugin hook executed: system:maintenance');
    } catch (error) {
      logger.error('Error executing system:maintenance hook:', error);
    }
  }

  async onSystemAlert(alertData: any) {
    try {
      await this.hookSystem.executeHooks('system:alert', alertData);
      logger.info('Plugin hook executed: system:alert');
    } catch (error) {
      logger.error('Error executing system:alert hook:', error);
    }
  }

  // Plugin management methods
  async getInstalledPlugins() {
    return this.pluginManager.getInstalledPlugins();
  }

  async installPlugin(pluginIdentifier: string, options?: any) {
    return this.pluginManager.installPlugin(pluginIdentifier, options);
  }

  async activatePlugin(pluginName: string) {
    return this.pluginManager.activatePlugin(pluginName);
  }

  async deactivatePlugin(pluginName: string) {
    return this.pluginManager.deactivatePlugin(pluginName);
  }

  async uninstallPlugin(pluginName: string, options?: any) {
    return this.pluginManager.uninstallPlugin(pluginName, options);
  }

  async updatePluginConfig(pluginName: string, config: any) {
    return this.pluginManager.updatePluginConfig(pluginName, config);
  }

  async searchMarketplacePlugins(options?: any) {
    return this.marketplace.searchPlugins(options);
  }

  async getPluginDetails(pluginName: string) {
    return this.marketplace.getPluginDetails(pluginName);
  }

  async ratePlugin(pluginName: string, userId: string, rating: number, review?: string) {
    return this.marketplace.ratePlugin(pluginName, userId, rating, review);
  }

  // Health check
  async getHealthStatus() {
    const plugins = await this.getInstalledPlugins();
    const activePlugins = plugins.filter(p => p.status === 'active');
    
    return {
      status: 'healthy',
      totalPlugins: plugins.length,
      activePlugins: activePlugins.length,
      hookSystem: {
        registeredHooks: this.hookSystem.getRegisteredHooks().length,
      },
      marketplace: {
        available: true,
      },
    };
  }
}
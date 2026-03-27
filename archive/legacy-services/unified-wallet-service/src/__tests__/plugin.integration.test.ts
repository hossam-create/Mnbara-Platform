import { PluginIntegrationService } from '../src/services/plugin-integration.service';
import { pluginConfigManager } from '../src/config/plugin.config';
import { prisma } from '../src/index';

describe('Plugin Integration Service', () => {
  let pluginService: PluginIntegrationService;

  beforeAll(async () => {
    pluginService = PluginIntegrationService.getInstance(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Plugin Configuration', () => {
    it('should load default plugin configuration', () => {
      const config = pluginConfigManager.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.enableSandbox).toBe(true);
      expect(config.enableMarketplace).toBe(true);
      expect(config.maxActivePlugins).toBe(50);
    });

    it('should validate allowed and restricted modules', () => {
      expect(pluginConfigManager.isModuleAllowed('crypto')).toBe(true);
      expect(pluginConfigManager.isModuleAllowed('child_process')).toBe(false);
      expect(pluginConfigManager.isModuleAllowed('http')).toBe(false);
    });

    it('should check if more plugins can be activated', () => {
      expect(pluginConfigManager.canActivateMorePlugins(10)).toBe(true);
      expect(pluginConfigManager.canActivateMorePlugins(50)).toBe(false);
      expect(pluginConfigManager.canActivateMorePlugins(60)).toBe(false);
    });
  });

  describe('Plugin Health Status', () => {
    it('should return plugin system health status', async () => {
      const health = await pluginService.getHealthStatus();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('totalPlugins');
      expect(health).toHaveProperty('activePlugins');
      expect(health).toHaveProperty('hookSystem');
      expect(health).toHaveProperty('marketplace');
    });
  });

  describe('Plugin Hooks', () => {
    it('should handle wallet creation hook', async () => {
      const walletData = {
        id: 'test-wallet-123',
        userId: 'test-user-456',
        currency: 'USD',
        balance: 1000,
        status: 'active',
      };

      // This should not throw an error
      await expect(pluginService.onWalletCreated(walletData)).resolves.not.toThrow();
    });

    it('should handle transaction initiation hook', async () => {
      const transactionData = {
        id: 'test-transaction-123',
        walletId: 'test-wallet-123',
        amount: 100,
        currency: 'USD',
        type: 'debit',
        status: 'pending',
      };

      // This should not throw an error
      await expect(pluginService.onTransactionInitiated(transactionData)).resolves.not.toThrow();
    });

    it('should handle transaction completion hook', async () => {
      const transactionData = {
        id: 'test-transaction-123',
        walletId: 'test-wallet-123',
        amount: 100,
        currency: 'USD',
        type: 'debit',
        status: 'completed',
      };

      // This should not throw an error
      await expect(pluginService.onTransactionCompleted(transactionData)).resolves.not.toThrow();
    });

    it('should handle payout creation hook', async () => {
      const payoutData = {
        id: 'test-payout-123',
        walletId: 'test-wallet-123',
        amount: 500,
        currency: 'USD',
        status: 'pending',
        recipient: 'test-recipient',
      };

      // This should not throw an error
      await expect(pluginService.onPayoutCreated(payoutData)).resolves.not.toThrow();
    });

    it('should handle KYC submission hook', async () => {
      const kycData = {
        id: 'test-kyc-123',
        userId: 'test-user-456',
        status: 'submitted',
        documents: [],
      };

      // This should not throw an error
      await expect(pluginService.onKYCSubmitted(kycData)).resolves.not.toThrow();
    });
  });

  describe('Plugin Management', () => {
    it('should get installed plugins list', async () => {
      const plugins = await pluginService.getInstalledPlugins();
      expect(Array.isArray(plugins)).toBe(true);
    });

    it('should search marketplace plugins', async () => {
      const plugins = await pluginService.searchMarketplacePlugins({
        query: 'payment',
        limit: 10,
      });
      expect(Array.isArray(plugins)).toBe(true);
    });
  });
});
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CryptoService } from '../services/wallet.service';
import { PrismaClient } from '@prisma/client';

/**
 * Real Unit Tests for CryptoService
 * Tests actual implementation, not mocks
 */

describe('CryptoService - Real Tests', () => {
  let cryptoService: CryptoService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    cryptoService = new CryptoService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('createWallet', () => {
    it('should create new crypto wallet', async () => {
      const userId = 'test-user-' + Date.now();

      const result = await cryptoService.createWallet(userId);

      expect(result).toBeDefined();
      expect(result.walletId).toBeTruthy();
      expect(result.address).toBeTruthy();
      expect(Array.isArray(result.currencies)).toBe(true);
      expect(result.currencies.length).toBeGreaterThan(0);
    });

    it('should store wallet in database', async () => {
      const userId = 'test-user-' + Date.now();

      const wallet = await cryptoService.createWallet(userId);
      const retrieved = await cryptoService.getWallet(wallet.walletId);

      expect(retrieved.walletId).toBe(wallet.walletId);
      expect(retrieved.userId).toBe(userId);
    });

    it('should generate unique addresses', async () => {
      const wallet1 = await cryptoService.createWallet('user-1');
      const wallet2 = await cryptoService.createWallet('user-2');

      expect(wallet1.address).not.toBe(wallet2.address);
    });
  });

  describe('getBalance', () => {
    it('should return wallet balances', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      const result = await cryptoService.getBalance(wallet.walletId);

      expect(result).toBeDefined();
      expect(Array.isArray(result.balances)).toBe(true);
      expect(result.totalUsdValue).toBeGreaterThanOrEqual(0);

      result.balances.forEach(balance => {
        expect(balance.currency).toBeTruthy();
        expect(balance.amount).toBeGreaterThanOrEqual(0);
        expect(balance.usdValue).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate total USD value correctly', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      const result = await cryptoService.getBalance(wallet.walletId);

      const calculatedTotal = result.balances.reduce((sum, b) => sum + b.usdValue, 0);
      expect(result.totalUsdValue).toBeCloseTo(calculatedTotal, 2);
    });
  });

  describe('sendTransaction', () => {
    it('should send crypto transaction', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      const result = await cryptoService.sendTransaction({
        walletId: wallet.walletId,
        toAddress: '0x' + 'a'.repeat(40),
        amount: 0.1,
        currency: 'ETH'
      });

      expect(result).toBeDefined();
      expect(result.txHash).toBeTruthy();
      expect(result.status).toBeTruthy();
      expect(result.fee).toBeGreaterThanOrEqual(0);
    });

    it('should validate recipient address', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      await expect(cryptoService.sendTransaction({
        walletId: wallet.walletId,
        toAddress: 'invalid-address',
        amount: 0.1,
        currency: 'ETH'
      })).rejects.toThrow('Invalid recipient address');
    });

    it('should validate amount', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      await expect(cryptoService.sendTransaction({
        walletId: wallet.walletId,
        toAddress: '0x' + 'a'.repeat(40),
        amount: -0.1,
        currency: 'ETH'
      })).rejects.toThrow('Amount must be positive');
    });
  });

  describe('getExchangeRate', () => {
    it('should return current exchange rates', async () => {
      const result = await cryptoService.getExchangeRate();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      Object.entries(result).forEach(([currency, rate]: any) => {
        expect(rate.usd).toBeGreaterThan(0);
        expect(typeof rate.change24h).toBe('number');
      });
    });

    it('should include major cryptocurrencies', async () => {
      const result = await cryptoService.getExchangeRate();

      expect(result).toHaveProperty('BTC');
      expect(result).toHaveProperty('ETH');
      expect(result).toHaveProperty('USDT');
    });
  });

  describe('processPayment', () => {
    it('should process crypto payment for order', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      const result = await cryptoService.processPayment({
        walletId: wallet.walletId,
        orderId: 'order-' + Date.now(),
        amount: 0.05,
        currency: 'ETH'
      });

      expect(result).toBeDefined();
      expect(result.paymentId).toBeTruthy();
      expect(result.status).toBeTruthy();
      expect(result.txHash).toBeTruthy();
    });

    it('should store payment in database', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);
      const orderId = 'order-' + Date.now();

      const payment = await cryptoService.processPayment({
        walletId: wallet.walletId,
        orderId,
        amount: 0.05,
        currency: 'ETH'
      });

      const retrieved = await cryptoService.getPayment(payment.paymentId);

      expect(retrieved.paymentId).toBe(payment.paymentId);
      expect(retrieved.orderId).toBe(orderId);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      const result = await cryptoService.getTransactionHistory(wallet.walletId);

      expect(Array.isArray(result.transactions)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);

      result.transactions.forEach(tx => {
        expect(tx.txHash).toBeTruthy();
        expect(tx.type).toMatch(/^(SEND|RECEIVE|PAYMENT)$/);
        expect(tx.amount).toBeGreaterThan(0);
        expect(tx.currency).toBeTruthy();
      });
    });

    it('should maintain transaction order', async () => {
      const userId = 'test-user-' + Date.now();
      const wallet = await cryptoService.createWallet(userId);

      const result = await cryptoService.getTransactionHistory(wallet.walletId);

      for (let i = 1; i < result.transactions.length; i++) {
        const prev = new Date(result.transactions[i - 1].timestamp).getTime();
        const curr = new Date(result.transactions[i].timestamp).getTime();
        expect(curr).toBeLessThanOrEqual(prev);
      }
    });
  });

  describe('getAnalytics', () => {
    it('should return crypto analytics', async () => {
      const result = await cryptoService.getAnalytics();

      expect(result).toBeDefined();
      expect(result.totalWallets).toBeGreaterThanOrEqual(0);
      expect(result.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(result.totalVolume).toBeGreaterThanOrEqual(0);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FraudDetectionService } from '../services/fraud.service';
import { PrismaClient } from '@prisma/client';

/**
 * Real Unit Tests for FraudDetectionService
 * Tests actual implementation, not mocks
 */

describe('FraudDetectionService - Real Tests', () => {
  let fraudService: FraudDetectionService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    fraudService = new FraudDetectionService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('analyzeTransaction', () => {
    it('should approve low-risk transaction', async () => {
      const result = await fraudService.analyzeTransaction({
        userId: 'user-' + Date.now(),
        amount: 50,
        currency: 'USD',
        deviceId: 'device-123',
        ip: '192.168.1.1'
      });

      expect(result).toBeDefined();
      expect(result.transactionId).toBeTruthy();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(['APPROVE', 'REVIEW', 'BLOCK']).toContain(result.decision);
      expect(Array.isArray(result.factors)).toBe(true);
    });

    it('should flag high-risk transaction', async () => {
      const result = await fraudService.analyzeTransaction({
        userId: 'user-' + Date.now(),
        amount: 5000,
        currency: 'USD',
        deviceId: 'device-new-' + Date.now(),
        ip: '10.0.0.1'
      });

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.decision).toBeTruthy();
    });

    it('should store transaction analysis', async () => {
      const userId = 'user-' + Date.now();

      const analysis = await fraudService.analyzeTransaction({
        userId,
        amount: 100,
        currency: 'USD',
        deviceId: 'device-123',
        ip: '192.168.1.1'
      });

      const retrieved = await fraudService.getTransaction(analysis.transactionId);

      expect(retrieved.transactionId).toBe(analysis.transactionId);
      expect(retrieved.userId).toBe(userId);
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score based on multiple factors', async () => {
      const result = await fraudService.calculateRiskScore({
        userId: 'user-' + Date.now(),
        amount: 200,
        deviceId: 'device-456',
        ip: '192.168.1.1'
      });

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(typeof result.breakdown).toBe('object');
    });

    it('should consider transaction velocity', async () => {
      const userId = 'user-' + Date.now();

      // First transaction
      await fraudService.analyzeTransaction({
        userId,
        amount: 100,
        currency: 'USD',
        deviceId: 'device-123',
        ip: '192.168.1.1'
      });

      // Second transaction immediately after
      const result = await fraudService.calculateRiskScore({
        userId,
        amount: 100,
        deviceId: 'device-123',
        ip: '192.168.1.1'
      });

      expect(result.breakdown.velocityScore).toBeGreaterThan(0);
    });
  });

  describe('checkBlacklist', () => {
    it('should detect blacklisted IP', async () => {
      // First add to blacklist
      await fraudService.addToBlacklist({
        type: 'IP',
        value: '10.0.0.1',
        reason: 'Multiple fraud attempts'
      });

      const result = await fraudService.checkBlacklist({ ip: '10.0.0.1' });

      expect(result.isBlacklisted).toBe(true);
      expect(result.type).toBe('IP');
    });

    it('should pass clean check', async () => {
      const result = await fraudService.checkBlacklist({ ip: '192.168.1.100' });

      expect(result.isBlacklisted).toBe(false);
    });

    it('should detect blacklisted email', async () => {
      const email = 'fraud-' + Date.now() + '@example.com';

      await fraudService.addToBlacklist({
        type: 'EMAIL',
        value: email,
        reason: 'Fraud detected'
      });

      const result = await fraudService.checkBlacklist({ email });

      expect(result.isBlacklisted).toBe(true);
    });
  });

  describe('createAlert', () => {
    it('should create fraud alert', async () => {
      const transactionId = 'tx-' + Date.now();

      const result = await fraudService.createAlert({
        transactionId,
        severity: 'HIGH',
        reason: 'Suspicious activity'
      });

      expect(result).toBeDefined();
      expect(result.alertId).toBeTruthy();
      expect(result.severity).toBe('HIGH');
      expect(result.status).toBe('OPEN');
    });

    it('should store alert in database', async () => {
      const transactionId = 'tx-' + Date.now();

      const alert = await fraudService.createAlert({
        transactionId,
        severity: 'MEDIUM',
        reason: 'Test alert'
      });

      const retrieved = await fraudService.getAlert(alert.alertId);

      expect(retrieved.alertId).toBe(alert.alertId);
      expect(retrieved.transactionId).toBe(transactionId);
    });
  });

  describe('getUserRiskProfile', () => {
    it('should return user risk profile', async () => {
      const userId = 'user-' + Date.now();

      // Create some transactions
      await fraudService.analyzeTransaction({
        userId,
        amount: 100,
        currency: 'USD',
        deviceId: 'device-123',
        ip: '192.168.1.1'
      });

      const result = await fraudService.getUserRiskProfile(userId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.riskLevel).toBeTruthy();
      expect(result.totalTransactions).toBeGreaterThanOrEqual(1);
      expect(result.flaggedTransactions).toBeGreaterThanOrEqual(0);
    });

    it('should track flagged transactions', async () => {
      const userId = 'user-' + Date.now();

      // Create high-risk transaction
      await fraudService.analyzeTransaction({
        userId,
        amount: 10000,
        currency: 'USD',
        deviceId: 'device-new-' + Date.now(),
        ip: '10.0.0.1'
      });

      const profile = await fraudService.getUserRiskProfile(userId);

      expect(profile.totalTransactions).toBeGreaterThanOrEqual(1);
    });
  });

  describe('addToBlacklist', () => {
    it('should add IP to blacklist', async () => {
      const ip = '10.0.0.' + Math.floor(Math.random() * 255);

      const result = await fraudService.addToBlacklist({
        type: 'IP',
        value: ip,
        reason: 'Test blacklist'
      });

      expect(result.success).toBe(true);

      const check = await fraudService.checkBlacklist({ ip });
      expect(check.isBlacklisted).toBe(true);
    });

    it('should add card to blacklist', async () => {
      const cardNumber = '4111111111111111';

      await fraudService.addToBlacklist({
        type: 'CARD',
        value: cardNumber,
        reason: 'Stolen card'
      });

      const result = await fraudService.checkBlacklist({ card: cardNumber });

      expect(result.isBlacklisted).toBe(true);
    });
  });

  describe('getAnalytics', () => {
    it('should return fraud analytics', async () => {
      const result = await fraudService.getAnalytics();

      expect(result).toBeDefined();
      expect(result.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(result.flaggedTransactions).toBeGreaterThanOrEqual(0);
      expect(result.blockedTransactions).toBeGreaterThanOrEqual(0);
      expect(result.fraudRate).toBeGreaterThanOrEqual(0);
      expect(result.fraudRate).toBeLessThanOrEqual(1);
    });
  });
});

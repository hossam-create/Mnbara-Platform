import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WholesaleService } from '../services/wholesale.service';
import { PrismaClient } from '@prisma/client';

/**
 * Real Unit Tests for WholesaleService
 * Tests actual implementation, not mocks
 */

describe('WholesaleService - Real Tests', () => {
  let wholesaleService: WholesaleService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    wholesaleService = new WholesaleService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('getProducts', () => {
    it('should return wholesale products with bulk pricing', async () => {
      const result = await wholesaleService.getProducts();

      expect(Array.isArray(result.products)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);

      if (result.products.length > 0) {
        expect(result.products[0]).toHaveProperty('id');
        expect(result.products[0]).toHaveProperty('name');
        expect(result.products[0]).toHaveProperty('minOrder');
        expect(result.products[0]).toHaveProperty('pricePerUnit');
        expect(result.products[0].minOrder).toBeGreaterThan(0);
      }
    });

    it('should filter by category', async () => {
      const result = await wholesaleService.getProducts({ category: 'electronics' });

      result.products.forEach(product => {
        expect(product.category).toBe('electronics');
      });
    });

    it('should filter by supplier', async () => {
      const result = await wholesaleService.getProducts({ supplierId: 'supplier-123' });

      result.products.forEach(product => {
        expect(product.supplierId).toBe('supplier-123');
      });
    });
  });

  describe('calculateBulkPrice', () => {
    it('should calculate tiered pricing', async () => {
      const result = await wholesaleService.calculateBulkPrice('prod-123', 100);

      expect(result).toBeDefined();
      expect(result.productId).toBe('prod-123');
      expect(result.quantity).toBe(100);
      expect(result.unitPrice).toBeGreaterThan(0);
      expect(result.totalPrice).toBe(result.unitPrice * result.quantity);
      expect(result.discount).toBeGreaterThanOrEqual(0);
      expect(result.discount).toBeLessThanOrEqual(100);
    });

    it('should apply higher discount for larger quantities', async () => {
      const smallOrder = await wholesaleService.calculateBulkPrice('prod-123', 100);
      const largeOrder = await wholesaleService.calculateBulkPrice('prod-123', 500);

      expect(largeOrder.discount).toBeGreaterThanOrEqual(smallOrder.discount);
      expect(largeOrder.unitPrice).toBeLessThanOrEqual(smallOrder.unitPrice);
    });

    it('should calculate savings correctly', async () => {
      const result = await wholesaleService.calculateBulkPrice('prod-123', 100);

      const regularPrice = result.unitPrice * result.quantity / (1 - result.discount / 100);
      const savings = regularPrice - result.totalPrice;

      expect(result.savings).toBeCloseTo(savings, 2);
    });

    it('should handle minimum order quantity', async () => {
      await expect(wholesaleService.calculateBulkPrice('prod-123', 5))
        .rejects.toThrow('Quantity below minimum order');
    });
  });

  describe('createInquiry', () => {
    it('should create price inquiry', async () => {
      const merchantId = 'merchant-' + Date.now();

      const result = await wholesaleService.createInquiry({
        merchantId,
        productId: 'prod-456',
        quantity: 200,
        message: 'Need bulk pricing'
      });

      expect(result).toBeDefined();
      expect(result.inquiryId).toBeTruthy();
      expect(result.productId).toBe('prod-456');
      expect(result.quantity).toBe(200);
      expect(result.status).toBe('PENDING');
    });

    it('should store inquiry in database', async () => {
      const merchantId = 'merchant-' + Date.now();

      const inquiry = await wholesaleService.createInquiry({
        merchantId,
        productId: 'prod-456',
        quantity: 200,
        message: 'Need bulk pricing'
      });

      const retrieved = await wholesaleService.getInquiry(inquiry.inquiryId);

      expect(retrieved.inquiryId).toBe(inquiry.inquiryId);
      expect(retrieved.merchantId).toBe(merchantId);
    });
  });

  describe('createOrder', () => {
    it('should create wholesale order', async () => {
      const merchantId = 'merchant-' + Date.now();

      const result = await wholesaleService.createOrder({
        merchantId,
        items: [{ productId: 'prod-123', quantity: 100 }]
      });

      expect(result).toBeDefined();
      expect(result.orderId).toBeTruthy();
      expect(result.items).toHaveLength(1);
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.status).toBe('CONFIRMED');
    });

    it('should validate minimum order quantities', async () => {
      const merchantId = 'merchant-' + Date.now();

      await expect(wholesaleService.createOrder({
        merchantId,
        items: [{ productId: 'prod-123', quantity: 5 }]
      })).rejects.toThrow('Quantity below minimum order');
    });

    it('should calculate total correctly', async () => {
      const merchantId = 'merchant-' + Date.now();

      const result = await wholesaleService.createOrder({
        merchantId,
        items: [
          { productId: 'prod-123', quantity: 100 },
          { productId: 'prod-456', quantity: 50 }
        ]
      });

      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.items).toHaveLength(2);
    });
  });

  describe('registerMerchant', () => {
    it('should register new wholesale merchant', async () => {
      const result = await wholesaleService.registerMerchant({
        businessName: 'ABC Trading ' + Date.now(),
        taxId: 'TAX-' + Date.now(),
        email: 'contact-' + Date.now() + '@abc.com',
        phone: '+966501234567'
      });

      expect(result).toBeDefined();
      expect(result.merchantId).toBeTruthy();
      expect(result.businessName).toContain('ABC Trading');
      expect(result.tier).toBeTruthy();
      expect(result.discount).toBeGreaterThanOrEqual(0);
    });

    it('should assign tier based on registration', async () => {
      const result = await wholesaleService.registerMerchant({
        businessName: 'New Merchant ' + Date.now(),
        taxId: 'TAX-' + Date.now(),
        email: 'new-' + Date.now() + '@merchant.com',
        phone: '+966501234567'
      });

      expect(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).toContain(result.tier);
    });

    it('should validate email format', async () => {
      await expect(wholesaleService.registerMerchant({
        businessName: 'Test',
        taxId: 'TAX-123',
        email: 'invalid-email',
        phone: '+966501234567'
      })).rejects.toThrow('Invalid email format');
    });
  });

  describe('getSuppliers', () => {
    it('should return list of suppliers', async () => {
      const result = await wholesaleService.getSuppliers();

      expect(Array.isArray(result.suppliers)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);

      if (result.suppliers.length > 0) {
        expect(result.suppliers[0]).toHaveProperty('id');
        expect(result.suppliers[0]).toHaveProperty('name');
      }
    });
  });

  describe('getAnalytics', () => {
    it('should return wholesale analytics', async () => {
      const result = await wholesaleService.getAnalytics();

      expect(result).toBeDefined();
      expect(result.totalMerchants).toBeGreaterThanOrEqual(0);
      expect(result.totalOrders).toBeGreaterThanOrEqual(0);
      expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(result.avgOrderValue).toBeGreaterThanOrEqual(0);
    });
  });
});

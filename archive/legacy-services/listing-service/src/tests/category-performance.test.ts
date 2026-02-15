import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../app';

const prisma = new PrismaClient();

describe('Category Performance Tests', () => {
  let testCategories: any[] = [];

  beforeAll(async () => {
    // Create test data for performance testing
    await createTestCategoryData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Category List Performance', () => {
    it('should fetch categories within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories')
        .query({
          includeStats: 'true',
          includeChildren: 'false',
          limit: 100
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should handle large category lists efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories')
        .query({
          limit: 1000,
          includeStats: 'true'
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should handle 1000 items within 1s
      expect(response.data.data.length).toBeGreaterThan(100);
    });

    it('should apply filters efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories')
        .query({
          level: 1,
          includeStats: 'true',
          limit: 50
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Filtered queries should be faster
      expect(response.data.data.every((cat: any) => cat.level === 1)).toBe(true);
    });
  });

  describe('Category Tree Performance', () => {
    it('should build category tree efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories/tree')
        .query({
          maxDepth: 3,
          includeStats: 'true'
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(800); // Tree building should be efficient
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should handle deep category trees', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories/tree')
        .query({
          maxDepth: 5,
          includeStats: 'true'
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1500); // Deep trees should still be performant
    });
  });

  describe('Category Search Performance', () => {
    it('should perform full-text search efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories/search')
        .query({
          q: 'electronics',
          limit: 20
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300); // Search should be very fast
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should handle complex search queries', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories/search')
        .query({
          q: 'mobile phones accessories',
          limit: 50
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(400); // Complex searches should still be fast
    });
  });

  describe('Category Stats Performance', () => {
    it('should fetch category statistics efficiently', async () => {
      const categoryId = testCategories[0]?.id;

      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/categories/${categoryId}/stats`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Stats should be very fast
      expect(response.data.data).toBeDefined();
      expect(response.data.data.productCount).toBeDefined();
    });

    it('should refresh stats efficiently', async () => {
      const categoryId = testCategories[0]?.id;

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/categories/${categoryId}/refresh-stats`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Stats refresh should be reasonable
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = 50;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/categories')
            .query({ limit: 20 })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      results.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(100); // Average should be under 100ms
    });

    it('should handle mixed concurrent requests', async () => {
      const promises = [];

      const startTime = Date.now();

      // Mix different types of requests
      for (let i = 0; i < 20; i++) {
        promises.push(request(app).get('/api/categories').query({ limit: 20 }));
        promises.push(request(app).get('/api/categories/tree'));
        promises.push(request(app).get('/api/categories/search').query({ q: 'test', limit: 10 }));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      results.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      // Average response time should be reasonable even with mixed load
      const avgResponseTime = totalTime / results.length;
      expect(avgResponseTime).toBeLessThan(150);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/categories')
          .query({ limit: 50 });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Query Performance', () => {
    it('should use indexes efficiently', async () => {
      // This test would require database query analysis
      // For now, we'll test response times which indirectly indicate index usage
      
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/categories')
        .query({
          parentId: null, // Should use parent index
          level: 1,      // Should use level index
          limit: 100
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100); // Indexed queries should be very fast
    });
  });

  // Helper functions
  async function createTestCategoryData() {
    // Create test categories for performance testing
    const categories = [];
    
    // Create root categories
    for (let i = 0; i < 10; i++) {
      const category = await prisma.category.create({
        data: {
          name: `Test Category ${i}`,
          nameAr: `فئة اختبار ${i}`,
          slug: `test-category-${i}`,
          level: 1,
          displayOrder: i,
          isActive: true,
          productCount: Math.floor(Math.random() * 1000)
        }
      });
      categories.push(category);
      testCategories.push(category);

      // Create subcategories
      for (let j = 0; j < 5; j++) {
        const subCategory = await prisma.category.create({
          data: {
            name: `Test Subcategory ${i}-${j}`,
            nameAr: `فئة فرعية اختبار ${i}-${j}`,
            slug: `test-subcategory-${i}-${j}`,
            level: 2,
            parentId: category.id,
            displayOrder: j,
            isActive: true,
            productCount: Math.floor(Math.random() * 500)
          }
        });
        categories.push(subCategory);
        testCategories.push(subCategory);
      }
    }

    return categories;
  }

  async function cleanupTestData() {
    // Clean up test categories
    await prisma.category.deleteMany({
      where: {
        slug: {
          startsWith: 'test-'
        }
      }
    });
  }
});

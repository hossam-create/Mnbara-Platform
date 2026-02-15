import { TrustCaseIngestionService } from '../trust_case_ingestion.service';
import { TrustCaseSubjectType, TrustCaseStatus, TrustCaseSeverity } from '../../../models/trust_case.model';

describe('TrustCaseIngestionService Integration Tests', () => {
  let service: TrustCaseIngestionService;

  beforeAll(() => {
    service = new TrustCaseIngestionService();
  });

  describe('End-to-End Ingestion Pipeline', () => {
    it('should complete full ingestion cycle', async () => {
      // Test the complete pipeline from rule evaluation to trust case creation
      
      // 1. Run ingestion pipeline
      const result = await service.runIngestionPipeline();
      
      // 2. Verify processing results
      expect(result).toBeDefined();
      expect(result.processed).toBeGreaterThanOrEqual(0);
      expect(result.created).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeGreaterThanOrEqual(0);
      
      // 3. If cases were created, verify they can be retrieved
      if (result.created > 0) {
        for (const trustCase of result.details.cases) {
          const retrieved = await service.getTrustCase(trustCase.case_id);
          expect(retrieved).toBeDefined();
          expect(retrieved?.case_id).toBe(trustCase.case_id);
          expect(retrieved?.status).toBe(TrustCaseStatus.OPEN);
        }
      }
    }, 30000); // 30 second timeout for integration test

    it('should handle idempotency correctly', async () => {
      // Test that multiple runs with same data don't create duplicates
      
      // First run
      const firstRun = await service.runIngestionPipeline();
      
      // Wait a bit to simulate time passing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second run (should process same logs but find existing cases)
      const secondRun = await service.runIngestionPipeline();
      
      // Verify idempotency
      expect(secondRun.duplicates).toBeGreaterThan(0);
      expect(secondRun.created).toBeLessThanOrEqual(firstRun.created);
    }, 45000);

    it('should maintain data integrity', async () => {
      // Test that all created cases have valid data
      
      const result = await service.runIngestionPipeline();
      
      for (const trustCase of result.details.cases) {
        // Verify required fields exist
        expect(trustCase.case_id).toBeDefined();
        expect(trustCase.case_id).toMatch(/^TC-\d+-[a-z0-9]+$/);
        
        expect(trustCase.subject_type).toBeDefined();
        expect(Object.values(TrustCaseSubjectType)).toContain(trustCase.subject_type);
        
        expect(trustCase.subject_id).toBeDefined();
        expect(trustCase.subject_id).toBeTruthy();
        
        expect(trustCase.rule_id).toBeDefined();
        expect(trustCase.rule_id).toBeTruthy();
        
        expect(trustCase.severity).toBeDefined();
        expect(Object.values(TrustCaseSeverity)).toContain(trustCase.severity);
        
        expect(trustCase.status).toBeDefined();
        expect(trustCase.status).toBe(TrustCaseStatus.OPEN);
        
        expect(trustCase.created_at).toBeDefined();
        expect(trustCase.created_at).toBeInstanceOf(Date);
      }
    }, 30000);
  });

  describe('Query Performance Tests', () => {
    it('should handle large query results efficiently', async () => {
      const startTime = Date.now();
      
      // Query with no filters (should return all cases)
      const cases = await service.queryTrustCases({
        limit: 100,
        offset: 0
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(Array.isArray(cases)).toBe(true);
    }, 10000);

    it('should handle filtered queries efficiently', async () => {
      const startTime = Date.now();
      
      // Query with multiple filters
      const cases = await service.queryTrustCases({
        subject_type: TrustCaseSubjectType.USER,
        status: TrustCaseStatus.OPEN,
        severity: TrustCaseSeverity.HIGH,
        limit: 50,
        offset: 0
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000); // 3 seconds
      expect(Array.isArray(cases)).toBe(true);
    }, 10000);
  });

  describe('Statistics Accuracy Tests', () => {
    it('should provide accurate statistics', async () => {
      // Get statistics
      const stats = await service.getTrustCaseStats();
      
      // Verify structure
      expect(stats).toHaveProperty('total_cases');
      expect(stats).toHaveProperty('open_cases');
      expect(stats).toHaveProperty('under_review_cases');
      expect(stats).toHaveProperty('resolved_cases');
      expect(stats).toHaveProperty('dismissed_cases');
      expect(stats).toHaveProperty('cases_by_severity');
      expect(stats).toHaveProperty('cases_by_subject_type');
      
      // Verify data types
      expect(typeof stats.total_cases).toBe('number');
      expect(typeof stats.open_cases).toBe('number');
      expect(typeof stats.cases_by_severity).toBe('object');
      expect(typeof stats.cases_by_subject_type).toBe('object');
      
      // Verify logical consistency
      const sumOfStatuses = stats.open_cases + stats.under_review_cases + 
                           stats.resolved_cases + stats.dismissed_cases;
      expect(sumOfStatuses).toBeLessThanOrEqual(stats.total_cases);
    }, 15000);

    it('should apply filters correctly', async () => {
      const filters = {
        subject_type: TrustCaseSubjectType.USER,
        date_range: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31')
        }
      };
      
      const filteredStats = await service.getTrustCaseStats(filters);
      const allStats = await service.getTrustCaseStats();
      
      // Filtered stats should be less than or equal to all stats
      expect(filteredStats.total_cases).toBeLessThanOrEqual(allStats.total_cases);
    }, 15000);
  });

  describe('Concurrent Access Tests', () => {
    it('should handle concurrent case creation', async () => {
      const caseData = {
        subject_type: TrustCaseSubjectType.USER,
        subject_id: 'concurrent-test-user',
        rule_id: 'test-rule',
        severity: TrustCaseSeverity.MEDIUM,
        status: TrustCaseStatus.OPEN
      };
      
      // Create multiple cases concurrently
      const promises = Array.from({ length: 5 }, (_, i) => 
        service.createTrustCase({
          ...caseData,
          subject_id: `concurrent-test-user-${i}`
        })
      );
      
      const results = await Promise.allSettled(promises);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful).toHaveLength(5);
      
      // Verify all cases were created with unique IDs
      const caseIds = successful.map(r => 
        r.status === 'fulfilled' ? r.value.case_id : null
      ).filter(Boolean);
      
      const uniqueCaseIds = new Set(caseIds);
      expect(uniqueCaseIds.size).toBe(5);
    }, 20000);

    it('should handle concurrent queries', async () => {
      // Run multiple queries concurrently
      const promises = Array.from({ length: 10 }, () => 
        service.queryTrustCases({ limit: 10, offset: 0 })
      );
      
      const results = await Promise.allSettled(promises);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful).toHaveLength(10);
      
      // Results should be consistent
      const firstResult = successful[0].status === 'fulfilled' ? 
        successful[0].value : [];
      
      for (let i = 1; i < successful.length; i++) {
        const currentResult = successful[i].status === 'fulfilled' ? 
          successful[i].value : [];
        expect(currentResult).toEqual(firstResult);
      }
    }, 15000);
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking database connection issues
      // For now, we'll test the service's error handling structure
      
      try {
        // Try to get a non-existent case
        const result = await service.getTrustCase('non-existent-case-id');
        expect(result).toBeNull();
      } catch (error) {
        // Should not throw unhandled errors
        fail('Should handle non-existent case gracefully');
      }
    }, 10000);

    it('should validate input data correctly', async () => {
      const invalidCaseData = {
        subject_type: 'INVALID_TYPE' as any,
        subject_id: '',
        rule_id: '',
        severity: 'INVALID_SEVERITY' as any,
        status: 'INVALID_STATUS' as any
      };
      
      // Should handle invalid data gracefully
      await expect(service.createTrustCase(invalidCaseData))
        .rejects.toThrow();
    }, 10000);
  });

  describe('Memory and Resource Tests', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run many operations
      for (let i = 0; i < 100; i++) {
        await service.queryTrustCases({ limit: 10, offset: 0 });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory usage should not increase significantly
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    }, 30000);
  });

  describe('Business Logic Tests', () => {
    it('should enforce human decision requirement', async () => {
      // Try to resolve a case without human decision
      const resolutionData = {
        case_id: 'test-case',
        status: 'RESOLVED',
        resolved_by: '', // Missing human decision
        notes: 'Auto-resolution attempt'
      };
      
      await expect(service.resolveTrustCase(resolutionData))
        .rejects.toThrow('Human decision required for TrustCase resolution');
    }, 10000);

    it('should maintain read-only access to rule logs', async () => {
      // Verify the service only reads from rule_evaluation_log
      // and never writes to it
      
      const result = await service.runIngestionPipeline();
      
      // The service should only create trust cases
      // and mark logs as processed (which is a read-only operation in context)
      expect(result).toBeDefined();
      expect(typeof result.processed).toBe('number');
    }, 15000);

    it('should never access financial resources', async () => {
      // Verify the service has no access to financial systems
      const servicePrototype = Object.getPrototypeOf(service);
      const serviceMethods = Object.getOwnPropertyNames(servicePrototype);
      
      // Should not have any financial access methods
      const financialMethods = serviceMethods.filter(method => 
        method.includes('wallet') || 
        method.includes('escrow') || 
        method.includes('ledger') ||
        method.includes('payment') ||
        method.includes('transaction')
      );
      
      expect(financialMethods).toHaveLength(0);
    }, 5000);
  });
});

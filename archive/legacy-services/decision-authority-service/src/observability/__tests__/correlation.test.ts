import { CorrelationContext, generateCorrelationId, withCorrelationId, withCorrelationIdAsync } from '../correlation';

describe('Correlation', () => {
  afterEach(() => {
    CorrelationContext.clear();
  });

  describe('CorrelationContext', () => {
    it('should generate new correlation ID', () => {
      const id = CorrelationContext.getOrCreate();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should clear correlation ID', () => {
      CorrelationContext.set('test-id');
      CorrelationContext.clear();
      const id = CorrelationContext.get();
      expect(id).toBeUndefined();
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });

    it('should generate valid UUID format', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('withCorrelationId', () => {
    it('should set correlation ID for function execution', () => {
      const testId = 'test-correlation-id';
      let capturedId: string | undefined;

      withCorrelationId(testId, () => {
        capturedId = testId;
      });

      expect(capturedId).toBe(testId);
    });

    it('should generate correlation ID if not provided', () => {
      const result = withCorrelationId(undefined, () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should return function result', () => {
      const result = withCorrelationId('test-id', () => {
        return 42;
      });

      expect(result).toBe(42);
    });
  });

  describe('withCorrelationIdAsync', () => {
    it('should set correlation ID for async function execution', async () => {
      const testId = 'test-correlation-id';
      let capturedId: string | undefined;

      await withCorrelationIdAsync(testId, async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        capturedId = testId;
      });

      expect(capturedId).toBe(testId);
    });

    it('should generate correlation ID if not provided', async () => {
      const result = await withCorrelationIdAsync(undefined, async () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should return async function result', async () => {
      const result = await withCorrelationIdAsync('test-id', async () => {
        return Promise.resolve(42);
      });

      expect(result).toBe(42);
    });
  });
});

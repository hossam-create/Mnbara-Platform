import { metricsCollector } from '../metrics';

describe('Metrics', () => {
  beforeEach(() => {
    metricsCollector.reset();
  });

  afterEach(() => {
    metricsCollector.reset();
  });

  describe('Histogram', () => {
    it('should record observations', () => {
      const histogram = metricsCollector.histogram('test_histogram', 'Test histogram', ['decision_source']);
      histogram.observe(100, { decision_source: 'INTERNAL' });
      histogram.observe(200, { decision_source: 'EXTERNAL' });

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_histogram_sum 300');
      expect(metrics).toContain('test_histogram_count 2');
    });

    it('should handle observations without labels', () => {
      const histogram = metricsCollector.histogram('test_histogram2', 'Test histogram 2');
      histogram.observe(150);

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_histogram2_sum 150');
      expect(metrics).toContain('test_histogram2_count 1');
    });
  });

  describe('Counter', () => {
    it('should increment counter', () => {
      const counter = metricsCollector.counter('test_counter', 'Test counter', ['decision_source']);
      counter.inc(1, { decision_source: 'INTERNAL' });
      counter.inc(2, { decision_source: 'EXTERNAL' });

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_counter');
    });

    it('should increment counter without labels', () => {
      const counter = metricsCollector.counter('test_counter2', 'Test counter 2');
      counter.inc(5);

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_counter2 5');
    });

    it('should default increment to 1', () => {
      const counter = metricsCollector.counter('test_counter3', 'Test counter 3');
      counter.inc();

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_counter3 1');
    });
  });

  describe('Gauge', () => {
    it('should set gauge value', () => {
      const gauge = metricsCollector.gauge('test_gauge', 'Test gauge', ['decision_source']);
      gauge.set(1, { decision_source: 'EXTERNAL' });

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_gauge');
    });

    it('should increment gauge', () => {
      const gauge = metricsCollector.gauge('test_gauge2', 'Test gauge 2');
      gauge.set(0);
      gauge.inc(1);

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_gauge2 1');
    });

    it('should decrement gauge', () => {
      const gauge = metricsCollector.gauge('test_gauge3', 'Test gauge 3');
      gauge.set(2);
      gauge.dec(1);

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_gauge3 1');
    });
  });

  describe('MetricsCollector', () => {
    it('should return all metrics', () => {
      const counter = metricsCollector.counter('test_counter4', 'Test counter 4');
      const gauge = metricsCollector.gauge('test_gauge4', 'Test gauge 4');
      const histogram = metricsCollector.histogram('test_histogram4', 'Test histogram 4');

      counter.inc(10);
      gauge.set(5);
      histogram.observe(100);

      const metrics = metricsCollector.getMetrics();
      expect(metrics).toContain('test_counter4 10');
      expect(metrics).toContain('test_gauge4 5');
      expect(metrics).toContain('test_histogram4_sum 100');
    });

    it('should reset all metrics', () => {
      const counter = metricsCollector.counter('test_counter5', 'Test counter 5');
      counter.inc(5);
      
      metricsCollector.reset();

      const metrics = metricsCollector.getMetrics();
      expect(metrics).not.toContain('test_counter5');
    });
  });
});

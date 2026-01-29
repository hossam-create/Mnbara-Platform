import { UptimeMonitorService } from '../uptime-monitor.service';
import { redis } from '../../index';

describe('UptimeMonitorService', () => {
  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await UptimeMonitorService.reset();
  });

  describe('recordStartup', () => {
    it('should record matching engine startup', async () => {
      await UptimeMonitorService.recordStartup();
      
      const status = await UptimeMonitorService.getUptimeStatus();
      
      expect(status.status).toBe('running');
      expect(status.lastStartup).toBeTruthy();
      expect(status.healthStatus).toBe('healthy');
    });
  });

  describe('recordShutdown', () => {
    it('should record matching engine shutdown', async () => {
      await UptimeMonitorService.recordStartup();
      await UptimeMonitorService.recordShutdown();
      
      const status = await UptimeMonitorService.getUptimeStatus();
      
      expect(status.status).toBe('stopped');
      expect(status.lastShutdown).toBeTruthy();
    });
  });

  describe('recordHealthCheck', () => {
    it('should record healthy health check', async () => {
      await UptimeMonitorService.recordHealthCheck(true, { test: 'data' });
      
      const status = await UptimeMonitorService.getUptimeStatus();
      
      expect(status.healthStatus).toBe('healthy');
      expect(status.lastHealthCheck).toBeTruthy();
    });

    it('should record unhealthy health check', async () => {
      await UptimeMonitorService.recordHealthCheck(false, { reason: 'test_failure' });
      
      const status = await UptimeMonitorService.getUptimeStatus();
      
      expect(status.healthStatus).toBe('unhealthy');
    });

    it('should record downtime event on unhealthy check', async () => {
      await UptimeMonitorService.recordHealthCheck(false, { reason: 'test_failure' });
      
      const events = await UptimeMonitorService.getDowntimeEvents(10);
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].reason).toBe('test_failure');
    });
  });

  describe('calculateUptimePercentage', () => {
    it('should return 100% uptime when no downtime events', async () => {
      const uptime = await UptimeMonitorService.calculateUptimePercentage(60);
      
      expect(uptime).toBe(100);
    });

    it('should calculate uptime percentage with downtime events', async () => {
      // Record multiple downtime events
      for (let i = 0; i < 5; i++) {
        await UptimeMonitorService.recordHealthCheck(false, { reason: 'test' });
      }
      
      const uptime = await UptimeMonitorService.calculateUptimePercentage(60);
      
      expect(uptime).toBeLessThan(100);
      expect(uptime).toBeGreaterThan(0);
    });
  });

  describe('getDowntimeEvents', () => {
    it('should return empty array when no downtime events', async () => {
      const events = await UptimeMonitorService.getDowntimeEvents(10);
      
      expect(events).toEqual([]);
    });

    it('should return downtime events', async () => {
      await UptimeMonitorService.recordHealthCheck(false, { reason: 'test1' });
      await UptimeMonitorService.recordHealthCheck(false, { reason: 'test2' });
      
      const events = await UptimeMonitorService.getDowntimeEvents(10);
      
      expect(events.length).toBe(2);
      expect(events[0].reason).toBe('test2'); // Most recent first
      expect(events[1].reason).toBe('test1');
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await UptimeMonitorService.recordHealthCheck(false, { reason: `test${i}` });
      }
      
      const events = await UptimeMonitorService.getDowntimeEvents(5);
      
      expect(events.length).toBe(5);
    });
  });

  describe('generateUptimeReport', () => {
    it('should generate uptime report', async () => {
      await UptimeMonitorService.recordStartup();
      
      const report = await UptimeMonitorService.generateUptimeReport();
      
      expect(report.period).toBeTruthy();
      expect(report.uptime1h).toBe(100);
      expect(report.uptime24h).toBe(100);
      expect(report.uptime7d).toBe(100);
      expect(report.uptime30d).toBe(100);
      expect(report.status).toBe('running');
    });

    it('should include downtime events in report', async () => {
      await UptimeMonitorService.recordHealthCheck(false, { reason: 'test' });
      
      const report = await UptimeMonitorService.generateUptimeReport();
      
      expect(report.downtimeEvents.length).toBeGreaterThan(0);
    });
  });

  describe('checkSLACompliance', () => {
    it('should return compliant when uptime >= 99.9%', async () => {
      await UptimeMonitorService.recordStartup();
      
      const compliance = await UptimeMonitorService.checkSLACompliance(1440);
      
      expect(compliance.compliant).toBe(true);
      expect(compliance.uptime).toBe(100);
      expect(compliance.slaTarget).toBe(99.9);
    });

    it('should return non-compliant when uptime < 99.9%', async () => {
      // Record many downtime events to drop below 99.9%
      for (let i = 0; i < 20; i++) {
        await UptimeMonitorService.recordHealthCheck(false, { reason: 'test' });
      }
      
      const compliance = await UptimeMonitorService.checkSLACompliance(60);
      
      expect(compliance.compliant).toBe(false);
      expect(compliance.uptime).toBeLessThan(99.9);
    });

    it('should calculate allowed downtime correctly', async () => {
      const compliance = await UptimeMonitorService.checkSLACompliance(1440);
      
      // 99.9% uptime allows 0.1% downtime = 1.44 minutes per day
      expect(compliance.allowedDowntimeMinutes).toBeCloseTo(1.44, 1);
    });
  });

  describe('reset', () => {
    it('should reset all uptime data', async () => {
      await UptimeMonitorService.recordStartup();
      await UptimeMonitorService.recordHealthCheck(false, { reason: 'test' });
      
      await UptimeMonitorService.reset();
      
      const status = await UptimeMonitorService.getUptimeStatus();
      const events = await UptimeMonitorService.getDowntimeEvents(10);
      
      expect(status.status).toBe('unknown');
      expect(events).toEqual([]);
    });
  });
});

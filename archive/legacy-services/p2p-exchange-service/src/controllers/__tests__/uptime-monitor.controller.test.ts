import { UptimeMonitorService } from '../../services/uptime-monitor.service';
import { redis } from '../../index';

describe('UptimeMonitorController', () => {
  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await UptimeMonitorService.reset();
  });

  describe('Uptime Status', () => {
    it('should track uptime status correctly', async () => {
      await UptimeMonitorService.recordStartup();
      
      const status = await UptimeMonitorService.getUptimeStatus();
      
      expect(status.status).toBe('running');
      expect(status.lastStartup).toBeTruthy();
      expect(status.healthStatus).toBe('healthy');
    });
  });

  describe('Uptime Report', () => {
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
  });

  describe('SLA Compliance', () => {
    it('should check SLA compliance', async () => {
      const compliance = await UptimeMonitorService.checkSLACompliance(1440);
      
      expect(compliance.compliant).toBe(true);
      expect(compliance.uptime).toBe(100);
      expect(compliance.slaTarget).toBe(99.9);
    });

    it('should calculate allowed downtime correctly', async () => {
      const compliance = await UptimeMonitorService.checkSLACompliance(1440);
      
      // 99.9% uptime allows 0.1% downtime = 1.44 minutes per day
      expect(compliance.allowedDowntimeMinutes).toBeCloseTo(1.44, 1);
    });
  });

  describe('Downtime Events', () => {
    it('should track downtime events', async () => {
      await UptimeMonitorService.recordHealthCheck(false, { reason: 'test' });
      
      const events = await UptimeMonitorService.getDowntimeEvents(10);
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].reason).toBe('test');
    });

    it('should limit downtime events', async () => {
      for (let i = 0; i < 10; i++) {
        await UptimeMonitorService.recordHealthCheck(false, { reason: `test${i}` });
      }
      
      const events = await UptimeMonitorService.getDowntimeEvents(5);
      
      expect(events.length).toBe(5);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset uptime data', async () => {
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

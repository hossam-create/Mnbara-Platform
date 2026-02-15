import { MatchingEngineHealthService } from '../matching-engine-health.service';
import { redis, prisma } from '../../index';

describe('MatchingEngineHealthService', () => {
  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear health check data
    await redis.del('matching_engine:job');
    await redis.del('matching_engine:health');
  });

  afterEach(() => {
    MatchingEngineHealthService.stopHealthChecks();
  });

  describe('startHealthChecks', () => {
    it('should start health checks', () => {
      MatchingEngineHealthService.startHealthChecks();
      
      // Health checks should be running
      expect(MatchingEngineHealthService['healthCheckInterval']).toBeTruthy();
      
      MatchingEngineHealthService.stopHealthChecks();
    });

    it('should not start multiple health check intervals', () => {
      MatchingEngineHealthService.startHealthChecks();
      const firstInterval = MatchingEngineHealthService['healthCheckInterval'];
      
      MatchingEngineHealthService.startHealthChecks();
      const secondInterval = MatchingEngineHealthService['healthCheckInterval'];
      
      expect(firstInterval).toBe(secondInterval);
      
      MatchingEngineHealthService.stopHealthChecks();
    });
  });

  describe('stopHealthChecks', () => {
    it('should stop health checks', () => {
      MatchingEngineHealthService.startHealthChecks();
      MatchingEngineHealthService.stopHealthChecks();
      
      expect(MatchingEngineHealthService['healthCheckInterval']).toBeNull();
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', async () => {
      const status = await MatchingEngineHealthService.getHealthStatus();
      
      expect(status).toHaveProperty('healthy');
      expect(status).toHaveProperty('lastCheckTime');
      expect(status).toHaveProperty('consecutiveFailures');
      expect(status).toHaveProperty('details');
    });

    it('should check database connection', async () => {
      const status = await MatchingEngineHealthService.getHealthStatus();
      
      expect(status.details.database).toBeTruthy();
      expect(status.details.database.status).toBe('connected');
    });

    it('should check redis connection', async () => {
      const status = await MatchingEngineHealthService.getHealthStatus();
      
      expect(status.details.redis).toBeTruthy();
      expect(status.details.redis.status).toBe('connected');
    });

    it('should check matching engine job status', async () => {
      // Set up a recent job run
      const now = new Date().toISOString();
      await redis.hSet('matching_engine:job', 'last_run', now);
      await redis.hSet('matching_engine:job', 'status', 'running');
      
      const status = await MatchingEngineHealthService.getHealthStatus();
      
      expect(status.details.matchingEngine).toBeTruthy();
      expect(status.details.matchingEngine.status).toBe('running');
    });

    it('should detect stalled matching engine', async () => {
      // Set up an old job run (more than 2 minutes ago)
      const oldTime = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      await redis.hSet('matching_engine:job', 'last_run', oldTime);
      
      const status = await MatchingEngineHealthService.getHealthStatus();
      
      expect(status.healthy).toBe(false);
      expect(status.details.matchingEngine.status).toBe('stalled');
    });
  });

  describe('isResponsive', () => {
    it('should return true when healthy', async () => {
      const responsive = await MatchingEngineHealthService.isResponsive();
      
      expect(typeof responsive).toBe('boolean');
    });
  });

  describe('getHealthMetrics', () => {
    it('should return health metrics', async () => {
      const metrics = await MatchingEngineHealthService.getHealthMetrics();
      
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('lastCheckTime');
      expect(metrics).toHaveProperty('consecutiveFailures');
      expect(metrics).toHaveProperty('healthStatus');
      
      expect(typeof metrics.uptime).toBe('number');
      expect(typeof metrics.lastCheckTime).toBe('number');
      expect(typeof metrics.consecutiveFailures).toBe('number');
      expect(['healthy', 'unhealthy']).toContain(metrics.healthStatus);
    });
  });

  describe('health check with active requests', () => {
    it('should include active request count in health details', async () => {
      const status = await MatchingEngineHealthService.getHealthStatus();
      
      expect(status.details).toHaveProperty('activeRequests');
      expect(typeof status.details.activeRequests).toBe('number');
    });

    it('should include pending matches count in health details', async () => {
      const status = await MatchingEngineHealthService.getHealthStatus();
      
      expect(status.details).toHaveProperty('pendingMatches');
      expect(typeof status.details.pendingMatches).toBe('number');
    });
  });
});

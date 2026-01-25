import { Pool } from 'pg';
import Redis from 'ioredis';
import { FraudDetectionService } from '../FraudDetectionService';
import { FraudCheckType } from '../../types/fraud.types';

// Mock dependencies
jest.mock('pg');
jest.mock('ioredis');
jest.mock('../../utils/logger');

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;
  let mockDb: jest.Mocked<Pool>;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    } as any;

    mockRedis = {
      incr: jest.fn(),
      expire: jest.fn(),
      get: jest.fn(),
      setex: jest.fn(),
      lrange: jest.fn(),
      lpush: jest.fn(),
      ltrim: jest.fn(),
      del: jest.fn(),
    } as any;

    service = new FraudDetectionService(mockDb, mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('performFraudCheck', () => {
    it('should return LOW risk for normal request', async () => {
      // Mock velocity check - low counts
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        { userAgent: 'Mozilla/5.0' }
      );

      expect(result.riskLevel).toBe('LOW');
      expect(result.action).toBe('ALLOW');
      expect(result.flags).toHaveLength(0);
    });

    it('should detect IP velocity violations', async () => {
      // Mock high IP velocity
      mockRedis.incr
        .mockResolvedValueOnce(150) // IP hour count
        .mockResolvedValueOnce(25); // IP minute count
      mockRedis.get.mockResolvedValue(null);
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        null,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        { userAgent: 'Mozilla/5.0' }
      );

      expect(result.flags).toContain('IP_VELOCITY_EXCEEDED_HOUR');
      expect(result.flags).toContain('IP_VELOCITY_EXCEEDED_MINUTE');
      expect(result.riskLevel).not.toBe('LOW');
    });

    it('should detect bot user agents', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        { userAgent: 'curl/7.68.0' }
      );

      expect(result.flags).toContain('BOT_USER_AGENT');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect blacklisted IPs', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get
        .mockResolvedValueOnce(null) // Device check
        .mockResolvedValueOnce(null) // Last IP check
        .mockResolvedValueOnce('fraud'); // Blacklist check
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        { userAgent: 'Mozilla/5.0' }
      );

      expect(result.flags).toContain('BLACKLISTED_IP');
      expect(result.action).toBe('BLOCK');
      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should detect new devices', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null); // New device
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        {
          userAgent: 'Mozilla/5.0',
          deviceId: 'new-device-123',
        }
      );

      expect(result.flags).toContain('NEW_DEVICE');
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should detect IP changes', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get
        .mockResolvedValueOnce('1') // Known device
        .mockResolvedValueOnce('192.168.1.2') // Different last IP
        .mockResolvedValueOnce(null); // Not blacklisted
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        {
          userAgent: 'Mozilla/5.0',
          deviceId: 'device-123',
        }
      );

      expect(result.flags).toContain('IP_CHANGE');
    });

    it('should detect uniform timing patterns', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);
      
      // Mock uniform timing pattern (bot-like)
      const now = Date.now();
      const uniformActions = Array.from({ length: 5 }, (_, i) => 
        JSON.stringify({
          timestamp: new Date(now - i * 1000).toISOString(), // Exactly 1 second apart
          ipAddress: '192.168.1.1',
          metadata: {},
        })
      );
      mockRedis.lrange.mockResolvedValue(uniformActions);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        { userAgent: 'Mozilla/5.0' }
      );

      expect(result.flags).toContain('UNIFORM_TIMING_PATTERN');
    });

    it('should detect suspicious round amounts', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        {
          userAgent: 'Mozilla/5.0',
          amount: 5000, // Round amount
        }
      );

      expect(result.flags).toContain('ROUND_AMOUNT');
    });

    it('should detect large amounts', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        {
          userAgent: 'Mozilla/5.0',
          amount: 15000, // Large amount
        }
      );

      expect(result.flags).toContain('LARGE_AMOUNT');
    });

    it('should store alert in database', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        { userAgent: 'Mozilla/5.0' }
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO fraud_alerts'),
        expect.any(Array)
      );
    });

    it('should determine REVIEW action for high risk', async () => {
      mockRedis.incr
        .mockResolvedValueOnce(1) // IP hour
        .mockResolvedValueOnce(25); // IP minute - exceeds limit
      mockRedis.get.mockResolvedValue(null);
      mockRedis.lrange.mockResolvedValue([]);
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await service.performFraudCheck(
        1,
        '192.168.1.1',
        FraudCheckType.PAYMENT_CREATION,
        { userAgent: 'curl/7.68.0' } // Bot user agent
      );

      // Multiple concerning flags should trigger REVIEW
      expect(result.action).toBe('REVIEW');
    });
  });

  describe('blacklistIp', () => {
    it('should add IP to blacklist', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      await service.blacklistIp('192.168.1.1', 'fraud', 86400);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'blacklist:ip:192.168.1.1',
        86400,
        'fraud'
      );
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove IP from blacklist', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.removeFromBlacklist('192.168.1.1');

      expect(mockRedis.del).toHaveBeenCalledWith('blacklist:ip:192.168.1.1');
    });
  });

  describe('getUserAlerts', () => {
    it('should retrieve user alerts', async () => {
      const mockAlerts = [
        {
          user_id: 1,
          ip_address: '192.168.1.1',
          check_type: 'PAYMENT_CREATION',
          risk_score: 50,
          risk_level: 'MEDIUM',
          flags: ['NEW_DEVICE'],
          action: 'ALLOW',
          reasons: ['Request from new device'],
          metadata: {},
          created_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValue({ rows: mockAlerts } as any);

      const alerts = await service.getUserAlerts(1, 10);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].userId).toBe(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [1, 10]
      );
    });
  });

  describe('getIpAlerts', () => {
    it('should retrieve IP alerts', async () => {
      const mockAlerts = [
        {
          user_id: null,
          ip_address: '192.168.1.1',
          check_type: 'PAYMENT_CREATION',
          risk_score: 80,
          risk_level: 'HIGH',
          flags: ['IP_VELOCITY_EXCEEDED_HOUR'],
          action: 'REVIEW',
          reasons: ['IP exceeded 100 requests per hour'],
          metadata: {},
          created_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValue({ rows: mockAlerts } as any);

      const alerts = await service.getIpAlerts('192.168.1.1', 10);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].ipAddress).toBe('192.168.1.1');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ip_address = $1'),
        ['192.168.1.1', 10]
      );
    });
  });
});

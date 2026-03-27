import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import {
  FraudCheckResult,
  FraudCheckType,
  RiskLevel,
  FraudAction,
  FraudCheckContext,
} from '../types/fraud.types';

// Additional parameter types
interface VelocityCheckParams {
  userId: number | null;
  ipAddress: string;
}

interface DeviceFingerprintParams {
  userId: number | null;
  ipAddress: string;
  metadata: Record<string, any>;
}

interface BehaviorAnalysisParams {
  userId: number | null;
  ipAddress: string;
  metadata: Record<string, any>;
}

export class FraudDetectionService {
  private db: Pool;
  private redis: Redis;

  // Risk score thresholds
  private readonly RISK_THRESHOLDS = {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 100,
  };

  // Velocity limits (requests per time window)
  private readonly VELOCITY_LIMITS = {
    IP_PER_HOUR: 100,
    IP_PER_MINUTE: 20,
    USER_PER_HOUR: 50,
    USER_PER_MINUTE: 10,
  };

  constructor(db: Pool, redis: Redis) {
    this.db = db;
    this.redis = redis;
  }

  /**
   * Perform comprehensive fraud check
   */
  async performFraudCheck(
    userId: number | null,
    ipAddress: string,
    checkType: FraudCheckType,
    metadata: Record<string, any> = {}
  ): Promise<FraudCheckResult & { userId: number | null; ipAddress: string; checkType: FraudCheckType; timestamp: Date }> {
    try {
      const checks = await Promise.all([
        this.checkVelocity({ userId, ipAddress }),
        this.checkDeviceFingerprint({ userId, ipAddress, metadata }),
        this.checkBehaviorPatterns({ userId, ipAddress, metadata }),
        this.checkBlacklist(ipAddress),
      ]);

      // Aggregate results
      const flags: string[] = [];
      const reasons: string[] = [];
      let totalRiskScore = 0;

      checks.forEach((check) => {
        flags.push(...check.flags);
        reasons.push(...check.reasons);
        totalRiskScore += check.riskScore;
      });

      // Calculate average risk score
      const riskScore = Math.min(Math.round(totalRiskScore / checks.length), 100);
      const riskLevel = this.calculateRiskLevel(riskScore);
      const action = this.determineAction(riskLevel, flags);

      const result = {
        userId,
        ipAddress,
        checkType,
        riskScore,
        riskLevel,
        flags: [...new Set(flags)], // Remove duplicates
        action,
        reasons: [...new Set(reasons)],
        metadata,
        timestamp: new Date(),
      };

      // Store alert in database
      await this.storeAlert(result);

      // Log high-risk alerts
      if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
        logger.warn('High-risk fraud alert', {
          userId,
          ipAddress,
          riskLevel,
          riskScore,
          flags,
        });
      }

      return result;
    } catch (error) {
      logger.error('Fraud check failed', { error, userId, ipAddress });
      throw error;
    }
  }

  /**
   * Check velocity (rate of requests)
   */
  private async checkVelocity(params: VelocityCheckParams): Promise<Partial<FraudCheckResult>> {
    const { userId, ipAddress } = params;
    const flags: string[] = [];
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check IP velocity
      const ipHourKey = `velocity:ip:hour:${ipAddress}`;
      const ipMinuteKey = `velocity:ip:minute:${ipAddress}`;
      
      const [ipHourCount, ipMinuteCount] = await Promise.all([
        this.redis.incr(ipHourKey),
        this.redis.incr(ipMinuteKey),
      ]);

      // Set expiry on first increment
      if (ipHourCount === 1) await this.redis.expire(ipHourKey, 3600);
      if (ipMinuteCount === 1) await this.redis.expire(ipMinuteKey, 60);

      if (ipHourCount > this.VELOCITY_LIMITS.IP_PER_HOUR) {
        flags.push('IP_VELOCITY_EXCEEDED_HOUR');
        reasons.push(`IP exceeded ${this.VELOCITY_LIMITS.IP_PER_HOUR} requests per hour`);
        riskScore += 30;
      }

      if (ipMinuteCount > this.VELOCITY_LIMITS.IP_PER_MINUTE) {
        flags.push('IP_VELOCITY_EXCEEDED_MINUTE');
        reasons.push(`IP exceeded ${this.VELOCITY_LIMITS.IP_PER_MINUTE} requests per minute`);
        riskScore += 40;
      }

      // Check user velocity if authenticated
      if (userId) {
        const userHourKey = `velocity:user:hour:${userId}`;
        const userMinuteKey = `velocity:user:minute:${userId}`;
        
        const [userHourCount, userMinuteCount] = await Promise.all([
          this.redis.incr(userHourKey),
          this.redis.incr(userMinuteKey),
        ]);

        if (userHourCount === 1) await this.redis.expire(userHourKey, 3600);
        if (userMinuteCount === 1) await this.redis.expire(userMinuteKey, 60);

        if (userHourCount > this.VELOCITY_LIMITS.USER_PER_HOUR) {
          flags.push('USER_VELOCITY_EXCEEDED_HOUR');
          reasons.push(`User exceeded ${this.VELOCITY_LIMITS.USER_PER_HOUR} requests per hour`);
          riskScore += 25;
        }

        if (userMinuteCount > this.VELOCITY_LIMITS.USER_PER_MINUTE) {
          flags.push('USER_VELOCITY_EXCEEDED_MINUTE');
          reasons.push(`User exceeded ${this.VELOCITY_LIMITS.USER_PER_MINUTE} requests per minute`);
          riskScore += 35;
        }
      }
    } catch (error) {
      logger.error('Velocity check failed', { error, userId, ipAddress });
    }

    return { flags, reasons, riskScore };
  }

  /**
   * Check device fingerprint
   */
  private async checkDeviceFingerprint(
    params: DeviceFingerprintParams
  ): Promise<Partial<FraudCheckResult>> {
    const { userId, ipAddress, metadata } = params;
    const flags: string[] = [];
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      const userAgent = metadata.userAgent as string | undefined;
      const deviceId = metadata.deviceId as string | undefined;

      // Check for missing or suspicious user agent
      if (!userAgent || userAgent.length < 10) {
        flags.push('SUSPICIOUS_USER_AGENT');
        reasons.push('Missing or invalid user agent');
        riskScore += 20;
      }

      // Check for bot patterns in user agent
      const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];
      if (userAgent && botPatterns.some((pattern) => userAgent.toLowerCase().includes(pattern))) {
        flags.push('BOT_USER_AGENT');
        reasons.push('User agent indicates automated bot');
        riskScore += 40;
      }

      // Check device fingerprint consistency
      if (userId && deviceId) {
        const deviceKey = `device:${userId}:${deviceId}`;
        const knownDevice = await this.redis.get(deviceKey);

        if (!knownDevice) {
          // New device for this user
          await this.redis.setex(deviceKey, 86400 * 30, '1'); // 30 days
          flags.push('NEW_DEVICE');
          reasons.push('Request from new device');
          riskScore += 10;
        }
      }

      // Check for IP changes (if user is authenticated)
      if (userId) {
        const lastIpKey = `lastip:${userId}`;
        const lastIp = await this.redis.get(lastIpKey);

        if (lastIp && lastIp !== ipAddress) {
          flags.push('IP_CHANGE');
          reasons.push('IP address changed since last request');
          riskScore += 15;
        }

        await this.redis.setex(lastIpKey, 3600, ipAddress); // 1 hour
      }
    } catch (error) {
      logger.error('Device fingerprint check failed', { error, userId, ipAddress });
    }

    return { flags, reasons, riskScore };
  }

  /**
   * Analyze behavior patterns
   */
  private async checkBehaviorPatterns(
    params: BehaviorAnalysisParams
  ): Promise<Partial<FraudCheckResult>> {
    const { userId, ipAddress, metadata } = params;
    const flags: string[] = [];
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check for suspicious timing patterns
      if (userId) {
        const recentActionsKey = `actions:${userId}`;
        const recentActions = await this.redis.lrange(recentActionsKey, 0, 9);
        
        if (recentActions.length >= 5) {
          const timestamps = recentActions.map((action) => {
            const parsed = JSON.parse(action);
            return new Date(parsed.timestamp).getTime();
          });

          // Check if actions are too uniform (bot-like behavior)
          const intervals = [];
          for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
          }

          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const variance = intervals.reduce((sum, interval) => {
            return sum + Math.pow(interval - avgInterval, 2);
          }, 0) / intervals.length;

          // Low variance indicates bot-like behavior
          if (variance < 1000) {
            flags.push('UNIFORM_TIMING_PATTERN');
            reasons.push('Actions show bot-like timing patterns');
            riskScore += 35;
          }
        }

        // Store current action
        const action = JSON.stringify({
          timestamp: new Date().toISOString(),
          ipAddress,
          metadata,
        });
        await this.redis.lpush(recentActionsKey, action);
        await this.redis.ltrim(recentActionsKey, 0, 9); // Keep last 10
        await this.redis.expire(recentActionsKey, 3600); // 1 hour
      }

      // Check for suspicious metadata patterns
      if (metadata.amount && typeof metadata.amount === 'number') {
        // Check for round numbers (common in fraud)
        if (metadata.amount % 100 === 0 && metadata.amount >= 1000) {
          flags.push('ROUND_AMOUNT');
          reasons.push('Transaction amount is suspiciously round');
          riskScore += 10;
        }

        // Check for unusually large amounts
        if (metadata.amount > 10000) {
          flags.push('LARGE_AMOUNT');
          reasons.push('Transaction amount is unusually large');
          riskScore += 20;
        }
      }
    } catch (error) {
      logger.error('Behavior analysis failed', { error, userId, ipAddress });
    }

    return { flags, reasons, riskScore };
  }

  /**
   * Check IP against blacklist
   */
  private async checkBlacklist(ipAddress: string): Promise<Partial<FraudCheckResult>> {
    const flags: string[] = [];
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      const blacklistKey = `blacklist:ip:${ipAddress}`;
      const isBlacklisted = await this.redis.get(blacklistKey);

      if (isBlacklisted) {
        flags.push('BLACKLISTED_IP');
        reasons.push('IP address is blacklisted');
        riskScore += 100; // Maximum risk
      }
    } catch (error) {
      logger.error('Blacklist check failed', { error, ipAddress });
    }

    return { flags, reasons, riskScore };
  }

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= this.RISK_THRESHOLDS.HIGH) return 'CRITICAL';
    if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) return 'HIGH';
    if (riskScore >= this.RISK_THRESHOLDS.LOW) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Determine action based on risk level and flags
   */
  private determineAction(riskLevel: RiskLevel, flags: string[]): FraudAction {
    // Block if blacklisted or critical risk
    if (flags.includes('BLACKLISTED_IP') || riskLevel === 'CRITICAL') {
      return 'BLOCK';
    }

    // Review if high risk
    if (riskLevel === 'HIGH') {
      return 'REVIEW';
    }

    // Review if multiple concerning flags
    const concerningFlags = [
      'BOT_USER_AGENT',
      'UNIFORM_TIMING_PATTERN',
      'IP_VELOCITY_EXCEEDED_MINUTE',
      'USER_VELOCITY_EXCEEDED_MINUTE',
    ];
    const concerningFlagCount = flags.filter((flag) => concerningFlags.includes(flag)).length;
    
    if (concerningFlagCount >= 2) {
      return 'REVIEW';
    }

    return 'ALLOW';
  }

  /**
   * Store fraud alert in database
   */
  private async storeAlert(result: FraudCheckResult): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO fraud_alerts 
         (user_id, ip_address, check_type, risk_score, risk_level, flags, action, reasons, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          result.userId,
          result.ipAddress,
          result.checkType,
          result.riskScore,
          result.riskLevel,
          result.flags,
          result.action,
          result.reasons,
          JSON.stringify(result.metadata),
        ]
      );
    } catch (error) {
      logger.error('Failed to store fraud alert', { error, result });
      // Don't throw - we don't want to fail the request if logging fails
    }
  }

  /**
   * Add IP to blacklist
   */
  async blacklistIp(ipAddress: string, reason: string, durationSeconds: number = 86400): Promise<void> {
    try {
      const blacklistKey = `blacklist:ip:${ipAddress}`;
      await this.redis.setex(blacklistKey, durationSeconds, reason);
      
      logger.info('IP blacklisted', { ipAddress, reason, durationSeconds });
    } catch (error) {
      logger.error('Failed to blacklist IP', { error, ipAddress });
      throw error;
    }
  }

  /**
   * Remove IP from blacklist
   */
  async removeFromBlacklist(ipAddress: string): Promise<void> {
    try {
      const blacklistKey = `blacklist:ip:${ipAddress}`;
      await this.redis.del(blacklistKey);
      
      logger.info('IP removed from blacklist', { ipAddress });
    } catch (error) {
      logger.error('Failed to remove IP from blacklist', { error, ipAddress });
      throw error;
    }
  }

  /**
   * Get fraud alerts for a user
   */
  async getUserAlerts(userId: number, limit: number = 10): Promise<Array<FraudCheckResult & { userId: number | null; ipAddress: string; checkType: FraudCheckType; timestamp: Date }>> {
    try {
      const result = await this.db.query(
        `SELECT * FROM fraud_alerts 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map((row) => ({
        userId: row.user_id,
        ipAddress: row.ip_address,
        checkType: row.check_type,
        riskScore: row.risk_score,
        riskLevel: row.risk_level,
        flags: row.flags,
        action: row.action,
        reasons: row.reasons,
        metadata: row.metadata,
        timestamp: row.created_at,
      }));
    } catch (error) {
      logger.error('Failed to get user alerts', { error, userId });
      throw error;
    }
  }

  /**
   * Get fraud alerts for an IP
   */
  async getIpAlerts(ipAddress: string, limit: number = 10): Promise<Array<FraudCheckResult & { userId: number | null; ipAddress: string; checkType: FraudCheckType; timestamp: Date }>> {
    try {
      const result = await this.db.query(
        `SELECT * FROM fraud_alerts 
         WHERE ip_address = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [ipAddress, limit]
      );

      return result.rows.map((row) => ({
        userId: row.user_id,
        ipAddress: row.ip_address,
        checkType: row.check_type,
        riskScore: row.risk_score,
        riskLevel: row.risk_level,
        flags: row.flags,
        action: row.action,
        reasons: row.reasons,
        metadata: row.metadata,
        timestamp: row.created_at,
      }));
    } catch (error) {
      logger.error('Failed to get IP alerts', { error, ipAddress });
      throw error;
    }
  }
}

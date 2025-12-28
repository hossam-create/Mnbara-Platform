import * as crypto from 'crypto';

/**
 * Secure Transaction Audit Service
 * خدمة التدقيق الآمن للمعاملات - Encrypted logging with tamper detection
 */

export enum AuditEventType {
  TRANSACTION_INITIATED = 'TRANSACTION_INITIATED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_REVERSED = 'TRANSACTION_REVERSED',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  FRAUD_CLEARED = 'FRAUD_CLEARED',
  BIOMETRIC_VERIFIED = 'BIOMETRIC_VERIFIED',
  BIOMETRIC_FAILED = 'BIOMETRIC_FAILED',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  CONFIG_CHANGED = 'CONFIG_CHANGED'
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  transactionId?: string;
  ipAddress?: string;
  deviceId?: string;
  action: string;
  details: Record<string, any>;
  riskScore?: number;
  outcome: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'BLOCKED';
  encryptedPayload?: string;
  hash: string;
  previousHash: string;
}

export interface TransactionLogInput {
  userId: string;
  transactionId: string;
  type: string;
  amount: number;
  currency: string;
  fromAddress?: string;
  toAddress?: string;
  ipAddress?: string;
  deviceId?: string;
  location?: {
    country?: string;
    city?: string;
  };
  riskScore?: number;
  fraudSignals?: string[];
  metadata?: Record<string, any>;
}

// In-memory chain storage (use database in production)
const auditChain: AuditLogEntry[] = [];
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export class SecureAuditService {
  private encryptionKey: string;
  private signingKey: string;

  constructor() {
    this.encryptionKey = process.env.AUDIT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.signingKey = process.env.AUDIT_SIGNING_KEY || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Log a transaction event with encryption and chain integrity
   * تسجيل حدث معاملة مع التشفير وسلامة السلسلة
   */
  async logTransaction(
    eventType: AuditEventType,
    input: TransactionLogInput,
    outcome: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'BLOCKED'
  ): Promise<AuditLogEntry> {
    const sensitiveData = {
      amount: input.amount,
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      metadata: input.metadata
    };

    const encryptedPayload = this.encryptPayload(sensitiveData);
    const previousHash = this.getLastHash();

    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType,
      userId: input.userId,
      transactionId: input.transactionId,
      ipAddress: this.maskIpAddress(input.ipAddress),
      deviceId: input.deviceId,
      action: `${eventType} - ${input.type}`,
      details: {
        currency: input.currency,
        transactionType: input.type,
        location: input.location,
        fraudSignals: input.fraudSignals
      },
      riskScore: input.riskScore,
      outcome,
      encryptedPayload,
      hash: '', // Will be calculated
      previousHash
    };

    // Calculate hash for chain integrity
    entry.hash = this.calculateHash(entry);

    // Store in chain
    auditChain.push(entry);

    console.log(`[Audit] ${eventType} logged for transaction ${input.transactionId}`);

    return this.sanitizeEntry(entry);
  }

  /**
   * Log a security event
   * تسجيل حدث أمني
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    userId: string,
    action: string,
    details: Record<string, any>,
    outcome: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'BLOCKED'
  ): Promise<AuditLogEntry> {
    const previousHash = this.getLastHash();

    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType,
      userId,
      action,
      details,
      outcome,
      hash: '',
      previousHash
    };

    entry.hash = this.calculateHash(entry);
    auditChain.push(entry);

    console.log(`[Audit] Security event ${eventType} logged for user ${userId}`);

    return entry;
  }

  /**
   * Retrieve audit logs for a user
   * استرجاع سجلات التدقيق للمستخدم
   */
  async getUserAuditLogs(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      eventTypes?: AuditEventType[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    let filtered = auditChain.filter(entry => entry.userId === userId);

    if (options.startDate) {
      filtered = filtered.filter(e => e.timestamp >= options.startDate!);
    }

    if (options.endDate) {
      filtered = filtered.filter(e => e.timestamp <= options.endDate!);
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      filtered = filtered.filter(e => options.eventTypes!.includes(e.eventType));
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;

    const entries = filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit)
      .map(e => this.sanitizeEntry(e));

    return { entries, total };
  }

  /**
   * Retrieve audit logs for a transaction
   */
  async getTransactionAuditLogs(transactionId: string): Promise<AuditLogEntry[]> {
    const entries = auditChain
      .filter(entry => entry.transactionId === transactionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(e => this.sanitizeEntry(e));

    return entries;
  }

  /**
   * Verify chain integrity
   * التحقق من سلامة السلسلة
   */
  verifyChainIntegrity(): { isValid: boolean; brokenAt?: number; message: string } {
    if (auditChain.length === 0) {
      return { isValid: true, message: 'Audit chain is empty' };
    }

    // Check genesis block
    if (auditChain[0].previousHash !== GENESIS_HASH) {
      return {
        isValid: false,
        brokenAt: 0,
        message: 'Genesis block has invalid previous hash'
      };
    }

    // Verify each entry
    for (let i = 0; i < auditChain.length; i++) {
      const entry = auditChain[i];
      const calculatedHash = this.calculateHash({ ...entry, hash: '' });

      if (entry.hash !== calculatedHash) {
        return {
          isValid: false,
          brokenAt: i,
          message: `Entry ${i} has been tampered with (hash mismatch)`
        };
      }

      if (i > 0 && entry.previousHash !== auditChain[i - 1].hash) {
        return {
          isValid: false,
          brokenAt: i,
          message: `Chain broken at entry ${i} (previous hash mismatch)`
        };
      }
    }

    return {
      isValid: true,
      message: `Chain integrity verified. ${auditChain.length} entries validated.`
    };
  }

  /**
   * Export audit logs for compliance reporting
   * تصدير سجلات التدقيق لإعداد تقارير الامتثال
   */
  async exportForCompliance(
    startDate: Date,
    endDate: Date,
    includeEncrypted: boolean = false
  ): Promise<{
    exportId: string;
    generatedAt: Date;
    period: { start: Date; end: Date };
    totalEntries: number;
    entries: AuditLogEntry[];
    integrityCheck: { isValid: boolean; message: string };
  }> {
    const filtered = auditChain.filter(
      e => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const entries = filtered.map(e => {
      const sanitized = this.sanitizeEntry(e);
      if (!includeEncrypted) {
        delete sanitized.encryptedPayload;
      }
      return sanitized;
    });

    const integrityCheck = this.verifyChainIntegrity();

    return {
      exportId: crypto.randomUUID(),
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      totalEntries: entries.length,
      entries,
      integrityCheck
    };
  }

  /**
   * Decrypt payload (admin only)
   */
  decryptPayload(encryptedPayload: string): Record<string, any> {
    try {
      const parts = encryptedPayload.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'hex');

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(this.encryptionKey.substring(0, 32)),
        iv
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('[Audit] Failed to decrypt payload:', error);
      throw new Error('Failed to decrypt audit payload');
    }
  }

  // Private helper methods

  private encryptPayload(data: Record<string, any>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey.substring(0, 32)),
      iv
    );

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  private calculateHash(entry: Omit<AuditLogEntry, 'hash'> & { hash?: string }): string {
    const { hash, ...dataToHash } = entry;
    const content = JSON.stringify(dataToHash) + this.signingKey;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private getLastHash(): string {
    if (auditChain.length === 0) {
      return GENESIS_HASH;
    }
    return auditChain[auditChain.length - 1].hash;
  }

  private maskIpAddress(ip?: string): string | undefined {
    if (!ip) return undefined;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return ip.substring(0, ip.length / 2) + 'xxxx';
  }

  private sanitizeEntry(entry: AuditLogEntry): AuditLogEntry {
    // Return a copy without exposing encryption keys
    return { ...entry };
  }

  /**
   * Get chain statistics
   */
  getChainStats(): {
    totalEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    entriesByType: Record<string, number>;
  } {
    const entriesByType: Record<string, number> = {};

    for (const entry of auditChain) {
      entriesByType[entry.eventType] = (entriesByType[entry.eventType] || 0) + 1;
    }

    return {
      totalEntries: auditChain.length,
      oldestEntry: auditChain.length > 0 ? auditChain[0].timestamp : null,
      newestEntry: auditChain.length > 0 ? auditChain[auditChain.length - 1].timestamp : null,
      entriesByType
    };
  }
}

// Singleton instance
export const secureAuditService = new SecureAuditService();

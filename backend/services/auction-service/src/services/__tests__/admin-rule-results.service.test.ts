/**
 * Admin Rule Results Service Tests
 * Tests for admin UI rule flag management
 * 
 * CRITICAL TESTS:
 * - Admin can SEE flags (read-only)
 * - Admin can ACKNOWLEDGE flags (audit trail)
 * - Admin can OVERRIDE flags (audit trail)
 * - NO auto-execution (manual review only)
 * - All actions logged (APPEND-ONLY)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  AdminRuleResultsService,
  FlagStatus,
  OverrideAction,
  AuditAction,
} from '../admin-rule-results.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Mock Prisma Service
 */
class MockPrismaService {
  ruleFlag = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    update: vi.fn(),
  };

  ruleFlagAcknowledgment = {
    create: vi.fn(),
    findMany: vi.fn(),
  };

  ruleFlagOverride = {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  };

  ruleFlagAuditLog = {
    create: vi.fn(),
    findMany: vi.fn(),
  };
}

describe('AdminRuleResultsService', () => {
  let service: AdminRuleResultsService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new AdminRuleResultsService(prisma as any);
  });

  describe('View Flags', () => {
    it('should get pending flags', async () => {
      const flags = [
        {
          flag_id: uuidv4(),
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: 'FLAG_USER',
          severity: 'HIGH',
          reason: 'Test reason',
          user_id: 'user-123',
          status: FlagStatus.PENDING,
          created_at: new Date(),
        },
      ];

      prisma.ruleFlag.findMany.mockResolvedValue(flags);

      const result = await service.getPendingFlags(50, 0);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(FlagStatus.PENDING);
      expect(prisma.ruleFlag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: FlagStatus.PENDING },
        })
      );
    });

    it('should get user flags', async () => {
      const userId = 'user-123';
      const flags = [
        {
          flag_id: uuidv4(),
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: 'FLAG_USER',
          severity: 'HIGH',
          reason: 'Test reason',
          user_id: userId,
          status: FlagStatus.PENDING,
          created_at: new Date(),
        },
      ];

      prisma.ruleFlag.findMany.mockResolvedValue(flags);

      const result = await service.getUserFlags(userId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe(userId);
    });

    it('should get auction flags', async () => {
      const auctionId = 'auction-456';
      const flags = [
        {
          flag_id: uuidv4(),
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: 'FLAG_AUCTION',
          severity: 'MEDIUM',
          reason: 'Test reason',
          auction_id: auctionId,
          status: FlagStatus.PENDING,
          created_at: new Date(),
        },
      ];

      prisma.ruleFlag.findMany.mockResolvedValue(flags);

      const result = await service.getAuctionFlags(auctionId);

      expect(result).toHaveLength(1);
      expect(result[0].auction_id).toBe(auctionId);
    });

    it('should get flags by status', async () => {
      const flags = [
        {
          flag_id: uuidv4(),
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: 'FLAG_USER',
          severity: 'HIGH',
          reason: 'Test reason',
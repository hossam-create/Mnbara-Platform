import { TrustScoreCalculator, TrustScoreUtils } from '../services/trust/trust_score.service';
import { TrustScoreInput } from '../models/trust_case.model';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    trustCase: {
      findMany: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

describe('Trust Score Calculator', () => {
  let calculator: TrustScoreCalculator;

  beforeEach(() => {
    calculator = new TrustScoreCalculator();
  });

  describe('calculateTrustScore', () => {
    it('should calculate excellent trust score', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-123',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'LOW',
            status: 'RESOLVED',
            created_at: new Date('2025-01-01'),
            resolved_at: new Date('2025-01-15'),
            appeals: [
              {
                appeal_id: 'AP-1',
                status: 'ACCEPTED',
                reviewed_at: new Date('2025-01-20')
              }
            ]
          }
        ],
        calculation_date: new Date('2025-01-17')
      };

      const result = await calculator.calculateTrustScore(input);

      expect(result.subject_id).toBe('user-123');
      expect(result.subject_type).toBe('USER');
      expect(result.trust_score).toBeGreaterThan(80);
      expect(result.score_category).toBe('EXCELLENT');
      expect(result.metadata.read_only).toBe(true);
      expect(result.metadata.non_binding).toBe(true);
      expect(result.metadata.not_used_in_payments).toBe(true);
    });

    it('should calculate critical trust score', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-456',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'CRITICAL',
            status: 'OPEN',
            created_at: new Date('2025-01-01')
          },
          {
            case_id: 'TC-2',
            severity: 'HIGH',
            status: 'OPEN',
            created_at: new Date('2025-01-05')
          },
          {
            case_id: 'TC-3',
            severity: 'MEDIUM',
            status: 'UNDER_REVIEW',
            created_at: new Date('2024-12-01')
          }
        ],
        calculation_date: new Date('2025-01-17')
      };

      const result = await calculator.calculateTrustScore(input);

      expect(result.trust_score).toBeLessThan(20);
      expect(result.score_category).toBe('CRITICAL');
      expect(result.calculation_details.open_cases).toBe(2);
      expect(result.calculation_details.under_review_cases).toBe(1);
    });

    it('should apply time decay correctly', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-789',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'HIGH',
            status: 'RESOLVED',
            created_at: new Date('2024-01-01') // Very old case
          }
        ],
        calculation_date: new Date('2025-01-17')
      };

      const result = await calculator.calculateTrustScore(input);

      // Old case should have minimal impact due to time decay
      expect(result.score_breakdown.time_decay_factor).toBeLessThan(0.5);
      expect(result.trust_score).toBeGreaterThan(80); // Should be high due to decay
    });

    it('should handle appeal adjustments correctly', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-999',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'HIGH',
            status: 'RESOLVED',
            created_at: new Date('2025-01-10'),
            appeals: [
              {
                appeal_id: 'AP-1',
                status: 'ACCEPTED', // Should improve score
                reviewed_at: new Date('2025-01-15')
              },
              {
                appeal_id: 'AP-2',
                status: 'REJECTED', // Should hurt score
                reviewed_at: new Date('2025-01-16')
              }
            ]
          }
        ],
        calculation_date: new Date('2025-01-17')
      };

      const result = await calculator.calculateTrustScore(input);

      // Net appeal adjustment should be -5 (accepted: -10, rejected: +5)
      expect(result.score_breakdown.appeal_adjustment).toBe(-5);
      expect(result.calculation_details.accepted_appeals).toBe(1);
      expect(result.calculation_details.rejected_appeals).toBe(1);
    });

    it('should validate input correctly', async () => {
      const invalidInput = {
        subject_id: 'invalid-uuid',
        subject_type: 'INVALID_TYPE',
        trust_cases: [],
        calculation_date: new Date()
      };

      await expect(calculator.calculateTrustScore(invalidInput as any))
        .rejects.toThrow();
    });

    it('should handle empty trust cases', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-empty',
        subject_type: 'USER',
        trust_cases: [],
        calculation_date: new Date()
      };

      const result = await calculator.calculateTrustScore(input);

      expect(result.trust_score).toBe(100); // Base score with no penalties
      expect(result.score_category).toBe('EXCELLENT');
      expect(result.calculation_details.total_cases).toBe(0);
    });
  });

  describe('getSubjectTrustScore', () => {
    it('should retrieve and calculate score for subject', async () => {
      const mockTrustCases = [
        {
          case_id: 'TC-1',
          subject_id: 'user-123',
          subject_type: 'USER',
          severity: 'LOW',
          status: 'RESOLVED',
          created_at: new Date('2025-01-01'),
          resolved_at: new Date('2025-01-15'),
          appeals: []
        }
      ];

      // Mock the database call
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient() as jest.Mocked<any>;
      mockPrisma.trustCase.findMany.mockResolvedValue(mockTrustCases);

      const result = await calculator.getSubjectTrustScore('user-123', 'USER');

      expect(result).not.toBeNull();
      expect(result!.subject_id).toBe('user-123');
      expect(result!.trust_score).toBeGreaterThan(80);
      expect(mockPrisma.trustCase.findMany).toHaveBeenCalledWith({
        where: {
          subject_id: 'user-123',
          subject_type: 'USER'
        },
        include: {
          appeals: {
            select: {
              appeal_id: true,
              status: true,
              reviewed_at: true,
              reviewed_by: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 100
      });
    });

    it('should return null for subject with no trust cases', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient() as jest.Mocked<any>;
      mockPrisma.trustCase.findMany.mockResolvedValue([]);

      const result = await calculator.getSubjectTrustScore('user-999', 'USER');

      expect(result).toBeNull();
    });
  });

  describe('getBatchTrustScores', () => {
    it('should calculate scores for multiple subjects', async () => {
      const subjects = [
        { subject_id: 'user-123', subject_type: 'USER' },
        { subject_id: 'user-456', subject_type: 'USER' },
        { subject_id: 'seller-789', subject_type: 'SELLER' }
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient() as jest.Mocked<any>;
      
      // Mock different responses for each subject
      mockPrisma.trustCase.findMany
        .mockResolvedValueOnce([{ case_id: 'TC-1' }]) // user-123
        .mockResolvedValueOnce([{ case_id: 'TC-2' }]) // user-456
        .mockResolvedValueOnce([]); // seller-789 (no cases)

      const results = await calculator.getBatchTrustScores(subjects);

      expect(results).toHaveLength(2); // Only subjects with cases
      expect(results[0].subject_id).toBe('user-123');
      expect(results[1].subject_id).toBe('user-456');
    });
  });

  describe('getTrustScoreStatistics', () => {
    it('should return trust score statistics', async () => {
      const stats = await calculator.getTrustScoreStatistics();

      expect(stats).toHaveProperty('total_subjects');
      expect(stats).toHaveProperty('average_score');
      expect(stats).toHaveProperty('score_distribution');
      expect(stats.metadata.read_only).toBe(true);
      expect(stats.metadata.non_binding).toBe(true);
      expect(stats.metadata.not_used_in_payments).toBe(true);
    });

    it('should return filtered statistics', async () => {
      const stats = await calculator.getTrustScoreStatistics('USER', {
        score_range: 'POOR',
        date_range: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31')
        }
      });

      expect(stats).toHaveProperty('total_subjects');
      expect(stats).toHaveProperty('average_score');
    });
  });

  describe('Configuration', () => {
    it('should return default configuration', () => {
      const config = calculator.getConfig();

      expect(config.severityWeights.CRITICAL).toBe(40);
      expect(config.severityWeights.HIGH).toBe(25);
      expect(config.appealImpactWeights.ACCEPTED).toBe(-10);
      expect(config.timeDecayConfig.halfLife).toBe(90);
    });

    it('should update configuration', () => {
      const newConfig = {
        severityWeights: {
          CRITICAL: 50,
          HIGH: 30,
          MEDIUM: 20,
          LOW: 10
        }
      };

      calculator.updateConfig(newConfig);
      const updatedConfig = calculator.getConfig();

      expect(updatedConfig.severityWeights.CRITICAL).toBe(50);
      expect(updatedConfig.severityWeights.HIGH).toBe(30);
      expect(updatedConfig.severityWeights.MEDIUM).toBe(20);
      expect(updatedConfig.severityWeights.LOW).toBe(10);
    });
  });

  describe('Trust Score Utils', () => {
    it('should validate input correctly', () => {
      const validInput = {
        subject_id: 'user-123',
        subject_type: 'USER',
        trust_cases: [],
        calculation_date: new Date()
      };

      const result = TrustScoreUtils.validateInput(validInput);

      expect(result.subject_id).toBe('user-123');
      expect(result.subject_type).toBe('USER');
    });

    it('should get score category description', () => {
      const description = TrustScoreUtils.getScoreCategoryDescription('EXCELLENT');

      expect(description).toContain('Outstanding trust record');
    });

    it('should get score impact explanation', () => {
      const scoreBreakdown = {
        base_score: 85,
        severity_penalty: 25,
        appeal_adjustment: -5,
        time_decay_factor: 0.896
      };

      const explanation = TrustScoreUtils.getScoreImpactExplanation(scoreBreakdown);

      expect(explanation).toContain('Base Score: 85');
      expect(explanation).toContain('Severity Penalty: -25');
      expect(explanation).toContain('Appeal Adjustment: -5');
      expect(explanation).toContain('Time Decay Factor: 0.896');
    });
  });

  describe('Business Rules Verification', () => {
    it('should be read only - no data modification', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient() as jest.Mocked<any>;
      mockPrisma.trustCase.findMany.mockResolvedValue([]);

      await calculator.getSubjectTrustScore('user-123', 'USER');

      // Verify no write operations were called
      expect(mockPrisma.trustCase.create).not.toHaveBeenCalled();
      expect(mockPrisma.trustCase.update).not.toHaveBeenCalled();
      expect(mockPrisma.trustCase.delete).not.toHaveBeenCalled();
    });

    it('should be non-binding - no automatic actions', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-123',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'CRITICAL',
            status: 'OPEN',
            created_at: new Date()
          }
        ],
        calculation_date: new Date()
      };

      const result = await calculator.calculateTrustScore(input);

      // Score should be calculated but no actions triggered
      expect(result.trust_score).toBeLessThan(20);
      expect(result.score_category).toBe('CRITICAL');
      expect(result.metadata.read_only).toBe(true);
      expect(result.metadata.non_binding).toBe(true);
      expect(result.metadata.not_used_in_payments).toBe(true);
    });

    it('should not be used in payments - financial isolation', async () => {
      const fs = require('fs');
      const path = require('path');
      const serviceFile = fs.readFileSync(
        path.join(__dirname, '../services/trust/trust_score.service.ts'),
        'utf8'
      );

      // Should not contain any financial system access
      expect(serviceFile).not.toContain('wallet');
      expect(serviceFile).not.toContain('escrow');
      expect(serviceFile).not.toContain('ledger');
      expect(serviceFile).not.toContain('payment');
      expect(serviceFile).not.toContain('transaction');
      expect(serviceFile).not.toContain('invoice');
      expect(serviceFile).not.toContain('balance');

      // Should contain read-only and non-binding declarations
      expect(serviceFile).toContain('read_only: true');
      expect(serviceFile).toContain('non_binding: true');
      expect(serviceFile).toContain('not_used_in_payments: true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very old cases', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-old',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'LOW',
            status: 'RESOLVED',
            created_at: new Date('2023-01-01') // Over a year old
          }
        ],
        calculation_date: new Date('2025-01-17')
      };

      const result = await calculator.calculateTrustScore(input);

      // Very old case should have minimal impact
      expect(result.score_breakdown.time_decay_factor).toBeLessThan(0.1);
      expect(result.trust_score).toBeGreaterThan(90); // Should be very high
    });

    it('should handle maximum penalty scenario', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-max-penalty',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'CRITICAL',
            status: 'OPEN',
            created_at: new Date() // Recent
          },
          {
            case_id: 'TC-2',
            severity: 'CRITICAL',
            status: 'OPEN',
            created_at: new Date() // Recent
          },
          {
            case_id: 'TC-3',
            severity: 'HIGH',
            status: 'OPEN',
            created_at: new Date() // Recent
          }
        ],
        calculation_date: new Date()
      };

      const result = await calculator.calculateTrustScore(input);

      // Should result in very low score due to multiple open severe cases
      expect(result.trust_score).toBeLessThan(20);
      expect(result.score_category).toBe('CRITICAL');
    });

    it('should handle zero score floor', async () => {
      const input: TrustScoreInput = {
        subject_id: 'user-zero-score',
        subject_type: 'USER',
        trust_cases: [
          {
            case_id: 'TC-1',
            severity: 'CRITICAL',
            status: 'OPEN',
            created_at: new Date()
          },
          {
            case_id: 'TC-2',
            severity: 'CRITICAL',
            status: 'OPEN',
            created_at: new Date()
          },
          {
            case_id: 'TC-3',
            severity: 'CRITICAL',
            status: 'OPEN',
            created_at: new Date()
          }
        ],
        calculation_date: new Date()
      };

      const result = await calculator.calculateTrustScore(input);

      // Score should not go below 0
      expect(result.trust_score).toBe(0);
      expect(result.score_category).toBe('CRITICAL');
    });
  });
});

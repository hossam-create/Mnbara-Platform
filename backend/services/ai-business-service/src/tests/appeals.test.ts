import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppealStatus, AppealActorType } from '../models/appeal.model';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    trustCase: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    appeal: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn()
    },
    businessAuditLog: {
      create: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

describe('Appeal Submission API', () => {
  let app: express.Application;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Import and use the router
    const appealsRouter = require('../routes/trust/appeals').default;
    app.use('/trust/appeals', appealsRouter);
    
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('POST /trust/appeals', () => {
    it('should submit appeal successfully', async () => {
      const mockTrustCase = {
        case_id: 'TC-123',
        subject_id: 'user-123',
        subject_type: 'USER',
        status: 'RESOLVED',
        severity: 'HIGH',
        businessAccountId: 'business-123',
        rule: { name: 'Suspicious Activity' }
      };

      const mockAppeal = {
        appeal_id: 'AP-123',
        trust_case_id: 'TC-123',
        actor_id: 'user-123',
        actor_type: 'USER',
        status: 'OPEN',
        message: 'I believe this decision was incorrect because...',
        created_at: new Date()
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockTrustCase);
      mockPrisma.appeal.findFirst.mockResolvedValue(null); // No existing appeal
      mockPrisma.appeal.create.mockResolvedValue(mockAppeal);
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: 'I believe this decision was incorrect because I have provided all necessary documentation and followed all guidelines.'
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        appeal: {
          appeal_id: 'AP-123',
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          status: 'OPEN',
          message: 'Appeal submitted successfully. It will be reviewed by our team.'
        },
        trust_case: {
          case_id: 'TC-123',
          status: 'RESOLVED',
          severity: 'HIGH',
          rule_name: 'Suspicious Activity'
        },
        next_steps: {
          status: 'SUBMITTED_FOR_REVIEW',
          message: 'Your appeal has been submitted and is pending review. You will be notified when a decision is made.',
          expected_response_time: '24-48 hours'
        }
      });
    });

    it('should reject appeal for non-existent trust case', async () => {
      mockPrisma.trustCase.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'NON-EXISTENT',
          actor_type: 'USER',
          message: 'This is my appeal message.'
        });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Trust case not found',
        code: 'TRUST_CASE_NOT_FOUND'
      });
    });

    it('should reject duplicate appeal within 24 hours', async () => {
      const mockTrustCase = {
        case_id: 'TC-123',
        subject_id: 'user-123',
        subject_type: 'USER',
        status: 'RESOLVED',
        businessAccountId: 'business-123'
      };

      const existingAppeal = {
        appeal_id: 'AP-EXISTING',
        trust_case_id: 'TC-123',
        actor_id: 'user-123',
        actor_type: 'USER',
        status: 'OPEN',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockTrustCase);
      mockPrisma.appeal.findFirst.mockResolvedValue(existingAppeal);

      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: 'This is a duplicate appeal.'
        });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        error: 'Appeal already exists for this trust case',
        code: 'DUPLICATE_APPEAL',
        existing_appeal_id: 'AP-EXISTING'
      });
    });

    it('should reject appeal for unauthorized trust case', async () => {
      const mockTrustCase = {
        case_id: 'TC-123',
        subject_id: 'other-user-456',
        subject_type: 'USER',
        status: 'RESOLVED',
        businessAccountId: 'other-business-456'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockTrustCase);
      mockPrisma.appeal.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: 'I am trying to appeal someone else\'s case.'
        });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: 'You can only appeal trust cases for your own business account',
        code: 'UNAUTHORIZED_ACCESS'
      });
    });

    it('should validate message length', async () => {
      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: 'Too short' // Less than 10 characters
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/trust/appeals')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: 'This is an appeal without authentication.'
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    });

    it('should enforce rate limiting', async () => {
      const mockTrustCase = {
        case_id: 'TC-123',
        subject_id: 'user-123',
        subject_type: 'USER',
        status: 'RESOLVED',
        businessAccountId: 'business-123'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockTrustCase);
      mockPrisma.appeal.findFirst.mockResolvedValue(null);
      mockPrisma.appeal.create.mockResolvedValue({});

      // First request should succeed
      const firstResponse = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: 'First appeal within the hour.'
        });

      expect(firstResponse.status).toBe(201);

      // Second request should be rate limited
      const secondResponse = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-456',
          actor_type: 'USER',
          message: 'Second appeal within the hour.'
        });

      expect(secondResponse.status).toBe(429);
      expect(secondResponse.body).toMatchObject({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'You can only submit one appeal per hour'
      });
    });
  });

  describe('GET /trust/appeals/:id', () => {
    it('should return user\'s own appeal', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        trust_case_id: 'TC-123',
        actor_id: 'user-123',
        actor_type: 'USER',
        status: 'OPEN',
        message: 'This is my appeal message',
        created_at: new Date(),
        trustCase: {
          case_id: 'TC-123',
          status: 'RESOLVED',
          severity: 'HIGH',
          rule: { name: 'Suspicious Activity' }
        }
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);

      const response = await request(app)
        .get('/trust/appeals/AP-123')
        .set('Authorization', 'Bearer valid-user-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        appeal: {
          appeal_id: 'AP-123',
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          status: 'OPEN',
          message: 'This is my appeal message'
        },
        trust_case: {
          case_id: 'TC-123',
          status: 'RESOLVED',
          severity: 'HIGH',
          rule_name: 'Suspicious Activity'
        }
      });
    });

    it('should reject access to other user\'s appeal', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        actor_id: 'other-user-456', // Different user
        trust_case_id: 'TC-123',
        actor_type: 'USER',
        status: 'OPEN'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);

      const response = await request(app)
        .get('/trust/appeals/AP-123')
        .set('Authorization', 'Bearer valid-user-token');

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: 'Access denied',
        code: 'UNAUTHORIZED_ACCESS'
      });
    });

    it('should return 404 for non-existent appeal', async () => {
      mockPrisma.appeal.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/trust/appeals/NON-EXISTENT')
        .set('Authorization', 'Bearer valid-user-token');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Appeal not found',
        code: 'APPEAL_NOT_FOUND'
      });
    });
  });

  describe('GET /trust/appeals', () => {
    it('should return user\'s appeals with pagination', async () => {
      const mockAppeals = [
        {
          appeal_id: 'AP-123',
          trust_case_id: 'TC-123',
          actor_id: 'user-123',
          actor_type: 'USER',
          status: 'OPEN',
          message: 'First appeal message',
          created_at: new Date(),
          trustCase: {
            case_id: 'TC-123',
            status: 'RESOLVED',
            severity: 'HIGH',
            rule: { name: 'Suspicious Activity' }
          }
        },
        {
          appeal_id: 'AP-456',
          trust_case_id: 'TC-456',
          actor_id: 'user-123',
          actor_type: 'USER',
          status: 'ACCEPTED',
          message: 'Second appeal message',
          created_at: new Date(),
          trustCase: {
            case_id: 'TC-456',
            status: 'RESOLVED',
            severity: 'MEDIUM',
            rule: { name: 'Policy Violation' }
          }
        }
      ];

      mockPrisma.appeal.findMany.mockResolvedValue(mockAppeals);
      mockPrisma.appeal.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        appeals: expect.any(Array),
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          has_more: false
        }
      });

      expect(response.body.appeals).toHaveLength(2);
      expect(response.body.appeals[0].message).toContain('...'); // Should be truncated
    });

    it('should filter appeals by status', async () => {
      const mockAppeals = [
        {
          appeal_id: 'AP-123',
          actor_id: 'user-123',
          status: 'OPEN',
          created_at: new Date()
        }
      ];

      mockPrisma.appeal.findMany.mockResolvedValue(mockAppeals);
      mockPrisma.appeal.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .query({ status: 'OPEN' });

      expect(response.status).toBe(200);
      expect(response.body.appeals).toHaveLength(1);
      expect(response.body.appeals[0].status).toBe('OPEN');
    });
  });

  describe('GET /trust/appeals/eligible-cases', () => {
    it('should return cases user can appeal', async () => {
      const mockEligibleCases = [
        {
          case_id: 'TC-123',
          subject_type: 'USER',
          subject_id: 'user-123',
          status: 'RESOLVED',
          severity: 'HIGH',
          created_at: new Date(),
          rule: { name: 'Suspicious Activity' },
          _count: { appeals: 0 }
        },
        {
          case_id: 'TC-456',
          subject_type: 'TRAVELER',
          subject_id: 'user-123',
          status: 'DISMISSED',
          severity: 'MEDIUM',
          created_at: new Date(),
          rule: { name: 'Verification Issues' },
          _count: { appeals: 0 }
        }
      ];

      mockPrisma.trustCase.findMany.mockResolvedValue(mockEligibleCases);

      const response = await request(app)
        .get('/trust/appeals/eligible-cases')
        .set('Authorization', 'Bearer valid-user-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        eligible_cases: expect.any(Array),
        total: 2
      });

      expect(response.body.eligible_cases).toHaveLength(2);
      expect(response.body.eligible_cases[0]).toMatchObject({
        case_id: 'TC-123',
        can_appeal: true,
        appeal_deadline: expect.any(Date)
      });
    });

    it('should exclude cases with recent appeals', async () => {
      const mockCases = [
        {
          case_id: 'TC-123',
          subject_id: 'user-123',
          _count: { appeals: 1 } // Has recent appeal
        },
        {
          case_id: 'TC-456',
          subject_id: 'user-123',
          _count: { appeals: 0 } // No recent appeal
        }
      ];

      mockPrisma.trustCase.findMany.mockResolvedValue(mockCases);

      const response = await request(app)
        .get('/trust/appeals/eligible-cases')
        .set('Authorization', 'Bearer valid-user-token');

      expect(response.body.eligible_cases).toHaveLength(1);
      expect(response.body.eligible_cases[0].case_id).toBe('TC-456');
    });
  });

  describe('Input Validation', () => {
    it('should validate trust_case_id format', async () => {
      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'invalid-uuid-format',
          actor_type: 'USER',
          message: 'This appeal has invalid trust case ID.'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate actor_type', async () => {
      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'INVALID_ACTOR_TYPE',
          message: 'This appeal has invalid actor type.'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate message length limits', async () => {
      const longMessage = 'a'.repeat(5001); // Exceeds 5000 character limit

      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: longMessage
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should trim whitespace from message', async () => {
      const mockTrustCase = {
        case_id: 'TC-123',
        subject_id: 'user-123',
        subject_type: 'USER',
        status: 'RESOLVED',
        businessAccountId: 'business-123'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockTrustCase);
      mockPrisma.appeal.findFirst.mockResolvedValue(null);
      mockPrisma.appeal.create.mockImplementation((data: any) => {
        expect(data.message).toBe('Trimmed message'); // Should be trimmed
        return Promise.resolve({ appeal_id: 'AP-123' });
      });

      await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: '   Trimmed message   ' // With whitespace
        });
    });
  });

  describe('Business Rules Verification', () => {
    it('should never auto-resolve appeals', async () => {
      const mockTrustCase = {
        case_id: 'TC-123',
        subject_id: 'user-123',
        status: 'RESOLVED',
        businessAccountId: 'business-123'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockTrustCase);
      mockPrisma.appeal.findFirst.mockResolvedValue(null);
      mockPrisma.appeal.create.mockResolvedValue({
        appeal_id: 'AP-123',
        status: 'OPEN' // Should always be OPEN initially
      });

      const response = await request(app)
        .post('/trust/appeals')
        .set('Authorization', 'Bearer valid-user-token')
        .send({
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          message: 'This appeal should not be auto-resolved.'
        });

      expect(response.status).toBe(201);
      expect(response.body.appeal.status).toBe('OPEN');
      expect(response.body.next_steps.status).toBe('SUBMITTED_FOR_REVIEW');
    });

    it('should never execute attachments', async () => {
      const fs = require('fs');
      const path = require('path');
      const appealsFile = fs.readFileSync(
        path.join(__dirname, '../routes/trust/appeals.ts'),
        'utf8'
      );

      // Should not contain any file handling logic
      expect(appealsFile).not.toContain('multer');
      expect(appealsFile).not.toContain('upload');
      expect(appealsFile).not.toContain('attachment');
      expect(appealsFile).not.toContain('file');
    });

    it('should never access financial systems', async () => {
      const fs = require('fs');
      const path = require('path');
      const appealsFile = fs.readFileSync(
        path.join(__dirname, '../routes/trust/appeals.ts'),
        'utf8'
      );

      // Should not contain any financial system access
      expect(appealsFile).not.toContain('wallet');
      expect(appealsFile).not.toContain('escrow');
      expect(appealsFile).not.toContain('ledger');
      expect(appealsFile).not.toContain('payment');
      expect(appealsFile).not.toContain('transaction');
    });
  });
});

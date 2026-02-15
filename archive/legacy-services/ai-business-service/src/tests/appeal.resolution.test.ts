import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppealStatus } from '../models/appeal.model';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    appeal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    businessAuditLog: {
      create: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

describe('Admin Appeal Resolution API', () => {
  let app: express.Application;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Import and use the router
    const appealResolutionRouter = require('../routes/admin/appeal.resolution').default;
    app.use('/admin/trust/appeals', appealResolutionRouter);
    
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('POST /admin/trust/appeals/:id/resolve', () => {
    it('should accept appeal successfully', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        trust_case_id: 'TC-123',
        actor_id: 'user-123',
        actor_type: 'USER',
        status: 'OPEN',
        message: 'This is my appeal message',
        created_at: new Date()
      };

      const mockTrustCase = {
        case_id: 'TC-123',
        status: 'RESOLVED',
        severity: 'HIGH',
        rule: { name: 'Suspicious Activity' },
        businessAccount: { name: 'Test Business' }
      };

      const updatedAppeal = {
        ...mockAppeal,
        status: 'ACCEPTED',
        admin_notes: 'Appeal accepted after review',
        reviewed_by: 'admin-456',
        reviewed_at: new Date()
      };

      mockPrisma.appeal.findUnique.mockResolvedValue({
        ...mockAppeal,
        trustCase: mockTrustCase
      });
      mockPrisma.appeal.update.mockResolvedValue(updatedAppeal);
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: 'Appeal accepted after thorough review. User provided sufficient documentation.',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        appeal_id: 'AP-123',
        resolution_action: 'ACCEPT',
        new_status: 'ACCEPTED',
        resolved_by: 'admin-456',
        financial_impact: {
          wallet_changed: false,
          escrow_changed: false,
          ledger_changed: false,
          payment_processed: false,
          message: 'Appeal resolution is informational only - no financial systems affected'
        }
      });
    });

    it('should reject appeal successfully', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        trust_case_id: 'TC-123',
        actor_id: 'user-123',
        actor_type: 'USER',
        status: 'OPEN',
        created_at: new Date()
      };

      const mockTrustCase = {
        case_id: 'TC-123',
        status: 'RESOLVED',
        severity: 'MEDIUM',
        rule: { name: 'Policy Violation' }
      };

      const updatedAppeal = {
        ...mockAppeal,
        status: 'REJECTED',
        admin_notes: 'Appeal rejected - insufficient evidence',
        reviewed_by: 'admin-456',
        reviewed_at: new Date()
      };

      mockPrisma.appeal.findUnique.mockResolvedValue({
        ...mockAppeal,
        trustCase: mockTrustCase
      });
      mockPrisma.appeal.update.mockResolvedValue(updatedAppeal);
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'REJECT',
          admin_notes: 'Appeal rejected due to insufficient evidence and policy violations.',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        appeal_id: 'AP-123',
        resolution_action: 'REJECT',
        new_status: 'REJECTED',
        resolved_by: 'admin-456',
        financial_impact: {
          wallet_changed: false,
          escrow_changed: false,
          ledger_changed: false,
          payment_processed: false,
          message: 'Appeal resolution is informational only - no financial systems affected'
        }
      });
    });

    it('should request more information successfully', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        trust_case_id: 'TC-123',
        actor_id: 'user-123',
        actor_type: 'USER',
        status: 'OPEN',
        created_at: new Date()
      };

      const mockTrustCase = {
        case_id: 'TC-123',
        status: 'RESOLVED',
        severity: 'MEDIUM',
        rule: { name: 'Verification Issues' }
      };

      const updatedAppeal = {
        ...mockAppeal,
        status: 'UNDER_REVIEW',
        admin_notes: 'Requesting additional documentation',
        reviewed_by: 'admin-456',
        reviewed_at: new Date()
      };

      mockPrisma.appeal.findUnique.mockResolvedValue({
        ...mockAppeal,
        trustCase: mockTrustCase
      });
      mockPrisma.appeal.update.mockResolvedValue(updatedAppeal);
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'REQUEST_INFO',
          admin_notes: 'Please provide additional documentation for your identity verification.',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        appeal_id: 'AP-123',
        resolution_action: 'REQUEST_INFO',
        new_status: 'UNDER_REVIEW',
        resolved_by: 'admin-456',
        financial_impact: {
          wallet_changed: false,
          escrow_changed: false,
          ledger_changed: false,
          payment_processed: false,
          message: 'Appeal resolution is informational only - no financial systems affected'
        }
      });
    });

    it('should reject resolution of already resolved appeal', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        status: 'ACCEPTED', // Already resolved
        trust_case_id: 'TC-123'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'REJECT',
          admin_notes: 'Trying to resolve already accepted appeal',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Appeal has already been resolved',
        code: 'APPEAL_ALREADY_RESOLVED'
      });
    });

    it('should reject resolution for non-existent appeal', async () => {
      mockPrisma.appeal.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/admin/trust/appeals/NON-EXISTENT/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: 'Trying to resolve non-existent appeal',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Appeal not found',
        code: 'APPEAL_NOT_FOUND'
      });
    });

    it('should validate admin notes', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        status: 'OPEN',
        trust_case_id: 'TC-123'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: '', // Empty notes
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should reject invalid resolution action', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        status: 'OPEN',
        trust_case_id: 'TC-123'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'INVALID_ACTION',
          admin_notes: 'Invalid resolution action',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .send({
          action: 'ACCEPT',
          admin_notes: 'No authentication provided',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer non-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: 'Non-admin trying to resolve appeal',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    });
  });

  describe('GET /admin/trust/appeals/:id/history', () => {
    it('should return appeal resolution history', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'APPEAL_RESOLUTION',
          newValues: { resolution_action: 'ACCEPT', admin_id: 'admin-456' },
          createdAt: new Date('2025-01-17T11:54:00.000Z')
        },
        {
          id: 'audit-2',
          action: 'FINANCIAL_NON_IMPACT',
          newValues: { appeal_id: 'AP-123', impact_type: 'INFORMATIONAL_ONLY' },
          createdAt: new Date('2025-01-17T11:55:00.000Z')
        }
      ];

      mockPrisma.businessAuditLog.findMany.mockResolvedValue(mockAuditLogs);

      const response = await request(app)
        .get('/admin/trust/appeals/AP-123/history')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        appeal_id: 'AP-123',
        action_history: expect.any(Array)
      });
    });
  });

  describe('GET /admin/trust/appeals/pending-resolution', () => {
    it('should return appeals pending resolution', async () => {
      const mockPendingAppeals = [
        {
          appeal_id: 'AP-123',
          trust_case_id: 'TC-123',
          actor_type: 'USER',
          actor_id: 'user-123',
          status: 'OPEN',
          message: 'First appeal message',
          created_at: new Date(),
          trustCase: {
            case_id: 'TC-123',
            subject_type: 'USER',
            subject_id: 'user-123',
            status: 'RESOLVED',
            severity: 'HIGH',
            rule: { name: 'Suspicious Activity' },
            businessAccount: { name: 'Test Business', businessType: 'ENTERPRISE' }
          }
        },
        {
          appeal_id: 'AP-456',
          trust_case_id: 'TC-456',
          actor_type: 'TRAVELER',
          actor_id: 'user-123',
          status: 'UNDER_REVIEW',
          message: 'Second appeal message',
          created_at: new Date(),
          trustCase: {
            case_id: 'TC-456',
            subject_type: 'TRAVELER',
            subject_id: 'user-123',
            status: 'DISMISSED',
            severity: 'MEDIUM',
            rule: { name: 'Verification Issues' },
            businessAccount: { name: 'Test Business', businessType: 'ENTERPRISE' }
          }
        }
      ];

      mockPrisma.appeal.findMany.mockResolvedValue(mockPendingAppeals);

      const response = await request(app)
        .get('/admin/trust/appeals/pending-resolution')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        pending_appeals: expect.any(Array),
        total: 2
      });
    });
  });

  describe('POST /admin/trust/appeals/bulk-resolve', () => {
    it('should perform bulk appeal resolution', async () => {
      const mockAppeals = [
        { appeal_id: 'AP-123', status: 'OPEN' },
        { appeal_id: 'AP-456', status: 'OPEN' },
        { appeal_id: 'AP-789', status: 'OPEN' }
      ];

      mockPrisma.appeal.findUnique
        .mockResolvedValueOnce(mockAppeals[0])
        .mockResolvedValueOnce(mockAppeals[1])
        .mockResolvedValueOnce(mockAppeals[2]);

      mockPrisma.appeal.update
        .mockResolvedValueOnce({ status: 'ACCEPTED' })
        .mockResolvedValueOnce({ status: 'ACCEPTED' })
        .mockResolvedValueOnce({ status: 'ACCEPTED' });

      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/appeals/bulk-resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          appeal_ids: ['AP-123', 'AP-456', 'AP-789'],
          action: 'ACCEPT',
          admin_notes: 'Bulk acceptance of appeals after review'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        resolution_action: 'ACCEPT',
        processed: 3,
        errors: 0,
        financial_impact: {
          wallet_changed: false,
          escrow_changed: false,
          ledger_changed: false,
          payment_processed: false,
          message: 'Bulk appeal resolution completed - informational only, no financial systems affected'
        }
      });
    });

    it('should handle mixed success and errors in bulk resolution', async () => {
      const mockAppeals = [
        { appeal_id: 'AP-123', status: 'OPEN' },
        { appeal_id: 'AP-456', status: 'ACCEPTED' }, // Already resolved
        { appeal_id: 'AP-789', status: 'OPEN' }
      ];

      mockPrisma.appeal.findUnique
        .mockResolvedValueOnce(mockAppeals[0])
        .mockResolvedValueOnce(mockAppeals[1])
        .mockResolvedValueOnce(mockAppeals[2]);

      mockPrisma.appeal.update
        .mockResolvedValueOnce({ status: 'ACCEPTED' })
        .mockResolvedValueOnce({ status: 'ACCEPTED' });

      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/appeals/bulk-resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          appeal_ids: ['AP-123', 'AP-456', 'AP-789'],
          action: 'ACCEPT',
          admin_notes: 'Bulk resolution attempt'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        resolution_action: 'ACCEPT',
        processed: 2,
        errors: 1,
        financial_impact: {
          wallet_changed: false,
          escrow_changed: false,
          ledger_changed: false,
          payment_processed: false,
          message: 'Bulk appeal resolution completed - informational only, no financial systems affected'
        }
      });
    });
  });

  describe('Financial Non-Impact Verification', () => {
    it('should never access financial systems', async () => {
      const fs = require('fs');
      const path = require('path');
      const appealResolutionFile = fs.readFileSync(
        path.join(__dirname, '../routes/admin/appeal.resolution.ts'),
        'utf8'
      );

      // Should not contain any financial system access
      expect(appealResolutionFile).not.toContain('wallet');
      expect(appealResolutionFile).not.toContain('escrow');
      expect(appealResolutionFile).not.toContain('ledger');
      expect(appealResolutionFile).not.toContain('payment');
      expect(appealResolutionFile).not.toContain('transaction');
    });

    it('should log financial non-impact for all resolutions', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        status: 'OPEN',
        trust_case_id: 'TC-123'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);
      mockPrisma.appeal.update.mockResolvedValue({ status: 'ACCEPTED' });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: 'Test resolution',
          reviewed_by: 'admin-456'
        });

      // Verify financial non-impact logging
      expect(mockPrisma.businessAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'financial_systems',
          recordId: 'appeal-AP-123',
          action: 'FINANCIAL_NON_IMPACT',
          newValues: expect.objectContaining({
            wallet_accessed: false,
            escrow_accessed: false,
            ledger_accessed: false,
            payment_processed: false,
            impact_type: 'INFORMATIONAL_ONLY'
          })
        })
      );
    });

    it('should explicitly state no financial changes in response', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        status: 'OPEN',
        trust_case_id: 'TC-123'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);
      mockPrisma.appeal.update.mockResolvedValue({ status: 'REJECTED' });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'REJECT',
          admin_notes: 'Test rejection',
          reviewed_by: 'admin-456'
        });

      expect(response.body.financial_impact).toMatchObject({
        wallet_changed: false,
        escrow_changed: false,
        ledger_changed: false,
        payment_processed: false,
        message: expect.stringContaining('no financial systems affected')
      });
    });
  });

  describe('Audit Logging Verification', () => {
    it('should log all appeal resolution actions', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        status: 'OPEN',
        trust_case_id: 'TC-123'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);
      mockPrisma.appeal.update.mockResolvedValue({ status: 'ACCEPTED' });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: 'Test audit logging',
          reviewed_by: 'admin-456'
        });

      // Verify audit logging was called
      expect(mockPrisma.businessAuditLog.create).toHaveBeenCalledTimes(2); // Resolution + Financial non-impact
      
      // Verify resolution audit log
      expect(mockPrisma.businessAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'appeals',
          recordId: 'AP-123',
          action: 'APPEAL_RESOLUTION',
          newValues: expect.objectContaining({
            resolution_action: 'ACCEPT',
            new_status: 'ACCEPTED',
            financial_impact: 'NONE'
          })
        })
      );
    });

    it('should log admin details in audit trail', async () => {
      const mockAppeal = {
        appeal_id: 'AP-123',
        status: 'OPEN',
        trust_case_id: 'TC-123'
      };

      mockPrisma.appeal.findUnique.mockResolvedValue(mockAppeal);
      mockPrisma.appeal.update.mockResolvedValue({ status: 'REJECTED' });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'REJECT',
          admin_notes: 'Test admin details logging',
          reviewed_by: 'admin-456'
        });

      // Verify admin details are logged
      expect(mockPrisma.businessAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-456',
          newValues: expect.objectContaining({
            admin_id: 'admin-456',
            reviewed_by: 'admin-456'
          })
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate resolution action', async () => {
      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'INVALID_ACTION',
          admin_notes: 'Invalid action test',
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate admin notes length', async () => {
      const longNotes = 'a'.repeat(2001); // Exceeds 2000 character limit

      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: longNotes,
          reviewed_by: 'admin-456'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate reviewed_by UUID format', async () => {
      const response = await request(app)
        .post('/admin/trust/appeals/AP-123/resolve')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACCEPT',
          admin_notes: 'Valid notes',
          reviewed_by: 'invalid-uuid-format'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });
  });
});

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { TrustCaseActionSchema } from '../routes/admin/trust.actions';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    trustCase: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    businessAuditLog: {
      create: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

describe('Trust Case Admin Actions', () => {
  let app: express.Application;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Import and use the router
    const trustActionsRouter = require('../routes/admin/trust.actions').default;
    app.use('/admin/trust', trustActionsRouter);
    
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('POST /admin/trust/cases/:id/action', () => {
    it('should acknowledge a trust case', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'OPEN',
        notes: 'Initial case notes'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);
      mockPrisma.trustCase.update.mockResolvedValue({
        ...mockCase,
        status: 'UNDER_REVIEW'
      });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACKNOWLEDGE',
          acknowledged_by: 'admin-123',
          notes: 'Case acknowledged and under review'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        case_id: 'TC-123',
        action_performed: 'ACKNOWLEDGE',
        result: expect.any(Object)
      });
    });

    it('should add note to trust case', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'OPEN',
        notes: 'Initial notes'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);
      mockPrisma.trustCase.update.mockResolvedValue({
        ...mockCase,
        notes: 'Initial notes\n\n[Note added by admin-123 at 2025-01-17T08:53:00.000Z]\nAdditional investigation needed'
      });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ADD_NOTE',
          added_by: 'admin-123',
          notes: 'Additional investigation needed'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        action_performed: 'ADD_NOTE',
        result: expect.any(Object)
      });
    });

    it('should request more info', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'OPEN'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);
      mockPrisma.trustCase.update.mockResolvedValue({
        ...mockCase,
        status: 'UNDER_REVIEW',
        notes: 'Initial notes\n\n[Info requested by admin-123 at 2025-01-17T08:53:00.000Z]\nRequest: Additional documentation needed\nDeadline: 2025-01-24'
      });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'REQUEST_MORE_INFO',
          requested_by: 'admin-123',
          info_request: 'Additional documentation needed',
          deadline: '2025-01-24T23:59:59.000Z'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        action_performed: 'REQUEST_MORE_INFO',
        result: expect.any(Object)
      });
    });

    it('should mark case for monitoring', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'OPEN'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);
      mockPrisma.trustCase.update.mockResolvedValue({
        ...mockCase,
        status: 'UNDER_REVIEW',
        notes: 'Initial notes\n\n[Marked for monitoring by admin-123 at 2025-01-17T08:53:00.000Z]\nReason: Suspicious pattern continues\nDuration: 14 days'
      });
      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'MARK_FOR_MONITORING',
          marked_by: 'admin-123',
          monitoring_reason: 'Suspicious pattern continues',
          monitoring_duration: 14
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        action_performed: 'MARK_FOR_MONITORING',
        result: expect.any(Object)
      });
    });

    it('should reject action on resolved case', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'RESOLVED'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);

      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACKNOWLEDGE',
          acknowledged_by: 'admin-123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Cannot perform actions on resolved or dismissed cases',
        code: 'CASE_ALREADY_CLOSED'
      });
    });

    it('should reject invalid action', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'OPEN'
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);

      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'INVALID_ACTION'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Invalid action type',
        code: 'INVALID_STATUS'
      });
    });

    it('should reject non-existent case', async () => {
      mockPrisma.trustCase.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/admin/trust/cases/NON-EXISTENT/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACKNOWLEDGE',
          acknowledged_by: 'admin-123'
        });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Trust case not found',
        code: 'CASE_NOT_FOUND'
      });
    });
  });

  describe('GET /admin/trust/cases/:id/history', () => {
    it('should return action history', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'TRUST_CASE_ACTION',
          newValues: { action: 'ACKNOWLEDGE', adminId: 'admin-123' },
          createdAt: new Date('2025-01-17T08:53:00.000Z')
        },
        {
          id: 'audit-2',
          action: 'TRUST_CASE_ACTION',
          newValues: { action: 'ADD_NOTE', adminId: 'admin-123' },
          createdAt: new Date('2025-01-17T09:00:00.000Z')
        }
      ];

      mockPrisma.businessAuditLog.findMany.mockResolvedValue(mockAuditLogs);

      const response = await request(app)
        .get('/admin/trust/cases/TC-123/history')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        case_id: 'TC-123',
        action_history: expect.any(Array)
      });
    });
  });

  describe('GET /admin/trust/cases/:id/available-actions', () => {
    it('should return available actions for open case', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'OPEN',
        created_at: new Date(),
        resolved_at: null
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);

      const response = await request(app)
        .get('/admin/trust/cases/TC-123/available-actions')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        case_id: 'TC-123',
        current_status: 'OPEN',
        available_actions: ['ACKNOWLEDGE', 'ADD_NOTE', 'REQUEST_MORE_INFO', 'MARK_FOR_MONITORING']
      });
    });

    it('should return no actions for resolved case', async () => {
      const mockCase = {
        case_id: 'TC-123',
        status: 'RESOLVED',
        created_at: new Date(),
        resolved_at: new Date()
      };

      mockPrisma.trustCase.findUnique.mockResolvedValue(mockCase);

      const response = await request(app)
        .get('/admin/trust/cases/TC-123/available-actions')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        case_id: 'TC-123',
        current_status: 'RESOLVED',
        available_actions: []
      });
    });
  });

  describe('GET /admin/trust/cases/pending-actions', () => {
    it('should return cases with pending info requests', async () => {
      const mockCases = [
        {
          case_id: 'TC-123',
          subject_type: 'USER',
          subject_id: 'user-123',
          status: 'UNDER_REVIEW',
          notes: 'Info requested by admin-456',
          updated_at: new Date(),
          rule: { name: 'Suspicious Activity' },
          businessAccount: { name: 'Test Business', businessType: 'ENTERPRISE' }
        }
      ];

      mockPrisma.trustCase.findMany.mockResolvedValue(mockCases);

      const response = await request(app)
        .get('/admin/trust/cases/pending-actions')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        pending_info_requests: expect.any(Array)
      });
    });
  });

  describe('POST /admin/trust/cases/bulk-action', () => {
    it('should perform bulk acknowledge action', async () => {
      const mockCases = [
        { case_id: 'TC-123', status: 'OPEN' },
        { case_id: 'TC-456', status: 'OPEN' },
        { case_id: 'TC-789', status: 'OPEN' }
      ];

      mockPrisma.trustCase.findUnique
        .mockResolvedValueOnce(mockCases[0])
        .mockResolvedValueOnce(mockCases[1])
        .mockResolvedValueOnce(mockCases[2]);

      mockPrisma.trustCase.update
        .mockResolvedValueOnce({ status: 'UNDER_REVIEW' })
        .mockResolvedValueOnce({ status: 'UNDER_REVIEW' })
        .mockResolvedValueOnce({ status: 'UNDER_REVIEW' });

      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/cases/bulk-action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          case_ids: ['TC-123', 'TC-456', 'TC-789'],
          action: 'ACKNOWLEDGE',
          notes: 'Bulk acknowledge'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        action_performed: 'ACKNOWLEDGE',
        processed: 3,
        errors: 0,
        results: expect.any(Array)
      });
    });

    it('should handle mixed success and errors in bulk action', async () => {
      const mockCases = [
        { case_id: 'TC-123', status: 'OPEN' },
        { case_id: 'TC-456', status: 'RESOLVED' }, // Should error
        { case_id: 'TC-789', status: 'OPEN' }
      ];

      mockPrisma.trustCase.findUnique
        .mockResolvedValueOnce(mockCases[0])
        .mockResolvedValueOnce(mockCases[1])
        .mockResolvedValueOnce(mockCases[2]);

      mockPrisma.trustCase.update
        .mockResolvedValueOnce({ status: 'UNDER_REVIEW' })
        .mockResolvedValueOnce({ status: 'UNDER_REVIEW' })
        .mockResolvedValueOnce({ status: 'UNDER_REVIEW' });

      mockPrisma.businessAuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/admin/trust/cases/bulk-action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          case_ids: ['TC-123', 'TC-456', 'TC-789'],
          action: 'ACKNOWLEDGE'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        action_performed: 'ACKNOWLEDGE',
        processed: 2,
        errors: 1,
        results: expect.any(Array),
        errors: expect.any(Array)
      });
    });
  });

  describe('Security and Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .send({
          action: 'ACKNOWLEDGE',
          acknowledged_by: 'admin-123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    });

    it('should reject requests without admin role', async () => {
      // Mock non-admin user
      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer non-admin-token')
        .send({
          action: 'ACKNOWLEDGE',
          acknowledged_by: 'admin-123'
        });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    });

    it('should reject requests without proper permissions', async () => {
      // Mock user without trust_cases:manage permission
      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer admin-no-permission-token')
        .send({
          action: 'ACKNOWLEDGE',
          acknowledged_by: 'admin-123'
        });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: "Permission 'trust_cases:manage' required",
        code: 'PERMISSION_REQUIRED'
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields for acknowledge action', async () => {
      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ACKNOWLEDGE'
          // Missing acknowledged_by
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate required fields for add note action', async () => {
      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'ADD_NOTE'
          // Missing notes
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate required fields for request more info', async () => {
      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'REQUEST_MORE_INFO'
          // Missing info_request
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate required fields for mark monitoring', async () => {
      const response = await request(app)
        .post('/admin/trust/cases/TC-123/action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          action: 'MARK_FOR_MONITORING'
          // Missing monitoring_reason
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate bulk action limits', async () => {
      const response = await request(app)
        .post('/admin/trust/cases/bulk-action')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          case_ids: Array.from({ length: 51 }, (_, i) => `TC-${i}`), // 51 cases - over limit
          action: 'ACKNOWLEDGE'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('Forbidden Operations Verification', () => {
    it('should never access wallet/escrow/ledger systems', async () => {
      // Verify that the trust actions router has no access to financial systems
      const routerModule = require('../routes/admin/trust.actions');
      const router = routerModule.default;

      // Check route definitions
      const routes = router.stack.map((layer: any) => layer.route?.path);
      
      // Should not have any financial endpoints
      const financialRoutes = routes.filter((route: string) => 
        route.includes('wallet') || 
        route.includes('escrow') || 
        route.includes('ledger') ||
        route.includes('payment') ||
        route.includes('transaction')
      );

      expect(financialRoutes).toHaveLength(0);
    });

    it('should never suspend users', async () => {
      // Verify no suspension logic exists in the actions
      const fs = require('fs');
      const path = require('path');
      const actionsFile = fs.readFileSync(
        path.join(__dirname, '../routes/admin/trust.actions.ts'),
        'utf8'
      );

      // Should not contain suspension logic
      expect(actionsFile).not.toContain('suspend');
      expect(actionsFile).not.toContain('block');
      expect(actionsFile).not.toContain('freeze');
    });
  });
});

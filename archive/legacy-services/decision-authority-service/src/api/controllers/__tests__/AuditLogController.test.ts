import { Request, Response } from 'express';
import { PrismaClient, DecisionStatus } from '@prisma/client';
import { AuditLogController } from '../AuditLogController';
import { AuditLogService } from '../../../services/AuditLogService';

// Mock AuditLogService
jest.mock('../../../services/AuditLogService');

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let mockService: jest.Mocked<AuditLogService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    mockRequest = {
      params: {},
      query: {}
    };

    const mockPrisma = {} as PrismaClient;
    controller = new AuditLogController(mockPrisma);
    mockService = (controller as any).auditLogService;
  });

  describe('getAuditLogs', () => {
    it('should get audit logs for decision and return 200', async () => {
      const mockAuditLogs = [
        {
          id: 1,
          decisionId: 1,
          action: 'CREATED',
          previousStatus: null,
          newStatus: DecisionStatus.PENDING,
          actorId: 'SYSTEM',
          actorType: 'SYSTEM',
          metadata: {},
          createdAt: new Date()
        },
        {
          id: 2,
          decisionId: 1,
          action: 'STATUS_CHANGED',
          previousStatus: DecisionStatus.PENDING,
          newStatus: DecisionStatus.APPROVED,
          actorId: 'SOURCE',
          actorType: 'DECISION_SOURCE',
          metadata: {},
          createdAt: new Date()
        }
      ];

      mockRequest.params = { decisionId: '1' };

      mockService.getAuditLogs = jest.fn().mockResolvedValue(mockAuditLogs);

      await controller.getAuditLogs(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAuditLogs).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ auditLogs: mockAuditLogs });
    });

    it('should handle errors', async () => {
      mockRequest.params = { decisionId: '999' };

      mockService.getAuditLogs = jest.fn().mockRejectedValue(
        new Error('Decision not found')
      );

      await controller.getAuditLogs(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'InternalServerError',
          statusCode: 500
        })
      );
    });
  });

  describe('queryAuditLogs', () => {
    it('should query audit logs with filters and return 200', async () => {
      const mockAuditLogs = [
        {
          id: 1,
          decisionId: 1,
          action: 'CREATED',
          actorId: 'SYSTEM',
          actorType: 'SYSTEM',
          createdAt: new Date()
        }
      ];

      mockRequest.query = {
        decisionId: '1',
        action: 'CREATED'
      };

      mockService.queryAuditLogs = jest.fn().mockResolvedValue(mockAuditLogs);

      await controller.queryAuditLogs(mockRequest as Request, mockResponse as Response);

      expect(mockService.queryAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          decisionId: 1,
          action: 'CREATED'
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        auditLogs: mockAuditLogs,
        total: mockAuditLogs.length
      });
    });

    it('should handle date filters', async () => {
      const mockAuditLogs: any[] = [];

      mockRequest.query = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        limit: '50'
      };

      mockService.queryAuditLogs = jest.fn().mockResolvedValue(mockAuditLogs);

      await controller.queryAuditLogs(mockRequest as Request, mockResponse as Response);

      expect(mockService.queryAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
          limit: 50
        })
      );
    });

    it('should handle empty query', async () => {
      const mockAuditLogs: any[] = [];

      mockRequest.query = {};

      mockService.queryAuditLogs = jest.fn().mockResolvedValue(mockAuditLogs);

      await controller.queryAuditLogs(mockRequest as Request, mockResponse as Response);

      expect(mockService.queryAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({})
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});

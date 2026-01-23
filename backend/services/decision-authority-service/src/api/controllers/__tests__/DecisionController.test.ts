import { Request, Response } from 'express';
import { PrismaClient, AssetType, DecisionStatus } from '@prisma/client';
import { DecisionController } from '../DecisionController';
import { DecisionAuthorityService } from '../../../services/DecisionAuthorityService';
import { 
  DecisionNotFoundError, 
  InvalidDecisionStateError, 
  ValidationError 
} from '../../../utils/errors';

// Mock DecisionAuthorityService
jest.mock('../../../services/DecisionAuthorityService');

describe('DecisionController', () => {
  let controller: DecisionController;
  let mockService: jest.Mocked<DecisionAuthorityService>;
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
      body: {},
      params: {},
      query: {}
    };

    const mockPrisma = {} as PrismaClient;
    controller = new DecisionController(mockPrisma);
    mockService = (controller as any).decisionService;
  });

  describe('createDecision', () => {
    it('should create decision and return 201', async () => {
      const mockDecision = {
        id: 1,
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        status: DecisionStatus.PENDING
      };

      mockRequest.body = {
        assetType: AssetType.LISTING,
        assetId: 'listing-123'
      };

      mockService.requestDecision = jest.fn().mockResolvedValue(mockDecision);

      await controller.createDecision(mockRequest as Request, mockResponse as Response);

      expect(mockService.requestDecision).toHaveBeenCalledWith({
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        metadata: undefined
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockDecision);
    });

    it('should return 400 for ValidationError', async () => {
      mockRequest.body = {
        assetType: null,
        assetId: 'listing-123'
      };

      mockService.requestDecision = jest.fn().mockRejectedValue(
        new ValidationError('assetType is required')
      );

      await controller.createDecision(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'assetType is required',
        statusCode: 400
      });
    });
  });

  describe('getDecision', () => {
    it('should get decision and return 200', async () => {
      const mockDecision = {
        id: 1,
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        status: DecisionStatus.PENDING
      };

      mockRequest.params = { id: '1' };

      mockService.getDecision = jest.fn().mockResolvedValue(mockDecision);

      await controller.getDecision(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDecision).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockDecision);
    });

    it('should return 404 for DecisionNotFoundError', async () => {
      mockRequest.params = { id: '999' };

      mockService.getDecision = jest.fn().mockRejectedValue(
        new DecisionNotFoundError('999')
      );

      await controller.getDecision(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DecisionNotFound',
          statusCode: 404
        })
      );
    });
  });

  describe('getDecisionByDecisionId', () => {
    it('should get decision by decision ID and return 200', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec-123',
        status: DecisionStatus.PENDING
      };

      mockRequest.params = { decisionId: 'dec-123' };

      mockService.getDecisionByDecisionId = jest.fn().mockResolvedValue(mockDecision);

      await controller.getDecisionByDecisionId(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDecisionByDecisionId).toHaveBeenCalledWith('dec-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockDecision);
    });
  });

  describe('getDecisionsByAsset', () => {
    it('should get decisions by asset and return 200', async () => {
      const mockDecisions = [
        { id: 1, assetType: AssetType.LISTING, assetId: 'listing-123' },
        { id: 2, assetType: AssetType.LISTING, assetId: 'listing-123' }
      ];

      mockRequest.params = {
        assetType: AssetType.LISTING,
        assetId: 'listing-123'
      };

      mockService.getDecisionsByAsset = jest.fn().mockResolvedValue(mockDecisions);

      await controller.getDecisionsByAsset(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDecisionsByAsset).toHaveBeenCalledWith(
        AssetType.LISTING,
        'listing-123'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockDecisions);
    });
  });

  describe('listDecisions', () => {
    it('should list decisions with filters and return 200', async () => {
      const mockResult = {
        decisions: [{ id: 1 }, { id: 2 }],
        total: 2,
        limit: 50,
        offset: 0
      };

      mockRequest.query = {
        status: DecisionStatus.PENDING,
        limit: '10'
      };

      mockService.listDecisions = jest.fn().mockResolvedValue(mockResult);

      await controller.listDecisions(mockRequest as Request, mockResponse as Response);

      expect(mockService.listDecisions).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DecisionStatus.PENDING,
          limit: 10
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should handle date filters', async () => {
      const mockResult = {
        decisions: [],
        total: 0,
        limit: 50,
        offset: 0
      };

      mockRequest.query = {
        startDate: '2026-01-01',
        endDate: '2026-01-31'
      };

      mockService.listDecisions = jest.fn().mockResolvedValue(mockResult);

      await controller.listDecisions(mockRequest as Request, mockResponse as Response);

      expect(mockService.listDecisions).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        })
      );
    });
  });

  describe('error handling', () => {
    it('should return 400 for InvalidDecisionStateError', async () => {
      mockRequest.params = { id: '1' };

      mockService.getDecision = jest.fn().mockRejectedValue(
        new InvalidDecisionStateError('Invalid state transition')
      );

      await controller.getDecision(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'InvalidDecisionState',
        message: 'Invalid state transition',
        statusCode: 400
      });
    });

    it('should return 500 for unknown errors', async () => {
      mockRequest.params = { id: '1' };

      mockService.getDecision = jest.fn().mockRejectedValue(
        new Error('Unknown error')
      );

      await controller.getDecision(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'Unknown error',
        statusCode: 500
      });
    });
  });
});

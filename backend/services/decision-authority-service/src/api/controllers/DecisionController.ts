import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { DecisionAuthorityService } from '../../services/DecisionAuthorityService';
import { 
  CreateDecisionRequestDto, 
  ListDecisionsQueryDto 
} from '../dtos/decision.dto';
import { mapServiceErrorToHttp } from '../utils/errorMapper';
import { AssetType } from '../../interfaces/IDecisionSource';

/**
 * DecisionController - Thin REST layer
 * 
 * Rules:
 * - NO business logic
 * - NO state transitions
 * - 100% delegation to DecisionAuthorityService
 * - Input validation only
 * - Error mapping only
 */
export class DecisionController {
  private decisionService: DecisionAuthorityService;

  constructor(prisma: PrismaClient) {
    this.decisionService = new DecisionAuthorityService(prisma);
  }

  /**
   * POST /api/v1/decisions
   * Create a new decision request
   */
  async createDecision(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateDecisionRequestDto = req.body;

      const decision = await this.decisionService.requestDecision({
        assetType: dto.assetType as any,
        assetId: dto.assetId,
        metadata: dto.metadata
      });

      res.status(201).json(decision);
    } catch (error) {
      const { statusCode, body } = mapServiceErrorToHttp(error);
      res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/v1/decisions/:id
   * Get decision by ID
   */
  async getDecision(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      const decision = await this.decisionService.getDecision(id);

      res.status(200).json(decision);
    } catch (error) {
      const { statusCode, body } = mapServiceErrorToHttp(error);
      res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/v1/decisions/by-decision-id/:decisionId
   * Get decision by source decision ID
   */
  async getDecisionByDecisionId(req: Request, res: Response): Promise<void> {
    try {
      const decisionId = req.params.decisionId;

      const decision = await this.decisionService.getDecisionByDecisionId(decisionId);

      res.status(200).json(decision);
    } catch (error) {
      const { statusCode, body } = mapServiceErrorToHttp(error);
      res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/v1/decisions/asset/:assetType/:assetId
   * Get decisions for an asset
   */
  async getDecisionsByAsset(req: Request, res: Response): Promise<void> {
    try {
      const assetType = req.params.assetType as any as AssetType;
      const assetId = req.params.assetId;

      const decisions = await this.decisionService.getDecisionsByAsset(assetType, assetId);

      res.status(200).json(decisions);
    } catch (error) {
      const { statusCode, body } = mapServiceErrorToHttp(error);
      res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/v1/decisions
   * List decisions with filters
   */
  async listDecisions(req: Request, res: Response): Promise<void> {
    try {
      const query: ListDecisionsQueryDto = req.query;

      const filters = {
        assetType: query.assetType as any,
        assetId: query.assetId,
        status: query.status as any,
        decisionSource: query.decisionSource,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit ? parseInt(query.limit.toString(), 10) : undefined,
        offset: query.offset ? parseInt(query.offset.toString(), 10) : undefined
      };

      const result = await this.decisionService.listDecisions(filters);

      res.status(200).json(result);
    } catch (error) {
      const { statusCode, body } = mapServiceErrorToHttp(error);
      res.status(statusCode).json(body);
    }
  }
}

// ============================================
// Dispute Controller
// User-facing API endpoints for disputes
// ============================================

import { Request, Response, NextFunction } from 'express';
import { DisputeService } from '../services/DisputeService';
import {
  CreateDisputeInput,
  DisputeFilters,
  DisputeParty
} from '../types/dispute.types';
import {
  DisputeNotFoundError,
  UnauthorizedDisputeAccessError
} from '../errors/DisputeErrors';

const disputeService = new DisputeService();

/**
 * POST /api/requests/:id/dispute
 * Open a new dispute for a request
 */
export async function openDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const requestId = parseInt(req.params.id);
    const { reason, description } = req.body;
    const userId = (req.user?.id || 'user-123') as string;
    const userRole = (req.user?.role === 'BUYER' ? DisputeParty.BUYER : DisputeParty.SELLER) as DisputeParty;

    const input: CreateDisputeInput = {
      requestId,
      reason,
      description,
      evidenceFiles: (req as any).files
    };

    const dispute = await disputeService.openDispute(input, userId, userRole);

    res.status(201).json({
      success: true,
      data: dispute
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/disputes/my-disputes
 * Get current user's disputes
 */
export async function getMyDisputes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user?.id || 'user-123') as string;
    const userRole = (req.user?.role === 'BUYER' ? DisputeParty.BUYER : DisputeParty.SELLER) as DisputeParty;
    
    const filters: DisputeFilters = {
      status: req.query.status as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await disputeService.getUserDisputes(userId, userRole, filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/disputes/:id
 * Get a specific dispute
 */
export async function getDisputeById(req: Request, res: Response, next: NextFunction) {
  try {
    const disputeId = req.params.id;
    const userId = (req.user?.id || 'user-123') as string;
    const userRole = req.user?.role;

    const dispute = await disputeService.getDisputeById(disputeId, userId, userRole);

    res.json({
      success: true,
      data: dispute
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/disputes/:id/add-evidence
 * Add evidence to a dispute
 */
export async function addEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const disputeId = req.params.id;
    const userId = (req.user?.id || 'user-123') as string;
    const userRole = (req.user?.role === 'BUYER' ? DisputeParty.BUYER : DisputeParty.SELLER) as DisputeParty;
    const files = (req as any).files || [];

    await disputeService.addEvidence(disputeId, userRole, files, userId);

    res.json({
      success: true,
      message: 'Evidence added successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Dispute Controller Error:', err);

  if (err instanceof DisputeNotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  if (err instanceof UnauthorizedDisputeAccessError) {
    return res.status(403).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}

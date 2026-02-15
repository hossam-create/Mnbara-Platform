// ============================================================
// PHASE 5.5 — Appeals Window Controller
// ============================================================

import { Request, Response } from 'express';
import {
  AppealsWindowService,
  AppealReason,
  AppealStatus,
} from '../services/appeals-window.service';

const appealsService = new AppealsWindowService();

// ============================================================
// SUBMIT APPEAL
// POST /appeals/submit
// ============================================================
export async function submitAppeal(req: Request, res: Response) {
  try {
    const { auctionId, appellantId, reasonCode, description } = req.body;

    // Validate required fields
    if (!auctionId || !appellantId || !reasonCode) {
      return res.status(400).json({
        error: 'Missing required fields: auctionId, appellantId, reasonCode',
      });
    }

    // Validate reason code
    if (!Object.values(AppealReason).includes(reasonCode)) {
      return res.status(400).json({
        error: `Invalid reasonCode. Must be one of: ${Object.values(AppealReason).join(', ')}`,
      });
    }

    const result = await appealsService.submitAppeal({
      auctionId,
      appellantId,
      reasonCode,
      description,
    });

    return res.status(201).json({
      success: true,
      appeal: result.appeal,
      windowEndsAt: result.windowConfig?.windowEndsAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a window closure error
    if (message.includes('Appeals window has closed')) {
      return res.status(410).json({ error: message }); // 410 Gone
    }

    // Check if it's a participant validation error
    if (message.includes('Appellant must be a bidder or seller')) {
      return res.status(403).json({ error: message }); // 403 Forbidden
    }

    return res.status(400).json({ error: message });
  }
}

// ============================================================
// RESOLVE APPEAL (Admin Only)
// POST /appeals/:appealId/resolve
// ============================================================
export async function resolveAppeal(req: Request, res: Response) {
  try {
    const { appealId } = req.params;
    const { resolution, resolutionNote, resolvedBy } = req.body;

    // Validate required fields
    if (!appealId || !resolution || !resolvedBy) {
      return res.status(400).json({
        error: 'Missing required fields: appealId, resolution, resolvedBy',
      });
    }

    // Validate resolution
    if (!['REJECT', 'ACCEPT', 'ESCALATE'].includes(resolution)) {
      return res.status(400).json({
        error: 'Invalid resolution. Must be REJECT, ACCEPT, or ESCALATE',
      });
    }

    const result = await appealsService.resolveAppeal({
      appealId: parseInt(appealId),
      resolution,
      resolutionNote,
      resolvedBy,
    });

    return res.status(200).json({
      success: true,
      appeal: result.appeal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// FINALIZE SETTLEMENT
// POST /appeals/:auctionId/finalize
// ============================================================
export async function finalizeSettlement(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const result = await appealsService.finalizeSettlement(parseInt(auctionId));

    return res.status(200).json({
      success: true,
      auction: result,
      message: 'Settlement finalized. Auction is now immutable.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check if window is still open
    if (message.includes('Appeals window still open')) {
      return res.status(409).json({ error: message }); // 409 Conflict
    }

    return res.status(400).json({ error: message });
  }
}

// ============================================================
// ADMIN OVERRIDE (Dual Approval)
// POST /appeals/:auctionId/override
// ============================================================
export async function adminOverride(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;
    const { overrideReason, newState, initiatedBy, approvedBy, metadata } = req.body;

    // Validate required fields
    if (!auctionId || !overrideReason || !newState || !initiatedBy || !approvedBy) {
      return res.status(400).json({
        error: 'Missing required fields: auctionId, overrideReason, newState, initiatedBy, approvedBy',
      });
    }

    // Verify dual approval
    if (initiatedBy === approvedBy) {
      return res.status(403).json({
        error: 'SECURITY: Override requires dual approval. Initiator and approver must be different.',
      });
    }

    const result = await appealsService.adminOverride({
      auctionId: parseInt(auctionId),
      overrideReason,
      newState,
      initiatedBy,
      approvedBy,
      metadata,
    });

    return res.status(200).json({
      success: true,
      auction: result.auction,
      overrideLog: result.overrideLog,
      message: 'Settlement override applied. Audit log created.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// CHECK SETTLEMENT FINALITY
// GET /appeals/:auctionId/finality
// ============================================================
export async function checkSettlementFinality(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const finality = await appealsService.checkSettlementFinality(parseInt(auctionId));

    return res.status(200).json({
      success: true,
      finality,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET APPEAL
// GET /appeals/:appealId
// ============================================================
export async function getAppeal(req: Request, res: Response) {
  try {
    const { appealId } = req.params;

    if (!appealId) {
      return res.status(400).json({ error: 'Missing appealId' });
    }

    const appeal = await appealsService.getAppeal(parseInt(appealId));

    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    return res.status(200).json({
      success: true,
      appeal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET APPEALS FOR AUCTION
// GET /appeals/auction/:auctionId
// ============================================================
export async function getAppealsForAuction(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;
    const { status } = req.query;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const appeals = await appealsService.getAppealsForAuction(
      parseInt(auctionId),
      status as AppealStatus | undefined
    );

    return res.status(200).json({
      success: true,
      appeals,
      count: appeals.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET APPEALS WINDOW CONFIG
// GET /appeals/window/:auctionId
// ============================================================
export async function getAppealWindowConfig(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const windowConfig = await appealsService.getAppealWindowConfig(parseInt(auctionId));

    if (!windowConfig) {
      return res.status(404).json({ error: 'Appeals window not found' });
    }

    return res.status(200).json({
      success: true,
      windowConfig,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET OVERRIDE HISTORY
// GET /appeals/:auctionId/overrides
// ============================================================
export async function getOverrideHistory(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const overrideLogs = await appealsService.getOverrideHistory(parseInt(auctionId));

    return res.status(200).json({
      success: true,
      overrideLogs,
      count: overrideLogs.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET ALL OPEN APPEALS (Admin/Control Center)
// GET /appeals/admin/open
// ============================================================
export async function getAllOpenAppeals(req: Request, res: Response) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await appealsService.getAllOpenAppeals(
      parseInt(limit as string),
      parseInt(offset as string)
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

/**
 * Admin KYC Controller
 * Admin review endpoints
 */

import { Request, Response } from 'express';
import { KYCService } from '../services/kyc.service';

const kycService = new KYCService();

export class AdminKYCController {
  /**
   * GET /admin/kyc/pending
   * Get pending verifications
   */
  async getPending(req: Request, res: Response) {
    try {
      const verifications = await kycService.getPendingVerifications();
      res.json({ success: true, data: verifications });
    } catch (error: any) {
      console.error('Get pending error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /admin/kyc/:id/review
   * Review verification
   */
  async review(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const verification = await kycService.reviewVerification({
        verificationId: parseInt(req.params.id),
        adminId,
        approved: req.body.approved,
        rejectionReason: req.body.rejectionReason,
      });

      res.json({ success: true, data: verification });
    } catch (error: any) {
      console.error('Review error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

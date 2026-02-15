/**
 * KYC Controller
 * User-facing endpoints
 */

import { Request, Response } from 'express';
import { KYCService } from '../services/kyc.service';

const kycService = new KYCService();

export class KYCController {
  /**
   * POST /kyc/submit
   * Submit KYC verification
   */
  async submit(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.idPhoto || !files.selfiePhoto) {
        return res.status(400).json({ error: 'Both ID photo and selfie required' });
      }

      const verification = await kycService.submitVerification({
        userId,
        idType: req.body.idType,
        idNumber: req.body.idNumber,
        fullName: req.body.fullName,
        idPhoto: files.idPhoto[0],
        selfiePhoto: files.selfiePhoto[0],
      });

      res.json({
        success: true,
        data: {
          id: verification.id,
          status: verification.status,
          ocrMatch: verification.ocrMatch,
          faceMatch: verification.faceMatch,
          faceConfidence: verification.faceConfidence,
        },
      });
    } catch (error: any) {
      console.error('KYC submission error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kyc/status
   * Get verification status
   */
  async getStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const verification = await kycService.getVerificationStatus(userId);

      if (!verification) {
        return res.json({ success: true, data: null });
      }

      res.json({ success: true, data: verification });
    } catch (error: any) {
      console.error('Get status error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

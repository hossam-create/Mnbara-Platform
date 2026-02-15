import { Request, Response } from 'express';
import { KYCService } from '../services/kyc.service';

const kycService = new KYCService();

export class KYCController {
  async initiateKYC(req: Request, res: Response) {
    try {
      const { userId, userData } = req.body;
      const kyc = await kycService.initiateKYC(userId, userData);
      res.json(kyc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async uploadDocument(req: Request, res: Response) {
    try {
      const { kycId, documentType, documentUrl } = req.body;
      const kyc = await kycService.uploadDocument(kycId, documentType, documentUrl);
      res.json(kyc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifyDocuments(req: Request, res: Response) {
    try {
      const { kycId } = req.params;
      const kyc = await kycService.verifyDocuments(kycId);
      res.json(kyc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async performAMLCheck(req: Request, res: Response) {
    try {
      const { userId, kycId } = req.body;
      const result = await kycService.performAMLCheck(userId, kycId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getKYCStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const status = await kycService.getKYCStatus(userId);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async reportSuspiciousTransaction(req: Request, res: Response) {
    try {
      const { userId, transactionId, reason } = req.body;
      const report = await kycService.reportSuspiciousTransaction(userId, transactionId, reason);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

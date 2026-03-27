import { Request, Response } from 'express';
import { VendorService } from '../services/vendor.service';
import { CommissionService } from '../services/commission.service';
import { PayoutService } from '../services/payout.service';

const vendorService = new VendorService();
const commissionService = new CommissionService();
const payoutService = new PayoutService();

export class VendorController {
  // Vendor registration
  async register(req: Request, res: Response) {
    try {
      const vendor = await vendorService.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get vendor profile
  async getProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await vendorService.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json(vendor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get vendor by user ID
  async getByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const vendor = await vendorService.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json(vendor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update vendor profile
  async updateProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await vendorService.updateVendor(id, req.body);
      res.json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get vendor analytics
  async getAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const analytics = await vendorService.getVendorAnalytics(id);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get vendor commissions
  async getCommissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, limit, offset } = req.query;

      const result = await commissionService.listCommissions({
        vendorId: id,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get commission summary
  async getCommissionSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const summary = await commissionService.getVendorCommissionSummary(id);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get vendor payouts
  async getPayouts(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, limit, offset } = req.query;

      const result = await payoutService.listPayouts({
        vendorId: id,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get payout summary
  async getPayoutSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const summary = await payoutService.getVendorPayoutSummary(id);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Request payout
  async requestPayout(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { commissionIds, method } = req.body;

      const payout = await payoutService.createPayout(id, commissionIds, method);
      res.status(201).json(payout);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // List all vendors (admin)
  async listVendors(req: Request, res: Response) {
    try {
      const { status, verificationStatus, businessType, limit, offset } = req.query;

      const result = await vendorService.listVendors({
        status: status as string,
        verificationStatus: verificationStatus as string,
        businessType: businessType as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update vendor status (admin)
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const vendor = await vendorService.updateVendorStatus(id, status);
      res.json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update verification status (admin)
  async updateVerificationStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { verificationStatus } = req.body;

      const vendor = await vendorService.updateVerificationStatus(id, verificationStatus);
      res.json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Process payout (admin)
  async processPayout(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reference } = req.body;

      const payout = await payoutService.processPayout(id, reference);
      res.json(payout);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Complete payout (admin)
  async completePayout(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reference } = req.body;

      const payout = await payoutService.completePayout(id, reference);
      res.json(payout);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Fail payout (admin)
  async failPayout(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { failureReason } = req.body;

      const payout = await payoutService.failPayout(id, failureReason);
      res.json(payout);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Batch create payouts (admin)
  async batchCreatePayouts(req: Request, res: Response) {
    try {
      const { vendorIds, method } = req.body;

      const payouts = await payoutService.batchCreatePayouts(vendorIds, method);
      res.status(201).json(payouts);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

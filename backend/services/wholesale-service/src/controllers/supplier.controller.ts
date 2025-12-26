// Supplier Controller - Wholesale B2B
// متحكم الموردين - البيع بالجملة

import { Request, Response } from 'express';
import { supplierService } from '../services/supplier.service';

export class SupplierController {
  // Register supplier
  async register(req: Request, res: Response) {
    try {
      const supplier = await supplierService.registerSupplier(req.body);
      res.status(201).json({
        success: true,
        message: 'Supplier registered successfully',
        messageAr: 'تم تسجيل المورد بنجاح',
        data: supplier
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تسجيل المورد'
      });
    }
  }

  // Get supplier by ID
  async getById(req: Request, res: Response) {
    try {
      const supplier = await supplierService.getSupplierById(req.params.id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
          messageAr: 'المورد غير موجود'
        });
      }
      res.json({ success: true, data: supplier });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get supplier by user ID
  async getByUserId(req: Request, res: Response) {
    try {
      const supplier = await supplierService.getSupplierByUserId(req.params.userId);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
          messageAr: 'المورد غير موجود'
        });
      }
      res.json({ success: true, data: supplier });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update supplier
  async update(req: Request, res: Response) {
    try {
      const supplier = await supplierService.updateSupplier(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Supplier updated successfully',
        messageAr: 'تم تحديث المورد بنجاح',
        data: supplier
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // List suppliers
  async list(req: Request, res: Response) {
    try {
      const { country, businessType, status, isVerified, minRating, page, limit } = req.query;
      const result = await supplierService.listSuppliers(
        {
          country: country as string,
          businessType: businessType as any,
          status: status as any,
          isVerified: isVerified === 'true',
          minRating: minRating ? parseFloat(minRating as string) : undefined
        },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Search suppliers
  async search(req: Request, res: Response) {
    try {
      const { q, country, businessType, page, limit } = req.query;
      const result = await supplierService.searchSuppliers(
        q as string || '',
        { country: country as string, businessType: businessType as any },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Submit verification
  async submitVerification(req: Request, res: Response) {
    try {
      const { documents } = req.body;
      const supplier = await supplierService.submitVerification(req.params.id, documents);
      res.json({
        success: true,
        message: 'Verification documents submitted',
        messageAr: 'تم تقديم مستندات التحقق',
        data: supplier
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Verify supplier (admin)
  async verify(req: Request, res: Response) {
    try {
      const { approved } = req.body;
      const supplier = await supplierService.verifySupplier(req.params.id, approved);
      res.json({
        success: true,
        message: approved ? 'Supplier verified' : 'Supplier rejected',
        messageAr: approved ? 'تم التحقق من المورد' : 'تم رفض المورد',
        data: supplier
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get dashboard
  async getDashboard(req: Request, res: Response) {
    try {
      const dashboard = await supplierService.getSupplierDashboard(req.params.id);
      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const supplierController = new SupplierController();

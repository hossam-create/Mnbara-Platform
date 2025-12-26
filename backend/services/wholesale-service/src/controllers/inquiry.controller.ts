// Inquiry Controller - RFQ
// متحكم الاستفسارات - طلب عرض سعر

import { Request, Response } from 'express';
import { inquiryService } from '../services/inquiry.service';

export class InquiryController {
  // Create inquiry
  async create(req: Request, res: Response) {
    try {
      const inquiry = await inquiryService.createInquiry(req.body);
      res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully',
        messageAr: 'تم إرسال الاستفسار بنجاح',
        data: inquiry
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get inquiry by ID
  async getById(req: Request, res: Response) {
    try {
      const inquiry = await inquiryService.getInquiryById(req.params.id);
      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: 'Inquiry not found',
          messageAr: 'الاستفسار غير موجود'
        });
      }
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Respond to inquiry
  async respond(req: Request, res: Response) {
    try {
      const { response, quotedPrice } = req.body;
      const inquiry = await inquiryService.respondToInquiry(req.params.id, response, quotedPrice);
      res.json({
        success: true,
        message: 'Response sent successfully',
        messageAr: 'تم إرسال الرد بنجاح',
        data: inquiry
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update status
  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const inquiry = await inquiryService.updateInquiryStatus(req.params.id, status);
      res.json({
        success: true,
        message: 'Status updated',
        messageAr: 'تم تحديث الحالة',
        data: inquiry
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // List inquiries
  async list(req: Request, res: Response) {
    try {
      const { supplierId, buyerId, status, page, limit } = req.query;
      const result = await inquiryService.listInquiries(
        {
          supplierId: supplierId as string,
          buyerId: buyerId as string,
          status: status as any
        },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get pending count
  async getPendingCount(req: Request, res: Response) {
    try {
      const count = await inquiryService.getPendingCount(req.params.supplierId);
      res.json({ success: true, data: { pendingCount: count } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const inquiryController = new InquiryController();

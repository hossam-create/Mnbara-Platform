import { Request, Response } from 'express';
import { disputeService } from '../services/dispute.service';
import { DisputeReason, DisputeRole, DisputeStatus, DisputeResolution } from '@prisma/client';

export const disputeController = {
  // فتح نزاع - Open dispute
  async openDispute(req: Request, res: Response) {
    try {
      const { escrowId, initiatedBy, initiatorRole, reason, description, evidence } = req.body;

      if (!escrowId || !initiatedBy || !initiatorRole || !reason || !description) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const dispute = await disputeService.openDispute({
        escrowId,
        initiatedBy,
        initiatorRole: initiatorRole as DisputeRole,
        reason: reason as DisputeReason,
        description,
        evidence
      });

      res.status(201).json({
        success: true,
        message: 'Dispute opened successfully',
        messageAr: 'تم فتح النزاع بنجاح',
        data: dispute
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في فتح النزاع'
      });
    }
  },

  // الحصول على نزاع - Get dispute
  async getDispute(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;

      const dispute = await disputeService.getDispute(disputeId);

      res.json({
        success: true,
        data: dispute
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
        messageAr: 'النزاع غير موجود'
      });
    }
  },

  // إضافة رسالة - Add message
  async addMessage(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;
      const { senderId, senderRole, message, attachments, isInternal } = req.body;

      if (!senderId || !senderRole || !message) {
        return res.status(400).json({
          success: false,
          message: 'senderId, senderRole, and message are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const newMessage = await disputeService.addMessage({
        disputeId,
        senderId,
        senderRole: senderRole as DisputeRole,
        message,
        attachments,
        isInternal
      });

      res.status(201).json({
        success: true,
        message: 'Message added',
        messageAr: 'تمت إضافة الرسالة',
        data: newMessage
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إضافة الرسالة'
      });
    }
  },

  // إضافة دليل - Add evidence
  async addEvidence(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;
      const { evidence } = req.body;

      if (!evidence) {
        return res.status(400).json({
          success: false,
          message: 'Evidence is required',
          messageAr: 'الدليل مطلوب'
        });
      }

      const dispute = await disputeService.addEvidence(disputeId, evidence);

      res.json({
        success: true,
        message: 'Evidence added',
        messageAr: 'تمت إضافة الدليل',
        data: dispute
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إضافة الدليل'
      });
    }
  },

  // تصعيد النزاع - Escalate dispute
  async escalateDispute(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Reason is required',
          messageAr: 'السبب مطلوب'
        });
      }

      const dispute = await disputeService.escalateDispute(disputeId, reason);

      res.json({
        success: true,
        message: 'Dispute escalated',
        messageAr: 'تم تصعيد النزاع',
        data: dispute
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تصعيد النزاع'
      });
    }
  },

  // حل النزاع - Resolve dispute
  async resolveDispute(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;
      const { resolution, resolvedBy, resolutionNote, buyerRefund, sellerPayout } = req.body;

      if (!resolution || !resolvedBy || !resolutionNote) {
        return res.status(400).json({
          success: false,
          message: 'resolution, resolvedBy, and resolutionNote are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const dispute = await disputeService.resolveDispute({
        disputeId,
        resolution: resolution as DisputeResolution,
        resolvedBy,
        resolutionNote,
        buyerRefund: buyerRefund ? parseFloat(buyerRefund) : undefined,
        sellerPayout: sellerPayout ? parseFloat(sellerPayout) : undefined
      });

      res.json({
        success: true,
        message: 'Dispute resolved',
        messageAr: 'تم حل النزاع',
        data: dispute
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في حل النزاع'
      });
    }
  },

  // الحصول على نزاعات المستخدم - Get user disputes
  async getUserDisputes(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status, limit, offset } = req.query;

      const disputes = await disputeService.getUserDisputes(userId, {
        status: status as DisputeStatus | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: disputes
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على النزاعات'
      });
    }
  }
};

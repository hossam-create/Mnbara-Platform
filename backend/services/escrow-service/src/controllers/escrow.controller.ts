import { Request, Response } from 'express';
import { escrowService } from '../services/escrow.service';
import { EscrowStatus, PaymentMethod } from '@prisma/client';

export const escrowController = {
  // إنشاء معاملة ضمان - Create escrow
  async createEscrow(req: Request, res: Response) {
    try {
      const { orderId, buyerId, sellerId, amount, currency, paymentMethod, description, inspectionDays, metadata } = req.body;

      if (!orderId || !buyerId || !sellerId || !amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'orderId, buyerId, sellerId, amount, and paymentMethod are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const escrow = await escrowService.createEscrow({
        orderId,
        buyerId,
        sellerId,
        amount: parseFloat(amount),
        currency,
        paymentMethod: paymentMethod as PaymentMethod,
        description,
        inspectionDays: inspectionDays ? parseInt(inspectionDays) : undefined,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Escrow created successfully',
        messageAr: 'تم إنشاء معاملة الضمان بنجاح',
        data: escrow
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إنشاء معاملة الضمان'
      });
    }
  },

  // تمويل الضمان - Fund escrow
  async fundEscrow(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;
      const { paymentReference } = req.body;

      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference is required',
          messageAr: 'مرجع الدفع مطلوب'
        });
      }

      const escrow = await escrowService.fundEscrow(escrowId, paymentReference);

      res.json({
        success: true,
        message: 'Escrow funded successfully',
        messageAr: 'تم تمويل الضمان بنجاح',
        data: escrow
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تمويل الضمان'
      });
    }
  },

  // تأكيد الشحن - Confirm shipping
  async confirmShipping(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;
      const { trackingNumber } = req.body;

      const escrow = await escrowService.confirmShipping(escrowId, trackingNumber);

      res.json({
        success: true,
        message: 'Shipping confirmed',
        messageAr: 'تم تأكيد الشحن',
        data: escrow
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تأكيد الشحن'
      });
    }
  },

  // تأكيد التسليم - Confirm delivery
  async confirmDelivery(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;

      const escrow = await escrowService.confirmDelivery(escrowId);

      res.json({
        success: true,
        message: 'Delivery confirmed. Inspection period started.',
        messageAr: 'تم تأكيد التسليم. بدأت فترة الفحص.',
        data: escrow
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تأكيد التسليم'
      });
    }
  },

  // موافقة المشتري - Approve transaction
  async approveTransaction(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;

      const escrow = await escrowService.approveTransaction(escrowId);

      res.json({
        success: true,
        message: 'Transaction approved. Funds released to seller.',
        messageAr: 'تمت الموافقة على المعاملة. تم تحرير الأموال للبائع.',
        data: escrow
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الموافقة'
      });
    }
  },

  // الحصول على معاملة ضمان - Get escrow
  async getEscrow(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;

      const escrow = await escrowService.getEscrow(escrowId);

      res.json({
        success: true,
        data: escrow
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
        messageAr: 'معاملة الضمان غير موجودة'
      });
    }
  },

  // الحصول على معاملات المستخدم - Get user escrows
  async getUserEscrows(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { role, status, limit, offset } = req.query;

      const escrows = await escrowService.getUserEscrows(
        userId,
        (role as 'buyer' | 'seller' | 'all') || 'all',
        {
          status: status as EscrowStatus | undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined
        }
      );

      res.json({
        success: true,
        data: escrows
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على المعاملات'
      });
    }
  },

  // تمديد فترة الفحص - Extend inspection
  async extendInspection(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;
      const { additionalDays } = req.body;

      if (!additionalDays) {
        return res.status(400).json({
          success: false,
          message: 'Additional days is required',
          messageAr: 'عدد الأيام الإضافية مطلوب'
        });
      }

      const escrow = await escrowService.extendInspection(escrowId, parseInt(additionalDays));

      res.json({
        success: true,
        message: 'Inspection period extended',
        messageAr: 'تم تمديد فترة الفحص',
        data: escrow
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تمديد فترة الفحص'
      });
    }
  },

  // حساب الرسوم - Calculate fees
  async calculateFees(req: Request, res: Response) {
    try {
      const { amount } = req.query;

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required',
          messageAr: 'المبلغ مطلوب'
        });
      }

      const fees = await escrowService.calculateFees(parseFloat(amount as string));

      res.json({
        success: true,
        data: fees
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في حساب الرسوم'
      });
    }
  }
};

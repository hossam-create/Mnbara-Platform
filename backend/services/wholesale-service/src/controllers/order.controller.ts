// Order Controller - Wholesale B2B
// متحكم الطلبات - البيع بالجملة

import { Request, Response } from 'express';
import { orderService } from '../services/order.service';

export class OrderController {
  // Create order
  async create(req: Request, res: Response) {
    try {
      const order = await orderService.createOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        messageAr: 'تم إنشاء الطلب بنجاح',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء الطلب'
      });
    }
  }

  // Get order by ID
  async getById(req: Request, res: Response) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          messageAr: 'الطلب غير موجود'
        });
      }
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get order by number
  async getByNumber(req: Request, res: Response) {
    try {
      const order = await orderService.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          messageAr: 'الطلب غير موجود'
        });
      }
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update order status
  async updateStatus(req: Request, res: Response) {
    try {
      const { status, notes } = req.body;
      const userId = req.headers['x-user-id'] as string;
      const order = await orderService.updateOrderStatus(req.params.id, status, notes, userId);
      res.json({
        success: true,
        message: 'Order status updated',
        messageAr: 'تم تحديث حالة الطلب',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update payment status
  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { paymentStatus, paidAt } = req.body;
      const order = await orderService.updatePaymentStatus(
        req.params.id,
        paymentStatus,
        paidAt ? new Date(paidAt) : undefined
      );
      res.json({
        success: true,
        message: 'Payment status updated',
        messageAr: 'تم تحديث حالة الدفع',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Add tracking number
  async addTracking(req: Request, res: Response) {
    try {
      const { trackingNumber, estimatedDelivery } = req.body;
      const order = await orderService.addTrackingNumber(
        req.params.id,
        trackingNumber,
        estimatedDelivery ? new Date(estimatedDelivery) : undefined
      );
      res.json({
        success: true,
        message: 'Tracking number added',
        messageAr: 'تم إضافة رقم التتبع',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // List orders
  async list(req: Request, res: Response) {
    try {
      const { buyerId, supplierId, status, paymentStatus, fromDate, toDate, page, limit } = req.query;
      const result = await orderService.listOrders(
        {
          buyerId: buyerId as string,
          supplierId: supplierId as string,
          status: status as any,
          paymentStatus: paymentStatus as any,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined
        },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get supplier order stats
  async getSupplierStats(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const stats = await orderService.getSupplierOrderStats(
        req.params.supplierId,
        (period as 'day' | 'week' | 'month' | 'year') || 'month'
      );
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get buyer order history
  async getBuyerHistory(req: Request, res: Response) {
    try {
      const history = await orderService.getBuyerOrderHistory(req.params.buyerId);
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const orderController = new OrderController();

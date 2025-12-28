import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '@prisma/client';

const orderService = new OrderService();

export class OrderController {
  // Create new order
  static async create(req: Request, res: Response) {
    try {
      const { items, shippingAddress, paymentMethodId } = req.body;
      const userId = req.headers['x-user-id'] as string; // Assuming API Gateway passes this

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing User ID' });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
      }

      const order = await orderService.createOrder({
        userId,
        items,
        shippingAddress,
        paymentMethodId
      });

      res.status(201).json({ success: true, order });
    } catch (error: any) {
      console.error('Create Order Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get single order
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;

      const order = await orderService.getOrder(id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Security check: Only allow owner or admin
      // TODO: Add robust role check. For now assume passing user ID means owner check
      if (order.userId !== userId) { // && !req.user.isAdmin
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json({ success: true, order });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get my orders
  static async getMyOrders(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await orderService.getUserOrders(userId, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update status (Admin only strictly, but for MVP flexible)
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.headers['x-user-id'] as string;

      if (!Object.values(OrderStatus).includes(status)) {
         return res.status(400).json({ error: 'Invalid status' });
      }

      const order = await orderService.updateStatus(id, status, userId);
      res.json({ success: true, order });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

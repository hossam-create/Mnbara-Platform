import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

const orderService = new OrderService();

export class OrderController {
  async get(req: Request, res: Response) {
    try {
      const order = await orderService.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filters = {
        customerId: req.query.customerId as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await orderService.listOrders(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateFulfillment(req: Request, res: Response) {
    try {
      const { fulfillmentStatus } = req.body;
      const order = await orderService.updateFulfillmentStatus(req.params.id, fulfillmentStatus);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updatePayment(req: Request, res: Response) {
    try {
      const { paymentStatus } = req.body;
      const order = await orderService.updatePaymentStatus(req.params.id, paymentStatus);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const order = await orderService.cancelOrder(req.params.id);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTotal(req: Request, res: Response) {
    try {
      const total = await orderService.getOrderTotal(req.params.id);
      res.json(total);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';

const cartService = new CartService();

export class CartController {
  async create(req: Request, res: Response) {
    try {
      const { customerId, email } = req.body;
      const cart = await cartService.createCart(customerId, email);
      res.status(201).json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const cart = await cartService.getCart(req.params.id);
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addItem(req: Request, res: Response) {
    try {
      const item = await cartService.addItem(req.params.id, req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const item = await cartService.updateItemQuantity(itemId, quantity);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeItem(req: Request, res: Response) {
    try {
      await cartService.removeItem(req.params.itemId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async clear(req: Request, res: Response) {
    try {
      const cart = await cartService.clearCart(req.params.id);
      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTotal(req: Request, res: Response) {
    try {
      const total = await cartService.getCartTotal(req.params.id);
      res.json(total);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async complete(req: Request, res: Response) {
    try {
      const { customerId, email } = req.body;
      const order = await cartService.completeCart(req.params.id, customerId, email);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

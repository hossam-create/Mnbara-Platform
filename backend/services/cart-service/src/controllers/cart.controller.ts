import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';

const cartService = new CartService();

export class CartController {
  async getCart(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.query.userId as string;
      const cart = await cartService.getCart(userId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }

  async addToCart(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { productId, quantity } = req.body;
      
      const cart = await cartService.addToCart(userId, productId, quantity);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  }

  async removeFromCart(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { productId } = req.params;
      
      const cart = await cartService.removeFromCart(userId, productId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove from cart' });
    }
  }

  async updateQuantity(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { productId } = req.params;
      const { quantity } = req.body;
      
      const cart = await cartService.updateQuantity(userId, productId, quantity);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update quantity' });
    }
  }

  async clearCart(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      await cartService.clearCart(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }
}

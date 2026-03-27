import { Request, Response } from 'express';
import { SellerService } from '../services/seller.service';

const sellerService = new SellerService();

export class SellerController {
  async register(req: Request, res: Response) {
    try {
      const seller = await sellerService.registerSeller(req.body);
      res.status(201).json(seller);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.getSellerProfile(sellerId);
      res.json(seller);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.updateSellerProfile(sellerId, req.body);
      res.json(seller);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const stats = await sellerService.getSellerStats(sellerId);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

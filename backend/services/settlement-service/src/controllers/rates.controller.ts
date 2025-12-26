import { Request, Response } from 'express';
import { RatesService } from '../services/rates.service';

const ratesService = new RatesService();

export class RatesController {
  async getExchangeRate(req: Request, res: Response) {
    try {
      const { from, to } = req.params;
      const rate = await ratesService.getExchangeRate(from, to);
      res.json({ success: true, data: rate });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAllRates(req: Request, res: Response) {
    try {
      const rates = await ratesService.getAllRates();
      res.json({ success: true, data: rates });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateRate(req: Request, res: Response) {
    try {
      const rate = await ratesService.updateRate(req.body);
      res.json({ success: true, data: rate });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getRateHistory(req: Request, res: Response) {
    try {
      const { from, to } = req.params;
      const { days } = req.query;
      const history = await ratesService.getRateHistory(from, to, Number(days) || 30);
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

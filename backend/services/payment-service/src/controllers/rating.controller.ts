import { Request, Response } from 'express';
import { RatingService } from '../services/rating.service';

export class RatingController {
  async create(req: Request, res: Response) {
    try {
      const raterId = Number(req.body.raterId || req.headers['x-user-id'] || 1);
      const { orderId, score, comment } = req.body;
      if (!orderId || score === undefined) {
        return res.status(400).json({ error: 'orderId and score are required' });
      }
      const rating = await RatingService.createRating({
        orderId: Number(orderId),
        raterId,
        score: Number(score),
        comment,
      });
      return res.status(201).json({ rating });
    } catch (error: any) {
      const msg = error.message || 'Error creating rating';
      if (
        msg.includes('already submitted') ||
        msg.includes('completion') ||
        msg.includes('dispute') ||
        msg.includes('Rater is not part')
      ) {
        return res.status(400).json({ error: msg });
      }
      console.error('Rating create error:', error);
      return res.status(500).json({ error: msg });
    }
  }
}







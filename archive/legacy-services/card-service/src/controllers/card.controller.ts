import { Request, Response } from 'express';
import { prisma } from '../index';
import { CardService } from '../services/card.service';

const cardService = new CardService();

export const generateCard = async (req: Request, res: Response) => {
  try {
    const { userId, walletId, type } = req.body;
    // In production, verify wallet ownership via Auth Middleware
    
    const card = await cardService.issueCard(userId, walletId, type);
    res.status(201).json(card);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyCards = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) throw new Error('UserId required');
    
    const cards = await prisma.card.findMany({
      where: { userId: String(userId) }
    });
    res.json(cards);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const processTransaction = async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { amount, merchant } = req.body;
    
    const tx = await cardService.attemptPurchase(cardId, Number(amount), merchant);
    res.json(tx);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

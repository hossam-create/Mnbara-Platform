import { Router, Request, Response } from 'express';
import { feeCalculatorService } from '../services/fee-calculator.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Calculate fees for an item
 * POST /fees/calculate
 * Requirements: TRN-002
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const {
      itemPrice,
      quantity = 1,
      shippingCost,
      taxRate,
      userType,
      paymentMethod,
    } = req.body;

    if (!itemPrice || itemPrice <= 0) {
      return res.status(400).json({ error: 'Valid item price required' });
    }

    const breakdown = feeCalculatorService.calculateFees({
      itemPrice,
      quantity,
      shippingCost,
      taxRate,
      userType,
      paymentMethod,
    });

    res.json(breakdown);
  } catch (error) {
    logger.error(`Error calculating fees: ${error}`);
    res.status(500).json({ error: 'Failed to calculate fees' });
  }
});

/**
 * Get fee summary
 * POST /fees/summary
 * Requirements: TRN-001
 */
router.post('/summary', async (req: Request, res: Response) => {
  try {
    const {
      itemPrice,
      quantity = 1,
      shippingCost,
      taxRate,
      userType,
      paymentMethod,
    } = req.body;

    if (!itemPrice || itemPrice <= 0) {
      return res.status(400).json({ error: 'Valid item price required' });
    }

    const summary = feeCalculatorService.getFeeSummary({
      itemPrice,
      quantity,
      shippingCost,
      taxRate,
      userType,
      paymentMethod,
    });

    res.json(summary);
  } catch (error) {
    logger.error(`Error getting fee summary: ${error}`);
    res.status(500).json({ error: 'Failed to get fee summary' });
  }
});

/**
 * Calculate seller earnings
 * POST /fees/seller-earnings
 * Requirements: TRN-002
 */
router.post('/seller-earnings', async (req: Request, res: Response) => {
  try {
    const { itemPrice, quantity = 1 } = req.body;

    if (!itemPrice || itemPrice <= 0) {
      return res.status(400).json({ error: 'Valid item price required' });
    }

    const earnings = feeCalculatorService.calculateSellerEarnings(itemPrice, quantity);

    res.json({
      itemPrice,
      quantity,
      totalEarnings: earnings,
      earningsPerItem: Math.round((earnings / quantity) * 100) / 100,
    });
  } catch (error) {
    logger.error(`Error calculating seller earnings: ${error}`);
    res.status(500).json({ error: 'Failed to calculate seller earnings' });
  }
});

export default router;

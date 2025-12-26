import { Router, Request, Response } from 'express';
import { CustomerIDService } from '../services/customer-id.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const customerIDService = new CustomerIDService(prisma);

/**
 * POST /api/customer-id/generate
 * Generate new Customer ID
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({
        error: 'userId and userType are required',
      });
    }

    const customerID = await customerIDService.generateCustomerID(userId, userType);

    res.status(201).json({
      success: true,
      data: customerID,
      message: 'Customer ID generated successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/customer-id/:id
 * Get customer by any ID format
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await customerIDService.getCustomerByID(id);

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/customer-id/stats
 * Get customer statistics
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await customerIDService.getCustomerStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * DELETE /api/customer-id/:id
 * Deactivate customer ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await customerIDService.deactivateCustomerID(id);

    res.json({
      success: true,
      message: 'Customer ID deactivated',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/customer-id/export
 * Export customer IDs
 */
router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query;

    const data = await customerIDService.exportCustomerIDs(parseInt(limit as string));

    // Convert to CSV
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer-ids.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;

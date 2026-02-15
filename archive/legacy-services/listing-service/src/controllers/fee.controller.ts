import { Request, Response } from 'express';
import { FeeCalculationService } from '../services/fee-calculation.service';

const feeCalculationService = new FeeCalculationService();

export class FeeController {
    /**
     * Calculate fees for listing preview
     * POST /api/v1/fees/calculate
     */
    async calculateFees(req: Request, res: Response) {
        try {
            const { price, categoryId, listingType, currency } = req.body;

            // Validate required fields
            if (!price || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price is required and must be greater than 0',
                });
            }

            if (typeof price !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a number',
                });
            }

            // Validate categoryId if provided
            if (categoryId !== undefined && (typeof categoryId !== 'number' || categoryId <= 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Category ID must be a positive number',
                });
            }

            // Validate listingType if provided
            if (listingType && !['buy_now', 'auction'].includes(listingType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Listing type must be either "buy_now" or "auction"',
                });
            }

            // Calculate fees
            const feeBreakdown = await feeCalculationService.calculateFees({
                price: Number(price),
                categoryId: categoryId ? Number(categoryId) : undefined,
                listingType: listingType || 'buy_now',
                currency: currency || 'USD',
            });

            res.json({
                success: true,
                data: feeBreakdown,
            });
        } catch (error: any) {
            console.error('Fee calculation error:', error);

            if (error.message.includes('must be') || error.message.includes('exceeds')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Calculate fees for checkout (transaction preview)
     * POST /api/v1/fees/calculate-checkout
     */
    async calculateCheckoutFees(req: Request, res: Response) {
        try {
            const { price, categoryId, listingType, currency } = req.body;

            // Same validation as calculateFees
            if (!price || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price is required and must be greater than 0',
                });
            }

            if (typeof price !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a number',
                });
            }

            // Calculate fees (same logic as listing preview)
            const feeBreakdown = await feeCalculationService.calculateFees({
                price: Number(price),
                categoryId: categoryId ? Number(categoryId) : undefined,
                listingType: listingType || 'buy_now',
                currency: currency || 'USD',
            });

            res.json({
                success: true,
                data: feeBreakdown,
            });
        } catch (error: any) {
            console.error('Checkout fee calculation error:', error);

            if (error.message.includes('must be') || error.message.includes('exceeds')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }
}






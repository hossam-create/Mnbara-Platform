import { Router } from 'express';
import { dropshipService } from '../services/dropship.service';
import { validateDropshipRequest } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { DropshipStatus } from '../types/dropship.types';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Create new dropship order
router.post('/orders', validateDropshipRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await dropshipService.createDropshipRequest(req.body, userId);
        
        res.status(201).json({
            success: true,
            data: result.order,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get available suppliers for dropshipping
router.get('/suppliers', async (req, res) => {
    try {
        const filters = {
            category: req.query.category as string,
            minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
            location: req.query.location as string
        };

        const suppliers = await dropshipService.getDropshipSuppliers(filters);
        
        res.json({
            success: true,
            data: suppliers,
            count: suppliers.length
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get dropship orders for user
router.get('/orders', async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role; // 'customer' or 'supplier'
        const status = req.query.status as string;

        const orders = await dropshipService.getDropshipOrders(userId, role as 'customer' | 'supplier', status as DropshipStatus | undefined);
        
        res.json({
            success: true,
            data: orders,
            count: orders.length
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get specific dropship order details
router.get('/orders/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.user.id;
        const role = req.user.role;

        // Get order and verify user has access
        const orders = await dropshipService.getDropshipOrders(userId, role as 'customer' | 'supplier');
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Supplier accepts dropship order
router.post('/orders/:orderId/accept', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const supplierId = req.user.id;

        const order = await dropshipService.acceptDropshipOrder(orderId, supplierId);
        
        res.json({
            success: true,
            data: order,
            message: 'Order accepted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Update tracking information
router.post('/orders/:orderId/tracking', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const supplierId = req.user.id;
        const { trackingNumber, carrier } = req.body;

        if (!trackingNumber || !carrier) {
            return res.status(400).json({
                success: false,
                message: 'Tracking number and carrier are required'
            });
        }

        const order = await dropshipService.updateTracking(orderId, supplierId, trackingNumber, carrier);
        
        res.json({
            success: true,
            data: order,
            message: 'Tracking information updated'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Mark order as delivered
router.post('/orders/:orderId/complete', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const supplierId = req.user.id;

        const order = await dropshipService.completeDropshipOrder(orderId, supplierId);
        
        res.json({
            success: true,
            data: order,
            message: 'Order completed successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Cancel dropship order
router.post('/orders/:orderId/cancel', async (req, res) => {
    try {
        // Implementation for order cancellation
        // This would handle refunds, notifications, etc.
        
        res.json({
            success: true,
            message: 'Order cancellation requested'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get dropship analytics for suppliers
router.get('/analytics', async (req, res) => {
    try {
        const supplierId = req.user.id;
        
        // Get supplier analytics
        const analytics = await dropshipService.getSupplierAnalytics(supplierId);
        
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

export default router;

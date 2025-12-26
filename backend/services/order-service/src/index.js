const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8080';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3002';
const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://listing-service:3001';

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// In-memory storage for demo (replace with database in production)
let orders = [];
let orderCounter = 1;

// Helper function to generate order ID
const generateOrderId = () => {
    return `ORD-${Date.now()}-${orderCounter++}`;
};

// Helper function to calculate order total
const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'order-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        ordersCount: orders.length
    });
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethodId, userId } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Invalid items',
                message: 'Order must contain at least one item'
            });
        }

        if (!userId) {
            return res.status(400).json({
                error: 'Missing user ID',
                message: 'User ID is required to create an order'
            });
        }

        // Calculate order total
        const total = calculateOrderTotal(items);
        
        if (total <= 0) {
            return res.status(400).json({
                error: 'Invalid order total',
                message: 'Order total must be greater than 0'
            });
        }

        // Create order object
        const order = {
            id: generateOrderId(),
            userId,
            items: items.map(item => ({
                productId: item.productId,
                title: item.title || 'Product',
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            total,
            currency: 'USD',
            status: 'PENDING',
            shippingAddress: shippingAddress || null,
            paymentMethodId: paymentMethodId || null,
            paymentStatus: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Store order
        orders.push(order);

        // If payment method provided, create payment intent
        if (paymentMethodId) {
            try {
                const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/create-intent`, {
                    amount: total,
                    currency: 'USD',
                    orderId: order.id,
                    userId: userId
                });

                if (paymentResponse.data.success) {
                    order.paymentIntentId = paymentResponse.data.paymentIntentId;
                    order.clientSecret = paymentResponse.data.clientSecret;
                }
            } catch (paymentError) {
                console.error('Payment intent creation failed:', paymentError.message);
                // Continue with order creation even if payment fails
            }
        }

        res.status(201).json({
            success: true,
            order: {
                id: order.id,
                items: order.items,
                total: order.total,
                currency: order.currency,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentIntentId: order.paymentIntentId,
                clientSecret: order.clientSecret,
                createdAt: order.createdAt
            }
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            error: 'Order creation failed',
            message: error.message
        });
    }
});

// Get order by ID
app.get('/api/orders/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found',
                message: `Order with ID ${orderId} does not exist`
            });
        }

        res.json({
            success: true,
            order: {
                id: order.id,
                userId: order.userId,
                items: order.items,
                total: order.total,
                currency: order.currency,
                status: order.status,
                paymentStatus: order.paymentStatus,
                shippingAddress: order.shippingAddress,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            }
        });

    } catch (error) {
        console.error('Order retrieval error:', error);
        res.status(500).json({
            error: 'Order retrieval failed',
            message: error.message
        });
    }
});

// Get orders for user
app.get('/api/orders', (req, res) => {
    try {
        const { userId, status, limit = 10, offset = 0 } = req.query;

        if (!userId) {
            return res.status(400).json({
                error: 'Missing user ID',
                message: 'User ID is required to retrieve orders'
            });
        }

        let userOrders = orders.filter(order => order.userId === userId);

        // Filter by status if provided
        if (status) {
            userOrders = userOrders.filter(order => order.status === status.toUpperCase());
        }

        // Sort by creation date (newest first)
        userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const paginatedOrders = userOrders.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        res.json({
            success: true,
            orders: paginatedOrders.map(order => ({
                id: order.id,
                items: order.items,
                total: order.total,
                currency: order.currency,
                status: order.status,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt
            })),
            pagination: {
                total: userOrders.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: userOrders.length > parseInt(offset) + parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Orders retrieval error:', error);
        res.status(500).json({
            error: 'Orders retrieval failed',
            message: error.message
        });
    }
});

// Update order status
app.put('/api/orders/:orderId/status', (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus } = req.body;

        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found',
                message: `Order with ID ${orderId} does not exist`
            });
        }

        // Update status if provided
        if (status) {
            const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
            if (!validStatuses.includes(status.toUpperCase())) {
                return res.status(400).json({
                    error: 'Invalid status',
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }
            order.status = status.toUpperCase();
        }

        // Update payment status if provided
        if (paymentStatus) {
            const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
            if (!validPaymentStatuses.includes(paymentStatus.toUpperCase())) {
                return res.status(400).json({
                    error: 'Invalid payment status',
                    message: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`
                });
            }
            order.paymentStatus = paymentStatus.toUpperCase();
        }

        order.updatedAt = new Date().toISOString();

        res.json({
            success: true,
            order: {
                id: order.id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                updatedAt: order.updatedAt
            }
        });

    } catch (error) {
        console.error('Order update error:', error);
        res.status(500).json({
            error: 'Order update failed',
            message: error.message
        });
    }
});

// Cancel order
app.delete('/api/orders/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found',
                message: `Order with ID ${orderId} does not exist`
            });
        }

        // Check if order can be cancelled
        if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
            return res.status(400).json({
                error: 'Cannot cancel order',
                message: 'Order cannot be cancelled after shipping'
            });
        }

        // Update order status to cancelled
        order.status = 'CANCELLED';
        order.updatedAt = new Date().toISOString();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order: {
                id: order.id,
                status: order.status,
                updatedAt: order.updatedAt
            }
        });

    } catch (error) {
        console.error('Order cancellation error:', error);
        res.status(500).json({
            error: 'Order cancellation failed',
            message: error.message
        });
    }
});

// Get order statistics
app.get('/api/orders/stats/summary', (req, res) => {
    try {
        const { userId } = req.query;

        let filteredOrders = orders;
        if (userId) {
            filteredOrders = orders.filter(order => order.userId === userId);
        }

        const stats = {
            totalOrders: filteredOrders.length,
            totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
            statusBreakdown: {
                PENDING: filteredOrders.filter(o => o.status === 'PENDING').length,
                CONFIRMED: filteredOrders.filter(o => o.status === 'CONFIRMED').length,
                PROCESSING: filteredOrders.filter(o => o.status === 'PROCESSING').length,
                SHIPPED: filteredOrders.filter(o => o.status === 'SHIPPED').length,
                DELIVERED: filteredOrders.filter(o => o.status === 'DELIVERED').length,
                CANCELLED: filteredOrders.filter(o => o.status === 'CANCELLED').length
            },
            paymentStatusBreakdown: {
                PENDING: filteredOrders.filter(o => o.paymentStatus === 'PENDING').length,
                PAID: filteredOrders.filter(o => o.paymentStatus === 'PAID').length,
                FAILED: filteredOrders.filter(o => o.paymentStatus === 'FAILED').length,
                REFUNDED: filteredOrders.filter(o => o.paymentStatus === 'REFUNDED').length
            }
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Order stats error:', error);
        res.status(500).json({
            error: 'Order stats retrieval failed',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Order service error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong in order processing'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'Order service endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Order Service running on port ${PORT}`);
    console.log(`🔗 Auth Service: ${AUTH_SERVICE_URL}`);
    console.log(`💳 Payment Service: ${PAYMENT_SERVICE_URL}`);
    console.log(`📦 Listing Service: ${LISTING_SERVICE_URL}`);
    console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
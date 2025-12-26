const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const stripe = require('stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'payment-service',
        version: '1.0.0',
        timestamp: new Date().toISOString() 
    });
});

// Create payment intent
app.post('/api/payments/create-intent', async (req, res) => {
    try {
        const { amount, currency = 'USD', orderId, userId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                error: 'Invalid amount',
                message: 'Amount must be greater than 0'
            });
        }

        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            metadata: {
                orderId: orderId || '',
                userId: userId || '',
                platform: 'mnbara'
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            currency: currency
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({
            error: 'Payment intent creation failed',
            message: error.message
        });
    }
});

// Confirm payment
app.post('/api/payments/confirm', async (req, res) => {
    try {
        const { paymentIntentId, paymentMethodId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                error: 'Missing payment intent ID'
            });
        }

        const paymentIntent = await stripeClient.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId
        });

        res.json({
            success: true,
            status: paymentIntent.status,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase()
        });

    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({
            error: 'Payment confirmation failed',
            message: error.message
        });
    }
});

// Get payment status
app.get('/api/payments/:paymentIntentId', async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

        res.json({
            success: true,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            created: new Date(paymentIntent.created * 1000).toISOString()
        });

    } catch (error) {
        console.error('Payment retrieval error:', error);
        res.status(500).json({
            error: 'Payment retrieval failed',
            message: error.message
        });
    }
});

// Stripe webhook handler
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id);
            // TODO: Update order status in database
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.id);
            // TODO: Handle failed payment
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// List payment methods for customer
app.get('/api/payments/methods/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;

        const paymentMethods = await stripeClient.paymentMethods.list({
            customer: customerId,
            type: 'card',
        });

        res.json({
            success: true,
            paymentMethods: paymentMethods.data.map(pm => ({
                id: pm.id,
                type: pm.type,
                card: pm.card ? {
                    brand: pm.card.brand,
                    last4: pm.card.last4,
                    exp_month: pm.card.exp_month,
                    exp_year: pm.card.exp_year
                } : null
            }))
        });

    } catch (error) {
        console.error('Payment methods retrieval error:', error);
        res.status(500).json({
            error: 'Payment methods retrieval failed',
            message: error.message
        });
    }
});

// Create customer
app.post('/api/payments/customers', async (req, res) => {
    try {
        const { email, name, userId } = req.body;

        const customer = await stripeClient.customers.create({
            email,
            name,
            metadata: {
                userId: userId || '',
                platform: 'mnbara'
            }
        });

        res.json({
            success: true,
            customerId: customer.id,
            email: customer.email,
            name: customer.name
        });

    } catch (error) {
        console.error('Customer creation error:', error);
        res.status(500).json({
            error: 'Customer creation failed',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Payment service error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong in payment processing'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'Payment service endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Payment Service running on port ${PORT}`);
    console.log(`💳 Stripe integration: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
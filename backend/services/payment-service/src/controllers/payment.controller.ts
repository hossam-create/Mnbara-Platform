import { Request, Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe.service';
import { PayPalService } from '../services/paypal.service';
import { PaymobService, BillingData } from '../services/paymob.service';
import { PaymentRecordService } from '../services/payment-record.service';
import { WebhookEventService } from '../services/webhook-event.service';

export class PaymentController {
    private stripeService: StripeService;
    private payPalService: PayPalService;
    private paymobService: PaymobService;

    constructor() {
        this.stripeService = new StripeService();
        this.payPalService = new PayPalService();
        this.paymobService = new PaymobService();
    }

    // ==================== STRIPE ====================

    /**
     * Create Stripe Payment Intent
     */
    createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { amount, currency = 'usd', metadata, userId, orderId } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, error: 'Invalid amount' });
            }

            // Create Stripe payment intent
            const paymentIntent = await this.stripeService.createPaymentIntent(amount, currency, {
                ...metadata,
                userId: userId?.toString(),
                orderId: orderId?.toString()
            });

            // Create payment record in database
            if (userId) {
                await PaymentRecordService.createPayment({
                    provider: 'STRIPE',
                    externalId: paymentIntent.id,
                    userId: parseInt(userId),
                    amount,
                    currency: currency.toUpperCase(),
                    orderId: orderId ? parseInt(orderId) : undefined,
                    method: 'CARD',
                    captureMethod: 'manual', // For escrow holds
                    description: metadata?.description || `Payment for order ${orderId}`,
                    metadata
                });
            }
            
            res.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Capture Stripe Payment (release held funds)
     */
    captureStripePayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { paymentIntentId } = req.body;

            if (!paymentIntentId) {
                return res.status(400).json({ success: false, error: 'Payment intent ID required' });
            }

            const paymentIntent = await this.stripeService.capturePayment(paymentIntentId);
            
            res.json({
                success: true,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Refund Stripe Payment
     */
    refundStripePayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { paymentIntentId, amount } = req.body;

            if (!paymentIntentId) {
                return res.status(400).json({ success: false, error: 'Payment intent ID required' });
            }

            const refund = await this.stripeService.refundPayment(paymentIntentId, amount);
            
            res.json({
                success: true,
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount / 100,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Handle Stripe Webhook
     */
    handleStripeWebhook = async (req: Request, res: Response) => {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            console.error('Missing Stripe signature');
            return res.status(400).json({ error: 'Missing signature' });
        }

        try {
            // Verify webhook signature
            const event = this.stripeService.verifyWebhook(req.body, signature);

            console.log(`Received Stripe webhook: ${event.type} (${event.id})`);

            // Process event using WebhookEventService
            const result = await WebhookEventService.processStripeEvent(event);

            if (result.success) {
                console.log(`Stripe webhook processed: ${result.action}`);
            } else {
                console.error(`Stripe webhook processing failed: ${result.error}`);
            }

            res.json({ received: true, processed: result.success, action: result.action });
        } catch (error: any) {
            console.error('Stripe webhook error:', error.message);
            res.status(400).json({ error: error.message });
        }
    };

    // ==================== PAYPAL ====================

    /**
     * Create PayPal Order
     */
    createPayPalOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { amount, currency = 'USD', description, metadata, userId, orderId } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, error: 'Invalid amount' });
            }

            const order = await this.payPalService.createOrder(amount, currency, description, {
                ...metadata,
                orderId: orderId?.toString()
            });
            
            // Find approval URL
            const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;

            // Create payment record in database
            if (userId) {
                await PaymentRecordService.createPayment({
                    provider: 'PAYPAL',
                    externalId: order.id,
                    userId: parseInt(userId),
                    amount,
                    currency: currency.toUpperCase(),
                    orderId: orderId ? parseInt(orderId) : undefined,
                    method: 'PAYPAL',
                    description: description || `PayPal payment for order ${orderId}`,
                    metadata: { ...metadata, approvalUrl }
                });
            }

            res.json({
                success: true,
                orderId: order.id,
                status: order.status,
                approvalUrl,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Capture PayPal Order
     */
    capturePayPalOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId } = req.body;

            if (!orderId) {
                return res.status(400).json({ success: false, error: 'Order ID required' });
            }

            const capture = await this.payPalService.captureOrder(orderId);
            
            res.json({
                success: true,
                orderId: capture.id,
                status: capture.status,
                captures: capture.purchaseUnits?.[0]?.payments?.captures,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get PayPal Order Details
     */
    getPayPalOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId } = req.params;

            if (!orderId) {
                return res.status(400).json({ success: false, error: 'Order ID required' });
            }

            const order = await this.payPalService.getOrder(orderId);
            
            res.json({ success: true, order });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Refund PayPal Capture
     */
    refundPayPalCapture = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { captureId, amount, currency = 'USD', reason } = req.body;

            if (!captureId) {
                return res.status(400).json({ success: false, error: 'Capture ID required' });
            }

            const refund = await this.payPalService.refundCapture(captureId, amount, currency, reason);
            
            res.json({ success: true, refund });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Handle PayPal Webhook
     */
    handlePayPalWebhook = async (req: Request, res: Response) => {
        const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
        const headers: Record<string, string> = {};
        
        // Extract PayPal headers
        for (const [key, value] of Object.entries(req.headers)) {
            if (key.startsWith('paypal-')) {
                headers[key] = value as string;
            }
        }

        try {
            const isValid = await this.payPalService.verifyWebhookSignature(webhookId, req.body, headers);

            if (!isValid) {
                console.error('Invalid PayPal webhook signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }

            console.log(`Received PayPal webhook: ${req.body.event_type} (${req.body.id})`);

            // Process event using WebhookEventService
            const result = await WebhookEventService.processPayPalEvent(req.body);

            if (result.success) {
                console.log(`PayPal webhook processed: ${result.action}`);
            } else {
                console.error(`PayPal webhook processing failed: ${result.error}`);
            }

            res.json({ received: true, processed: result.success, action: result.action });
        } catch (error: any) {
            console.error('PayPal webhook error:', error.message);
            res.status(400).json({ error: error.message });
        }
    };

    // ==================== PAYMOB ====================

    /**
     * Initiate Paymob Payment
     */
    initiatePaymobPayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { amount, currency = 'EGP', billingData, merchantOrderId, userId, orderId } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, error: 'Invalid amount' });
            }

            if (!billingData || !billingData.firstName || !billingData.email || !billingData.phone) {
                return res.status(400).json({ success: false, error: 'Billing data required (firstName, email, phone)' });
            }

            const result = await this.paymobService.initiatePayment(
                amount,
                currency,
                billingData as BillingData,
                merchantOrderId || orderId?.toString()
            );

            // Create payment record in database
            if (userId) {
                await PaymentRecordService.createPayment({
                    provider: 'PAYMOB',
                    externalId: result.orderId.toString(),
                    userId: parseInt(userId),
                    amount,
                    currency: currency.toUpperCase(),
                    orderId: orderId ? parseInt(orderId) : undefined,
                    method: 'CARD',
                    description: `Paymob payment for order ${orderId || merchantOrderId}`,
                    metadata: { billingData, iframeUrl: result.iframeUrl }
                });
            }

            res.json({
                success: true,
                orderId: result.orderId,
                paymentKey: result.paymentKey,
                iframeUrl: result.iframeUrl,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Create Paymob Mobile Wallet Payment
     */
    createPaymobWalletPayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { amount, currency = 'EGP', mobileNumber, billingData, merchantOrderId, userId, orderId } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, error: 'Invalid amount' });
            }

            if (!mobileNumber) {
                return res.status(400).json({ success: false, error: 'Mobile number required' });
            }

            // Create order first
            const amountCents = Math.round(amount * 100);
            const order = await this.paymobService.createOrder(amountCents, currency, merchantOrderId || orderId?.toString());

            // Create wallet payment
            const result = await this.paymobService.createMobileWalletPayment(
                order.id,
                amountCents,
                currency,
                mobileNumber,
                billingData as BillingData
            );

            // Create payment record in database
            if (userId) {
                await PaymentRecordService.createPayment({
                    provider: 'PAYMOB',
                    externalId: order.id.toString(),
                    userId: parseInt(userId),
                    amount,
                    currency: currency.toUpperCase(),
                    orderId: orderId ? parseInt(orderId) : undefined,
                    method: 'MOBILE_WALLET',
                    description: `Paymob wallet payment for order ${orderId || merchantOrderId}`,
                    metadata: { mobileNumber, billingData, redirectUrl: result.redirectUrl }
                });
            }

            res.json({
                success: true,
                orderId: order.id,
                redirectUrl: result.redirectUrl,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get Paymob Transaction
     */
    getPaymobTransaction = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { transactionId } = req.params;

            if (!transactionId) {
                return res.status(400).json({ success: false, error: 'Transaction ID required' });
            }

            const transaction = await this.paymobService.getTransaction(parseInt(transactionId));

            res.json({ success: true, transaction });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Refund Paymob Transaction
     */
    refundPaymobTransaction = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { transactionId, amount } = req.body;

            if (!transactionId) {
                return res.status(400).json({ success: false, error: 'Transaction ID required' });
            }

            const amountCents = amount ? Math.round(amount * 100) : undefined;
            const result = await this.paymobService.refundTransaction(transactionId, amountCents!);

            res.json({ success: true, refund: result });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Handle Paymob Webhook (Transaction Callback)
     */
    handlePaymobWebhook = async (req: Request, res: Response) => {
        const hmac = req.query.hmac as string;

        try {
            // Verify HMAC signature
            const isValid = this.paymobService.verifyWebhookSignature(req.body, hmac);

            const obj = req.body.obj;
            console.log(`Received Paymob webhook: Transaction ${obj?.id}, Success: ${obj?.success}`);

            // Process event using WebhookEventService
            const result = await WebhookEventService.processPaymobEvent(req.body, isValid);

            if (result.success) {
                console.log(`Paymob webhook processed: ${result.action}`);
            } else {
                console.error(`Paymob webhook processing failed: ${result.error}`);
            }

            res.json({ received: true, processed: result.success, action: result.action });
        } catch (error: any) {
            console.error('Paymob webhook error:', error.message);
            res.status(400).json({ error: error.message });
        }
    };

    /**
     * Handle Paymob Response Callback (redirect after payment)
     */
    handlePaymobResponse = async (req: Request, res: Response) => {
        // This is called when user is redirected back after payment
        const { success, txn_response_code, order, id } = req.query;

        console.log('Paymob response callback:', { success, txn_response_code, order, id });

        // Redirect to frontend with result
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const status = success === 'true' ? 'success' : 'failed';
        
        res.redirect(`${frontendUrl}/checkout/result?status=${status}&orderId=${order}&transactionId=${id}`);
    };
}

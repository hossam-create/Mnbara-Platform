import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

export class StripeService {
    
    /**
     * Create Payment Intent (for escrow hold)
     */
    async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any): Promise<Stripe.PaymentIntent> {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                automatic_payment_methods: {
                    enabled: true,
                },
                capture_method: 'manual', // Hold funds until manual capture
                metadata: metadata || {}
            });

            return paymentIntent;
        } catch (error: any) {
            console.error('Stripe Payment Intent Error:', error);
            throw new Error(`Stripe error: ${error.message}`);
        }
    }

    /**
     * Capture Payment (release escrow to seller)
     */
    async capturePayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        try {
            const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
            return paymentIntent;
        } catch (error: any) {
            console.error('Stripe Capture Error:', error);
            throw new Error(`Failed to capture payment: ${error.message}`);
        }
    }

    /**
     * Refund Payment (return to buyer)
     */
    async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined,
            });
            return refund;
        } catch (error: any) {
            console.error('Stripe Refund Error:', error);
            throw new Error(`Failed to refund payment: ${error.message}`);
        }
    }

    /**
     * Create Payout to Seller's Bank/Card
     */
    async createPayout(amount: number, destination: string, currency: string = 'usd'): Promise<any> {
        try {
            // Note: Requires Stripe Connect for marketplace payouts
            const transfer = await stripe.transfers.create({
                amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
                destination: destination, // Seller's Stripe account ID
            });
            return transfer;
        } catch (error: any) {
            console.error('Stripe Payout Error:', error);
            throw new Error(`Failed to create payout: ${error.message}`);
        }
    }

    /**
     * Verify Webhook Signature
     */
    verifyWebhook(payload: string | Buffer, signature: string): Stripe.Event {
        try {
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
            const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            return event;
        } catch (error: any) {
            console.error('Webhook Verification Error:', error);
            throw new Error(`Webhook verification failed: ${error.message}`);
        }
    }

    /**
     * Get Payment Method Details
     */
    async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
        try {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            return paymentMethod;
        } catch (error: any) {
            console.error('Get Payment Method Error:', error);
            throw new Error(`Failed to retrieve payment method: ${error.message}`);
        }
    }

    /**
     * Create Customer (for recurring payments or saved cards)
     */
    async createCustomer(email: string, name: string, metadata?: any): Promise<Stripe.Customer> {
        try {
            const customer = await stripe.customers.create({
                email,
                name,
                metadata: metadata || {}
            });
            return customer;
        } catch (error: any) {
            console.error('Create Customer Error:', error);
            throw new Error(`Failed to create customer: ${error.message}`);
        }
    }
}


import { Request, Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe.service';
import { PayPalService } from '../services/paypal.service';

export class PaymentController {
    private stripeService: StripeService;
    private payPalService: PayPalService;

    constructor() {
        this.stripeService = new StripeService();
        this.payPalService = new PayPalService();
    }

    // Stripe: Create Payment Intent
    createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { amount, currency = 'usd' } = req.body;
            const clientSecret = await this.stripeService.createPaymentIntent(amount, currency);
            res.json({ success: true, clientSecret });
        } catch (error) {
            next(error);
        }
    };

    // PayPal: Create Order
    createPayPalOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { amount } = req.body;
            const orderId = await this.payPalService.createOrder(amount);
            res.json({ success: true, orderId });
        } catch (error) {
            next(error);
        }
    };

    // PayPal: Capture Order
    capturePayPalOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId } = req.body;
            const captureId = await this.payPalService.captureOrder(orderId);
            res.json({ success: true, captureId });
        } catch (error) {
            next(error);
        }
    };

    // Webhooks
    handleStripeWebhook = async (req: Request, res: Response) => {
        // TODO: Verify signature and handle event
        console.log('Stripe Webhook received');
        res.json({ received: true });
    };

    handlePayPalWebhook = async (req: Request, res: Response) => {
        console.log('PayPal Webhook received');
        res.json({ received: true });
    };
}

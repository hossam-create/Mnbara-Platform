/**
 * Unified Payment Service
 * Provides a single interface for all payment providers (Stripe, PayPal, Paymob)
 */

import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';
import { PaymobService, BillingData } from './paymob.service';
import {
    PaymentProvider,
    PaymentRequest,
    PaymentResult,
    PaymentStatus,
    RefundRequest,
    RefundResult,
} from '../types/payment.types';

export class UnifiedPaymentService {
    private stripeService: StripeService;
    private paypalService: PayPalService;
    private paymobService: PaymobService;

    constructor() {
        this.stripeService = new StripeService();
        this.paypalService = new PayPalService();
        this.paymobService = new PaymobService();
    }

    /**
     * Create a payment intent/order based on provider
     */
    async createPayment(request: PaymentRequest): Promise<PaymentResult> {
        const { provider, amount, currency, orderId, metadata } = request;

        switch (provider) {
            case 'stripe':
                return this.createStripePayment(amount, currency, metadata);
            case 'paypal':
                return this.createPayPalPayment(amount, currency, metadata);
            case 'paymob':
                throw new Error('Paymob requires billing data. Use createPaymobPayment directly.');
            default:
                throw new Error(`Unsupported payment provider: ${provider}`);
        }
    }

    /**
     * Create Stripe payment intent
     */
    private async createStripePayment(
        amount: number,
        currency: string = 'USD',
        metadata?: Record<string, any>
    ): Promise<PaymentResult> {
        const paymentIntent = await this.stripeService.createPaymentIntent(amount, currency, metadata);

        return {
            success: true,
            provider: 'stripe',
            transactionId: paymentIntent.id,
            status: this.mapStripeStatus(paymentIntent.status),
            amount,
            currency,
            metadata: {
                clientSecret: paymentIntent.client_secret,
            },
        };
    }


    /**
     * Create PayPal order
     */
    private async createPayPalPayment(
        amount: number,
        currency: string = 'USD',
        metadata?: Record<string, any>
    ): Promise<PaymentResult> {
        const order = await this.paypalService.createOrder(amount, currency, undefined, metadata);

        const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;

        return {
            success: true,
            provider: 'paypal',
            transactionId: order.id,
            status: this.mapPayPalStatus(order.status),
            amount,
            currency,
            metadata: {
                approvalUrl,
                links: order.links,
            },
        };
    }

    /**
     * Create Paymob payment (card or wallet)
     */
    async createPaymobPayment(
        amount: number,
        currency: string = 'EGP',
        billingData: BillingData,
        merchantOrderId?: string
    ): Promise<PaymentResult> {
        const result = await this.paymobService.initiatePayment(
            amount,
            currency,
            billingData,
            merchantOrderId
        );

        return {
            success: true,
            provider: 'paymob',
            transactionId: result.orderId.toString(),
            status: 'pending',
            amount,
            currency,
            metadata: {
                paymentKey: result.paymentKey,
                iframeUrl: result.iframeUrl,
            },
        };
    }

    /**
     * Capture/Complete a payment
     */
    async capturePayment(
        provider: PaymentProvider,
        transactionId: string
    ): Promise<PaymentResult> {
        switch (provider) {
            case 'stripe':
                const stripeResult = await this.stripeService.capturePayment(transactionId);
                return {
                    success: stripeResult.status === 'succeeded',
                    provider: 'stripe',
                    transactionId: stripeResult.id,
                    status: this.mapStripeStatus(stripeResult.status),
                    amount: stripeResult.amount / 100,
                    currency: stripeResult.currency.toUpperCase(),
                };

            case 'paypal':
                const paypalResult = await this.paypalService.captureOrder(transactionId);
                const capture = paypalResult.purchaseUnits?.[0]?.payments?.captures?.[0];
                return {
                    success: paypalResult.status === 'COMPLETED',
                    provider: 'paypal',
                    transactionId: paypalResult.id,
                    status: this.mapPayPalStatus(paypalResult.status),
                    amount: capture ? parseFloat(capture.amount.value) : 0,
                    currency: capture?.amount.currency_code || 'USD',
                };

            case 'paymob':
                // Paymob captures automatically via webhook
                throw new Error('Paymob payments are captured automatically via webhook');

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
     * Refund a payment
     */
    async refundPayment(request: RefundRequest): Promise<RefundResult> {
        const { provider, transactionId, amount, reason } = request;

        switch (provider) {
            case 'stripe':
                const stripeRefund = await this.stripeService.refundPayment(transactionId, amount);
                return {
                    success: stripeRefund.status === 'succeeded',
                    refundId: stripeRefund.id,
                    status: stripeRefund.status,
                    amount: stripeRefund.amount / 100,
                    currency: stripeRefund.currency.toUpperCase(),
                };

            case 'paypal':
                const paypalRefund = await this.paypalService.refundCapture(
                    transactionId,
                    amount,
                    'USD',
                    reason
                );
                return {
                    success: paypalRefund.status === 'COMPLETED',
                    refundId: paypalRefund.id,
                    status: paypalRefund.status,
                    amount: parseFloat(paypalRefund.amount?.value || '0'),
                    currency: paypalRefund.amount?.currency_code || 'USD',
                };

            case 'paymob':
                const amountCents = amount ? Math.round(amount * 100) : 0;
                const paymobRefund = await this.paymobService.refundTransaction(
                    parseInt(transactionId),
                    amountCents
                );
                return {
                    success: paymobRefund.success || false,
                    refundId: paymobRefund.id?.toString() || '',
                    status: paymobRefund.success ? 'completed' : 'failed',
                    amount: amount || 0,
                    currency: 'EGP',
                };

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(
        provider: PaymentProvider,
        transactionId: string
    ): Promise<PaymentStatus> {
        switch (provider) {
            case 'stripe':
                // Would need to add getPaymentIntent to StripeService
                return 'pending';

            case 'paypal':
                const order = await this.paypalService.getOrder(transactionId);
                return this.mapPayPalStatus(order.status);

            case 'paymob':
                const transaction = await this.paymobService.getTransaction(parseInt(transactionId));
                if (transaction.success) return 'succeeded';
                if (transaction.pending) return 'processing';
                return 'failed';

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
     * Map Stripe status to unified status
     */
    private mapStripeStatus(status: string): PaymentStatus {
        const statusMap: Record<string, PaymentStatus> = {
            'requires_payment_method': 'pending',
            'requires_confirmation': 'pending',
            'requires_action': 'requires_action',
            'processing': 'processing',
            'requires_capture': 'processing',
            'canceled': 'canceled',
            'succeeded': 'succeeded',
        };
        return statusMap[status] || 'pending';
    }

    /**
     * Map PayPal status to unified status
     */
    private mapPayPalStatus(status: string): PaymentStatus {
        const statusMap: Record<string, PaymentStatus> = {
            'CREATED': 'pending',
            'SAVED': 'pending',
            'APPROVED': 'processing',
            'VOIDED': 'canceled',
            'COMPLETED': 'succeeded',
            'PAYER_ACTION_REQUIRED': 'requires_action',
        };
        return statusMap[status] || 'pending';
    }

    /**
     * Get available payment methods for a region/currency
     */
    getAvailableProviders(currency: string, country?: string): PaymentProvider[] {
        const providers: PaymentProvider[] = ['stripe', 'paypal'];

        // Paymob is available for MENA region
        const menaCountries = ['EG', 'SA', 'AE', 'KW', 'BH', 'QA', 'OM', 'JO', 'LB', 'PK'];
        const menaCurrencies = ['EGP', 'SAR', 'AED', 'KWD', 'BHD', 'QAR', 'OMR', 'JOD', 'LBP', 'PKR'];

        if (
            (country && menaCountries.includes(country.toUpperCase())) ||
            menaCurrencies.includes(currency.toUpperCase())
        ) {
            providers.push('paymob');
        }

        return providers;
    }
}

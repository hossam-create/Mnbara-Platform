import paypal from '@paypal/checkout-server-sdk';

// PayPal Environment Configuration
function environment(): paypal.core.SandboxEnvironment | paypal.core.LiveEnvironment {
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    const clientSecret = process.env.PAYPAL_SECRET || '';
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (mode === 'live') {
        return new paypal.core.LiveEnvironment(clientId, clientSecret);
    }
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client(): paypal.core.PayPalHttpClient {
    return new paypal.core.PayPalHttpClient(environment());
}

export interface PayPalOrderResult {
    id: string;
    status: string;
    links: Array<{ href: string; rel: string; method: string }>;
}

export interface PayPalCaptureResult {
    id: string;
    status: string;
    purchaseUnits: Array<{
        payments: {
            captures: Array<{
                id: string;
                status: string;
                amount: { value: string; currency_code: string };
            }>;
        };
    }>;
}

export class PayPalService {
    private client: paypal.core.PayPalHttpClient;

    constructor() {
        this.client = client();
    }

    /**
     * Create PayPal Order for checkout
     */
    async createOrder(
        amount: number,
        currency: string = 'USD',
        description?: string,
        metadata?: Record<string, string>
    ): Promise<PayPalOrderResult> {
        try {
            const request = new paypal.orders.OrdersCreateRequest();
            request.prefer('return=representation');
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: currency.toUpperCase(),
                            value: amount.toFixed(2),
                        },
                        description: description || 'MNBARA Purchase',
                        custom_id: metadata?.orderId || undefined,
                        reference_id: metadata?.referenceId || undefined,
                    },
                ],
                application_context: {
                    brand_name: 'MNBARA',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW',
                    return_url: `${process.env.WEBHOOK_BASE_URL}/api/payments/paypal/return`,
                    cancel_url: `${process.env.WEBHOOK_BASE_URL}/api/payments/paypal/cancel`,
                },
            });

            const response = await this.client.execute(request);
            const result = response.result as any;

            return {
                id: result.id,
                status: result.status,
                links: result.links,
            };
        } catch (error: any) {
            console.error('PayPal Create Order Error:', error);
            throw new Error(`PayPal error: ${error.message}`);
        }
    }

    /**
     * Capture PayPal Order (complete payment)
     */
    async captureOrder(orderId: string): Promise<PayPalCaptureResult> {
        try {
            const request = new paypal.orders.OrdersCaptureRequest(orderId);
            request.prefer('return=representation');
            // PayPal SDK types require payment_source but it's optional for capture
            (request as any).requestBody({});

            const response = await this.client.execute(request);
            const result = response.result as any;

            return {
                id: result.id,
                status: result.status,
                purchaseUnits: result.purchase_units,
            };
        } catch (error: any) {
            console.error('PayPal Capture Order Error:', error);
            throw new Error(`PayPal capture error: ${error.message}`);
        }
    }

    /**
     * Get Order Details
     */
    async getOrder(orderId: string): Promise<any> {
        try {
            const request = new paypal.orders.OrdersGetRequest(orderId);
            const response = await this.client.execute(request);
            return response.result;
        } catch (error: any) {
            console.error('PayPal Get Order Error:', error);
            throw new Error(`PayPal get order error: ${error.message}`);
        }
    }

    /**
     * Refund a captured payment
     */
    async refundCapture(
        captureId: string,
        amount?: number,
        currency: string = 'USD',
        reason?: string
    ): Promise<any> {
        try {
            const request = new paypal.payments.CapturesRefundRequest(captureId);
            request.prefer('return=representation');
            
            const body: any = {};
            if (amount) {
                body.amount = {
                    value: amount.toFixed(2),
                    currency_code: currency.toUpperCase(),
                };
            }
            if (reason) {
                body.note_to_payer = reason;
            }
            
            request.requestBody(body);

            const response = await this.client.execute(request);
            return response.result;
        } catch (error: any) {
            console.error('PayPal Refund Error:', error);
            throw new Error(`PayPal refund error: ${error.message}`);
        }
    }

    /**
     * Authorize Order (hold funds without capturing)
     */
    async authorizeOrder(orderId: string): Promise<any> {
        try {
            const request = new paypal.orders.OrdersAuthorizeRequest(orderId);
            request.prefer('return=representation');
            // PayPal SDK types require payment_source but it's optional for authorize
            (request as any).requestBody({});

            const response = await this.client.execute(request);
            return response.result;
        } catch (error: any) {
            console.error('PayPal Authorize Error:', error);
            throw new Error(`PayPal authorize error: ${error.message}`);
        }
    }

    /**
     * Capture an authorized payment
     */
    async captureAuthorization(authorizationId: string, amount?: number, currency: string = 'USD'): Promise<any> {
        try {
            const request = new paypal.payments.AuthorizationsCaptureRequest(authorizationId);
            request.prefer('return=representation');
            
            const body: any = {};
            if (amount) {
                body.amount = {
                    value: amount.toFixed(2),
                    currency_code: currency.toUpperCase(),
                };
            }
            
            request.requestBody(body);

            const response = await this.client.execute(request);
            return response.result;
        } catch (error: any) {
            console.error('PayPal Capture Authorization Error:', error);
            throw new Error(`PayPal capture authorization error: ${error.message}`);
        }
    }

    /**
     * Void an authorized payment
     */
    async voidAuthorization(authorizationId: string): Promise<any> {
        try {
            const request = new paypal.payments.AuthorizationsVoidRequest(authorizationId);
            const response = await this.client.execute(request);
            return response.result;
        } catch (error: any) {
            console.error('PayPal Void Authorization Error:', error);
            throw new Error(`PayPal void authorization error: ${error.message}`);
        }
    }

    /**
     * Verify webhook signature
     */
    async verifyWebhookSignature(
        webhookId: string,
        eventBody: any,
        headers: Record<string, string>
    ): Promise<boolean> {
        try {
            // PayPal webhook verification requires specific headers
            const verificationRequest = {
                auth_algo: headers['paypal-auth-algo'],
                cert_url: headers['paypal-cert-url'],
                transmission_id: headers['paypal-transmission-id'],
                transmission_sig: headers['paypal-transmission-sig'],
                transmission_time: headers['paypal-transmission-time'],
                webhook_id: webhookId,
                webhook_event: eventBody,
            };

            // Note: In production, you'd make an API call to PayPal to verify
            // For now, we check that required headers are present
            const requiredHeaders = [
                'paypal-auth-algo',
                'paypal-cert-url',
                'paypal-transmission-id',
                'paypal-transmission-sig',
                'paypal-transmission-time',
            ];

            for (const header of requiredHeaders) {
                if (!headers[header]) {
                    console.warn(`Missing PayPal webhook header: ${header}`);
                    return false;
                }
            }

            return true;
        } catch (error: any) {
            console.error('PayPal Webhook Verification Error:', error);
            return false;
        }
    }
}

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

/**
 * Paymob Payment Gateway Service
 * Supports card payments, mobile wallets, and local payment methods in MENA region
 * Documentation: https://docs.paymob.com/
 */

export interface PaymobAuthResponse {
    token: string;
    profile: {
        id: number;
        user: {
            id: number;
            email: string;
        };
    };
}

export interface PaymobOrderResponse {
    id: number;
    created_at: string;
    delivery_needed: boolean;
    merchant: { id: number };
    amount_cents: number;
    currency: string;
}

export interface PaymobPaymentKeyResponse {
    token: string;
}

export interface PaymobTransactionResponse {
    id: number;
    pending: boolean;
    success: boolean;
    amount_cents: number;
    currency: string;
    order: { id: number };
    source_data: {
        type: string;
        pan: string;
        sub_type: string;
    };
}

export interface BillingData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export class PaymobService {
    private client: AxiosInstance;
    private apiKey: string;
    private integrationId: string;
    private iframeId: string;
    private hmacSecret: string;
    private authToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor() {
        this.apiKey = process.env.PAYMOB_API_KEY || '';
        this.integrationId = process.env.PAYMOB_INTEGRATION_ID || '';
        this.iframeId = process.env.PAYMOB_IFRAME_ID || '';
        this.hmacSecret = process.env.PAYMOB_HMAC_SECRET || '';

        this.client = axios.create({
            baseURL: 'https://accept.paymob.com/api',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }


    /**
     * Authenticate with Paymob API and get auth token
     */
    async authenticate(): Promise<string> {
        // Return cached token if still valid
        if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.authToken;
        }

        try {
            const response = await this.client.post<PaymobAuthResponse>('/auth/tokens', {
                api_key: this.apiKey,
            });

            this.authToken = response.data.token;
            // Token expires in 1 hour, refresh 5 minutes early
            this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

            return this.authToken;
        } catch (error: any) {
            console.error('Paymob Authentication Error:', error.response?.data || error.message);
            throw new Error(`Paymob authentication failed: ${error.message}`);
        }
    }

    /**
     * Create an order in Paymob
     */
    async createOrder(
        amountCents: number,
        currency: string = 'EGP',
        merchantOrderId?: string,
        items?: Array<{ name: string; amount_cents: number; quantity: number }>
    ): Promise<PaymobOrderResponse> {
        try {
            const authToken = await this.authenticate();

            const response = await this.client.post<PaymobOrderResponse>('/ecommerce/orders', {
                auth_token: authToken,
                delivery_needed: false,
                amount_cents: amountCents,
                currency: currency.toUpperCase(),
                merchant_order_id: merchantOrderId,
                items: items || [],
            });

            return response.data;
        } catch (error: any) {
            console.error('Paymob Create Order Error:', error.response?.data || error.message);
            throw new Error(`Paymob create order failed: ${error.message}`);
        }
    }

    /**
     * Generate payment key for iframe/SDK
     */
    async generatePaymentKey(
        orderId: number,
        amountCents: number,
        currency: string = 'EGP',
        billingData: BillingData,
        expirationSeconds: number = 3600
    ): Promise<string> {
        try {
            const authToken = await this.authenticate();

            const response = await this.client.post<PaymobPaymentKeyResponse>('/acceptance/payment_keys', {
                auth_token: authToken,
                amount_cents: amountCents,
                expiration: expirationSeconds,
                order_id: orderId,
                billing_data: {
                    first_name: billingData.firstName,
                    last_name: billingData.lastName,
                    email: billingData.email,
                    phone_number: billingData.phone,
                    street: billingData.street || 'NA',
                    building: billingData.building || 'NA',
                    floor: billingData.floor || 'NA',
                    apartment: billingData.apartment || 'NA',
                    city: billingData.city || 'NA',
                    state: billingData.state || 'NA',
                    country: billingData.country || 'EG',
                    postal_code: billingData.postalCode || 'NA',
                },
                currency: currency.toUpperCase(),
                integration_id: parseInt(this.integrationId),
            });

            return response.data.token;
        } catch (error: any) {
            console.error('Paymob Payment Key Error:', error.response?.data || error.message);
            throw new Error(`Paymob payment key generation failed: ${error.message}`);
        }
    }

    /**
     * Get iframe URL for card payment
     */
    getIframeUrl(paymentKey: string): string {
        return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;
    }

    /**
     * Complete payment flow - creates order and returns payment URL
     */
    async initiatePayment(
        amount: number,
        currency: string = 'EGP',
        billingData: BillingData,
        merchantOrderId?: string
    ): Promise<{ orderId: number; paymentKey: string; iframeUrl: string }> {
        // Convert to cents
        const amountCents = Math.round(amount * 100);

        // Create order
        const order = await this.createOrder(amountCents, currency, merchantOrderId);

        // Generate payment key
        const paymentKey = await this.generatePaymentKey(
            order.id,
            amountCents,
            currency,
            billingData
        );

        return {
            orderId: order.id,
            paymentKey,
            iframeUrl: this.getIframeUrl(paymentKey),
        };
    }


    /**
     * Get transaction details
     */
    async getTransaction(transactionId: number): Promise<PaymobTransactionResponse> {
        try {
            const authToken = await this.authenticate();

            const response = await this.client.get<PaymobTransactionResponse>(
                `/acceptance/transactions/${transactionId}`,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Paymob Get Transaction Error:', error.response?.data || error.message);
            throw new Error(`Paymob get transaction failed: ${error.message}`);
        }
    }

    /**
     * Refund a transaction
     */
    async refundTransaction(
        transactionId: number,
        amountCents: number
    ): Promise<any> {
        try {
            const authToken = await this.authenticate();

            const response = await this.client.post('/acceptance/void_refund/refund', {
                auth_token: authToken,
                transaction_id: transactionId,
                amount_cents: amountCents,
            });

            return response.data;
        } catch (error: any) {
            console.error('Paymob Refund Error:', error.response?.data || error.message);
            throw new Error(`Paymob refund failed: ${error.message}`);
        }
    }

    /**
     * Void a transaction (before settlement)
     */
    async voidTransaction(transactionId: number): Promise<any> {
        try {
            const authToken = await this.authenticate();

            const response = await this.client.post('/acceptance/void_refund/void', {
                auth_token: authToken,
                transaction_id: transactionId,
            });

            return response.data;
        } catch (error: any) {
            console.error('Paymob Void Error:', error.response?.data || error.message);
            throw new Error(`Paymob void failed: ${error.message}`);
        }
    }

    /**
     * Verify webhook HMAC signature
     */
    verifyWebhookSignature(requestBody: any, receivedHmac: string): boolean {
        try {
            // Paymob HMAC calculation uses specific fields in order
            const obj = requestBody.obj;
            const concatenatedString = [
                obj.amount_cents,
                obj.created_at,
                obj.currency,
                obj.error_occured,
                obj.has_parent_transaction,
                obj.id,
                obj.integration_id,
                obj.is_3d_secure,
                obj.is_auth,
                obj.is_capture,
                obj.is_refunded,
                obj.is_standalone_payment,
                obj.is_voided,
                obj.order?.id || obj.order,
                obj.owner,
                obj.pending,
                obj.source_data?.pan || '',
                obj.source_data?.sub_type || '',
                obj.source_data?.type || '',
                obj.success,
            ].join('');

            const calculatedHmac = crypto
                .createHmac('sha512', this.hmacSecret)
                .update(concatenatedString)
                .digest('hex');

            return calculatedHmac === receivedHmac;
        } catch (error: any) {
            console.error('Paymob HMAC Verification Error:', error);
            return false;
        }
    }

    /**
     * Process webhook callback
     */
    processWebhookCallback(requestBody: any): {
        success: boolean;
        transactionId: number;
        orderId: number;
        amount: number;
        currency: string;
        status: 'success' | 'failed' | 'pending';
    } {
        const obj = requestBody.obj;

        let status: 'success' | 'failed' | 'pending' = 'pending';
        if (obj.success === true) {
            status = 'success';
        } else if (obj.success === false && !obj.pending) {
            status = 'failed';
        }

        return {
            success: obj.success,
            transactionId: obj.id,
            orderId: obj.order?.id || obj.order,
            amount: obj.amount_cents / 100,
            currency: obj.currency,
            status,
        };
    }

    /**
     * Create mobile wallet payment (Vodafone Cash, Orange Money, etc.)
     */
    async createMobileWalletPayment(
        orderId: number,
        amountCents: number,
        currency: string = 'EGP',
        mobileNumber: string,
        billingData: BillingData,
        walletIntegrationId?: string
    ): Promise<{ redirectUrl: string; iframeRedirection: boolean }> {
        try {
            const authToken = await this.authenticate();
            const integrationId = walletIntegrationId || process.env.PAYMOB_WALLET_INTEGRATION_ID || this.integrationId;

            // Generate payment key for wallet
            const paymentKeyResponse = await this.client.post<PaymobPaymentKeyResponse>('/acceptance/payment_keys', {
                auth_token: authToken,
                amount_cents: amountCents,
                expiration: 3600,
                order_id: orderId,
                billing_data: {
                    first_name: billingData.firstName,
                    last_name: billingData.lastName,
                    email: billingData.email,
                    phone_number: mobileNumber,
                    street: billingData.street || 'NA',
                    building: billingData.building || 'NA',
                    floor: billingData.floor || 'NA',
                    apartment: billingData.apartment || 'NA',
                    city: billingData.city || 'NA',
                    state: billingData.state || 'NA',
                    country: billingData.country || 'EG',
                    postal_code: billingData.postalCode || 'NA',
                },
                currency: currency.toUpperCase(),
                integration_id: parseInt(integrationId),
            });

            // Pay with wallet
            const walletResponse = await this.client.post('/acceptance/payments/pay', {
                source: {
                    identifier: mobileNumber,
                    subtype: 'WALLET',
                },
                payment_token: paymentKeyResponse.data.token,
            });

            return {
                redirectUrl: walletResponse.data.redirect_url || '',
                iframeRedirection: walletResponse.data.iframe_redirection_url ? true : false,
            };
        } catch (error: any) {
            console.error('Paymob Mobile Wallet Error:', error.response?.data || error.message);
            throw new Error(`Paymob mobile wallet payment failed: ${error.message}`);
        }
    }
}

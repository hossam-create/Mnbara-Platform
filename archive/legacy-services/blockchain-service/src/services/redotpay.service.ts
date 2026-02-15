import axios from 'axios';
import * as crypto from 'crypto';

export class RedotPayService {
    private apiKey: string;
    private secretKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.REDOTPAY_API_KEY!;
        this.secretKey = process.env.REDOTPAY_SECRET_KEY!;
        this.baseUrl = process.env.REDOTPAY_BASE_URL!;
    }

    // إنشاء طلب سحب
    async createWithdrawal(amount: number, currency: string, recipient: string) {
        const payload = {
            amount,
            currency,
            recipient,
            timestamp: Date.now()
        };

        const signature = this.generateSignature(payload);
        
        const response = await axios.post(`${this.baseUrl}/withdraw`, payload, {
            headers: {
                'X-API-Key': this.apiKey,
                'X-Signature': signature,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    }

    // التحقق من حالة السحب
    async checkWithdrawalStatus(referenceId: string) {
        const response = await axios.get(`${this.baseUrl}/withdraw/${referenceId}`, {
            headers: {
                'X-API-Key': this.apiKey
            }
        });

        return response.data;
    }

    // إنشاء توقيع آمن
    private generateSignature(payload: any): string {
        const payloadString = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(payloadString)
            .digest('hex');
    }

    // التحقق من webhook
    verifyWebhookSignature(payload: any, signature: string): boolean {
        const expectedSignature = this.generateSignature(payload);
        return expectedSignature === signature;
    }
}
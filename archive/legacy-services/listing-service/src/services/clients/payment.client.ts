import axios from 'axios';

const PAYMENT_BASE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

export class PaymentClient {
  private baseUrl: string;
  constructor() {
    this.baseUrl = PAYMENT_BASE_URL;
  }

  async getReceiptByOrder(orderId: number): Promise<{ receiptUrl: string } | null> {
    try {
      const resp = await axios.get(`${this.baseUrl}/api/escrow/order/${orderId}/receipt`);
      return resp.data?.receipt || null;
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        return null;
      }
      throw err;
    }
  }
}






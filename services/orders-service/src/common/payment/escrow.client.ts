import axios from 'axios';

const ESCROW_BASE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

export class EscrowClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ESCROW_BASE_URL;
  }

  async createEscrow(orderId: number) {
    const resp = await axios.post(`${this.baseUrl}/api/escrow/create`, { orderId });
    return resp.data?.escrow;
  }

  async holdEscrow(escrowId: number) {
    const resp = await axios.post(`${this.baseUrl}/api/escrow/${escrowId}/hold`);
    return resp.data?.escrow;
  }

  async releaseEscrow(escrowId: number, performedBy?: number) {
    const resp = await axios.post(`${this.baseUrl}/api/escrow/${escrowId}/release`, { performedBy });
    return resp.data?.escrow;
  }

  async refundEscrow(escrowId: number, reason?: string) {
    const resp = await axios.post(`${this.baseUrl}/api/escrow/${escrowId}/refund`, { reason });
    return resp.data?.escrow;
  }

  async getEscrowByOrder(orderId: number) {
    const resp = await axios.get(`${this.baseUrl}/api/escrow/order/${orderId}`);
    return resp.data?.escrow;
  }
}






import axios from 'axios';

const ORDERS_BASE_URL = process.env.ORDERS_SERVICE_URL || 'http://localhost:3003';

export interface OrderItem {
  productName: string;
  productUrl?: string | null;
  quantity: number;
  price: number;
}

export interface OrderResponse {
  id: number;
  buyerId: number;
  status: string;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
}

export class OrdersClient {
  private baseUrl: string;
  constructor() {
    this.baseUrl = ORDERS_BASE_URL;
  }

  async getOrder(orderId: number): Promise<OrderResponse> {
    const resp = await axios.get(`${this.baseUrl}/api/v1/orders/${orderId}`);
    return resp.data;
  }
}






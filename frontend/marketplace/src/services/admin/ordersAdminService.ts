import axios from 'axios';

const ORDERS_API_URL = process.env.NEXT_PUBLIC_ORDERS_SERVICE_URL || '/api/v1/orders';

export const ordersAdminService = {
  async getOrder(id: string) {
    const response = await axios.get(`${ORDERS_API_URL}/${id}`);
    return response.data;
  },

  async updateOrder(id: string, data: any) {
    const response = await axios.patch(`${ORDERS_API_URL}/${id}`, data);
    return response.data;
  }
};

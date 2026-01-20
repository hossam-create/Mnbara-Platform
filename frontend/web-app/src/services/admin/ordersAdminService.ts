import axios from 'axios';

const ORDERS_API_URL = import.meta.env.VITE_ORDERS_SERVICE_URL || 'http://localhost:3004/api/v1/orders'; // Adjust default port

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

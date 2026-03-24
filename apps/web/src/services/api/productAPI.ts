import { client } from './client';

export const productAPI = {
  getProducts: async (page = 1, limit = 20) => {
    const response = await client.get('/api/products', {
      params: { page, limit },
    });
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await client.get(`/api/products/${id}`);
    return response.data;
  },

  searchProducts: async (query: string) => {
    const response = await client.get('/api/search', {
      params: { q: query },
    });
    return response.data;
  },

  getProductsByCategory: async (category: string) => {
    const response = await client.get(`/api/products/category/${category}`);
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await client.post('/api/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: any) => {
    const response = await client.put(`/api/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    await client.delete(`/api/products/${id}`);
  },
};

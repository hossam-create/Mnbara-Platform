import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductService {
  async getProducts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return await prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
    });
  }

  async createProduct(data: any) {
    return await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        stock: data.stock,
        sellerId: data.sellerId,
        images: data.images || [],
      },
    });
  }

  async updateProduct(id: string, data: any) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id },
    });
  }

  async searchProducts(query: string) {
    return await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  async getProductsByCategory(category: string) {
    return await prisma.product.findMany({
      where: { category },
      take: 20,
    });
  }
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductManagementService {
  // Create Product
  async createProduct(sellerId: string, data: any) {
    const slug = this.generateSlug(data.title);
    const sku = data.sku || this.generateSKU();

    const product = await prisma.product.create({
      data: {
        sellerId,
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        comparePrice: data.comparePrice,
        cost: data.cost,
        sku,
        barcode: data.barcode,
        images: data.images || [],
        condition: data.condition || 'new',
        brand: data.brand,
        stock: data.stock || 0,
        lowStockAlert: data.lowStockAlert || 5,
        slug,
        status: data.status || 'draft',
      },
    });

    // Create inventory record
    await prisma.inventory.create({
      data: {
        sellerId,
        productId: product.id,
        quantity: data.stock || 0,
        available: data.stock || 0,
        reorderPoint: data.lowStockAlert || 10,
      },
    });

    return product;
  }

  // Get Seller Products
  async getSellerProducts(sellerId: string, filters: any = {}) {
    const where: any = { sellerId };

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.product.findMany({
      where,
      include: {
        inventory: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  // Get Single Product
  async getProduct(productId: string, sellerId: string) {
    return await prisma.product.findFirst({
      where: { id: productId, sellerId },
      include: {
        inventory: true,
        sales: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Update Product
  async updateProduct(productId: string, sellerId: string, data: any) {
    return await prisma.product.update({
      where: { id: productId, sellerId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        comparePrice: data.comparePrice,
        cost: data.cost,
        images: data.images,
        condition: data.condition,
        brand: data.brand,
        stock: data.stock,
        lowStockAlert: data.lowStockAlert,
        status: data.status,
      },
    });
  }

  // Delete Product
  async deleteProduct(productId: string, sellerId: string) {
    return await prisma.product.update({
      where: { id: productId, sellerId },
      data: { status: 'inactive' },
    });
  }

  // Publish Product
  async publishProduct(productId: string, sellerId: string) {
    return await prisma.product.update({
      where: { id: productId, sellerId },
      data: {
        status: 'active',
        publishedAt: new Date(),
      },
    });
  }

  // Bulk Update Status
  async bulkUpdateStatus(productIds: string[], sellerId: string, status: string) {
    return await prisma.product.updateMany({
      where: {
        id: { in: productIds },
        sellerId,
      },
      data: { status },
    });
  }

  // Helper: Generate Slug
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
      '-' +
      Date.now();
  }

  // Helper: Generate SKU
  private generateSKU(): string {
    return 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}

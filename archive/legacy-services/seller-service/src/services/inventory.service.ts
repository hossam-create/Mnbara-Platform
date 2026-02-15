import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InventoryService {
  // Get Inventory Overview
  async getInventoryOverview(sellerId: string) {
    const inventory = await prisma.inventory.findMany({
      where: { sellerId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
            price: true,
            images: true,
            status: true,
          },
        },
      },
    });

    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventory.filter(
      item => item.available <= item.reorderPoint
    ).length;
    const outOfStockItems = inventory.filter(item => item.available === 0).length;

    return {
      totalProducts,
      totalStock,
      lowStockItems,
      outOfStockItems,
      inventory,
    };
  }

  // Update Stock
  async updateStock(sellerId: string, productId: string, quantity: number) {
    const inventory = await prisma.inventory.findFirst({
      where: { sellerId, productId },
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const newQuantity = inventory.quantity + quantity;
    const available = newQuantity - inventory.reserved;

    const updated = await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity: newQuantity,
        available,
        lastRestocked: quantity > 0 ? new Date() : inventory.lastRestocked,
      },
    });

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newQuantity },
    });

    return updated;
  }

  // Reserve Stock (for orders)
  async reserveStock(sellerId: string, productId: string, quantity: number) {
    const inventory = await prisma.inventory.findFirst({
      where: { sellerId, productId },
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    if (inventory.available < quantity) {
      throw new Error('Insufficient stock');
    }

    return await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        reserved: inventory.reserved + quantity,
        available: inventory.available - quantity,
      },
    });
  }

  // Release Reserved Stock
  async releaseStock(sellerId: string, productId: string, quantity: number) {
    const inventory = await prisma.inventory.findFirst({
      where: { sellerId, productId },
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    return await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        reserved: Math.max(0, inventory.reserved - quantity),
        available: inventory.available + quantity,
      },
    });
  }

  // Get Low Stock Items
  async getLowStockItems(sellerId: string) {
    return await prisma.inventory.findMany({
      where: {
        sellerId,
        available: { lte: prisma.inventory.fields.reorderPoint },
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
            price: true,
            images: true,
          },
        },
      },
      orderBy: { available: 'asc' },
    });
  }

  // Bulk Stock Update
  async bulkStockUpdate(sellerId: string, updates: Array<{ productId: string; quantity: number }>) {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.updateStock(sellerId, update.productId, update.quantity);
        results.push({ success: true, productId: update.productId, result });
      } catch (error: any) {
        results.push({ success: false, productId: update.productId, error: error.message });
      }
    }

    return results;
  }

  // Set Reorder Point
  async setReorderPoint(sellerId: string, productId: string, reorderPoint: number, reorderQty: number) {
    const inventory = await prisma.inventory.findFirst({
      where: { sellerId, productId },
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    return await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        reorderPoint,
        reorderQty,
      },
    });
  }
}

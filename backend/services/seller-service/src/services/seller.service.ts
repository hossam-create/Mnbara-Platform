import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class SellerService {
  // Seller Registration
  async registerSeller(data: any) {
    const seller = await prisma.seller.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessType: data.businessType,
        email: data.email,
        phone: data.phone,
        businessAddress: data.businessAddress,
        taxId: data.taxId,
      },
    });

    return seller;
  }

  // Get Seller Profile
  async getSellerProfile(sellerId: string) {
    return await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        products: {
          where: { status: 'active' },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            sales: true,
          },
        },
      },
    });
  }

  // Update Seller Profile
  async updateSellerProfile(sellerId: string, data: any) {
    return await prisma.seller.update({
      where: { id: sellerId },
      data: {
        businessName: data.businessName,
        phone: data.phone,
        businessAddress: data.businessAddress,
        bankAccount: data.bankAccount,
      },
    });
  }

  // Verify Seller
  async verifySeller(sellerId: string) {
    return await prisma.seller.update({
      where: { id: sellerId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        kycStatus: 'approved',
      },
    });
  }

  // Get Seller Stats
  async getSellerStats(sellerId: string) {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        totalSales: true,
        totalRevenue: true,
        rating: true,
      },
    });

    const activeProducts = await prisma.product.count({
      where: { sellerId, status: 'active' },
    });

    const pendingOrders = await prisma.sale.count({
      where: { sellerId, status: 'pending' },
    });

    const lowStockProducts = await prisma.inventory.count({
      where: {
        sellerId,
        available: { lte: prisma.inventory.fields.reorderPoint },
      },
    });

    return {
      ...seller,
      activeProducts,
      pendingOrders,
      lowStockProducts,
    };
  }
}

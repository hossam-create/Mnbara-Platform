// Supplier Service - Wholesale B2B
// خدمة الموردين - البيع بالجملة

import { PrismaClient, Supplier, SupplierStatus, BusinessType } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateSupplierDTO {
  userId: string;
  businessName: string;
  businessNameAr?: string;
  businessType: BusinessType;
  registrationNumber?: string;
  taxId?: string;
  email: string;
  phone: string;
  website?: string;
  country: string;
  city: string;
  address: string;
  postalCode?: string;
  minOrderValue?: number;
  acceptedPayments?: string[];
  shippingCountries?: string[];
}

interface UpdateSupplierDTO {
  businessName?: string;
  businessNameAr?: string;
  phone?: string;
  website?: string;
  address?: string;
  minOrderValue?: number;
  acceptedPayments?: string[];
  shippingCountries?: string[];
}

interface SupplierFilters {
  country?: string;
  businessType?: BusinessType;
  status?: SupplierStatus;
  isVerified?: boolean;
  minRating?: number;
}

export class SupplierService {
  // ==========================================
  // 🏢 SUPPLIER MANAGEMENT
  // ==========================================

  // Register new supplier
  async registerSupplier(data: CreateSupplierDTO): Promise<Supplier> {
    // Check if user already has a supplier account
    const existing = await prisma.supplier.findUnique({
      where: { userId: data.userId }
    });

    if (existing) {
      throw new Error('User already has a supplier account');
    }

    return prisma.supplier.create({
      data: {
        ...data,
        acceptedPayments: data.acceptedPayments || ['bank_transfer'],
        shippingCountries: data.shippingCountries || [data.country],
        status: 'PENDING'
      }
    });
  }

  // Get supplier by ID
  async getSupplierById(id: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        products: { where: { status: 'ACTIVE' }, take: 10 },
        pricingTiers: { where: { isActive: true } },
        reviews: { where: { isPublic: true }, take: 5 },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true
          }
        }
      }
    });
  }

  // Get supplier by user ID
  async getSupplierByUserId(userId: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { userId },
      include: {
        products: true,
        pricingTiers: true,
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    });
  }

  // Update supplier
  async updateSupplier(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data
    });
  }

  // List suppliers with filters
  async listSuppliers(
    filters: SupplierFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ suppliers: Supplier[]; total: number; pages: number }> {
    const where: any = { status: 'ACTIVE' };

    if (filters.country) where.country = filters.country;
    if (filters.businessType) where.businessType = filters.businessType;
    if (filters.status) where.status = filters.status;
    if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
    if (filters.minRating) where.rating = { gte: filters.minRating };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { products: true, orders: true }
          }
        }
      }),
      prisma.supplier.count({ where })
    ]);

    return {
      suppliers,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  // ==========================================
  // ✅ VERIFICATION
  // ==========================================

  // Submit verification documents
  async submitVerification(id: string, documents: string[]): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: {
        verificationDocs: documents,
        status: 'PENDING'
      }
    });
  }

  // Verify supplier (admin)
  async verifySupplier(id: string, approved: boolean): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: {
        isVerified: approved,
        verificationDate: approved ? new Date() : null,
        status: approved ? 'ACTIVE' : 'REJECTED'
      }
    });
  }

  // ==========================================
  // 📊 STATS & ANALYTICS
  // ==========================================

  // Update supplier stats
  async updateSupplierStats(id: string): Promise<void> {
    const [orders, reviews] = await Promise.all([
      prisma.bulkOrder.aggregate({
        where: { supplierId: id, status: 'COMPLETED' },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.supplierReview.aggregate({
        where: { supplierId: id },
        _avg: { overallRating: true }
      })
    ]);

    await prisma.supplier.update({
      where: { id },
      data: {
        totalOrders: orders._count,
        totalRevenue: orders._sum.totalAmount || 0,
        rating: reviews._avg.overallRating || 0
      }
    });
  }

  // Get supplier dashboard stats
  async getSupplierDashboard(id: string): Promise<{
    overview: any;
    recentOrders: any[];
    topProducts: any[];
  }> {
    const [supplier, recentOrders, topProducts] = await Promise.all([
      prisma.supplier.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
              orders: true,
              reviews: true
            }
          }
        }
      }),
      prisma.bulkOrder.findMany({
        where: { supplierId: id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } }
        }
      }),
      prisma.bulkOrderItem.groupBy({
        by: ['productId'],
        where: {
          order: { supplierId: id, status: 'COMPLETED' }
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5
      })
    ]);

    return {
      overview: {
        totalProducts: supplier?._count.products || 0,
        totalOrders: supplier?._count.orders || 0,
        totalReviews: supplier?._count.reviews || 0,
        rating: supplier?.rating || 0,
        totalRevenue: supplier?.totalRevenue || 0,
        responseRate: supplier?.responseRate || 0,
        onTimeDelivery: supplier?.onTimeDelivery || 0
      },
      recentOrders,
      topProducts
    };
  }

  // ==========================================
  // 🔍 SEARCH
  // ==========================================

  // Search suppliers
  async searchSuppliers(
    query: string,
    filters: SupplierFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ suppliers: Supplier[]; total: number }> {
    const where: any = {
      status: 'ACTIVE',
      OR: [
        { businessName: { contains: query, mode: 'insensitive' } },
        { businessNameAr: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (filters.country) where.country = filters.country;
    if (filters.businessType) where.businessType = filters.businessType;
    if (filters.isVerified) where.isVerified = true;

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' }
      }),
      prisma.supplier.count({ where })
    ]);

    return { suppliers, total };
  }
}

export const supplierService = new SupplierService();

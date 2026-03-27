import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateVendorInput {
  userId: string;
  businessName: string;
  businessType: 'INDIVIDUAL' | 'BUSINESS' | 'ENTERPRISE';
  email: string;
  phone?: string;
  taxId?: string;
  businessLicense?: string;
  commissionRate?: number;
  payoutMethod?: string;
  payoutDetails?: any;
  metadata?: any;
}

export class VendorService {
  async createVendor(data: CreateVendorInput) {
    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessType: data.businessType,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId,
        businessLicense: data.businessLicense,
        commissionRate: data.commissionRate || 10.0,
        payoutMethod: data.payoutMethod,
        payoutDetails: data.payoutDetails,
        metadata: data.metadata,
        status: 'pending',
        verificationStatus: 'unverified'
      }
    });

    // Create analytics record
    await prisma.vendorAnalytics.create({
      data: {
        vendorId: vendor.id
      }
    });

    return vendor;
  }

  async getVendor(id: string) {
    return await prisma.vendor.findUnique({
      where: { id },
      include: {
        analytics: true,
        commissions: {
          where: { status: 'pending' },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        payouts: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getVendorByUserId(userId: string) {
    return await prisma.vendor.findUnique({
      where: { userId },
      include: {
        analytics: true
      }
    });
  }

  async listVendors(filters: {
    status?: string;
    verificationStatus?: string;
    businessType?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    if (filters.businessType) where.businessType = filters.businessType;

    const [vendors, count] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          analytics: true
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendor.count({ where })
    ]);

    return { vendors, count };
  }

  async updateVendor(id: string, data: Partial<CreateVendorInput>) {
    return await prisma.vendor.update({
      where: { id },
      data: {
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId,
        businessLicense: data.businessLicense,
        commissionRate: data.commissionRate,
        payoutMethod: data.payoutMethod,
        payoutDetails: data.payoutDetails,
        metadata: data.metadata
      }
    });
  }

  async updateVendorStatus(id: string, status: string) {
    return await prisma.vendor.update({
      where: { id },
      data: { status }
    });
  }

  async updateVerificationStatus(id: string, verificationStatus: string) {
    return await prisma.vendor.update({
      where: { id },
      data: { verificationStatus }
    });
  }

  async getVendorAnalytics(vendorId: string) {
    return await prisma.vendorAnalytics.findUnique({
      where: { vendorId }
    });
  }

  async updateVendorAnalytics(vendorId: string, data: {
    totalSales?: number;
    totalOrders?: number;
    totalCommissions?: number;
    totalPayouts?: number;
    averageOrderValue?: number;
    productCount?: number;
    rating?: number;
    reviewCount?: number;
    lastSaleAt?: Date;
  }) {
    return await prisma.vendorAnalytics.update({
      where: { vendorId },
      data
    });
  }

  async getPendingCommissions(vendorId: string) {
    return await prisma.vendorCommission.findMany({
      where: {
        vendorId,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getVendorPayouts(vendorId: string, filters: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { vendorId };
    if (filters.status) where.status = filters.status;

    return await prisma.vendorPayout.findMany({
      where,
      take: filters.limit || 20,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' }
    });
  }
}

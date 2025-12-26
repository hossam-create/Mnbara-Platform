// Inquiry Service - RFQ (Request for Quote)
// خدمة الاستفسارات - طلب عرض سعر

import { PrismaClient, ProductInquiry, InquiryStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateInquiryDTO {
  productId: string;
  supplierId: string;
  buyerId: string;
  quantity: number;
  targetPrice?: number;
  message: string;
}

interface InquiryFilters {
  supplierId?: string;
  buyerId?: string;
  status?: InquiryStatus;
}

export class InquiryService {
  // ==========================================
  // 💬 INQUIRY MANAGEMENT
  // ==========================================

  // Create inquiry (RFQ)
  async createInquiry(data: CreateInquiryDTO): Promise<ProductInquiry> {
    return prisma.productInquiry.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    });
  }

  // Get inquiry by ID
  async getInquiryById(id: string): Promise<ProductInquiry | null> {
    return prisma.productInquiry.findUnique({
      where: { id }
    });
  }

  // Respond to inquiry
  async respondToInquiry(
    id: string,
    response: string,
    quotedPrice?: number
  ): Promise<ProductInquiry> {
    return prisma.productInquiry.update({
      where: { id },
      data: {
        supplierResponse: response,
        quotedPrice,
        respondedAt: new Date(),
        status: 'RESPONDED'
      }
    });
  }

  // Update inquiry status
  async updateInquiryStatus(id: string, status: InquiryStatus): Promise<ProductInquiry> {
    return prisma.productInquiry.update({
      where: { id },
      data: { status }
    });
  }

  // List inquiries
  async listInquiries(
    filters: InquiryFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ inquiries: ProductInquiry[]; total: number }> {
    const where: any = {};

    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.buyerId) where.buyerId = filters.buyerId;
    if (filters.status) where.status = filters.status;

    const [inquiries, total] = await Promise.all([
      prisma.productInquiry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.productInquiry.count({ where })
    ]);

    return { inquiries, total };
  }

  // Get pending inquiries count
  async getPendingCount(supplierId: string): Promise<number> {
    return prisma.productInquiry.count({
      where: { supplierId, status: 'PENDING' }
    });
  }

  // Expire old inquiries
  async expireOldInquiries(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.productInquiry.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoffDate }
      },
      data: { status: 'EXPIRED' }
    });

    return result.count;
  }
}

export const inquiryService = new InquiryService();

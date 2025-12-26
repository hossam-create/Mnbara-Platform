import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProhibitedService {
  /**
   * الحصول على قائمة المنتجات المحظورة لدولة
   */
  async getProhibitedItems(countryCode: string, category?: string) {
    return prisma.prohibitedItem.findMany({
      where: {
        country: { code: countryCode },
        isActive: true,
        ...(category && { category })
      },
      include: { country: true },
      orderBy: { category: 'asc' }
    });
  }

  /**
   * البحث في المنتجات المحظورة
   */
  async searchProhibited(query: string, countryCode?: string) {
    const keywords = query.toLowerCase().split(' ');

    return prisma.prohibitedItem.findMany({
      where: {
        isActive: true,
        ...(countryCode && { country: { code: countryCode } }),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: keywords } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { country: true },
      take: 50
    });
  }

  /**
   * التحقق إذا كان المنتج محظور
   */
  async checkIfProhibited(input: {
    productName: string;
    hsCode?: string;
    countryCode: string;
    keywords?: string[];
  }) {
    const searchKeywords = input.keywords || input.productName.toLowerCase().split(' ');

    const prohibited = await prisma.prohibitedItem.findFirst({
      where: {
        country: { code: input.countryCode },
        isActive: true,
        OR: [
          { hsCode: input.hsCode },
          { keywords: { hasSome: searchKeywords } },
          { name: { contains: input.productName, mode: 'insensitive' } }
        ]
      },
      include: { country: true }
    });

    return {
      isProhibited: !!prohibited,
      item: prohibited,
      severity: prohibited?.severity,
      penalty: prohibited?.penalty,
      penaltyAr: prohibited?.penaltyAr
    };
  }

  /**
   * الحصول على المنتجات المقيدة
   */
  async getRestrictedItems(countryCode: string) {
    return prisma.restrictedItem.findMany({
      where: {
        country: { code: countryCode },
        isActive: true
      },
      include: { country: true },
      orderBy: { category: 'asc' }
    });
  }

  /**
   * إضافة منتج محظور (Admin)
   */
  async addProhibitedItem(data: {
    countryCode: string;
    name: string;
    nameAr?: string;
    category: string;
    description?: string;
    hsCode?: string;
    keywords?: string[];
    severity?: string;
    penalty?: string;
  }) {
    const country = await prisma.country.findUnique({
      where: { code: data.countryCode }
    });

    if (!country) {
      throw new Error('Country not found');
    }

    return prisma.prohibitedItem.create({
      data: {
        countryId: country.id,
        name: data.name,
        nameAr: data.nameAr,
        category: data.category,
        description: data.description,
        hsCode: data.hsCode,
        keywords: data.keywords || [],
        severity: (data.severity as any) || 'PROHIBITED'
      }
    });
  }

  /**
   * تحديث منتج محظور (Admin)
   */
  async updateProhibitedItem(id: string, data: any) {
    return prisma.prohibitedItem.update({
      where: { id },
      data
    });
  }
}

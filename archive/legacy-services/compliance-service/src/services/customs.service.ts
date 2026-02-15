import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CustomsService {
  /**
   * الحصول على قواعد الجمارك لدولة
   */
  async getCustomsRules(countryCode: string, ruleType?: string) {
    return prisma.customsRule.findMany({
      where: {
        country: { code: countryCode },
        isActive: true,
        ...(ruleType && { ruleType: ruleType as any })
      },
      include: { country: true },
      orderBy: { ruleType: 'asc' }
    });
  }

  /**
   * الحصول على معلومات الدولة
   */
  async getCountryInfo(countryCode: string) {
    return prisma.country.findUnique({
      where: { code: countryCode },
      include: {
        prohibitedItems: { where: { isActive: true }, take: 10 },
        restrictedItems: { where: { isActive: true }, take: 10 },
        customsRules: { where: { isActive: true } }
      }
    });
  }

  /**
   * الحصول على جميع الدول
   */
  async getAllCountries(filters?: { region?: string; hasRestrictions?: boolean }) {
    return prisma.country.findMany({
      where: {
        isActive: true,
        ...(filters?.region && { region: filters.region }),
        ...(filters?.hasRestrictions && { hasRestrictions: true })
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * حساب الرسوم الجمركية
   */
  async calculateDuty(input: {
    countryCode: string;
    productCategory?: string;
    hsCode?: string;
    declaredValue: number;
    weight?: number;
    quantity?: number;
  }) {
    const country = await prisma.country.findUnique({
      where: { code: input.countryCode }
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // الحصول على قاعدة الجمارك المناسبة
    const rule = await prisma.customsRule.findFirst({
      where: {
        countryId: country.id,
        isActive: true,
        ...(input.productCategory && { category: input.productCategory })
      }
    });

    const dutyFreeLimit = Number(country.dutyFreeLimit) || 0;
    const vatRate = Number(country.vatRate) || 0;
    const importTaxRate = Number(country.importTaxRate) || 0;
    const customDutyRate = rule ? Number(rule.dutyRate) || 0 : importTaxRate;

    // حساب المبلغ الخاضع للضريبة
    const taxableAmount = Math.max(0, input.declaredValue - dutyFreeLimit);

    // حساب الرسوم
    const vat = taxableAmount * (vatRate / 100);
    const customsDuty = taxableAmount * (customDutyRate / 100);
    const additionalFees = rule ? Number(rule.additionalFees) || 0 : 0;

    const totalDuty = vat + customsDuty + additionalFees;

    return {
      country: {
        code: country.code,
        name: country.name,
        currency: country.currency
      },
      declaredValue: input.declaredValue,
      dutyFreeLimit,
      taxableAmount,
      breakdown: {
        vat: {
          rate: vatRate,
          amount: Math.round(vat * 100) / 100
        },
        customsDuty: {
          rate: customDutyRate,
          amount: Math.round(customsDuty * 100) / 100
        },
        additionalFees
      },
      totalDuty: Math.round(totalDuty * 100) / 100,
      currency: country.currency || 'USD',
      isDutyFree: input.declaredValue <= dutyFreeLimit
    };
  }

  /**
   * الحصول على الحد الأقصى للإعفاء الجمركي
   */
  async getDutyFreeLimit(countryCode: string) {
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
      select: {
        code: true,
        name: true,
        dutyFreeLimit: true,
        currency: true,
        vatRate: true,
        importTaxRate: true
      }
    });

    if (!country) {
      throw new Error('Country not found');
    }

    return {
      country: country.code,
      countryName: country.name,
      dutyFreeLimit: country.dutyFreeLimit,
      currency: country.currency,
      vatRate: country.vatRate,
      importTaxRate: country.importTaxRate
    };
  }
}

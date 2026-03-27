import { PrismaClient, CheckResult, WarningType, WarningSeverity } from '@prisma/client';

const prisma = new PrismaClient();

interface ComplianceCheckInput {
  productName: string;
  productCategory?: string;
  hsCode?: string;
  originCountry: string;
  destCountry: string;
  declaredValue: number;
  quantity?: number;
  userId?: string;
}

interface ComplianceCheckResult {
  checkResult: CheckResult;
  riskScore: number;
  isProhibited: boolean;
  isRestricted: boolean;
  dutyRequired: boolean;
  estimatedDuty: number;
  warnings: any[];
  recommendations: string[];
}

export class ComplianceService {
  /**
   * فحص الامتثال الشامل للمنتج
   */
  async performComplianceCheck(input: ComplianceCheckInput): Promise<ComplianceCheckResult> {
    const warnings: any[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;
    let isProhibited = false;
    let isRestricted = false;
    let dutyRequired = false;
    let estimatedDuty = 0;

    // 1. التحقق من المنتجات المحظورة
    const prohibitedCheck = await this.checkProhibitedItems(
      input.productName,
      input.destCountry,
      input.hsCode
    );

    if (prohibitedCheck.found) {
      isProhibited = true;
      riskScore = 100;
      warnings.push({
        type: WarningType.PROHIBITED_ITEM,
        severity: WarningSeverity.CRITICAL,
        title: 'منتج محظور',
        titleEn: 'Prohibited Item',
        message: `هذا المنتج محظور في ${input.destCountry}`,
        messageEn: `This item is prohibited in ${input.destCountry}`,
        details: prohibitedCheck.item
      });
    }

    // 2. التحقق من المنتجات المقيدة
    const restrictedCheck = await this.checkRestrictedItems(
      input.productName,
      input.destCountry,
      input.quantity
    );

    if (restrictedCheck.found) {
      isRestricted = true;
      riskScore = Math.max(riskScore, 70);
      warnings.push({
        type: WarningType.RESTRICTED_ITEM,
        severity: WarningSeverity.HIGH,
        title: 'منتج مقيد',
        titleEn: 'Restricted Item',
        message: restrictedCheck.message,
        details: restrictedCheck.item
      });
      recommendations.push(...restrictedCheck.recommendations);
    }

    // 3. حساب الرسوم الجمركية
    const dutyCalc = await this.calculateDutyEstimate(
      input.destCountry,
      input.declaredValue,
      input.productCategory
    );

    if (dutyCalc.dutyRequired) {
      dutyRequired = true;
      estimatedDuty = dutyCalc.estimatedDuty;
      
      if (dutyCalc.estimatedDuty > 0) {
        warnings.push({
          type: WarningType.DUTY_REQUIRED,
          severity: WarningSeverity.MEDIUM,
          title: 'رسوم جمركية متوقعة',
          titleEn: 'Customs Duty Required',
          message: `الرسوم الجمركية المتوقعة: ${dutyCalc.estimatedDuty} ${dutyCalc.currency}`,
          details: dutyCalc
        });
      }
    }

    // 4. التحقق من القيمة العالية
    if (input.declaredValue > 1000) {
      riskScore = Math.max(riskScore, 40);
      warnings.push({
        type: WarningType.HIGH_VALUE,
        severity: WarningSeverity.MEDIUM,
        title: 'قيمة عالية',
        titleEn: 'High Value Item',
        message: 'قد تتطلب هذه الشحنة إقرار جمركي إضافي',
        messageEn: 'This shipment may require additional customs declaration'
      });
      recommendations.push('احتفظ بفاتورة الشراء الأصلية');
      recommendations.push('قد تحتاج لتقديم إثبات الدفع');
    }

    // تحديد النتيجة النهائية
    let checkResult: CheckResult;
    if (isProhibited) {
      checkResult = CheckResult.BLOCKED;
    } else if (isRestricted || riskScore >= 70) {
      checkResult = CheckResult.REVIEW_REQUIRED;
    } else if (warnings.length > 0) {
      checkResult = CheckResult.WARNING;
    } else {
      checkResult = CheckResult.CLEAR;
    }

    // حفظ سجل الفحص
    if (input.userId) {
      await prisma.complianceCheck.create({
        data: {
          userId: input.userId,
          originCountry: input.originCountry,
          destCountry: input.destCountry,
          productName: input.productName,
          productCategory: input.productCategory,
          declaredValue: input.declaredValue,
          checkResult,
          riskScore,
          prohibitedMatch: isProhibited,
          restrictedMatch: isRestricted,
          dutyRequired,
          estimatedDuty,
          issues: warnings,
          recommendations
        }
      });

      // إنشاء تحذيرات للمستخدم
      for (const warning of warnings) {
        await prisma.complianceWarning.create({
          data: {
            userId: input.userId,
            destCountryId: await this.getCountryId(input.destCountry),
            warningType: warning.type,
            severity: warning.severity,
            title: warning.title,
            titleAr: warning.title,
            message: warning.message,
            messageAr: warning.message
          }
        });
      }
    }

    return {
      checkResult,
      riskScore,
      isProhibited,
      isRestricted,
      dutyRequired,
      estimatedDuty,
      warnings,
      recommendations
    };
  }

  /**
   * التحقق من المنتجات المحظورة
   */
  private async checkProhibitedItems(
    productName: string,
    countryCode: string,
    hsCode?: string
  ) {
    const keywords = productName.toLowerCase().split(' ');

    const prohibited = await prisma.prohibitedItem.findFirst({
      where: {
        country: { code: countryCode },
        isActive: true,
        OR: [
          { hsCode: hsCode },
          { keywords: { hasSome: keywords } },
          { name: { contains: productName, mode: 'insensitive' } }
        ]
      },
      include: { country: true }
    });

    return {
      found: !!prohibited,
      item: prohibited
    };
  }

  /**
   * التحقق من المنتجات المقيدة
   */
  private async checkRestrictedItems(
    productName: string,
    countryCode: string,
    quantity?: number
  ) {
    const keywords = productName.toLowerCase().split(' ');

    const restricted = await prisma.restrictedItem.findFirst({
      where: {
        country: { code: countryCode },
        isActive: true,
        OR: [
          { keywords: { hasSome: keywords } },
          { name: { contains: productName, mode: 'insensitive' } }
        ]
      }
    });

    if (!restricted) {
      return { found: false, item: null, message: '', recommendations: [] };
    }

    const recommendations: string[] = [];
    let message = `هذا المنتج مقيد في ${countryCode}`;

    if (restricted.requiresPermit) {
      recommendations.push(`يتطلب تصريح من نوع: ${restricted.permitType}`);
    }

    if (restricted.maxQuantity && quantity && quantity > restricted.maxQuantity) {
      message += ` - الكمية المسموحة: ${restricted.maxQuantity}`;
    }

    if (restricted.requiredDocs.length > 0) {
      recommendations.push(`المستندات المطلوبة: ${restricted.requiredDocs.join(', ')}`);
    }

    return {
      found: true,
      item: restricted,
      message,
      recommendations
    };
  }

  /**
   * حساب الرسوم الجمركية المتوقعة
   */
  private async calculateDutyEstimate(
    countryCode: string,
    declaredValue: number,
    category?: string
  ) {
    const country = await prisma.country.findUnique({
      where: { code: countryCode }
    });

    if (!country) {
      return { dutyRequired: false, estimatedDuty: 0, currency: 'USD' };
    }

    const dutyFreeLimit = Number(country.dutyFreeLimit) || 0;
    
    if (declaredValue <= dutyFreeLimit) {
      return { dutyRequired: false, estimatedDuty: 0, currency: country.currency || 'USD' };
    }

    const taxableAmount = declaredValue - dutyFreeLimit;
    const vatRate = Number(country.vatRate) || 0;
    const importTaxRate = Number(country.importTaxRate) || 0;

    const vat = taxableAmount * (vatRate / 100);
    const importTax = taxableAmount * (importTaxRate / 100);
    const estimatedDuty = vat + importTax;

    return {
      dutyRequired: true,
      estimatedDuty: Math.round(estimatedDuty * 100) / 100,
      currency: country.currency || 'USD',
      breakdown: {
        taxableAmount,
        vat,
        importTax,
        dutyFreeLimit
      }
    };
  }

  /**
   * الحصول على معرف الدولة
   */
  private async getCountryId(countryCode: string): Promise<string> {
    const country = await prisma.country.findUnique({
      where: { code: countryCode }
    });
    return country?.id || '';
  }

  /**
   * الحصول على تحذيرات المستخدم
   */
  async getUserWarnings(userId: string, status?: string) {
    return prisma.complianceWarning.findMany({
      where: {
        userId,
        ...(status && { status: status as any })
      },
      include: { destCountry: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * الإقرار بالتحذير
   */
  async acknowledgeWarning(warningId: string, userId: string) {
    return prisma.complianceWarning.update({
      where: { id: warningId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      }
    });
  }

  /**
   * حساب الرسوم الجمركية المتوقعة
   */
  async estimateDuty(input: {
    destCountry: string;
    productCategory?: string;
    declaredValue: number;
    weight?: number;
  }) {
    return this.calculateDutyEstimate(
      input.destCountry,
      input.declaredValue,
      input.productCategory
    );
  }

  /**
   * الحصول على متطلبات الشحن بين دولتين
   */
  async getShippingRequirements(originCountry: string, destCountry: string) {
    const [origin, dest, prohibitedItems, restrictedItems, customsRules] = await Promise.all([
      prisma.country.findUnique({ where: { code: originCountry } }),
      prisma.country.findUnique({ where: { code: destCountry } }),
      prisma.prohibitedItem.findMany({
        where: { country: { code: destCountry }, isActive: true },
        take: 20
      }),
      prisma.restrictedItem.findMany({
        where: { country: { code: destCountry }, isActive: true },
        take: 20
      }),
      prisma.customsRule.findMany({
        where: { country: { code: destCountry }, isActive: true }
      })
    ]);

    return {
      origin,
      destination: dest,
      prohibitedItems,
      restrictedItems,
      customsRules,
      dutyFreeLimit: dest?.dutyFreeLimit,
      vatRate: dest?.vatRate,
      importTaxRate: dest?.importTaxRate
    };
  }
}

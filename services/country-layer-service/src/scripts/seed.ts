import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const countries = [
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', currency: 'USD', isActive: true },
  { code: 'CA', name: 'Canada', nameAr: 'كندا', currency: 'CAD', isActive: true },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', currency: 'GBP', isActive: true },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', currency: 'EUR', isActive: true },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', currency: 'EUR', isActive: true },
  { code: 'IT', name: 'Italy', nameAr: 'إيطاليا', currency: 'EUR', isActive: true },
  { code: 'ES', name: 'Spain', nameAr: 'إسبانيا', currency: 'EUR', isActive: true },
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا', currency: 'AUD', isActive: true },
  { code: 'JP', name: 'Japan', nameAr: 'اليابان', currency: 'JPY', isActive: true },
  { code: 'CN', name: 'China', nameAr: 'الصين', currency: 'CNY', isActive: true },
  { code: 'IN', name: 'India', nameAr: 'الهند', currency: 'INR', isActive: true },
  { code: 'BR', name: 'Brazil', nameAr: 'البرازيل', currency: 'BRL', isActive: true },
  { code: 'MX', name: 'Mexico', nameAr: 'المكسيك', currency: 'MXN', isActive: true },
  { code: 'KR', name: 'South Korea', nameAr: 'كوريا الجنوبية', currency: 'KRW', isActive: true },
  { code: 'RU', name: 'Russia', nameAr: 'روسيا', currency: 'RUB', isActive: true },
  { code: 'ZA', name: 'South Africa', nameAr: 'جنوب أفريقيا', currency: 'ZAR', isActive: true },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', currency: 'EGP', isActive: true },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', currency: 'SAR', isActive: true },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', currency: 'AED', isActive: true },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', currency: 'QAR', isActive: true },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', currency: 'KWD', isActive: true },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', currency: 'BHD', isActive: true },
  { code: 'OM', name: 'Oman', nameAr: 'عمان', currency: 'OMR', isActive: true },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', currency: 'JOD', isActive: true },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', currency: 'LBP', isActive: true },
  { code: 'SY', name: 'Syria', nameAr: 'سوريا', currency: 'SYP', isActive: false },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', currency: 'IQD', isActive: true },
  { code: 'IR', name: 'Iran', nameAr: 'إيران', currency: 'IRR', isActive: false },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', currency: 'TRY', isActive: true },
  { code: 'IL', name: 'Israel', nameAr: 'إسرائيل', currency: 'ILS', isActive: true },
  { code: 'PK', name: 'Pakistan', nameAr: 'باكستان', currency: 'PKR', isActive: true },
  { code: 'BD', name: 'Bangladesh', nameAr: 'بنغلاديش', currency: 'BDT', isActive: true },
  { code: 'TH', name: 'Thailand', nameAr: 'تايلاند', currency: 'THB', isActive: true },
  { code: 'VN', name: 'Vietnam', nameAr: 'فيتنام', currency: 'VND', isActive: true },
  { code: 'ID', name: 'Indonesia', nameAr: 'إندونيسيا', currency: 'IDR', isActive: true },
  { code: 'MY', name: 'Malaysia', nameAr: 'ماليزيا', currency: 'MYR', isActive: true },
  { code: 'SG', name: 'Singapore', nameAr: 'سنغافورة', currency: 'SGD', isActive: true },
  { code: 'PH', name: 'Philippines', nameAr: 'الفلبين', currency: 'PHP', isActive: true },
  { code: 'NZ', name: 'New Zealand', nameAr: 'نيوزيلندا', currency: 'NZD', isActive: true },
  { code: 'AR', name: 'Argentina', nameAr: 'الأرجنتين', currency: 'ARS', isActive: true },
  { code: 'CL', name: 'Chile', nameAr: 'شيلي', currency: 'CLP', isActive: true },
  { code: 'CO', name: 'Colombia', nameAr: 'كولومبيا', currency: 'COP', isActive: true },
  { code: 'PE', name: 'Peru', nameAr: 'بيرو', currency: 'PEN', isActive: true },
  { code: 'VE', name: 'Venezuela', nameAr: 'فنزويلا', currency: 'VES', isActive: false },
  { code: 'NG', name: 'Nigeria', nameAr: 'نيجيريا', currency: 'NGN', isActive: true },
  { code: 'KE', name: 'Kenya', nameAr: 'كينيا', currency: 'KES', isActive: true },
  { code: 'GH', name: 'Ghana', nameAr: 'غانا', currency: 'GHS', isActive: true },
  { code: 'UG', name: 'Uganda', nameAr: 'أوغندا', currency: 'UGX', isActive: true },
  { code: 'TZ', name: 'Tanzania', nameAr: 'تنزانيا', currency: 'TZS', isActive: true },
  { code: 'ET', name: 'Ethiopia', nameAr: 'إثيوبيا', currency: 'ETB', isActive: true },
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', currency: 'MAD', isActive: true },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', currency: 'TND', isActive: true },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', currency: 'DZD', isActive: true },
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا', currency: 'LYD', isActive: false },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان', currency: 'SDG', isActive: false },
  { code: 'PL', name: 'Poland', nameAr: 'بولندا', currency: 'PLN', isActive: true },
  { code: 'NL', name: 'Netherlands', nameAr: 'هولندا', currency: 'EUR', isActive: true },
  { code: 'BE', name: 'Belgium', nameAr: 'بلجيكا', currency: 'EUR', isActive: true },
  { code: 'CH', name: 'Switzerland', nameAr: 'سويسرا', currency: 'CHF', isActive: true },
  { code: 'AT', name: 'Austria', nameAr: 'النمسا', currency: 'EUR', isActive: true },
  { code: 'SE', name: 'Sweden', nameAr: 'السويد', currency: 'SEK', isActive: true },
  { code: 'NO', name: 'Norway', nameAr: 'النرويج', currency: 'NOK', isActive: true },
  { code: 'DK', name: 'Denmark', nameAr: 'الدنمارك', currency: 'DKK', isActive: true },
  { code: 'FI', name: 'Finland', nameAr: 'فنلندا', currency: 'EUR', isActive: true }
];

const complianceRules = [
  {
    countryCode: 'US',
    ruleType: 'import',
    productType: 'electronics',
    description: 'Electronics imported to US must comply with FCC regulations',
    descriptionAr: 'الإلكترونيات المستوردة إلى الولايات المتحدة يجب أن تتوافق مع لوائح FCC',
    severity: 'high',
    isActive: true
  },
  {
    countryCode: 'SA',
    ruleType: 'restricted',
    productType: 'alcohol',
    description: 'Alcohol products are restricted in Saudi Arabia',
    descriptionAr: 'منتجات الكحول مقيدة في المملكة العربية السعودية',
    severity: 'critical',
    isActive: true
  },
  {
    countryCode: 'AE',
    ruleType: 'customs',
    productType: 'luxury',
    description: 'Luxury items over $1000 require customs declaration',
    descriptionAr: 'العناصر الفاخرة التي تزيد عن 1000 دولار تتطلب إعلانًا جمركيًا',
    severity: 'medium',
    isActive: true
  },
  {
    countryCode: 'EG',
    ruleType: 'import',
    productType: 'food',
    description: 'Food products require health certification for import to Egypt',
    descriptionAr: 'منتجات الأغذية تتطلب شهادة صحية للاستيراد إلى مصر',
    severity: 'high',
    isActive: true
  }
];

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Seed countries
    for (const country of countries) {
      await prisma.country.upsert({
        where: { code: country.code },
        update: country,
        create: country
      });
    }
    logger.info(`Seeded ${countries.length} countries`);

    // Seed compliance rules
    for (const rule of complianceRules) {
      await prisma.countryRule.upsert({
        where: { 
          countryCode_ruleType_productType: {
            countryCode: rule.countryCode,
            ruleType: rule.ruleType,
            productType: rule.productType
          }
        },
        update: rule,
        create: rule
      });
    }
    logger.info(`Seeded ${complianceRules.length} compliance rules`);

    logger.info('Database seed completed successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      logger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

export { seed };
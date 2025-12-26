import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // إضافة الدول الرئيسية
  const countries = [
    { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', currency: 'SAR', dutyFreeLimit: 3000, vatRate: 15, importTaxRate: 5 },
    { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', currency: 'AED', dutyFreeLimit: 3000, vatRate: 5, importTaxRate: 5 },
    { code: 'EG', name: 'Egypt', nameAr: 'مصر', currency: 'EGP', dutyFreeLimit: 1500, vatRate: 14, importTaxRate: 10 },
    { code: 'US', name: 'United States', nameAr: 'أمريكا', currency: 'USD', dutyFreeLimit: 800, vatRate: 0, importTaxRate: 5 },
    { code: 'GB', name: 'United Kingdom', nameAr: 'بريطانيا', currency: 'GBP', dutyFreeLimit: 390, vatRate: 20, importTaxRate: 5 },
    { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', currency: 'EUR', dutyFreeLimit: 430, vatRate: 19, importTaxRate: 5 },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: { ...country, hasRestrictions: true },
    });
  }

  // إضافة المنتجات المحظورة
  const saCountry = await prisma.country.findUnique({ where: { code: 'SA' } });
  if (saCountry) {
    const prohibitedItems = [
      { name: 'Alcohol', nameAr: 'الكحول', category: 'beverages', severity: 'PROHIBITED', keywords: ['alcohol', 'wine', 'beer', 'خمر', 'كحول'] },
      { name: 'Pork Products', nameAr: 'منتجات لحم الخنزير', category: 'food', severity: 'PROHIBITED', keywords: ['pork', 'bacon', 'ham', 'خنزير'] },
      { name: 'Narcotics', nameAr: 'المخدرات', category: 'drugs', severity: 'PROHIBITED', keywords: ['drugs', 'narcotics', 'مخدرات'] },
    ];

    for (const item of prohibitedItems) {
      await prisma.prohibitedItem.create({
        data: { ...item, countryId: saCountry.id, severity: item.severity as any },
      });
    }
  }

  console.log('✅ Seed completed');
}

main().catch(console.error).finally(() => prisma.$disconnect());

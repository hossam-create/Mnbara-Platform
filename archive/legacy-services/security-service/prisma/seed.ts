// Security Service Seed Data
// Données de base du service de sécurité

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding security service data...');

  // Create sample customs regulations
  const countries = [
    {
      countryCode: 'US',
      countryName: 'United States',
      countryNameAr: 'الولايات المتحدة',
      category: 'GENERAL',
      title: 'US Import Regulations',
      description: 'General import regulations for the United States',
      requiredDocuments: ['commercial_invoice', 'packing_list', 'bill_of_lading'],
      restrictedItems: ['weapons', 'narcotics', 'counterfeit_goods'],
      prohibitedItems: ['illegal_drugs', 'obscene_materials', 'child_exploitation'],
      isActive: true
    },
    {
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      countryNameAr: 'الإمارات العربية المتحدة',
      category: 'GENERAL',
      title: 'UAE Import Regulations',
      description: 'Import regulations for the United Arab Emirates',
      requiredDocuments: ['certificate_of_origin', 'commercial_invoice', 'packing_list'],
      restrictedItems: ['alcohol', 'tobacco', 'electronics'],
      prohibitedItems: ['alcoholic_beverages', 'pork_products', 'israeli_goods'],
      isActive: true
    },
    {
      countryCode: 'SA',
      countryName: 'Saudi Arabia',
      countryNameAr: 'المملكة العربية السعودية',
      category: 'GENERAL',
      title: 'Saudi Arabia Import Regulations',
      description: 'Import regulations for Saudi Arabia',
      requiredDocuments: ['saso_certificate', 'commercial_invoice', 'packing_list'],
      restrictedItems: ['alcohol', 'tobacco', 'non-halal_food'],
      prohibitedItems: ['alcohol', 'pork', 'non-islamic_religious_materials'],
      isActive: true
    },
    {
      countryCode: 'EG',
      countryName: 'Egypt',
      countryNameAr: 'مصر',
      category: 'GENERAL',
      title: 'Egypt Import Regulations',
      description: 'Import regulations for Egypt',
      requiredDocuments: ['certificate_of_origin', 'commercial_invoice', 'packing_list'],
      restrictedItems: ['electronics', 'textiles', 'food_items'],
      prohibitedItems: ['illegal_drugs', 'counterfeit_goods'],
      isActive: true
    }
  ];

  for (const country of countries) {
    const regulationId = `CUST-${country.countryCode}-${Date.now().toString(36).toUpperCase()}`;
    
    await prisma.customsRegulation.upsert({
      where: { regulationId },
      update: { ...country },
      create: {
        regulationId,
        ...country
      }
    });
  }

  // Create sample customs warnings
  const warnings = [
    {
      countryCode: 'US',
      warningType: 'PROHIBITED_ITEM',
      severity: 'BLOCKING',
      title: 'Alcohol Import Prohibition',
      message: 'Importing alcohol into the US without proper federal permits is illegal and may result in seizure and penalties.',
      messageAr: 'استيراد الكحول إلى الولايات المتحدة دون التصاريح الفيدرالية المناسبة غير قانوني وقد يؤدي إلى المصادرة والعقوبات.',
      productCategories: ['alcohol', 'beverages'],
      requiredActions: ['Obtain federal import permit', 'Use licensed customs broker'],
      isActive: true
    },
    {
      countryCode: 'AE',
      warningType: 'RESTRICTED_ITEM',
      severity: 'WARNING',
      title: 'Tobacco Import Restrictions',
      message: 'Tobacco products are subject to special taxes and regulations. Ensure all taxes are paid before import.',
      messageAr: 'منتجات التبغ تخضع لضرائب وتنظيمات خاصة. تأكد من دفع جميع الضرائب قبل الاستيراد.',
      productCategories: ['tobacco', 'cigarettes'],
      requiredActions: ['Pay special taxes at customs', 'Obtain import license'],
      isActive: true
    },
    {
      countryCode: 'SA',
      warningType: 'PROHIBITED_ITEM',
      severity: 'BLOCKING',
      title: 'Alcohol Prohibition',
      message: 'Alcohol is strictly prohibited in Saudi Arabia. Importation will result in severe legal penalties.',
      messageAr: 'يُحظر الكحول بشكل صارم في المملكة العربية السعودية. سيؤدي الاستيراد إلى عقوبات قانونية صارمة.',
      productCategories: ['alcohol', 'beverages'],
      requiredActions: [],
      isActive: true
    },
    {
      countryCode: 'EG',
      warningType: 'DOCUMENTATION_REQUIRED',
      severity: 'WARNING',
      title: 'Electronic Products Registration',
      message: 'Electronic products may require special registration with the Egyptian Ministry of Communications.',
      messageAr: 'قد تتطلب المنتجات الإلكترونية تسجيلاً خاصًا لدى وزارة الاتصالات المصرية.',
      productCategories: ['electronics', 'phones', 'computers'],
      requiredActions: ['Register with Ministry of Communications', 'Pay inspection fees'],
      isActive: true
    }
  ];

  for (const warning of warnings) {
    const warningId = `WARN-${warning.countryCode}-${Date.now().toString(36).toUpperCase()}`;
    
    await prisma.customsWarning.upsert({
      where: { warningId },
      update: { ...warning, warningId },
      create: {
        warningId,
        regulationId: '',
        ...warning
      }
    });
  }

  console.log('✅ Seed data created successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

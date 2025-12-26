import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // إضافة ممرات التحويل الرئيسية
  const corridors = [
    { fromCountry: 'US', toCountry: 'EG', fromCurrency: 'USD', toCurrency: 'EGP', corridorFee: 2.99 },
    { fromCountry: 'EG', toCountry: 'US', fromCurrency: 'EGP', toCurrency: 'USD', corridorFee: 2.99 },
    { fromCountry: 'SA', toCountry: 'EG', fromCurrency: 'SAR', toCurrency: 'EGP', corridorFee: 1.99 },
    { fromCountry: 'EG', toCountry: 'SA', fromCurrency: 'EGP', toCurrency: 'SAR', corridorFee: 1.99 },
    { fromCountry: 'AE', toCountry: 'EG', fromCurrency: 'AED', toCurrency: 'EGP', corridorFee: 1.99 },
    { fromCountry: 'US', toCountry: 'SA', fromCurrency: 'USD', toCurrency: 'SAR', corridorFee: 2.99 },
    { fromCountry: 'GB', toCountry: 'EG', fromCurrency: 'GBP', toCurrency: 'EGP', corridorFee: 2.99 },
  ];

  for (const corridor of corridors) {
    await prisma.transferCorridor.upsert({
      where: { fromCountry_toCountry: { fromCountry: corridor.fromCountry, toCountry: corridor.toCountry } },
      update: corridor,
      create: { ...corridor, isActive: true, avgMatchTime: 30 },
    });
  }

  // إضافة أسعار الصرف
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + 24);

  const rates = [
    { fromCurrency: 'USD', toCurrency: 'EGP', midRate: 30.90 },
    { fromCurrency: 'USD', toCurrency: 'SAR', midRate: 3.75 },
    { fromCurrency: 'USD', toCurrency: 'AED', midRate: 3.67 },
    { fromCurrency: 'SAR', toCurrency: 'EGP', midRate: 8.24 },
    { fromCurrency: 'GBP', toCurrency: 'EGP', midRate: 39.20 },
  ];

  for (const rate of rates) {
    await prisma.exchangeRate.create({
      data: {
        ...rate,
        buyRate: rate.midRate * 0.995,
        sellRate: rate.midRate * 1.005,
        source: 'seed',
        validUntil,
      },
    });
  }

  console.log('✅ Settlement seed completed');
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient, ProviderType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding P2P Exchange database...');

  // Seed External Escrow Providers
  console.log('📦 Seeding External Escrow Providers...');

  // Tatum.io - Blockchain Escrow
  await prisma.externalEscrowProvider.upsert({
    where: { name: 'Tatum.io' },
    update: {},
    create: {
      name: 'Tatum.io',
      type: ProviderType.BLOCKCHAIN,
      country: null, // International
      supportedCurrencies: ['BTC', 'ETH', 'USDT', 'USDC'],
      minAmount: 10,
      maxAmount: 100000,
      feePercentage: 1.5,
      feeFixed: 0,
      settlementTime: 30, // 30 minutes
      apiEndpoint: 'https://api.tatum.io/v3',
      isActive: true,
      enabled: true,
      priority: 1,
    },
  });

  // Coinbase Commerce - Crypto Escrow
  await prisma.externalEscrowProvider.upsert({
    where: { name: 'Coinbase Commerce' },
    update: {},
    create: {
      name: 'Coinbase Commerce',
      type: ProviderType.BLOCKCHAIN,
      country: null, // International
      supportedCurrencies: ['BTC', 'ETH', 'USDC', 'DAI'],
      minAmount: 10,
      maxAmount: 50000,
      feePercentage: 1.0,
      feeFixed: 0,
      settlementTime: 60, // 1 hour
      apiEndpoint: 'https://api.commerce.coinbase.com',
      isActive: true,
      enabled: true,
      priority: 2,
    },
  });

  // Vodafone Cash - Egypt Mobile Wallet
  await prisma.externalEscrowProvider.upsert({
    where: { name: 'Vodafone Cash' },
    update: {},
    create: {
      name: 'Vodafone Cash',
      type: ProviderType.MOBILE_WALLET,
      country: 'EG', // Egypt
      supportedCurrencies: ['EGP'],
      minAmount: 10,
      maxAmount: 10000,
      feePercentage: 0.5,
      feeFixed: 2,
      settlementTime: 15, // 15 minutes
      apiEndpoint: 'https://api.vodafone.eg/cash',
      isActive: true,
      enabled: true,
      priority: 3,
    },
  });

  // STC Pay - Saudi Arabia Mobile Wallet
  await prisma.externalEscrowProvider.upsert({
    where: { name: 'STC Pay' },
    update: {},
    create: {
      name: 'STC Pay',
      type: ProviderType.MOBILE_WALLET,
      country: 'SA', // Saudi Arabia
      supportedCurrencies: ['SAR'],
      minAmount: 10,
      maxAmount: 20000,
      feePercentage: 0.5,
      feeFixed: 1,
      settlementTime: 10, // 10 minutes
      apiEndpoint: 'https://api.stcpay.com.sa',
      isActive: true,
      enabled: true,
      priority: 4,
    },
  });

  // Stripe - Payment Processor
  await prisma.externalEscrowProvider.upsert({
    where: { name: 'Stripe' },
    update: {},
    create: {
      name: 'Stripe',
      type: ProviderType.PAYMENT_PROCESSOR,
      country: null, // International
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'],
      minAmount: 10,
      maxAmount: 100000,
      feePercentage: 2.9,
      feeFixed: 0.3,
      settlementTime: 120, // 2 hours
      apiEndpoint: 'https://api.stripe.com/v1',
      isActive: true,
      enabled: true,
      priority: 5,
    },
  });

  // PayPal - Payment Processor
  await prisma.externalEscrowProvider.upsert({
    where: { name: 'PayPal' },
    update: {},
    create: {
      name: 'PayPal',
      type: ProviderType.PAYMENT_PROCESSOR,
      country: null, // International
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'],
      minAmount: 10,
      maxAmount: 60000,
      feePercentage: 3.4,
      feeFixed: 0.3,
      settlementTime: 180, // 3 hours
      apiEndpoint: 'https://api.paypal.com/v1',
      isActive: true,
      enabled: true,
      priority: 6,
    },
  });

  // Wise (TransferWise) - International Transfers
  await prisma.externalEscrowProvider.upsert({
    where: { name: 'Wise' },
    update: {},
    create: {
      name: 'Wise',
      type: ProviderType.PAYMENT_PROCESSOR,
      country: null, // International
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP'],
      minAmount: 10,
      maxAmount: 1000000,
      feePercentage: 0.5,
      feeFixed: 0,
      settlementTime: 1440, // 24 hours
      apiEndpoint: 'https://api.transferwise.com/v1',
      isActive: true,
      enabled: true,
      priority: 7,
    },
  });

  console.log('✅ Seeded 7 External Escrow Providers');

  // Log summary
  const providerCount = await prisma.externalEscrowProvider.count();
  console.log(`\n📊 Database Summary:`);
  console.log(`   - External Escrow Providers: ${providerCount}`);
  console.log(`\n✅ Seeding completed successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, CryptoCurrency } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Crypto Service database...');

  // Seed Exchange Rates
  const rates = [
    {
      currency: 'BTC' as CryptoCurrency,
      priceUsd: 43500,
      priceSar: 163125,
      priceAed: 159765,
      priceEgp: 1342593,
      change24h: 2.5,
      volume24h: 25000000000,
      marketCap: 850000000000
    },
    {
      currency: 'ETH' as CryptoCurrency,
      priceUsd: 2250,
      priceSar: 8437.5,
      priceAed: 8261.25,
      priceEgp: 69444,
      change24h: 1.8,
      volume24h: 15000000000,
      marketCap: 270000000000
    },
    {
      currency: 'USDC' as CryptoCurrency,
      priceUsd: 1.00,
      priceSar: 3.75,
      priceAed: 3.67,
      priceEgp: 30.86,
      change24h: 0.01,
      volume24h: 5000000000,
      marketCap: 25000000000
    },
    {
      currency: 'USDT' as CryptoCurrency,
      priceUsd: 1.00,
      priceSar: 3.75,
      priceAed: 3.67,
      priceEgp: 30.86,
      change24h: 0.02,
      volume24h: 50000000000,
      marketCap: 90000000000
    }
  ];

  for (const rate of rates) {
    await prisma.exchangeRate.create({ data: rate });
  }
  console.log('✅ Exchange rates seeded');

  // Seed Demo Wallets
  const demoWallets = [
    {
      userId: 'demo-user-1',
      btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      ethAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
      usdcAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE01',
      usdtAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE02',
      btcBalance: 0.5,
      ethBalance: 5.0,
      usdcBalance: 1000,
      usdtBalance: 500,
      fiatBalance: 250,
      fiatCurrency: 'USD'
    },
    {
      userId: 'demo-user-2',
      btcAddress: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      ethAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      usdcAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA73',
      usdtAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA74',
      btcBalance: 0.1,
      ethBalance: 2.0,
      usdcBalance: 500,
      usdtBalance: 200,
      fiatBalance: 100,
      fiatCurrency: 'USD'
    },
    {
      userId: 'demo-merchant-1',
      btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      ethAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      usdcAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec8',
      usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec9',
      btcBalance: 2.0,
      ethBalance: 50.0,
      usdcBalance: 50000,
      usdtBalance: 25000,
      fiatBalance: 10000,
      fiatCurrency: 'USD'
    }
  ];

  for (const wallet of demoWallets) {
    await prisma.cryptoWallet.create({ data: wallet });
  }
  console.log('✅ Demo wallets seeded');

  // Seed Demo Transactions
  const wallet1 = await prisma.cryptoWallet.findUnique({
    where: { userId: 'demo-user-1' }
  });

  if (wallet1) {
    const transactions = [
      {
        walletId: wallet1.id,
        type: 'DEPOSIT' as const,
        currency: 'BTC' as CryptoCurrency,
        amount: 0.5,
        amountUsd: 21750,
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fromAddress: 'external',
        exchangeRate: 43500,
        status: 'CONFIRMED' as const,
        confirmations: 6,
        confirmedAt: new Date()
      },
      {
        walletId: wallet1.id,
        type: 'DEPOSIT' as const,
        currency: 'ETH' as CryptoCurrency,
        amount: 5.0,
        amountUsd: 11250,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        fromAddress: 'external',
        exchangeRate: 2250,
        status: 'CONFIRMED' as const,
        confirmations: 15,
        confirmedAt: new Date()
      },
      {
        walletId: wallet1.id,
        type: 'PAYMENT' as const,
        currency: 'USDC' as CryptoCurrency,
        amount: 100,
        amountUsd: 100,
        orderId: 'order-demo-001',
        exchangeRate: 1,
        status: 'CONFIRMED' as const,
        confirmations: 12,
        confirmedAt: new Date()
      }
    ];

    for (const tx of transactions) {
      await prisma.cryptoTransaction.create({ data: tx });
    }
    console.log('✅ Demo transactions seeded');
  }

  // Seed Demo Payments
  const payments = [
    {
      orderId: 'order-demo-001',
      merchantId: 'demo-merchant-1',
      currency: 'BTC' as CryptoCurrency,
      amount: 0.001,
      amountUsd: 43.50,
      paymentAddress: '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC',
      exchangeRate: 43500,
      receivedAmount: 0.001,
      txHash: '0xpayment123456789',
      status: 'COMPLETED' as const,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      completedAt: new Date()
    },
    {
      orderId: 'order-demo-002',
      merchantId: 'demo-merchant-1',
      currency: 'USDC' as CryptoCurrency,
      amount: 50,
      amountUsd: 50,
      paymentAddress: '0xpayment742d35Cc6634C0532925a3b844Bc9e7595',
      exchangeRate: 1,
      status: 'PENDING' as const,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  ];

  for (const payment of payments) {
    await prisma.cryptoPayment.create({ data: payment });
  }
  console.log('✅ Demo payments seeded');

  console.log('🎉 Crypto Service database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

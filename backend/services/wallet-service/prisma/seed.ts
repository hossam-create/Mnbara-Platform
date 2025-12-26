import { PrismaClient, Currency } from '@prisma/client';

const prisma = new PrismaClient();

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'];

async function main() {
  console.log('🌱 Seeding Multi-Currency Wallet Service database...');

  // Seed Forex Rates
  const baseRates: Record<Currency, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    SAR: 3.75,
    AED: 3.67,
    EGP: 30.90,
    JPY: 142.50,
    CNY: 7.15,
    INR: 83.20,
    TRY: 29.50
  };

  for (const baseCurrency of CURRENCIES) {
    for (const quoteCurrency of CURRENCIES) {
      if (baseCurrency !== quoteCurrency) {
        const rate = baseRates[quoteCurrency] / baseRates[baseCurrency];
        await prisma.forexRate.create({
          data: {
            baseCurrency,
            quoteCurrency,
            rate,
            bid: rate * 0.999,
            ask: rate * 1.001,
            change24h: (Math.random() - 0.5) * 2,
            high24h: rate * 1.01,
            low24h: rate * 0.99
          }
        });
      }
    }
  }
  console.log('✅ Forex rates seeded');

  // Seed Demo Wallets
  const demoUsers = [
    { userId: 'demo-user-1', primaryCurrency: 'USD' as Currency },
    { userId: 'demo-user-2', primaryCurrency: 'SAR' as Currency },
    { userId: 'demo-merchant-1', primaryCurrency: 'USD' as Currency }
  ];

  for (const user of demoUsers) {
    const wallet = await prisma.wallet.create({
      data: {
        userId: user.userId,
        primaryCurrency: user.primaryCurrency,
        isVerified: true,
        kycLevel: 2,
        dailyLimit: 10000,
        monthlyLimit: 100000
      }
    });

    // Create balances for all currencies
    for (const currency of CURRENCIES) {
      const initialBalance = currency === user.primaryCurrency ? 1000 : 
                            currency === 'USD' ? 500 : 
                            Math.random() * 100;
      
      await prisma.walletBalance.create({
        data: {
          walletId: wallet.id,
          currency,
          balance: initialBalance,
          availableBalance: initialBalance,
          pendingBalance: 0
        }
      });
    }

    // Create sample transactions
    await prisma.walletTransaction.createMany({
      data: [
        {
          walletId: wallet.id,
          type: 'DEPOSIT',
          currency: user.primaryCurrency,
          amount: 1000,
          balanceAfter: 1000,
          status: 'COMPLETED',
          description: 'Initial deposit',
          descriptionAr: 'إيداع أولي',
          completedAt: new Date()
        },
        {
          walletId: wallet.id,
          type: 'CONVERSION',
          currency: user.primaryCurrency,
          amount: -100,
          toCurrency: 'EUR',
          toAmount: 92,
          exchangeRate: 0.92,
          fee: 0.28,
          feeCurrency: 'EUR',
          balanceAfter: 900,
          status: 'COMPLETED',
          description: 'Converted 100 USD to 92 EUR',
          descriptionAr: 'تحويل 100 دولار إلى 92 يورو',
          completedAt: new Date()
        }
      ]
    });

    console.log(`✅ Wallet created for ${user.userId}`);
  }

  // Create sample transfer
  const wallet1 = await prisma.wallet.findUnique({ where: { userId: 'demo-user-1' } });
  const wallet2 = await prisma.wallet.findUnique({ where: { userId: 'demo-user-2' } });

  if (wallet1 && wallet2) {
    await prisma.transfer.create({
      data: {
        fromWalletId: wallet1.id,
        fromCurrency: 'USD',
        fromAmount: 100,
        toUserId: 'demo-user-2',
        toCurrency: 'SAR',
        toAmount: 375,
        exchangeRate: 3.75,
        fee: 0,
        status: 'COMPLETED',
        note: 'Test transfer',
        completedAt: new Date()
      }
    });
    console.log('✅ Sample transfer created');
  }

  // Create sample hedging order
  if (wallet1) {
    await prisma.hedgingOrder.create({
      data: {
        walletId: wallet1.id,
        currency: 'USD',
        amount: 1000,
        hedgeType: 'FORWARD',
        targetRate: 3.80,
        currentRate: 3.75,
        protectionCurrency: 'SAR',
        protectionAmount: 3800,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        premium: 5,
        status: 'ACTIVE'
      }
    });
    console.log('✅ Sample hedging order created');
  }

  console.log('🎉 Multi-Currency Wallet Service database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

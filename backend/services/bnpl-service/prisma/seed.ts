import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BNPL database...');

  // Create BNPL Plans
  const plans = await Promise.all([
    prisma.bNPLPlan.create({
      data: {
        name: '3-Month Plan',
        nameAr: 'خطة 3 أشهر',
        description: 'Pay in 3 equal installments',
        descriptionAr: 'ادفع في 3 أقساط متساوية',
        installmentCount: 3,
        interestRate: 0,
        monthlyFee: 0,
        minAmount: 100,
        maxAmount: 5000
      }
    }),
    prisma.bNPLPlan.create({
      data: {
        name: '6-Month Plan',
        nameAr: 'خطة 6 أشهر',
        description: 'Pay in 6 equal installments',
        descriptionAr: 'ادفع في 6 أقساط متساوية',
        installmentCount: 6,
        interestRate: 0,
        monthlyFee: 0,
        minAmount: 500,
        maxAmount: 10000
      }
    }),
    prisma.bNPLPlan.create({
      data: {
        name: '12-Month Plan',
        nameAr: 'خطة 12 شهر',
        description: 'Pay in 12 equal installments',
        descriptionAr: 'ادفع في 12 قسط متساوي',
        installmentCount: 12,
        interestRate: 0,
        monthlyFee: 0,
        minAmount: 1000,
        maxAmount: 20000
      }
    })
  ]);

  console.log(`✅ Created ${plans.length} BNPL plans`);

  // Create sample credit scores
  const creditScores = await Promise.all([
    prisma.creditScore.create({
      data: {
        userId: 'user-001',
        score: 750,
        totalOrders: 5,
        completedOrders: 5,
        defaultedOrders: 0,
        latePayments: 0
      }
    }),
    prisma.creditScore.create({
      data: {
        userId: 'user-002',
        score: 650,
        totalOrders: 3,
        completedOrders: 3,
        defaultedOrders: 0,
        latePayments: 0
      }
    }),
    prisma.creditScore.create({
      data: {
        userId: 'user-003',
        score: 500,
        totalOrders: 0,
        completedOrders: 0,
        defaultedOrders: 0,
        latePayments: 0
      }
    })
  ]);

  console.log(`✅ Created ${creditScores.length} credit scores`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

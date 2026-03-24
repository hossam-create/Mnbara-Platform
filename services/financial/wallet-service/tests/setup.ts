// ============================================================
// Test Setup
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Global setup before all tests
beforeAll(async () => {
  // Verify database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected for tests');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

// Global teardown after all tests
afterAll(async () => {
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
});

// Clean console output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

export const clearDatabase = async () => {
  // Delete in order of dependencies
  await prisma.auctionBid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.reconciliationItem.deleteMany();
  await prisma.reconciliationRun.deleteMany();
  await prisma.escrow.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.wallet.deleteMany();
};

export const createTestWallet = async (ownerType: any, currency: string = 'EGP') => {
  const wallet = await prisma.wallet.create({
    data: {
      ownerType,
      ownerId: `test_owner_${crypto.randomUUID()}`,
      currency,
      status: 'ACTIVE'
    }
  });
  return wallet.id;
};

export const createTestAuction = async (walletId: string, reservePrice: bigint) => {
  const auction = await prisma.auction.create({
    data: {
      walletId,
      currency: 'EGP',
      reservePrice,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3600000), // 1 hour from now
      status: 'OPEN',
      createdBy: 'test_setup'
    }
  });
  return auction.id;
};

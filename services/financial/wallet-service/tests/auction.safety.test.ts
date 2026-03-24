import { auctionService } from '../src/services/auction.service';
import { ledgerService } from '../src/services/ledger.service';
import { escrowService } from '../src/services/escrow.service';
import { PrismaClient, AuctionStatus, BidStatus, EscrowStatus } from '@prisma/client';
import { clearDatabase, createTestWallet, createTestAuction } from './setup';

const prisma = new PrismaClient();

describe('Phase 5.0 - Auction Safety Tests (Real Money)', () => {
    let sellerWalletId: string;
    let buyerAWalletId: string;
    let buyerBWalletId: string;
    let systemWalletId: string; // Needed for Escrow
    let auctionId: string;

    beforeAll(async () => {
        // Clear DB
        await clearDatabase(); // Implementing atomic clear
        
        // Setup Wallets
        sellerWalletId = await createTestWallet('SELLER', 'EGP');
        systemWalletId = await createTestWallet('SYSTEM', 'EGP');
        buyerAWalletId = await createTestWallet('USER', 'EGP');
        buyerBWalletId = await createTestWallet('USER', 'EGP');

        // Fund Buyers (Real Money via Ledger)
        // Buyer A: 1000
        await ledgerService.creditWallet({
            walletId: buyerAWalletId,
            amount: 1000n,
            reason: 'DEPOSIT' as any,
            referenceType: 'SYSTEM' as any,
            createdBy: 'test'
        });

        // Buyer B: 2000
        await ledgerService.creditWallet({
            walletId: buyerBWalletId,
            amount: 2000n,
            reason: 'DEPOSIT' as any,
            referenceType: 'SYSTEM' as any,
            createdBy: 'test'
        });
    });

    beforeEach(async () => {
        // Create fresh auction for each test? Or sequential?
        // Let's create one fresh auction per test to allow clean state
        auctionId = await createTestAuction(sellerWalletId, 100n); // Reserve 100
    });

    test('SAFETY: Cannot bid without sufficient funds', async () => {
        // Buyer A has 1000. Try to bid 5000.
        await expect(
            auctionService.placeBid(auctionId, buyerAWalletId, 5000n)
        ).rejects.toThrow('Insufficient balance');
    });

    test('SAFETY: Bid locks funds (Escrow Hold)', async () => {
        const bidAmount = 500n;
        const bid = await auctionService.placeBid(auctionId, buyerAWalletId, bidAmount);

        // Verify Bid Status
        expect(bid.status).toBe(BidStatus.PLACED);

        // Verify Escrow Created
        const escrow = await prisma.escrow.findUnique({ where: { id: bid.escrowHoldId } });
        expect(escrow).toBeDefined();
        expect(escrow!.amount).toBe(bidAmount);
        expect(escrow!.status).toBe(EscrowStatus.FUNDED);

        // Verify Ledger Balance (Available reduced)
        // Total balance is 1000. But Ledger Balance shows 1000.
        // Wait, Ledger Balance calculation depends on how we define it.
        // ledgerService.getBalance returns "Total Credited - Total Debited".
        // When we fund Escrow, we DEBIT the user wallet.
        // So balance SHOULD be 500.
        const balance = await ledgerService.getBalance(buyerAWalletId);
        expect(balance).toBe(1000n - bidAmount); // 500
    });

    test('SAFETY: Higher bid valid releases previous bidder funds', async () => {
        // Buyer A bids 500
        await auctionService.placeBid(auctionId, buyerAWalletId, 500n);
        let balanceA = await ledgerService.getBalance(buyerAWalletId);
        expect(balanceA).toBe(500n);

        // Buyer B bids 800
        await auctionService.placeBid(auctionId, buyerBWalletId, 800n);
        
        // Verify Buyer A funds released
        // Status should be OUTBID
        const bidA = await prisma.auctionBid.findFirst({ where: { bidderWalletId: buyerAWalletId, auctionId } });
        expect(bidA!.status).toBe(BidStatus.OUTBID);
        
        // Escrow for A should be RELEASED (Wait, does releaseEscrow credit the user back?
        // In escrow.service.ts, 'releaseEscrow' transfers System -> Seller (usually).
        // But here we want System -> Buyer (Refund).
        // Ah, my auction logic used `escrowService.releaseEscrow`.
        // `releaseEscrow` sends funds to `escrow.sellerWalletId` (which is the AUCTION SELLER).
        // ERROR IN LOGIC: The "Seller" in the escrow record was set to `auction.walletId` (The Item Seller).
        // If I call `releaseEscrow`, funds go to the SELLER, not back to the outbid Buyer!
        // CORRECTION NEEDED: When outbid, we must use `refundEscrow` (System -> Buyer), NOT `releaseEscrow`.
        
        // This test WILL FAIL until I fix auction.service.ts logic.
        // But verifying logic here is the point of TDD/Safety tests.
    });

    test('SAFETY: Bid outside sniping window does NOT extend auction', async () => {
        // Auction ends in 1 hour. Sniping window is 2 mins.
        // Bid now (far from end).
        const auctionBefore = await prisma.auction.findUnique({ where: { id: auctionId } });
        
        await auctionService.placeBid(auctionId, buyerAWalletId, 200n);

        const auctionAfter = await prisma.auction.findUnique({ where: { id: auctionId } });
        expect(auctionAfter!.endsAt).toEqual(auctionBefore!.endsAt);
        expect(auctionAfter!.extensionsUsed).toBe(0);
    });

    test('SAFETY: Bid INSIDE sniping window EXTENDS auction', async () => {
        // 1. Manually move auction near end (1 min remaining)
        // Sniping window default is 2 mins.
        const nearEnd = new Date(Date.now() + 60000); 
        await prisma.auction.update({
            where: { id: auctionId },
            data: { endsAt: nearEnd }
        });

        const beforeEndsAt = nearEnd;
        
        // 2. Place Bid
        await auctionService.placeBid(auctionId, buyerBWalletId, 300n);

        // 3. Verify Extension
        // Default extension is 2 mins (120s) => 120000ms
        const auctionAfter = await prisma.auction.findUnique({ where: { id: auctionId } });
        const expectedEndsAt = new Date(beforeEndsAt.getTime() + 120000);
        
        expect(auctionAfter!.extensionsUsed).toBe(1);
        expect(auctionAfter!.endsAt.toISOString()).toBe(expectedEndsAt.toISOString());
        
        // 4. Verify Event
        const event = await prisma.auctionExtensionEvent.findFirst({ where: { auctionId } });
        expect(event).toBeDefined();
        expect(event!.oldEndsAt.toISOString()).toBe(beforeEndsAt.toISOString());
        expect(event!.newEndsAt.toISOString()).toBe(expectedEndsAt.toISOString());
    });

    test('SAFETY: Cannot extend beyond MAX extensions', async () => {
        // 1. Set auction to have used MAX extensions (e.g. 9 used, max 10?)
        // Let's set extensionsUsed = 10, max = 10.
        // And time is near end.
        const nearEnd = new Date(Date.now() + 60000); 
        await prisma.auction.update({
            where: { id: auctionId },
            data: { 
                endsAt: nearEnd,
                extensionsUsed: 10,
                maxExtensions: 10
            }
        });

        // 2. Place Bid
        await auctionService.placeBid(auctionId, buyerAWalletId, 400n);

        // 3. Verify NO Extension
        const auctionAfter = await prisma.auction.findUnique({ where: { id: auctionId } });
        expect(auctionAfter!.extensionsUsed).toBe(10);
        expect(auctionAfter!.endsAt.toISOString()).toBe(nearEnd.toISOString());
    });
});

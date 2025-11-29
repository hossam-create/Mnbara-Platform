import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class AuctionService {
    // Create Auction (Listing with auction flags)
    async createAuction(data: any) {
        return prisma.listing.create({
            data: {
                ...data,
                isAuction: true,
                status: 'ACTIVE',
                currentBid: data.startingBid,
            },
        });
    }

    // Get Auction Details
    async getAuction(id: number) {
        return prisma.listing.findUnique({
            where: { id, isAuction: true },
            include: {
                seller: {
                    select: { id: true, firstName: true, lastName: true },
                },
                bids: {
                    orderBy: { amount: 'desc' },
                    take: 5,
                    include: {
                        bidder: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });
    }

    // Place Bid
    async placeBid(listingId: number, bidderId: number, amount: number) {
        // 1. Get auction
        const auction = await prisma.listing.findUnique({
            where: { id: listingId },
        });

        if (!auction) throw new Error('Auction not found');
        if (!auction.isAuction) throw new Error('Listing is not an auction');
        if (auction.status !== 'ACTIVE') throw new Error('Auction is not active');
        if (auction.auctionEndsAt && new Date() > auction.auctionEndsAt) {
            throw new Error('Auction has ended');
        }

        const currentBid = Number(auction.currentBid || auction.startingBid || 0);
        if (amount <= currentBid) {
            throw new Error(`Bid must be higher than current bid (${currentBid})`);
        }

        // 2. Create Bid
        const bid = await prisma.bid.create({
            data: {
                listingId,
                bidderId,
                amount,
            },
            include: {
                bidder: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        // 3. Update Auction Current Bid
        await prisma.listing.update({
            where: { id: listingId },
            data: { currentBid: amount },
        });

        return bid;
    }

    // Get Bids for Auction
    async getBids(listingId: number) {
        return prisma.bid.findMany({
            where: { listingId },
            orderBy: { amount: 'desc' },
            include: {
                bidder: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }
}

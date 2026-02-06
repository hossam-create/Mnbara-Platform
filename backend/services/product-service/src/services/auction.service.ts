/**
 * Auction Service - Triple Format Auction System
 * 
 * Implements Buy It Now, Auction with Auto-Extend, and Make Offer
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ProductStatus, BidStatus, OfferStatus } from '@prisma/client';

interface PlaceBidParams {
    productId: string;
    bidderId: string;
    amount: number;
    isAutoBid?: boolean;
    maxAmount?: number; // For proxy bidding
}

interface AuctionResult {
    success: boolean;
    bid: any;
    product: any;
    wasExtended?: boolean;
    extensionInfo?: {
        previousEndTime: Date;
        newEndTime: Date;
        extensionNumber: number;
    };
    outbidUsers: string[];
}

export class AuctionService {
    /**
     * Place a bid on an auction
     */
    async placeBid(params: PlaceBidParams): Promise<AuctionResult> {
        const { productId, bidderId, amount, isAutoBid = false, maxAmount } = params;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                bids: {
                    where: { status: BidStatus.ACTIVE },
                    orderBy: { amount: 'desc' },
                    take: 10,
                },
            }
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (!product.isAuction) {
            throw new AppError('This product is not an auction', 400);
        }

        if (product.sellerId === bidderId) {
            throw new AppError('Sellers cannot bid on their own products', 400);
        }

        if (product.status !== ProductStatus.ACTIVE) {
            throw new AppError('Auction is not active', 400);
        }

        if (product.auctionEndsAt && new Date() > product.auctionEndsAt) {
            throw new AppError('Auction has ended', 400);
        }

        // Validate bid amount
        const startingBid = product.startingBid ? parseFloat(product.startingBid.toString()) : 0;
        const currentBid = product.currentBid ? parseFloat(product.currentBid.toString()) : 0;
        const minIncrement = product.minBidIncrement ? parseFloat(product.minBidIncrement.toString()) : 1;
        const minBidAmount = Math.max(startingBid, currentBid + minIncrement);

        if (amount < minBidAmount) {
            throw new AppError(`Bid must be at least ${minBidAmount}`, 400);
        }

        // Calculate auto-bid amount if applicable
        let finalAmount = amount;
        let autoBidTriggered = false;

        if (isAutoBid && maxAmount) {
            // Handle auto-bidding
            const proxyBid = await prisma.proxyBid.findFirst({
                where: { productId, bidderId }
            });

            if (proxyBid && parseFloat(proxyBid.maxAmount.toString()) > amount) {
                // User already has a higher proxy bid
                finalAmount = Math.min(parseFloat(proxyBid.maxAmount.toString()), maxAmount);
                autoBidTriggered = true;
            }
        }

        // Check for auction auto-extension
        let wasExtended = false;
        let extensionInfo = undefined;
        const autoExtendThresholdMs = 2 * 60 * 1000; // 2 minutes
        const autoExtendDurationMs = 2 * 60 * 1000; // 2 minutes
        const maxExtensions = 10;

        if (product.auctionEndsAt) {
            const timeRemaining = new Date(product.auctionEndsAt).getTime() - Date.now();
            const extensionCount = product.extensionCount || 0;

            if (timeRemaining <= autoExtendThresholdMs && extensionCount < maxExtensions) {
                wasExtended = true;
                const previousEndTime = new Date(product.auctionEndsAt);
                const newEndTime = new Date(Date.now() + autoExtendDurationMs);

                // Update product with extended time
                await prisma.product.update({
                    where: { id: productId },
                    data: {
                        auctionEndsAt: newEndTime,
                        extensionCount: { increment: 1 },
                    }
                });

                extensionInfo = {
                    previousEndTime,
                    newEndTime,
                    extensionNumber: extensionCount + 1,
                };

                logger.info('Auction auto-extended', { productId, previousEndTime, newEndTime });
            }
        }

        // Create bid and update product
        const [bid] = await prisma.$transaction([
            prisma.bid.create({
                data: {
                    productId,
                    bidderId,
                    amount: finalAmount,
                    isAutoBid: isAutoBid || autoBidTriggered,
                    maxAmount: maxAmount || null,
                    isWinning: true,
                    status: BidStatus.ACTIVE,
                }
            }),
            // Mark previous winning bid as outbid
            ...(product.bids.length > 0 ? [
                prisma.bid.updateMany({
                    where: {
                        productId,
                        status: BidStatus.ACTIVE,
                        id: { not: product.bids[0].id },
                    },
                    data: {
                        isWinning: false,
                        status: BidStatus.OUTBID,
                    }
                })
            ] : []),
            // Update product current bid
            prisma.product.update({
                where: { id: productId },
                data: {
                    currentBid: finalAmount,
                }
            })
        ]);

        // Get users to notify (outbid users)
        const outbidUserIds = product.bids
            .filter(b => b.bidderId !== bidderId)
            .map(b => b.bidderId);

        logger.info('Bid placed', { productId, bidderId, amount: finalAmount });

        return {
            success: true,
            bid,
            product: { ...product, currentBid: finalAmount },
            wasExtended,
            extensionInfo,
            outbidUsers: outbidUserIds,
        };
    }

    /**
     * Get current auction status
     */
    async getAuctionStatus(productId: string): Promise<{
        product: any;
        currentBid: any;
        bidHistory: any[];
        timeRemaining: number;
        bidCount: number;
    }> {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const currentBid = await prisma.bid.findFirst({
            where: { productId, isWinning: true },
            include: {
                bidder: {
                    select: { id: true, name: true }
                }
            }
        });

        const bidHistory = await prisma.bid.findMany({
            where: { productId },
            include: {
                bidder: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const timeRemaining = product.auctionEndsAt
            ? Math.max(0, new Date(product.auctionEndsAt).getTime() - Date.now())
            : 0;

        return {
            product,
            currentBid,
            bidHistory,
            timeRemaining,
            bidCount: bidHistory.length,
        };
    }

    /**
     * End auction and determine winner
     */
    async endAuction(productId: string): Promise<{
        success: boolean;
        winner: any;
        winningBid: any;
        reserveMet: boolean;
    }> {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (!product.isAuction) {
            throw new AppError('This product is not an auction', 400);
        }

        // Get highest bid
        const highestBid = await prisma.bid.findFirst({
            where: { productId, status: BidStatus.ACTIVE },
            orderBy: { amount: 'desc' },
        });

        if (!highestBid) {
            // No bids - auction ends without winner
            await prisma.product.update({
                where: { id: productId },
                data: {
                    status: ProductStatus.ENDED_UNMET_RESERVE,
                    endedReason: 'NORMAL',
                }
            });

            return {
                success: true,
                winner: null,
                winningBid: null,
                reserveMet: false,
            };
        }

        // Check reserve price
        const reservePrice = product.reservePrice 
            ? parseFloat(product.reservePrice.toString()) 
            : null;
        const bidAmount = parseFloat(highestBid.amount.toString());
        const reserveMet = !reservePrice || bidAmount >= reservePrice;

        await prisma.$transaction([
            // Update product
            prisma.product.update({
                where: { id: productId },
                data: {
                    status: reserveMet ? ProductStatus.SOLD : ProductStatus.ENDED_UNMET_RESERVE,
                    winnerId: reserveMet ? highestBid.bidderId : null,
                    finalPrice: reserveMet ? highestBid.amount : null,
                    reserveMet,
                    endedReason: 'NORMAL',
                }
            }),
            // Update winning bid
            prisma.bid.update({
                where: { id: highestBid.id },
                data: {
                    status: BidStatus.WON,
                    isWinning: true,
                }
            }),
            // Mark other bids as outbid
            prisma.bid.updateMany({
                where: {
                    productId,
                    id: { not: highestBid.id },
                    status: BidStatus.ACTIVE,
                },
                data: {
                    status: BidStatus.OUTBID,
                    isWinning: false,
                }
            })
        ]);

        logger.info('Auction ended', { productId, winnerId: highestBid.bidderId, reserveMet });

        return {
            success: true,
            winner: { id: highestBid.bidderId },
            winningBid: highestBid,
            reserveMet,
        };
    }

    /**
     * Create proxy bid configuration
     */
    async setProxyBid(productId: string, bidderId: string, maxAmount: number): Promise<void> {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isAuction) {
            throw new AppError('Auction not found', 404);
        }

        if (product.sellerId === bidderId) {
            throw new AppError('Sellers cannot set proxy bids', 400);
        }

        await prisma.proxyBid.upsert({
            where: {
                productId_bidderId: { productId, bidderId }
            },
            update: { maxAmount },
            create: {
                productId,
                bidderId,
                maxAmount,
                currentBid: product.currentBid || 0,
                isActive: true,
            }
        });

        logger.info('Proxy bid set', { productId, bidderId, maxAmount });
    }
}

export const auctionService = new AuctionService();

/**
 * Offer Service - Make Offer System
 * 
 * Handles counter-offer workflows for the Make Offer listing type
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { OfferStatus, ProductStatus } from '@prisma/client';

interface CreateOfferParams {
    productId: string;
    buyerId: string;
    offerPrice: number;
    message?: string;
}

interface CounterOfferParams {
    offerId: string;
    sellerId: string;
    counterPrice: number;
    message?: string;
}

export class OfferService {
    /**
     * Create a new offer (Make Offer)
     */
    async createOffer(params: CreateOfferParams): Promise<any> {
        const { productId, buyerId, offerPrice, message } = params;

        // Get product
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                seller: { select: { id: true } }
            }
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (product.sellerId === buyerId) {
            throw new AppError('Cannot make an offer on your own product', 400);
        }

        if (product.listingType !== 'MAKE_OFFER' && product.listingType !== 'COMBINED') {
            throw new AppError('This product does not accept offers', 400);
        }

        if (product.status !== ProductStatus.ACTIVE) {
            throw new AppError('Product is not available', 400);
        }

        // Check for existing pending offer
        const existingOffer = await prisma.makeOffer.findFirst({
            where: {
                productId,
                buyerId,
                status: { in: [OfferStatus.PENDING, OfferStatus.COUNTERED] }
            }
        });

        if (existingOffer) {
            throw new AppError('You already have a pending offer on this product', 400);
        }

        // Calculate offer expiry (48 hours)
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        // Create offer
        const offer = await prisma.makeOffer.create({
            data: {
                productId,
                buyerId,
                sellerId: product.sellerId,
                offerPrice,
                message,
                expiresAt,
                status: OfferStatus.PENDING,
            }
        });

        logger.info('Offer created', { offerId: offer.id, productId, buyerId });

        return offer;
    }

    /**
     * Accept an offer
     */
    async acceptOffer(offerId: string, sellerId: string): Promise<any> {
        const offer = await prisma.makeOffer.findUnique({
            where: { id: offerId },
            include: { product: true }
        });

        if (!offer) {
            throw new AppError('Offer not found', 404);
        }

        if (offer.sellerId !== sellerId) {
            throw new AppError('Not authorized to accept this offer', 403);
        }

        if (offer.status !== OfferStatus.PENDING && offer.status !== OfferStatus.COUNTERED) {
            throw new AppError('Offer is not pending', 400);
        }

        if (new Date() > offer.expiresAt) {
            throw new AppError('Offer has expired', 400);
        }

        // Accept the offer
        const [acceptedOffer, updatedProduct] = await prisma.$transaction([
            prisma.makeOffer.update({
                where: { id: offerId },
                data: {
                    status: OfferStatus.ACCEPTED,
                    respondedAt: new Date(),
                }
            }),
            prisma.product.update({
                where: { id: offer.productId },
                data: {
                    status: ProductStatus.SOLD,
                    stock: 0,
                    currentBid: offer.offerPrice,
                }
            }),
            // Reject other pending offers
            prisma.makeOffer.updateMany({
                where: {
                    productId: offer.productId,
                    id: { not: offerId },
                    status: { in: [OfferStatus.PENDING, OfferStatus.COUNTERED] }
                },
                data: {
                    status: OfferStatus.EXPIRED,
                    respondedAt: new Date(),
                }
            })
        ]);

        logger.info('Offer accepted', { offerId, sellerId });

        return { offer: acceptedOffer, product: updatedProduct };
    }

    /**
     * Decline an offer
     */
    async declineOffer(offerId: string, sellerId: string): Promise<any> {
        const offer = await prisma.makeOffer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            throw new AppError('Offer not found', 404);
        }

        if (offer.sellerId !== sellerId) {
            throw new AppError('Not authorized', 403);
        }

        if (offer.status !== OfferStatus.PENDING) {
            throw new AppError('Offer is not pending', 400);
        }

        const declinedOffer = await prisma.makeOffer.update({
            where: { id: offerId },
            data: {
                status: OfferStatus.DECLINED,
                respondedAt: new Date(),
            }
        });

        logger.info('Offer declined', { offerId, sellerId });

        return declinedOffer;
    }

    /**
     * Counter an offer
     */
    async counterOffer(params: CounterOfferParams): Promise<any> {
        const { offerId, sellerId, counterPrice, message } = params;

        const offer = await prisma.makeOffer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            throw new AppError('Offer not found', 404);
        }

        if (offer.sellerId !== sellerId) {
            throw new AppError('Not authorized', 403);
        }

        if (offer.status !== OfferStatus.PENDING) {
            throw new AppError('Can only counter pending offers', 400);
        }

        if (counterPrice >= offer.offerPrice) {
            throw new AppError('Counter price must be lower than original offer', 400);
        }

        // Extend expiry by 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const counteredOffer = await prisma.makeOffer.update({
            where: { id: offerId },
            data: {
                status: OfferStatus.COUNTERED,
                counterOffer: counterPrice,
                message,
                expiresAt,
                respondedAt: new Date(),
            }
        });

        logger.info('Offer countered', { offerId, sellerId, counterPrice });

        return counteredOffer;
    }

    /**
     * Buyer responds to counter offer
     */
    async respondToCounter(offerId: string, buyerId: string, accept: boolean): Promise<any> {
        const offer = await prisma.makeOffer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            throw new AppError('Offer not found', 404);
        }

        if (offer.buyerId !== buyerId) {
            throw new AppError('Not authorized', 403);
        }

        if (offer.status !== OfferStatus.COUNTERED) {
            throw new AppError('No counter offer to respond to', 400);
        }

        if (new Date() > offer.expiresAt) {
            throw new AppError('Counter offer has expired', 400);
        }

        if (accept) {
            // Accept the counter offer
            const [acceptedOffer, updatedProduct] = await prisma.$transaction([
                prisma.makeOffer.update({
                    where: { id: offerId },
                    data: {
                        status: OfferStatus.ACCEPTED,
                        offerPrice: offer.counterOffer,
                        respondedAt: new Date(),
                    }
                }),
                prisma.product.update({
                    where: { id: offer.productId },
                    data: {
                        status: ProductStatus.SOLD,
                        stock: 0,
                        currentBid: offer.counterOffer,
                    }
                })
            ]);

            logger.info('Counter offer accepted', { offerId, buyerId });

            return { offer: acceptedOffer, product: updatedProduct };
        } else {
            // Decline counter offer
            const declinedOffer = await prisma.makeOffer.update({
                where: { id: offerId },
                data: {
                    status: OfferStatus.DECLINED,
                    respondedAt: new Date(),
                }
            });

            logger.info('Counter offer declined', { offerId, buyerId });

            return declinedOffer;
        }
    }

    /**
     * Withdraw an offer (buyer)
     */
    async withdrawOffer(offerId: string, userId: string): Promise<any> {
        const offer = await prisma.makeOffer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            throw new AppError('Offer not found', 404);
        }

        if (offer.buyerId !== userId) {
            throw new AppError('Not authorized', 403);
        }

        if (offer.status !== OfferStatus.PENDING) {
            throw new AppError('Can only withdraw pending offers', 400);
        }

        const withdrawnOffer = await prisma.makeOffer.update({
            where: { id: offerId },
            data: {
                status: OfferStatus.WITHDRAWN,
                respondedAt: new Date(),
            }
        });

        logger.info('Offer withdrawn', { offerId, userId });

        return withdrawnOffer;
    }

    /**
     * Get offers for a product
     */
    async getProductOffers(productId: string, sellerId?: string): Promise<any[]> {
        const where: any = { productId };
        
        if (sellerId) {
            where.sellerId = sellerId;
        }

        return prisma.makeOffer.findMany({
            where,
            orderBy: { offerPrice: 'desc' },
        });
    }

    /**
     * Get user's received offers (seller)
     */
    async getReceivedOffers(userId: string, status?: OfferStatus): Promise<any[]> {
        const where: any = { sellerId: userId };
        if (status) where.status = status;

        return prisma.makeOffer.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        price: true,
                        images: { take: 1 }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get user's sent offers (buyer)
     */
    async getSentOffers(userId: string, status?: OfferStatus): Promise<any[]> {
        const where: any = { buyerId: userId };
        if (status) where.status = status;

        return prisma.makeOffer.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        price: true,
                        images: { take: 1 }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const offerService = new OfferService();

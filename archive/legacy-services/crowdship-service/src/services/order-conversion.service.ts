import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

export class OrderConversionService {
    private notifier: NotificationService;

    constructor() {
        this.notifier = new NotificationService();
    }

    /**
     * Convert an accepted offer with approved travel into a RequestOrder link (order-ready state).
     * Rolls back on failure via Prisma transaction.
     */
    async convertToOrder(params: { offerId: number }) {
        const offerId = params.offerId;
        return prisma.$transaction(async (tx) => {
            const offer = await tx.travelerOffer.findUnique({
                where: { id: offerId },
                include: { request: true, traveler: true },
            });
            if (!offer) {
                throw new Error('Offer not found');
            }
            if (offer.status !== 'ACCEPTED') {
                throw new Error('Offer must be ACCEPTED to convert to order');
            }
            if (offer.travelStatus !== 'APPROVED') {
                throw new Error('Travel dates must be approved before order creation');
            }

            // Ensure request not already linked
            const existingLink = await tx.requestOrder.findUnique({
                where: { requestId: offer.requestId },
            });
            if (existingLink) {
                return existingLink;
            }

            const request = offer.request;

            // Create RequestOrder link with price breakdown
            const link = await tx.requestOrder.create({
                data: {
                    requestId: request.id,
                    offerId: offer.id,
                    buyerId: request.buyerId,
                    travelerId: offer.travelerId,
                    productTitle: request.title ?? null,
                    productUrl: request.productUrl,
                    sourceSite: request.sourceSite ?? null,
                    sourceCountry: request.sourceCountry ?? null,
                    priceBreakdown: {
                        listedPrice: offer.listedPrice,
                        estimatedTax: offer.estimatedTax,
                        estimatedShipping: offer.estimatedShipping,
                        platformFee: offer.platformFee,
                        travelerProfit: offer.travelerProfit,
                        totalProposed: offer.totalProposed,
                    },
                    totalProposed: offer.totalProposed,
                    travelDepartureDate: offer.travelDepartureDate,
                    travelArrivalDate: offer.travelArrivalDate,
                    status: 'PENDING_PAYMENT',
                },
            });

            // Lock request from further offers
            await tx.shopperRequest.update({
                where: { id: request.id },
                data: { isOrderReady: true },
            });

            // Emit/log order-created event (placeholder)
            console.log('[order-created]', {
                requestId: request.id,
                offerId: offer.id,
                buyerId: request.buyerId,
                travelerId: offer.travelerId,
                total: offer.totalProposed,
            });

            await this.notifier.notify(request.buyerId, 'Order ready for payment', { requestId: request.id, offerId: offer.id });
            await this.notifier.notify(offer.travelerId, 'Order ready for payment', { requestId: request.id, offerId: offer.id });

            return link;
        });
    }
}






import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

export class OfferService {
    private notifier: NotificationService;

    constructor() {
        this.notifier = new NotificationService();
    }

    async createOffer(input: {
        requestId: number;
        travelerId: number;
        listedPrice: number;
        estimatedTax?: number;
        estimatedShipping?: number;
        platformFee?: number;
        travelerProfit?: number;
        counterNote?: string;
    }) {
        const request = await prisma.shopperRequest.findUnique({ where: { id: input.requestId } });
        if (!request) throw new Error('Shopper request not found');
        if (request.status === 'ACCEPTED' || request.status === 'REJECTED' || request.isOrderReady) {
            throw new Error('Request not accepting offers');
        }

        const offer = await prisma.travelerOffer.upsert({
            where: { requestId_travelerId: { requestId: input.requestId, travelerId: input.travelerId } },
            update: {
                listedPrice: input.listedPrice,
                estimatedTax: input.estimatedTax ?? 0,
                estimatedShipping: input.estimatedShipping ?? 0,
                platformFee: input.platformFee ?? 0,
                travelerProfit: input.travelerProfit ?? 0,
                totalProposed: this.total(input),
                status: 'OFFERED',
                lastActor: 'traveler',
                counterNote: input.counterNote ?? null,
            },
            create: {
                requestId: input.requestId,
                travelerId: input.travelerId,
                listedPrice: input.listedPrice,
                estimatedTax: input.estimatedTax ?? 0,
                estimatedShipping: input.estimatedShipping ?? 0,
                platformFee: input.platformFee ?? 0,
                travelerProfit: input.travelerProfit ?? 0,
                totalProposed: this.total(input),
                status: 'OFFERED',
                lastActor: 'traveler',
                counterNote: input.counterNote ?? null,
            },
        });

        await prisma.shopperRequest.update({
            where: { id: input.requestId },
            data: { status: 'NEGOTIATING' },
        });

        await this.notifier.notify(request.buyerId, 'New traveler offer', { offerId: offer.id, requestId: request.id });
        return offer;
    }

    private total(input: { listedPrice: number; estimatedTax?: number; estimatedShipping?: number; platformFee?: number; travelerProfit?: number }) {
        return (
            input.listedPrice +
            (input.estimatedTax ?? 0) +
            (input.estimatedShipping ?? 0) +
            (input.platformFee ?? 0) +
            (input.travelerProfit ?? 0)
        );
    }

    async buyerDecision(params: { offerId: number; action: 'ACCEPT' | 'REJECT' | 'COUNTER'; buyerId: number; counterData?: Partial<TravelerCounterInput> }) {
        const offer = await prisma.travelerOffer.findUnique({ where: { id: params.offerId }, include: { request: true } });
        if (!offer) throw new Error('Offer not found');
        if (offer.request.buyerId !== params.buyerId) throw new Error('Not authorized');

        if (params.action === 'ACCEPT') {
            // Ensure no other accepted offer
            const accepted = await prisma.travelerOffer.findFirst({
                where: { requestId: offer.requestId, status: 'ACCEPTED' },
            });
            if (accepted && accepted.id !== offer.id) {
                throw new Error('Another offer already accepted for this request');
            }

            const updated = await prisma.travelerOffer.update({
                where: { id: offer.id },
                data: { status: 'ACCEPTED', lastActor: 'buyer' },
            });
            await prisma.shopperRequest.update({
                where: { id: offer.requestId },
                data: { status: 'ACCEPTED', isOrderReady: true },
            });
            await this.notifier.notify(offer.travelerId, 'Offer accepted by buyer', { offerId: offer.id });
            return updated;
        }

        if (params.action === 'REJECT') {
            const updated = await prisma.travelerOffer.update({
                where: { id: offer.id },
                data: { status: 'REJECTED', lastActor: 'buyer' },
            });
            await this.notifier.notify(offer.travelerId, 'Offer rejected by buyer', { offerId: offer.id });
            return updated;
        }

        // COUNTER
        const counter = params.counterData || {};
        const updated = await prisma.travelerOffer.update({
            where: { id: offer.id },
            data: {
                listedPrice: counter.listedPrice ?? offer.listedPrice,
                estimatedTax: counter.estimatedTax ?? offer.estimatedTax,
                estimatedShipping: counter.estimatedShipping ?? offer.estimatedShipping,
                platformFee: counter.platformFee ?? offer.platformFee,
                travelerProfit: counter.travelerProfit ?? offer.travelerProfit,
                totalProposed: this.total({
                    listedPrice: counter.listedPrice ?? Number(offer.listedPrice),
                    estimatedTax: counter.estimatedTax ?? Number(offer.estimatedTax),
                    estimatedShipping: counter.estimatedShipping ?? Number(offer.estimatedShipping),
                    platformFee: counter.platformFee ?? Number(offer.platformFee),
                    travelerProfit: counter.travelerProfit ?? Number(offer.travelerProfit),
                }),
                status: 'COUNTERED',
                lastActor: 'buyer',
                counterNote: counter.counterNote ?? offer.counterNote,
            },
        });
        await prisma.shopperRequest.update({
            where: { id: offer.requestId },
            data: { status: 'NEGOTIATING' },
        });
        await this.notifier.notify(offer.travelerId, 'Buyer countered your offer', { offerId: offer.id });
        return updated;
    }

    async travelerDecision(params: { offerId: number; action: 'ACCEPT' | 'COUNTER'; travelerId: number; counterData?: Partial<TravelerCounterInput> }) {
        const offer = await prisma.travelerOffer.findUnique({ where: { id: params.offerId }, include: { request: true } });
        if (!offer) throw new Error('Offer not found');
        if (offer.travelerId !== params.travelerId) throw new Error('Not authorized');

        if (params.action === 'ACCEPT') {
            const updated = await prisma.travelerOffer.update({
                where: { id: offer.id },
                data: { status: 'ACCEPTED', lastActor: 'traveler' },
            });
            await prisma.shopperRequest.update({
                where: { id: offer.requestId },
                data: { status: 'ACCEPTED', isOrderReady: true },
            });
            await this.notifier.notify(offer.request.buyerId, 'Traveler accepted your counter', { offerId: offer.id });
            return updated;
        }

        const counter = params.counterData || {};
        const updated = await prisma.travelerOffer.update({
            where: { id: offer.id },
            data: {
                listedPrice: counter.listedPrice ?? offer.listedPrice,
                estimatedTax: counter.estimatedTax ?? offer.estimatedTax,
                estimatedShipping: counter.estimatedShipping ?? offer.estimatedShipping,
                platformFee: counter.platformFee ?? offer.platformFee,
                travelerProfit: counter.travelerProfit ?? offer.travelerProfit,
                totalProposed: this.total({
                    listedPrice: counter.listedPrice ?? Number(offer.listedPrice),
                    estimatedTax: counter.estimatedTax ?? Number(offer.estimatedTax),
                    estimatedShipping: counter.estimatedShipping ?? Number(offer.estimatedShipping),
                    platformFee: counter.platformFee ?? Number(offer.platformFee),
                    travelerProfit: counter.travelerProfit ?? Number(offer.travelerProfit),
                }),
                status: 'COUNTERED',
                lastActor: 'traveler',
                counterNote: counter.counterNote ?? offer.counterNote,
            },
        });
        await prisma.shopperRequest.update({
            where: { id: offer.requestId },
            data: { status: 'NEGOTIATING' },
        });
        await this.notifier.notify(offer.request.buyerId, 'Traveler countered your offer', { offerId: offer.id });
        return updated;
    }

    async submitTravelDetails(params: { offerId: number; travelerId: number; departure: string; arrival: string }) {
        const offer = await prisma.travelerOffer.findUnique({ where: { id: params.offerId }, include: { request: true } });
        if (!offer) throw new Error('Offer not found');
        if (offer.travelerId !== params.travelerId) throw new Error('Not authorized');
        if (offer.status !== 'ACCEPTED') throw new Error('Offer must be accepted before travel details');

        const updated = await prisma.travelerOffer.update({
            where: { id: offer.id },
            data: {
                travelDepartureDate: new Date(params.departure),
                travelArrivalDate: new Date(params.arrival),
                travelStatus: 'SUBMITTED',
            },
        });
        await this.notifier.notify(offer.request.buyerId, 'Traveler submitted travel dates', { offerId: offer.id });
        return updated;
    }

    async buyerTravelDecision(params: { offerId: number; buyerId: number; approve: boolean }) {
        const offer = await prisma.travelerOffer.findUnique({ where: { id: params.offerId }, include: { request: true } });
        if (!offer) throw new Error('Offer not found');
        if (offer.request.buyerId !== params.buyerId) throw new Error('Not authorized');

        const updated = await prisma.travelerOffer.update({
            where: { id: offer.id },
            data: {
                travelStatus: params.approve ? 'APPROVED' : 'REJECTED',
            },
        });
        await this.notifier.notify(offer.travelerId, params.approve ? 'Buyer approved travel dates' : 'Buyer rejected travel dates', { offerId: offer.id });
        return updated;
    }
}

export interface TravelerCounterInput {
    listedPrice: number;
    estimatedTax?: number;
    estimatedShipping?: number;
    platformFee?: number;
    travelerProfit?: number;
    counterNote?: string;
}


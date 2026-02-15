import { OfferService } from '../offer.service';
import { PrismaClient } from '@prisma/client';
import { OrderConversionService } from '../order-conversion.service';

jest.mock('@prisma/client', () => {
    const mPrisma = {
        shopperRequest: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        travelerOffer: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        requestOrder: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        $transaction: (fn: any) => fn(mPrisma),
    };
    return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('OfferService negotiation', () => {
    const prisma = new PrismaClient() as any;
    const service = new OfferService();
    const conversion = new OrderConversionService();

    beforeEach(() => jest.clearAllMocks());

    it('creates an offer and sets request to NEGOTIATING', async () => {
        prisma.shopperRequest.findUnique.mockResolvedValue({ id: 1, buyerId: 5, status: 'REQUESTED' });
        prisma.travelerOffer.upsert.mockResolvedValue({ id: 10, requestId: 1 });
        prisma.shopperRequest.update.mockResolvedValue({});

        const offer = await service.createOffer({ requestId: 1, travelerId: 2, listedPrice: 100 });

        expect(offer).toEqual({ id: 10, requestId: 1 });
        expect(prisma.shopperRequest.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'NEGOTIATING' },
        });
    });

    it('buyer accepts offer and marks request accepted', async () => {
        prisma.travelerOffer.findUnique.mockResolvedValue({
            id: 10,
            requestId: 1,
            request: { buyerId: 5 },
        });
        prisma.travelerOffer.findFirst.mockResolvedValue(null);
        prisma.travelerOffer.update.mockResolvedValue({ id: 10, status: 'ACCEPTED' });
        prisma.shopperRequest.update.mockResolvedValue({});

        const result = await service.buyerDecision({ offerId: 10, action: 'ACCEPT', buyerId: 5 });
        expect(result).toEqual({ id: 10, status: 'ACCEPTED' });
        expect(prisma.shopperRequest.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'ACCEPTED', isOrderReady: true },
        });
    });

    it('converts accepted offer with approved travel to RequestOrder', async () => {
        prisma.travelerOffer.findUnique.mockResolvedValue({
            id: 10,
            requestId: 1,
            travelerId: 2,
            travelStatus: 'APPROVED',
            status: 'ACCEPTED',
            listedPrice: 100,
            estimatedTax: 10,
            estimatedShipping: 5,
            platformFee: 3,
            travelerProfit: 12,
            totalProposed: 130,
            travelDepartureDate: new Date(),
            travelArrivalDate: new Date(),
            request: { id: 1, buyerId: 5, productUrl: 'http://x', sourceSite: 'x.com' },
        });
        prisma.requestOrder.findUnique.mockResolvedValue(null);
        prisma.requestOrder.create.mockResolvedValue({ id: 99, requestId: 1 });
        prisma.shopperRequest.update.mockResolvedValue({});

        const link = await conversion.convertToOrder({ offerId: 10 });

        expect(link).toEqual({ id: 99, requestId: 1 });
        expect(prisma.requestOrder.create).toHaveBeenCalled();
        expect(prisma.shopperRequest.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { isOrderReady: true },
        });
    });
});


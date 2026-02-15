import { ShopperRequestService } from '../shopper-request.service';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
    const mPrisma = {
        shopperRequest: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };
    return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('ShopperRequestService', () => {
    const prisma = new PrismaClient() as any;
    const service = new ShopperRequestService();

    beforeEach(() => jest.clearAllMocks());

    it('creates a request with fetched metadata fallback', async () => {
        prisma.shopperRequest.create.mockResolvedValue({ id: 1, productUrl: 'http://example.com' });
        const request = await service.createRequest({ buyerId: 1, productUrl: 'http://example.com', price: 10 });
        expect(request).toEqual({ id: 1, productUrl: 'http://example.com' });
        expect(prisma.shopperRequest.create).toHaveBeenCalled();
    });

    it('lists available requests filtered by country', async () => {
        prisma.shopperRequest.findMany.mockResolvedValue([{ id: 1 }]);
        const items = await service.listAvailableForTraveler('US');
        expect(items).toEqual([{ id: 1 }]);
        expect(prisma.shopperRequest.findMany).toHaveBeenCalledWith({
            where: { status: { in: ['REQUESTED', 'NEGOTIATING'] }, sourceCountry: 'US' },
            orderBy: { createdAt: 'desc' },
        });
    });
});






import { ResaleService } from '../resale.service';
import { PrismaClient } from '@prisma/client';
import { OrdersClient } from '../clients/orders.client';
import { PaymentClient } from '../clients/payment.client';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    listing: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

jest.mock('../clients/orders.client');
jest.mock('../clients/payment.client');

describe('ResaleService', () => {
  const prisma = new PrismaClient() as any;
  const service = new ResaleService();
  const ordersClient = OrdersClient as jest.MockedClass<typeof OrdersClient>;
  const paymentClient = PaymentClient as jest.MockedClass<typeof PaymentClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates resale listing when order is completed and receipt exists', async () => {
    (ordersClient.prototype.getOrder as any) = jest.fn().mockResolvedValue({
      id: 1,
      buyerId: 5,
      status: 'COMPLETED',
      totalAmount: 200,
      currency: 'USD',
      items: [{ productName: 'Phone', productUrl: 'http://example.com/p' }],
    });
    (paymentClient.prototype.getReceiptByOrder as any) = jest.fn().mockResolvedValue({ receiptUrl: 'http://receipt' });
    prisma.listing.findFirst.mockResolvedValue(null);
    prisma.listing.create.mockResolvedValue({ id: 10, originalOrderId: 1, isResale: true });

    const listing = await service.createResaleListing({
      sellerId: 5,
      orderId: 1,
      categoryId: 2,
      city: 'NYC',
      country: 'US',
    });

    expect(listing).toEqual({ id: 10, originalOrderId: 1, isResale: true });
    expect(prisma.listing.create).toHaveBeenCalled();
  });

  it('blocks resale if order not completed', async () => {
    (ordersClient.prototype.getOrder as any) = jest.fn().mockResolvedValue({
      id: 1,
      buyerId: 5,
      status: 'PENDING',
      totalAmount: 200,
      currency: 'USD',
      items: [],
    });
    await expect(
      service.createResaleListing({ sellerId: 5, orderId: 1, categoryId: 2, city: 'NYC', country: 'US' }),
    ).rejects.toThrow('Order must be completed before resale');
  });
});






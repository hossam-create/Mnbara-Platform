import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { EmailService } from '../common/email/email.service';
import { EscrowClient } from '../common/payment/escrow.client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto, DeliveryType } from './dto/create-order.dto';

describe('OrdersService - Guest Checkout', () => {
  let service: OrdersService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;
  let emailService: jest.Mocked<EmailService>;
  let escrowClient: jest.Mocked<EscrowClient>;

  const mockOrder = {
    id: 1,
    orderNumber: 'ORD-123',
    buyerId: null,
    isGuestOrder: true,
    guestEmail: 'guest@example.com',
    guestFirstName: 'John',
    guestLastName: 'Doe',
    guestPhone: '+1234567890',
    totalAmount: 100.00,
    currency: 'USD',
    status: 'PENDING',
    items: [
      {
        id: 1,
        productName: 'Test Product',
        quantity: 1,
        price: 100.00,
      },
    ],
    deliveryCity: 'New York',
    deliveryCountry: 'USA',
    deliveryAddress: '123 Main St',
  };

  beforeEach(async () => {
    const mockPrisma = {
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn(),
    };

    const mockEmail = {
      sendOrderConfirmation: jest.fn(),
    };

    const mockEscrow = {
      createEscrow: jest.fn(),
      holdEscrow: jest.fn(),
      releaseEscrow: jest.fn(),
      refundEscrow: jest.fn(),
      getEscrowByOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: EmailService,
          useValue: mockEmail,
        },
        {
          provide: EscrowClient,
          useValue: mockEscrow,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(CacheService);
    emailService = module.get(EmailService);
    escrowClient = module.get(EscrowClient);
  });

  describe('confirmDelivery', () => {
    it('should release escrow on delivery confirmation', async () => {
      escrowClient.getEscrowByOrder.mockResolvedValue({ id: 10 });
      escrowClient.releaseEscrow.mockResolvedValue({});
      prismaService.order.update.mockResolvedValue({ id: 1, status: 'COMPLETED' } as any);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.clear.mockResolvedValue(undefined);

      const result = await service.confirmDelivery(1, 99);

      expect(escrowClient.getEscrowByOrder).toHaveBeenCalledWith(1);
      expect(escrowClient.releaseEscrow).toHaveBeenCalledWith(10, 99);
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'COMPLETED' },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('createGuestOrder', () => {
    const guestOrderDto: CreateOrderDto = {
      deliveryType: DeliveryType.CROWDSHIP,
      items: [
        {
          productName: 'Test Product',
          quantity: 1,
          price: 100.00,
        },
      ],
      pickupCity: 'New York',
      pickupCountry: 'USA',
      deliveryCity: 'London',
      deliveryCountry: 'UK',
      guestEmail: 'guest@example.com',
      guestFirstName: 'John',
      guestLastName: 'Doe',
      guestPhone: '+1234567890',
    };

    it('should create a guest order successfully', async () => {
      prismaService.order.create.mockResolvedValue(mockOrder as any);
      emailService.sendOrderConfirmation.mockResolvedValue(undefined);
      escrowClient.createEscrow.mockResolvedValue({ id: 10 });
      escrowClient.holdEscrow.mockResolvedValue({ id: 10 });

      const result = await service.createGuestOrder(guestOrderDto);

      expect(result).toEqual(mockOrder);
      expect(prismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          buyerId: null,
          isGuestOrder: true,
          guestEmail: 'guest@example.com',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestPhone: '+1234567890',
        }),
        include: {
          items: true,
          buyer: false,
        },
      });
      expect(escrowClient.createEscrow).toHaveBeenCalledWith(1);
      expect(escrowClient.holdEscrow).toHaveBeenCalledWith(10);
      expect(emailService.sendOrderConfirmation).toHaveBeenCalledWith(
        'guest@example.com',
        'ORD-123',
        expect.any(Object),
      );
    });

    it('should throw error if guest email is missing', async () => {
      const invalidDto = { ...guestOrderDto, guestEmail: undefined };

      await expect(service.createGuestOrder(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if guest first name is missing', async () => {
      const invalidDto = { ...guestOrderDto, guestFirstName: undefined };

      await expect(service.createGuestOrder(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if guest last name is missing', async () => {
      const invalidDto = { ...guestOrderDto, guestLastName: undefined };

      await expect(service.createGuestOrder(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not fail order creation if email sending fails', async () => {
      prismaService.order.create.mockResolvedValue(mockOrder as any);
      emailService.sendOrderConfirmation.mockRejectedValue(new Error('Email failed'));
      escrowClient.createEscrow.mockResolvedValue({ id: 10 });
      escrowClient.holdEscrow.mockResolvedValue({ id: 10 });

      const result = await service.createGuestOrder(guestOrderDto);

      expect(result).toEqual(mockOrder);
      // Order should still be created even if email fails
    });
  });

  describe('getGuestOrdersByEmail', () => {
    it('should retrieve guest orders by email', async () => {
      const mockOrders = [mockOrder];
      prismaService.order.findMany.mockResolvedValue(mockOrders as any);

      const result = await service.getGuestOrdersByEmail('guest@example.com');

      expect(result).toEqual(mockOrders);
      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: {
          isGuestOrder: true,
          guestEmail: 'guest@example.com',
        },
        select: expect.any(Object),
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('linkGuestOrdersToUser', () => {
    it('should link guest orders to a user account', async () => {
      prismaService.order.updateMany.mockResolvedValue({ count: 2 });
      cacheService.clear.mockResolvedValue(undefined);

      const result = await service.linkGuestOrdersToUser('guest@example.com', 1);

      expect(result.count).toBe(2);
      expect(prismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          isGuestOrder: true,
          guestEmail: 'guest@example.com',
          buyerId: null,
        },
        data: {
          buyerId: 1,
          isGuestOrder: false,
          guestEmail: null,
          guestFirstName: null,
          guestLastName: null,
          guestPhone: null,
        },
      });
      expect(cacheService.clear).toHaveBeenCalledWith('orders:guest:guest@example.com:*');
    });
  });
});


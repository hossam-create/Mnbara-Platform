import { FeeCalculationService, FeeCalculationInput } from './fee-calculation.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            feeRule: {
                findMany: jest.fn(),
            },
        })),
    };
});

describe('FeeCalculationService', () => {
    let service: FeeCalculationService;
    let mockPrisma: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
        service = new FeeCalculationService();
        // Replace prisma instance in service
        (service as any).prisma = mockPrisma;
    });

    describe('calculateFees', () => {
        it('should calculate fees for $50 transaction (Tier 1: 10%)', async () => {
            const input: FeeCalculationInput = {
                price: 50,
                listingType: 'buy_now',
            };

            // Mock no rules (will use defaults)
            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(5.00); // 10% of $50
            expect(result.paymentProcessingFee).toBeCloseTo(1.45, 2); // 2.9% of $50
            expect(result.totalFee).toBeCloseTo(6.45, 2);
            expect(result.netAmount).toBeCloseTo(43.55, 2);
            expect(result.currency).toBe('USD');
        });

        it('should calculate fees for $250 transaction (Tier 2: 8%)', async () => {
            const input: FeeCalculationInput = {
                price: 250,
                listingType: 'buy_now',
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(20.00); // 8% of $250
            expect(result.paymentProcessingFee).toBeCloseTo(7.25, 2); // 2.9% of $250
            expect(result.totalFee).toBeCloseTo(27.25, 2);
            expect(result.netAmount).toBeCloseTo(222.75, 2);
        });

        it('should calculate fees for $1000 transaction (Tier 3: 6%)', async () => {
            const input: FeeCalculationInput = {
                price: 1000,
                listingType: 'buy_now',
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(60.00); // 6% of $1000
            expect(result.paymentProcessingFee).toBeCloseTo(29.00, 2); // 2.9% of $1000
            expect(result.totalFee).toBeCloseTo(89.00, 2);
            expect(result.netAmount).toBeCloseTo(911.00, 2);
        });

        it('should use custom fee rules when available', async () => {
            const input: FeeCalculationInput = {
                price: 100,
                categoryId: 1,
                listingType: 'auction',
            };

            // Mock custom rule
            mockPrisma.feeRule.findMany.mockResolvedValue([
                {
                    id: 1,
                    name: 'Custom Auction Fee',
                    feeType: 'PERCENTAGE',
                    feeValue: 12.00, // 12%
                    paymentProcessingFee: 3.00, // 3%
                    listingFee: 5.00,
                    priority: 10,
                },
            ]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(12.00); // 12% of $100
            expect(result.paymentProcessingFee).toBe(3.00); // 3% of $100
            expect(result.listingFee).toBe(5.00);
            expect(result.totalFee).toBe(20.00);
        });

        it('should throw error for invalid price', async () => {
            const input: FeeCalculationInput = {
                price: -10,
            };

            await expect(service.calculateFees(input)).rejects.toThrow('Price must be greater than 0');
        });

        it('should throw error for price exceeding maximum', async () => {
            const input: FeeCalculationInput = {
                price: 2000000,
            };

            await expect(service.calculateFees(input)).rejects.toThrow('Price exceeds maximum allowed value');
        });

        it('should handle auction listings', async () => {
            const input: FeeCalculationInput = {
                price: 200,
                listingType: 'auction',
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(16.00); // 8% of $200
            expect(result.breakdown.platformFee.description).toBeDefined();
        });

        it('should handle category-specific rules', async () => {
            const input: FeeCalculationInput = {
                price: 150,
                categoryId: 5,
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([
                {
                    id: 2,
                    categoryId: 5,
                    feeType: 'PERCENTAGE',
                    feeValue: 9.00,
                    priority: 5,
                },
            ]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(13.50); // 9% of $150
        });

        it('should return structured breakdown', async () => {
            const input: FeeCalculationInput = {
                price: 100,
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.breakdown).toBeDefined();
            expect(result.breakdown.platformFee).toBeDefined();
            expect(result.breakdown.paymentProcessingFee).toBeDefined();
            expect(result.breakdown.listingFee).toBeDefined();
            expect(result.appliedRules).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle very small prices', async () => {
            const input: FeeCalculationInput = {
                price: 0.01,
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBeGreaterThan(0);
            expect(result.totalFee).toBeGreaterThan(0);
        });

        it('should handle boundary prices (exactly $100)', async () => {
            const input: FeeCalculationInput = {
                price: 100,
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(10.00); // 10% of $100
        });

        it('should handle boundary prices (exactly $500)', async () => {
            const input: FeeCalculationInput = {
                price: 500,
            };

            mockPrisma.feeRule.findMany.mockResolvedValue([]);

            const result = await service.calculateFees(input);

            expect(result.platformFee).toBe(40.00); // 8% of $500
        });
    });
});






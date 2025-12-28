import { PrismaClient } from '@prisma/client';
import { CreateDropshipRequestDto, DropshipStatus, SupplierInfo } from '../types/dropship.types';
import { notificationService } from './notification.service';
import { pricingService } from './pricing.service';

export class DropshipService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // Create new dropship request (like eBay's dropshipping)
    async createDropshipRequest(data: CreateDropshipRequestDto, userId: string) {
        try {
            // Validate supplier exists and is verified
            const supplier = await this.validateSupplier(data.supplierId);
            
            // Calculate fees and pricing
            const pricing = await pricingService.calculateDropshipPricing(data);
            
            // Create dropship order
            const dropshipOrder = await this.prisma.dropshipOrder.create({
                data: {
                    userId,
                    supplierId: data.supplierId,
                    productId: data.productId,
                    quantity: data.quantity,
                    customerAddress: data.customerAddress,
                    totalAmount: pricing.totalAmount,
                    platformFee: pricing.platformFee,
                    supplierPayout: pricing.supplierPayout,
                    status: DropshipStatus.PENDING,
                    estimatedDelivery: data.estimatedDelivery,
                    trackingNumber: null,
                    specialInstructions: data.specialInstructions,
                },
                include: {
                    user: true,
                    supplier: true,
                    product: true,
                }
            });

            // Notify supplier
            await notificationService.sendDropshipNotification({
                type: 'NEW_ORDER',
                recipientId: data.supplierId,
                orderId: dropshipOrder.id,
                amount: pricing.supplierPayout
            });

            return {
                success: true,
                order: dropshipOrder,
                message: 'Dropship order created successfully'
            };
        } catch (error) {
            throw new Error(`Failed to create dropship order: ${error.message}`);
        }
    }

    // Get available suppliers for dropshipping
    async getDropshipSuppliers(filters?: {
        category?: string;
        minRating?: number;
        location?: string;
    }) {
        try {
            const suppliers = await this.prisma.supplier.findMany({
                where: {
                    isVerified: true,
                    isDropshipEnabled: true,
                    rating: filters?.minRating ? { gte: filters.minRating } : undefined,
                    categories: filters?.category ? { has: filters.category } : undefined,
                    location: filters?.location ? { contains: filters.location } : undefined,
                },
                include: {
                    products: {
                        where: { isAvailableForDropship: true },
                        take: 10
                    },
                    stats: true
                }
            });

            return suppliers.map(supplier => ({
                ...supplier,
                dropshipStats: {
                    totalOrders: supplier.stats?.totalDropshipOrders || 0,
                    avgDeliveryTime: supplier.stats?.avgDeliveryTime || 0,
                    successRate: supplier.stats?.dropshipSuccessRate || 0
                }
            }));
        } catch (error) {
            throw new Error(`Failed to fetch suppliers: ${error.message}`);
        }
    }

    // Supplier accepts dropship order
    async acceptDropshipOrder(orderId: string, supplierId: string) {
        try {
            const order = await this.prisma.dropshipOrder.update({
                where: { id: orderId, supplierId },
                data: {
                    status: DropshipStatus.ACCEPTED,
                    acceptedAt: new Date()
                }
            });

            // Notify customer
            await notificationService.sendDropshipNotification({
                type: 'ORDER_ACCEPTED',
                recipientId: order.userId,
                orderId: orderId
            });

            return order;
        } catch (error) {
            throw new Error(`Failed to accept order: ${error.message}`);
        }
    }

    // Update order with tracking information
    async updateTracking(orderId: string, supplierId: string, trackingNumber: string, carrier: string) {
        try {
            const order = await this.prisma.dropshipOrder.update({
                where: { id: orderId, supplierId },
                data: {
                    trackingNumber,
                    carrier,
                    status: DropshipStatus.SHIPPED,
                    shippedAt: new Date()
                }
            });

            // Notify customer with tracking info
            await notificationService.sendDropshipNotification({
                type: 'ORDER_SHIPPED',
                recipientId: order.userId,
                orderId: orderId,
                trackingNumber,
                carrier
            });

            return order;
        } catch (error) {
            throw new Error(`Failed to update tracking: ${error.message}`);
        }
    }

    // Complete dropship order
    async completeDropshipOrder(orderId: string, supplierId: string) {
        try {
            const order = await this.prisma.dropshipOrder.update({
                where: { id: orderId, supplierId },
                data: {
                    status: DropshipStatus.DELIVERED,
                    deliveredAt: new Date()
                }
            });

            // Process supplier payment
            await this.processSupplierPayout(order);

            // Update supplier stats
            await this.updateSupplierStats(supplierId, order);

            // Notify customer
            await notificationService.sendDropshipNotification({
                type: 'ORDER_DELIVERED',
                recipientId: order.userId,
                orderId: orderId
            });

            return order;
        } catch (error) {
            throw new Error(`Failed to complete order: ${error.message}`);
        }
    }

    // Get dropship orders for user/supplier
    async getDropshipOrders(userId: string, role: 'customer' | 'supplier', status?: DropshipStatus) {
        try {
            const whereClause = role === 'customer' 
                ? { userId }
                : { supplierId: userId };

            if (status) {
                whereClause.status = status;
            }

            const orders = await this.prisma.dropshipOrder.findMany({
                where: whereClause,
                include: {
                    user: role === 'supplier',
                    supplier: role === 'customer',
                    product: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return orders;
        } catch (error) {
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }
    }

    // Validate supplier for dropshipping
    private async validateSupplier(supplierId: string): Promise<SupplierInfo> {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id: supplierId },
            include: { stats: true }
        });

        if (!supplier) {
            throw new Error('Supplier not found');
        }

        if (!supplier.isVerified) {
            throw new Error('Supplier is not verified for dropshipping');
        }

        if (!supplier.isDropshipEnabled) {
            throw new Error('Supplier does not have dropshipping enabled');
        }

        return supplier;
    }

    // Process payment to supplier
    private async processSupplierPayout(order: any) {
        // Integration with payment service
        // This would call the payment service to transfer funds
        console.log(`Processing payout of ${order.supplierPayout} to supplier ${order.supplierId}`);
    }

    // Update supplier statistics
    private async updateSupplierStats(supplierId: string, order: any) {
        await this.prisma.supplierStats.update({
            where: { supplierId },
            data: {
                totalDropshipOrders: { increment: 1 },
                totalRevenue: { increment: order.supplierPayout },
                lastOrderAt: new Date()
            }
        });
    }
}

export const dropshipService = new DropshipService();

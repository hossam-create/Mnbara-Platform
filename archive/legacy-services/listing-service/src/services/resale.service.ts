import { PrismaClient } from '@prisma/client';
import { OrdersClient } from './clients/orders.client';
import { PaymentClient } from './clients/payment.client';

const prisma = new PrismaClient();
const ordersClient = new OrdersClient();
const paymentClient = new PaymentClient();

export class ResaleService {
    async createResaleListing(params: {
        sellerId: number;
        orderId: number;
        price?: number;
        currency?: string;
        categoryId: number;
        city: string;
        country: string;
        description?: string;
    }) {
        // 1) Validate order exists, belongs to seller, and completed
        const order = await ordersClient.getOrder(params.orderId);
        if (!order || order.id !== params.orderId) {
            throw new Error('Order not found');
        }
        if (order.buyerId !== params.sellerId) {
            throw new Error('Order does not belong to this user');
        }
        if (!['COMPLETED', 'DELIVERED', 'PAID'].includes(order.status)) {
            throw new Error('Order must be completed before resale');
        }

        // 2) Ensure no existing resale listing for this order
        const existing = await prisma.listing.findFirst({
            where: { originalOrderId: params.orderId, isResale: true },
        });
        if (existing) {
            throw new Error('Resale listing already exists for this order');
        }

        // 3) Fetch receipt (must exist)
        const receipt = await paymentClient.getReceiptByOrder(params.orderId);
        if (!receipt?.receiptUrl) {
            throw new Error('Receipt not found for this order');
        }

        // 4) Build product details from order items
        const firstItem = order.items?.[0];
        const title = firstItem?.productName || 'Resale Item';
        const productUrl = firstItem?.productUrl || null;
        const autoDescription =
            params.description ||
            'Verified imported product (resale). Original purchase via traveler. Receipt available.';

        const listing = await prisma.listing.create({
            data: {
                title,
                description: autoDescription,
                price: params.price ? params.price : order.totalAmount,
                currency: params.currency || order.currency || 'USD',
                sellerId: params.sellerId,
                categoryId: params.categoryId,
                city: params.city,
                country: params.country,
                condition: 'LIKE_NEW',
                quantity: 1,
                images: [], // could be enriched later from stored media
                isAuction: false,
                buyNowPrice: params.price ? params.price : order.totalAmount,
                status: 'ACTIVE',
                isResale: true,
                isVerifiedImported: true,
                originalOrderId: params.orderId,
                originalProductUrl: productUrl,
                verificationReceiptUrl: receipt.receiptUrl,
                publishedAt: new Date(),
              },
        });

        return listing;
    }
}






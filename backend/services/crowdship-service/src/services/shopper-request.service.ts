import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

export class ShopperRequestService {
    private notifier: NotificationService;

    constructor() {
        this.notifier = new NotificationService();
    }

    async createRequest(input: {
        buyerId: number;
        productUrl: string;
        price?: number;
        currency?: string;
        sourceCountry?: string;
        destinationCountry?: string; // Added for SET-001
    }) {
        const meta = await this.fetchMetadata(input.productUrl);

        const request = await prisma.shopperRequest.create({
            data: {
                buyerId: input.buyerId,
                productUrl: input.productUrl,
                title: meta.title,
                price: input.price ?? meta.price ?? null,
                currency: input.currency ?? meta.currency ?? 'USD',
                sourceSite: meta.sourceSite,
                sourceCountry: input.sourceCountry ?? meta.sourceCountry ?? null,
                destinationCountry: input.destinationCountry ?? null, // Added for SET-001
                imageUrl: meta.imageUrl ?? null,
            },
        });

        return request;
    }

    async listAvailableForTraveler(travelerCountry?: string) {
        const where: any = {
            status: { in: ['REQUESTED', 'NEGOTIATING'] },
        };
        if (travelerCountry) {
            where.sourceCountry = travelerCountry;
        }
        return prisma.shopperRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async fetchMetadata(url: string): Promise<{ title?: string; price?: number; currency?: string; sourceSite?: string; sourceCountry?: string; imageUrl?: string }> {
        try {
            const res = await fetch(url);
            const html = await res.text();
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : undefined;
            const sourceSite = new URL(url).hostname;
            // Minimal price parsing fallback: look for price patterns
            const priceMatch = html.match(/\$([0-9]+(\.[0-9]{2})?)/);
            const price = priceMatch ? Number(priceMatch[1]) : undefined;
            return { title, price, currency: 'USD', sourceSite };
        } catch (err) {
            console.warn('Metadata fetch failed, proceeding with minimal data', err);
            return { sourceSite: new URL(url).hostname };
        }
    }
}


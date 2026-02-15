import { PrismaClient, Listing, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class ListingService {
    // Create Listing
    async createListing(data: any) {
        return prisma.listing.create({
            data: {
                ...data,
                status: 'ACTIVE', // Default to active for now
                publishedAt: new Date(),
            },
            include: {
                category: true,
                seller: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    // Get Listings with Filters
    async getListings(filters: any) {
        const {
            page = 1,
            limit = 20,
            categoryId,
            minPrice,
            maxPrice,
            search,
            status = 'ACTIVE',
            city,
            country,
        } = filters;

        const skip = (page - 1) * limit;
        const take = parseInt(limit);

        const where: Prisma.ListingWhereInput = {
            status: status,
            isActive: true,
        };

        if (categoryId) where.categoryId = parseInt(categoryId);
        if (city) where.city = { contains: city, mode: 'insensitive' };
        if (country) where.country = { contains: country, mode: 'insensitive' };

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [listings, total] = await Promise.all([
            prisma.listing.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: true,
                    seller: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            prisma.listing.count({ where }),
        ]);

        return {
            listings,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
            },
        };
    }

    // Get Single Listing
    async getListing(id: number) {
        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                category: true,
                seller: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rating: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!listing) throw new Error('Listing not found');

        // Increment view count async
        prisma.listing.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        }).catch(console.error);

        return listing;
    }

    // Update Listing
    async updateListing(id: number, data: any) {
        return prisma.listing.update({
            where: { id },
            data,
        });
    }

    // Delete Listing (Soft Delete)
    async deleteListing(id: number) {
        return prisma.listing.update({
            where: { id },
            data: {
                status: 'DELETED',
                isActive: false,
            },
        });
    }

    // Mark as Sold
    async markAsSold(id: number) {
        return prisma.listing.update({
            where: { id },
            data: {
                status: 'SOLD',
            },
        });
    }

    // Get Featured Listings
    async getFeaturedListings(limit: number = 10) {
        return prisma.listing.findMany({
            where: {
                isFeatured: true,
                status: 'ACTIVE',
                isActive: true,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
            },
        });
    }
}

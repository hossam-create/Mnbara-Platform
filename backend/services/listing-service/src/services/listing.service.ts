import { PrismaClient, Listing, Prisma, DispositionStatus } from '@prisma/client';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../../../shared/clients/DecisionAuthorityClient';
import { getDecisionAuthorityConfig } from '../config/decisionAuthority.config';

const prisma = new PrismaClient();

export class ListingService {
    private decisionClient: DecisionAuthorityClient;

    constructor() {
        const config = getDecisionAuthorityConfig();
        this.decisionClient = new DecisionAuthorityClient(config);
    }

    // Create Listing with Decision Authority Integration
    async createListing(data: any) {
        // Step 1: Create listing in DRAFT state initially
        const listing = await prisma.listing.create({
            data: {
                ...data,
                status: 'DRAFT', // Start as DRAFT until decision is made
                dispositionStatus: 'PENDING', // Default to PENDING
            },
            include: {
                product: true,
            },
        });

        // Step 2: Request decision if integration is enabled
        if (this.decisionClient.isEnabled()) {
            try {
                const decision = await this.decisionClient.requestDecision({
                    assetType: AssetType.LISTING,
                    assetId: listing.id,
                    metadata: {
                        title: listing.title,
                        price: listing.price.toString(),
                        sellerId: listing.sellerId,
                        categoryId: data.categoryId
                    }
                });

                if (decision) {
                    // Update listing with decision info
                    const updatedListing = await prisma.listing.update({
                        where: { id: listing.id },
                        data: {
                            decisionId: decision.id,
                            decisionRef: decision.decisionRef,
                            decisionRequestedAt: new Date(),
                            dispositionStatus: this.mapDecisionStatusToDisposition(decision.status),
                            status: decision.status === DecisionStatus.APPROVED ? 'ACTIVE' : 'DRAFT',
                            decisionDecidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null
                        },
                        include: {
                            product: true,
                        },
                    });

                    return updatedListing;
                }
            } catch (error) {
                console.error('[ListingService] Decision request failed, falling back to auto-approve:', error);
                // Fallback: Auto-approve on error
                return this.autoApproveListing(listing.id);
            }
        }

        // Step 3: If integration disabled, auto-approve (current behavior)
        return this.autoApproveListing(listing.id);
    }

    // Auto-approve listing (fallback behavior)
    private async autoApproveListing(listingId: string) {
        return prisma.listing.update({
            where: { id: listingId },
            data: {
                status: 'ACTIVE',
                dispositionStatus: 'APPROVED',
                decisionDecidedAt: new Date()
            },
            include: {
                product: true,
            },
        });
    }

    // Map Decision Authority status to Disposition status
    private mapDecisionStatusToDisposition(status: DecisionStatus): DispositionStatus {
        switch (status) {
            case DecisionStatus.PENDING:
                return 'PENDING';
            case DecisionStatus.APPROVED:
                return 'APPROVED';
            case DecisionStatus.REJECTED:
                return 'REJECTED';
            case DecisionStatus.EXPIRED:
                return 'EXPIRED';
            case DecisionStatus.CANCELLED:
                return 'REJECTED'; // Treat cancelled as rejected
            default:
                return 'PENDING';
        }
    }

    // Update listing disposition status (called by webhook or polling)
    async updateDispositionStatus(listingId: string, decisionId: number) {
        if (!this.decisionClient.isEnabled()) {
            return null;
        }

        try {
            const decision = await this.decisionClient.getDecision(decisionId);
            if (!decision) {
                return null;
            }

            return prisma.listing.update({
                where: { id: listingId },
                data: {
                    dispositionStatus: this.mapDecisionStatusToDisposition(decision.status),
                    status: decision.status === DecisionStatus.APPROVED ? 'ACTIVE' : 'DRAFT',
                    decisionDecidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null
                }
            });
        } catch (error) {
            console.error('[ListingService] Failed to update disposition status:', error);
            return null;
        }
    }

    // Get Listings with Filters (enhanced with disposition filter)
    async getListings(filters: any) {
        const {
            page = 1,
            limit = 20,
            categoryId,
            minPrice,
            maxPrice,
            search,
            status = 'ACTIVE',
            dispositionStatus, // NEW: Filter by disposition status
            city,
            country,
        } = filters;

        const skip = (page - 1) * limit;
        const take = parseInt(limit);

        const where: Prisma.ListingWhereInput = {
            status: status,
        };

        // NEW: Filter by disposition status (default to APPROVED for public listings)
        if (dispositionStatus) {
            where.dispositionStatus = dispositionStatus;
        } else if (status === 'ACTIVE') {
            // Public listings should only show APPROVED
            where.dispositionStatus = 'APPROVED';
        }

        if (categoryId) where.productId = categoryId;
        if (city) where.location = { path: ['city'], equals: city };
        if (country) where.location = { path: ['country'], equals: country };

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
                    product: true,
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
    async getListing(id: string) {
        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                product: true,
            },
        });

        if (!listing) throw new Error('Listing not found');

        return listing;
    }

    // Update Listing
    async updateListing(id: string, data: any) {
        return prisma.listing.update({
            where: { id },
            data,
        });
    }

    // Delete Listing (Soft Delete)
    async deleteListing(id: string) {
        return prisma.listing.update({
            where: { id },
            data: {
                status: 'INACTIVE',
                deletedAt: new Date(),
            },
        });
    }

    // Mark as Sold
    async markAsSold(id: string) {
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
                featured: true,
                status: 'ACTIVE',
                dispositionStatus: 'APPROVED', // NEW: Only show approved listings
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                product: true,
            },
        });
    }
}

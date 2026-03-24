import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProductCondition, ProductStatus, ListingType, ModerationStatus } from '@prisma/client';
import { ModerationService } from '../moderation/moderation.service';

export interface ProductFilters {
  sellerId?: string; categoryId?: string; status?: ProductStatus;
  condition?: ProductCondition; listingType?: ListingType;
  minPrice?: number; maxPrice?: number; city?: string; country?: string;
  originCountry?: string; purchaseCountry?: string; deliveryCountry?: string;
  isAuction?: boolean; moderationStatus?: ModerationStatus;
}

export interface PaginationOptions {
  page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
  ) {}

  async createProduct(data: any, sellerId: string) {
    const moderationCheck = await this.moderationService.checkContent(data.title, data.description);
    if (moderationCheck.blocked) throw new BadRequestException('Product content violates platform policies');

    const restrictedCheck = await this.moderationService.checkRestrictedKeywords(
      [data.title, data.description].join(' '),
    );
    if (restrictedCheck.blocked) throw new BadRequestException('Product contains restricted keywords');

    const product = await this.prisma.product.create({
      data: {
        sellerId, categoryId: data.categoryId,
        title: data.title, titleAr: data.titleAr,
        description: data.description, descriptionAr: data.descriptionAr,
        price: data.price, originalPrice: data.originalPrice,
        currency: data.currency || 'USD', discount: data.discount || 0,
        stock: data.stock || 0, sku: data.sku,
        condition: data.condition || ProductCondition.NEW,
        listingType: data.listingType || ListingType.BUY_IT_NOW,
        isAuction: data.listingType === ListingType.AUCTION || data.listingType === ListingType.COMBINED,
        startingBid: data.startingBid, reservePrice: data.reservePrice,
        buyNowPrice: data.buyNowPrice, minBidIncrement: data.minBidIncrement || 1.00,
        auctionEndsAt: data.auctionEndsAt, city: data.city,
        originCountry: data.originCountry, purchaseCountry: data.purchaseCountry,
        deliveryCountry: data.deliveryCountry || data.country,
        moderationStatus: moderationCheck.flagged ? ModerationStatus.FLAGGED : ModerationStatus.PENDING,
        status: moderationCheck.flagged ? ProductStatus.PENDING_REVIEW : ProductStatus.DRAFT,
      },
      include: { images: true, category: true },
    });

    if (data.images?.length > 0) {
      await this.prisma.productImage.createMany({
        data: data.images.map((img: any, index: number) => ({
          productId: product.id, url: img.url, thumbnailUrl: img.thumbnailUrl,
          position: index, isPrimary: index === 0, width: img.width, height: img.height, mimeType: img.mimeType,
        })),
      });
    }

    if (data.specifications) {
      await this.prisma.productSpecification.createMany({
        data: Object.entries(data.specifications).map(([key, value]) => ({
          productId: product.id, key, value: String(value),
        })),
      });
    }

    if (moderationCheck.flagged) {
      await this.moderationService.logAction({
        productId: product.id, action: 'FLAGGED', newStatus: ModerationStatus.FLAGGED, reason: moderationCheck.reason,
      });
    }

    this.logger.log(`Product created: ${product.id} by ${sellerId}`);
    return product;
  }

  async getProductById(id: string, incrementViews = false) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } }, specifications: true, category: true,
        seller: { select: { id: true, name: true, storeName: true, rating: true, trustScore: true } },
        bids: { where: { status: 'ACTIVE' }, orderBy: { amount: 'desc' }, take: 10 },
        offers: { where: { status: 'PENDING' }, orderBy: { offerPrice: 'desc' }, take: 5 },
      },
    });
    if (!product) return null;
    if (incrementViews) {
      await this.prisma.product.update({ where: { id }, data: { views: { increment: 1 } } });
    }
    return product;
  }

  async getProducts(filters: ProductFilters, pagination: PaginationOptions) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    if (filters.condition) where.condition = filters.condition;
    if (filters.listingType) where.listingType = filters.listingType;
    if (filters.isAuction !== undefined) where.isAuction = filters.isAuction;
    if (filters.moderationStatus) where.moderationStatus = filters.moderationStatus;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }
    if (filters.city) where.city = filters.city;
    if (filters.country && !filters.deliveryCountry) where.deliveryCountry = filters.country;
    if (filters.originCountry) where.originCountry = filters.originCountry;
    if (filters.purchaseCountry) where.purchaseCountry = filters.purchaseCountry;
    if (filters.deliveryCountry) where.deliveryCountry = filters.deliveryCountry;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, nameEn: true, nameAr: true } },
        },
        orderBy: { [sortBy]: sortOrder }, skip, take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateProduct(id: string, data: any, sellerId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenException('Not authorized to update this product');
    if (existing.status === ProductStatus.SOLD || existing.status === ProductStatus.ARCHIVED) {
      throw new BadRequestException('Cannot update sold or archived products');
    }

    if (data.title || data.description) {
      const moderationCheck = await this.moderationService.checkContent(
        data.title || existing.title, data.description || existing.description,
      );
      if (moderationCheck.blocked) throw new BadRequestException('Updated content violates platform policies');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.title && { title: data.title }), ...(data.titleAr && { titleAr: data.titleAr }),
        ...(data.description && { description: data.description }), ...(data.descriptionAr && { descriptionAr: data.descriptionAr }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.originalPrice !== undefined && { originalPrice: data.originalPrice }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.condition && { condition: data.condition }),
        ...(data.listingType && { listingType: data.listingType, isAuction: data.listingType === ListingType.AUCTION || data.listingType === ListingType.COMBINED }),
        ...(data.startingBid !== undefined && { startingBid: data.startingBid }),
        ...(data.reservePrice !== undefined && { reservePrice: data.reservePrice }),
        ...(data.buyNowPrice !== undefined && { buyNowPrice: data.buyNowPrice }),
        ...(data.auctionEndsAt && { auctionEndsAt: data.auctionEndsAt }),
        ...(data.city && { city: data.city }),
        ...(data.originCountry && { originCountry: data.originCountry }),
        ...(data.purchaseCountry && { purchaseCountry: data.purchaseCountry }),
        ...((data.deliveryCountry || data.country) && { deliveryCountry: data.deliveryCountry || data.country }),
      },
      include: { images: true, specifications: true, category: true },
    });

    if (data.images) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      await this.prisma.productImage.createMany({
        data: data.images.map((img: any, index: number) => ({
          productId: id, url: img.url, thumbnailUrl: img.thumbnailUrl, position: index, isPrimary: index === 0,
        })),
      });
    }

    if (data.specifications) {
      await this.prisma.productSpecification.deleteMany({ where: { productId: id } });
      await this.prisma.productSpecification.createMany({
        data: Object.entries(data.specifications).map(([key, value]) => ({
          productId: id, key, value: String(value),
        })),
      });
    }

    this.logger.log(`Product updated: ${id} by ${sellerId}`);
    return product;
  }

  async deleteProduct(id: string, sellerId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenException('Not authorized to delete this product');
    await this.prisma.product.update({ where: { id }, data: { status: ProductStatus.DELETED } });
    this.logger.log(`Product deleted: ${id} by ${sellerId}`);
  }

  async publishProduct(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not authorized');
    if (product.status !== ProductStatus.DRAFT && product.status !== ProductStatus.PAUSED) {
      throw new BadRequestException('Product can only be published from DRAFT or PAUSED status');
    }
    if (product.moderationStatus !== ModerationStatus.APPROVED && product.moderationStatus !== ModerationStatus.PENDING) {
      throw new BadRequestException('Product must be approved before publishing');
    }
    const imageCount = await this.prisma.productImage.count({ where: { productId: id } });
    if (imageCount === 0) throw new BadRequestException('Product must have at least one image');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.product.update({
        where: { id },
        data: { status: ProductStatus.ACTIVE, publishedAt: new Date(), moderationStatus: ModerationStatus.APPROVED },
        include: { images: true, category: true },
      });
      await tx.category.update({ where: { id: product.categoryId }, data: { productCount: { increment: 1 } } });
      this.logger.log(`Product published: ${id} by ${sellerId}`);
      return updated;
    });
  }

  async pauseProduct(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not authorized');
    if (product.status !== ProductStatus.ACTIVE) throw new BadRequestException('Only active products can be paused');
    return this.prisma.product.update({ where: { id }, data: { status: ProductStatus.PAUSED }, include: { images: true } });
  }

  async archiveProduct(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not authorized');
    return this.prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED }, include: { images: true } });
  }

  async markAsSold(id: string, buyerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== ProductStatus.ACTIVE) throw new BadRequestException('Only active products can be marked as sold');
    return this.prisma.product.update({ where: { id }, data: { status: ProductStatus.SOLD, stock: 0 }, include: { images: true } });
  }

  async likeProduct(id: string) {
    await this.prisma.product.update({ where: { id }, data: { likes: { increment: 1 } } });
  }
}

import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus, ProductStatus } from '@prisma/client';

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createOffer(productId: string, buyerId: string, offerPrice: number, message?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { seller: { select: { id: true } } } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId === buyerId) throw new BadRequestException('Cannot make an offer on your own product');
    if (product.listingType !== 'MAKE_OFFER' && product.listingType !== 'COMBINED') throw new BadRequestException('This product does not accept offers');
    if (product.status !== ProductStatus.ACTIVE) throw new BadRequestException('Product is not available');

    const existingOffer = await this.prisma.makeOffer.findFirst({
      where: { productId, buyerId, status: { in: [OfferStatus.PENDING, OfferStatus.COUNTERED] } },
    });
    if (existingOffer) throw new BadRequestException('You already have a pending offer on this product');

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const offer = await this.prisma.makeOffer.create({
      data: { productId, buyerId, sellerId: product.sellerId, offerPrice, message, expiresAt, status: OfferStatus.PENDING },
    });
    this.logger.log(`Offer created: ${offer.id} on ${productId}`);
    return offer;
  }

  async acceptOffer(offerId: string, sellerId: string) {
    const offer = await this.prisma.makeOffer.findUnique({ where: { id: offerId }, include: { product: true } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not authorized to accept this offer');
    if (offer.status !== OfferStatus.PENDING && offer.status !== OfferStatus.COUNTERED) throw new BadRequestException('Offer is not pending');
    if (new Date() > offer.expiresAt) throw new BadRequestException('Offer has expired');

    const [acceptedOffer, updatedProduct] = await this.prisma.$transaction([
      this.prisma.makeOffer.update({ where: { id: offerId }, data: { status: OfferStatus.ACCEPTED, respondedAt: new Date() } }),
      this.prisma.product.update({ where: { id: offer.productId }, data: { status: ProductStatus.SOLD, stock: 0, currentBid: offer.offerPrice } }),
      this.prisma.makeOffer.updateMany({
        where: { productId: offer.productId, id: { not: offerId }, status: { in: [OfferStatus.PENDING, OfferStatus.COUNTERED] } },
        data: { status: OfferStatus.EXPIRED, respondedAt: new Date() },
      }),
    ]);
    return { offer: acceptedOffer, product: updatedProduct };
  }

  async declineOffer(offerId: string, sellerId: string) {
    const offer = await this.prisma.makeOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not authorized');
    if (offer.status !== OfferStatus.PENDING) throw new BadRequestException('Offer is not pending');
    return this.prisma.makeOffer.update({ where: { id: offerId }, data: { status: OfferStatus.DECLINED, respondedAt: new Date() } });
  }

  async counterOffer(offerId: string, sellerId: string, counterPrice: number, message?: string) {
    const offer = await this.prisma.makeOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not authorized');
    if (offer.status !== OfferStatus.PENDING) throw new BadRequestException('Can only counter pending offers');
    if (counterPrice >= Number(offer.offerPrice)) throw new BadRequestException('Counter price must be lower than original offer');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return this.prisma.makeOffer.update({
      where: { id: offerId },
      data: { status: OfferStatus.COUNTERED, counterOffer: counterPrice, message, expiresAt, respondedAt: new Date() },
    });
  }

  async respondToCounter(offerId: string, buyerId: string, accept: boolean) {
    const offer = await this.prisma.makeOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.buyerId !== buyerId) throw new ForbiddenException('Not authorized');
    if (offer.status !== OfferStatus.COUNTERED) throw new BadRequestException('No counter offer to respond to');
    if (new Date() > offer.expiresAt) throw new BadRequestException('Counter offer has expired');

    if (accept) {
      if (offer.counterOffer === null) {
        throw new BadRequestException('No counter offer amount available');
      }
      const [acceptedOffer, updatedProduct] = await this.prisma.$transaction([
        this.prisma.makeOffer.update({ where: { id: offerId }, data: { status: OfferStatus.ACCEPTED, offerPrice: offer.counterOffer, respondedAt: new Date() } }),
        this.prisma.product.update({ where: { id: offer.productId }, data: { status: ProductStatus.SOLD, stock: 0, currentBid: offer.counterOffer } }),
      ]);
      return { offer: acceptedOffer, product: updatedProduct };
    } else {
      return this.prisma.makeOffer.update({ where: { id: offerId }, data: { status: OfferStatus.DECLINED, respondedAt: new Date() } });
    }
  }

  async withdrawOffer(offerId: string, userId: string) {
    const offer = await this.prisma.makeOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.buyerId !== userId) throw new ForbiddenException('Not authorized');
    if (offer.status !== OfferStatus.PENDING) throw new BadRequestException('Can only withdraw pending offers');
    return this.prisma.makeOffer.update({ where: { id: offerId }, data: { status: OfferStatus.WITHDRAWN, respondedAt: new Date() } });
  }

  async getProductOffers(productId: string, sellerId?: string) {
    const where: any = { productId };
    if (sellerId) where.sellerId = sellerId;
    return this.prisma.makeOffer.findMany({ where, orderBy: { offerPrice: 'desc' } });
  }

  async getReceivedOffers(userId: string, status?: string) {
    const where: any = { sellerId: userId };
    if (status) where.status = status;
    return this.prisma.makeOffer.findMany({
      where, include: { product: { select: { id: true, title: true, titleAr: true, price: true, images: { take: 1 } } } }, orderBy: { createdAt: 'desc' },
    });
  }

  async getSentOffers(userId: string, status?: string) {
    const where: any = { buyerId: userId };
    if (status) where.status = status;
    return this.prisma.makeOffer.findMany({
      where, include: { product: { select: { id: true, title: true, titleAr: true, price: true, images: { take: 1 } } } }, orderBy: { createdAt: 'desc' },
    });
  }
}

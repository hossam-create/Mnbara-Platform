import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus, BidStatus } from '@prisma/client';

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async placeBid(productId: string, bidderId: string, amount: number, isAutoBid = false, maxAmount?: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { bids: { where: { status: BidStatus.ACTIVE }, orderBy: { amount: 'desc' }, take: 10 } },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isAuction) throw new BadRequestException('This product is not an auction');
    if (product.sellerId === bidderId) throw new BadRequestException('Sellers cannot bid on their own products');
    if (product.status !== ProductStatus.ACTIVE) throw new BadRequestException('Auction is not active');
    if (product.auctionEndsAt && new Date() > product.auctionEndsAt) throw new BadRequestException('Auction has ended');

    const startingBid = product.startingBid ? parseFloat(product.startingBid.toString()) : 0;
    const currentBid = product.currentBid ? parseFloat(product.currentBid.toString()) : 0;
    const minIncrement = product.minBidIncrement ? parseFloat(product.minBidIncrement.toString()) : 1;
    const minBidAmount = Math.max(startingBid, currentBid + minIncrement);
    if (amount < minBidAmount) throw new BadRequestException(`Bid must be at least ${minBidAmount}`);

    let wasExtended = false;
    let extensionInfo: any = undefined;
    if (product.auctionEndsAt) {
      const timeRemaining = new Date(product.auctionEndsAt).getTime() - Date.now();
      if (timeRemaining <= 2 * 60 * 1000) {
        wasExtended = true;
        const previousEndTime = new Date(product.auctionEndsAt);
        const newEndTime = new Date(Date.now() + 2 * 60 * 1000);
        await this.prisma.product.update({ where: { id: productId }, data: { auctionEndsAt: newEndTime } });
        extensionInfo = { previousEndTime, newEndTime };
      }
    }

    const [bid] = await this.prisma.$transaction([
      this.prisma.bid.create({ data: { productId, bidderId, amount, isAutoBid, maxAmount: maxAmount || null, isWinning: true, status: BidStatus.ACTIVE } }),
      ...(product.bids.length > 0 ? [this.prisma.bid.updateMany({ where: { productId, status: BidStatus.ACTIVE, id: { not: product.bids[0].id } }, data: { isWinning: false, status: BidStatus.OUTBID } })] : []),
      this.prisma.product.update({ where: { id: productId }, data: { currentBid: amount } }),
    ]);

    const outbidUsers = product.bids.filter((b: any) => b.bidderId !== bidderId).map((b: any) => b.bidderId);
    this.logger.log(`Bid placed on ${productId} by ${bidderId}: ${amount}`);
    return { success: true, bid, product: { ...product, currentBid: amount }, wasExtended, extensionInfo, outbidUsers };
  }

  async getAuctionStatus(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    const currentBid = await this.prisma.bid.findFirst({ where: { productId, isWinning: true } });
    const bidHistory = await this.prisma.bid.findMany({ where: { productId }, orderBy: { createdAt: 'desc' }, take: 50 });
    const timeRemaining = product.auctionEndsAt ? Math.max(0, new Date(product.auctionEndsAt).getTime() - Date.now()) : 0;
    return { product, currentBid, bidHistory, timeRemaining, bidCount: bidHistory.length };
  }

  async endAuction(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isAuction) throw new BadRequestException('This product is not an auction');

    const highestBid = await this.prisma.bid.findFirst({ where: { productId, status: BidStatus.ACTIVE }, orderBy: { amount: 'desc' } });
    if (!highestBid) {
      await this.prisma.product.update({ where: { id: productId }, data: { status: ProductStatus.PAUSED } });
      return { success: true, winner: null, winningBid: null, reserveMet: false };
    }

    const reservePrice = product.reservePrice ? parseFloat(product.reservePrice.toString()) : null;
    const bidAmount = parseFloat(highestBid.amount.toString());
    const reserveMet = !reservePrice || bidAmount >= reservePrice;

    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { status: reserveMet ? ProductStatus.SOLD : ProductStatus.PAUSED } }),
      this.prisma.bid.update({ where: { id: highestBid.id }, data: { status: BidStatus.WON, isWinning: true } }),
      this.prisma.bid.updateMany({ where: { productId, id: { not: highestBid.id }, status: BidStatus.ACTIVE }, data: { status: BidStatus.OUTBID, isWinning: false } }),
    ]);

    return { success: true, winner: { id: highestBid.bidderId }, winningBid: highestBid, reserveMet };
  }

  async setProxyBid(productId: string, bidderId: string, maxAmount: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isAuction) throw new NotFoundException('Auction not found');
    if (product.sellerId === bidderId) throw new BadRequestException('Sellers cannot set proxy bids');
    this.logger.warn(`Proxy bid is not configured in current schema; request ignored for ${productId}:${bidderId}`);
    return { success: true, message: 'Proxy bid is currently unavailable', productId, bidderId, maxAmount };
  }
}

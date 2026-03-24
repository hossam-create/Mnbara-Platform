import { Controller, Get, Post, Param, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuctionService } from './auction.service';

@ApiTags('Auctions')
@Controller('api/auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Get(':productId')
  @ApiOperation({ summary: 'Get auction status' })
  async getStatus(@Param('productId') productId: string) {
    const data = await this.auctionService.getAuctionStatus(productId);
    return { success: true, data };
  }

  @Post(':productId/bid')
  @ApiOperation({ summary: 'Place a bid' })
  async placeBid(@Param('productId') productId: string, @Body() body: any, @Headers('x-buyer-id') buyerId?: string) {
    const bidderId = buyerId || body.bidderId || 'test-buyer';
    const result = await this.auctionService.placeBid(productId, bidderId, body.amount, body.isAutoBid, body.maxAmount);
    return { success: true, data: result };
  }

  @Post(':productId/end')
  @ApiOperation({ summary: 'End auction' })
  async endAuction(@Param('productId') productId: string) {
    const result = await this.auctionService.endAuction(productId);
    return { success: true, data: result };
  }

  @Post(':productId/proxy')
  @ApiOperation({ summary: 'Set proxy bid' })
  async setProxyBid(@Param('productId') productId: string, @Body() body: any, @Headers('x-buyer-id') buyerId?: string) {
    const bidderId = buyerId || body.bidderId || 'test-buyer';
    await this.auctionService.setProxyBid(productId, bidderId, body.maxAmount);
    return { success: true, message: 'Proxy bid configured', data: { productId, bidderId, maxAmount: body.maxAmount } };
  }
}

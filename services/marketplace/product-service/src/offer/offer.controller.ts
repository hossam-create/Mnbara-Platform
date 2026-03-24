import { Controller, Get, Post, Param, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OfferService } from './offer.service';

@ApiTags('Offers')
@Controller('api/offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @ApiOperation({ summary: 'Create offer' })
  async createOffer(@Body() body: any, @Headers('x-buyer-id') buyerId?: string) {
    const bid = buyerId || body.buyerId || 'test-buyer';
    const offer = await this.offerService.createOffer(body.productId, bid, body.offerPrice, body.message);
    return { success: true, data: offer };
  }

  @Get('received')
  @ApiOperation({ summary: 'Get received offers (seller)' })
  async getReceived(@Headers('x-seller-id') userId?: string) {
    const offers = await this.offerService.getReceivedOffers(userId || 'test-seller');
    return { success: true, data: offers };
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get sent offers (buyer)' })
  async getSent(@Headers('x-buyer-id') userId?: string) {
    const offers = await this.offerService.getSentOffers(userId || 'test-buyer');
    return { success: true, data: offers };
  }

  @Post(':offerId/accept')
  @ApiOperation({ summary: 'Accept offer' })
  async accept(@Param('offerId') offerId: string, @Headers('x-seller-id') sellerId?: string) {
    const result = await this.offerService.acceptOffer(offerId, sellerId || 'test-seller');
    return { success: true, message: 'Offer accepted', data: result };
  }

  @Post(':offerId/decline')
  @ApiOperation({ summary: 'Decline offer' })
  async decline(@Param('offerId') offerId: string, @Headers('x-seller-id') sellerId?: string) {
    const result = await this.offerService.declineOffer(offerId, sellerId || 'test-seller');
    return { success: true, message: 'Offer declined', data: result };
  }

  @Post(':offerId/counter')
  @ApiOperation({ summary: 'Counter offer' })
  async counter(@Param('offerId') offerId: string, @Body() body: any, @Headers('x-seller-id') sellerId?: string) {
    const result = await this.offerService.counterOffer(offerId, sellerId || 'test-seller', body.counterPrice, body.message);
    return { success: true, message: 'Counter offer sent', data: result };
  }

  @Post(':offerId/respond')
  @ApiOperation({ summary: 'Respond to counter offer' })
  async respond(@Param('offerId') offerId: string, @Body() body: any, @Headers('x-buyer-id') buyerId?: string) {
    const result = await this.offerService.respondToCounter(offerId, buyerId || 'test-buyer', body.accept);
    return { success: true, message: body.accept ? 'Counter offer accepted' : 'Counter offer declined', data: result };
  }

  @Post(':offerId/withdraw')
  @ApiOperation({ summary: 'Withdraw offer' })
  async withdraw(@Param('offerId') offerId: string, @Headers('x-user-id') userId?: string) {
    const result = await this.offerService.withdrawOffer(offerId, userId || 'test-user');
    return { success: true, message: 'Offer withdrawn', data: result };
  }
}

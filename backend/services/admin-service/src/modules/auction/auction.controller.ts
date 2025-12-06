import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('auction')
@UseGuards(JwtAuthGuard)
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post('listing')
  async createListing(@Request() req, @Body() dto: CreateListingDto) {
    return this.auctionService.createListing(req.user.userId, dto);
  }

  @Get('listing/:id')
  async getListing(@Param('id') id: number) {
    return this.auctionService.getListing(id);
  }

  @Post('bid')
  async placeBid(@Request() req, @Body() dto: PlaceBidDto) {
    return this.auctionService.placeBid(req.user.userId, dto);
  }

  @Post('buy-now/:listingId')
  async buyNow(@Request() req, @Param('listingId') listingId: number) {
    return this.auctionService.buyNow(req.user.userId, listingId);
  }
}

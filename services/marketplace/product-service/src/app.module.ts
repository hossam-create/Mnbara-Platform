import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { AuctionModule } from './auction/auction.module';
import { OfferModule } from './offer/offer.module';
import { ModerationModule } from './moderation/moderation.module';
import { CategoryModule } from './category/category.module';
import { SearchModule } from './search/search.module';
import { ImageModule } from './image/image.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    ProductModule,
    AuctionModule,
    OfferModule,
    ModerationModule,
    CategoryModule,
    SearchModule,
    ImageModule,
  ],
})
export class AppModule {}

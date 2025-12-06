import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { AuctionProcessor } from './auction.processor';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'auction-queue',
    }),
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionProcessor],
  exports: [AuctionService],
})
export class AuctionModule {}

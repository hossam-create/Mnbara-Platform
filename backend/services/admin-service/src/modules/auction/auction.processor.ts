import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AuctionService } from './auction.service';
import { Logger } from '@nestjs/common';

@Processor('auction-queue')
export class AuctionProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionProcessor.name);

  constructor(private readonly auctionService: AuctionService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job: ${job.name} for listing ${job.data.listingId}`);

    switch (job.name) {
      case 'close-auction':
        const result = await this.auctionService.closeAuction(job.data.listingId);
        this.logger.log(`Auction ${job.data.listingId} closed: ${result.success}`);
        return result;

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}

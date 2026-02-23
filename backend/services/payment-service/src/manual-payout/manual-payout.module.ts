import { Module } from '@nestjs/common';
import { ManualPayoutController } from './manual-payout.controller';
import { ManualPayoutService } from './manual-payout.service';

@Module({
  controllers: [ManualPayoutController],
  providers: [ManualPayoutService],
  exports: [ManualPayoutService],
})
export class ManualPayoutModule {}

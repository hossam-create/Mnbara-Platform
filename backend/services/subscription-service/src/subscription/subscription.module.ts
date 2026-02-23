import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, JwtAuthGuard],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationNotificationService } from './location-notification.service';

@Module({
  controllers: [LocationController],
  providers: [LocationNotificationService],
  exports: [LocationNotificationService],
})
export class LocationModule {}

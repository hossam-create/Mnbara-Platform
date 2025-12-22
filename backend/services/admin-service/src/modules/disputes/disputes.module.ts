/**
 * Disputes Module
 * Requirements: 12.1, 12.2, 12.3, 12.4, 17.1, 17.2, 17.3
 * Handles admin dispute resolution functionality
 */

import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

@Module({
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}

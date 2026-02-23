import { Module } from '@nestjs/common';
import { DisputeSystemController } from './dispute-system.controller';
import { DisputeSystemService } from './dispute-system.service';

@Module({
  controllers: [DisputeSystemController],
  providers: [DisputeSystemService],
  exports: [DisputeSystemService],
})
export class DisputeSystemModule {}

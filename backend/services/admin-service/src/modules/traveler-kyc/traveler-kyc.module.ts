import { Module } from '@nestjs/common';
import { TravelerKycController } from './traveler-kyc.controller';
import { TravelerKycService } from './traveler-kyc.service';
import { DatabaseModule } from '../../database/database.module';
import { KycGuard } from './guards/kyc.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [TravelerKycController],
  providers: [TravelerKycService, KycGuard],
  exports: [TravelerKycService, KycGuard],
})
export class TravelerKycModule {}
import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { KycGuard } from './kyc.guard';
import { KycService } from './kyc.service';

@Module({
  providers: [AuthGuard, KycGuard, KycService],
  exports: [AuthGuard, KycGuard, KycService],
})
export class AuthModule {}
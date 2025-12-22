import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { KycGuard } from '../guards/kyc.guard';

export function KycRequired() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, KycGuard)
  );
}
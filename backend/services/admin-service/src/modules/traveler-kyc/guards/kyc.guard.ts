import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TravelerKycService } from '../traveler-kyc.service';

@Injectable()
export class KycGuard implements CanActivate {
  constructor(private readonly travelerKycService: TravelerKycService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get KYC status
    const kycStatus = await this.travelerKycService.getKycStatus(user.id);

    // Allow if KYC is verified
    if (kycStatus.kycVerified && kycStatus.status === 'verified') {
      return true;
    }

    // Block with appropriate error message
    if (kycStatus.status === 'rejected') {
      throw new ForbiddenException(
        `KYC verification rejected: ${kycStatus.rejectionReason || 'Please contact support'}`
      );
    }

    if (kycStatus.status === 'submitted' || kycStatus.status === 'under_review') {
      throw new ForbiddenException(
        'KYC verification is under review. Please wait for approval.'
      );
    }

    throw new ForbiddenException(
      'Full KYC verification required to access this resource. Please complete your verification.'
    );
  }
}
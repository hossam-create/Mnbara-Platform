import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { kycVerified } from '../../../../shared/middleware';
import { KycService } from './kyc.service';

@Injectable()
export class KycGuard implements CanActivate {
  constructor(private readonly kycService: KycService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Create the KYC check function using HTTP service
    const checkKycStatus = async (userId: number): Promise<boolean> => {
      try {
        return await this.kycService.isTravelerVerified(userId);
      } catch (error) {
        console.error('KYC check error:', error);
        return false;
      }
    };

    return new Promise<boolean>((resolve) => {
      // Create a mock next function that resolves the promise
      const next = (error?: any) => {
        if (error) {
          resolve(false);
        } else {
          resolve(true);
        }
      };

      // Call the KYC verification middleware
      const middleware = kycVerified(checkKycStatus);
      middleware(request, response, next);
    });
  }
}
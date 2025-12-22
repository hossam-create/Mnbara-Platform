import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface KycStatusResponse {
  userId: number;
  status: string;
  isVerified: boolean;
  canViewRequests: boolean;
  canAcceptRequests: boolean;
  message: string;
  applicationId?: number;
}

@Injectable()
export class KycService {
  private readonly authServiceBaseUrl: string;

  constructor() {
    this.authServiceBaseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  }

  async checkTravelerKycStatus(userId: number): Promise<KycStatusResponse> {
    try {
      const response = await axios.get(
        `${this.authServiceBaseUrl}/api/traveler-kyc/status/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // KYC record not found - traveler hasn't started verification
        return {
          userId,
          status: 'DRAFT',
          isVerified: false,
          canViewRequests: false,
          canAcceptRequests: false,
          message: 'KYC not started. Complete verification to access traveler features.',
        };
      }

      console.error('KYC status check failed:', error.message);
      throw new Error(`Failed to check KYC status: ${error.message}`);
    }
  }

  async isTravelerVerified(userId: number): Promise<boolean> {
    try {
      const status = await this.checkTravelerKycStatus(userId);
      return status.isVerified;
    } catch (error) {
      console.error('KYC verification check failed:', error);
      return false;
    }
  }
}
/**
 * Traveler Full KYC & Trust Verification Types (V2 - Enhanced)
 */

export interface TravelerKycV2Payload {
  fullName: string;
  nationalIdNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  countryOfResidence?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  trustScoreConsent?: boolean;
}

export interface TravelerKycDocumentMeta {
  type: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export type TravelerKycVerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
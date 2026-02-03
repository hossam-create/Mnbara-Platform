export interface KYCSubmitDto {
  userId: number;
  idType: 'passport' | 'national_id' | 'driver_license';
  idNumber: string;
  fullName: string;
  idPhoto: Express.Multer.File;
  selfiePhoto: Express.Multer.File;
}

export interface KYCVerificationResult {
  id: number;
  userId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  ocrMatch?: boolean;
  faceMatch?: boolean;
  faceConfidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminReviewDto {
  verificationId: number;
  adminId: number;
  approved: boolean;
  rejectionReason?: string;
}

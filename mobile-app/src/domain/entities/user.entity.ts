// User entity - Domain model

export type UserRole = 'shopper' | 'traveler';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  profilePhoto?: string;
  role: UserRole;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  bio?: string;
  address?: Address;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  isDrivingLicenseVerified?: boolean;
  rating: number;
  totalReviews: number;
  totalDeliveries: number;
  totalTrips: number;
  memberSince: string;
  walletBalance?: number;
  verificationBadges: VerificationBadge[];
  emergencyContact?: EmergencyContact;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface VerificationBadge {
  type: 'email' | 'phone' | 'id' | 'driving_license' | 'social';
  label: string;
  verifiedAt: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface UserProfileUpdate {
  fullName?: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  gender?: User['gender'];
  bio?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  language?: string;
}

export interface VehicleInfo {
  type: 'car' | 'bike' | 'van' | 'truck';
  make?: string;
  model?: string;
  year?: string;
  licensePlate?: string;
  color?: string;
  numberOfSeats?: number;
  photos?: string[];
}

export interface TravelerInfo extends VehicleInfo {
  maxPackageSize: 'small' | 'medium' | 'large' | 'xlarge';
  instantBooking: boolean;
  preferences?: string[];
}

export default User;

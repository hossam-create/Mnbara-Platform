export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  verificationStatus?: VerificationStatus;
  profile: {
    bio?: string;
    location?: {
      country: string;
      city?: string;
    };
    preferences?: {
      notifications: boolean;
      language: string;
    };
  };
  stats: {
    totalRequests: number;
    completedRequests: number;
    averageRating: number;
    responseTime: number; // in hours
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  REQUESTER = 'REQUESTER',
  TRAVELER = 'TRAVELER',
  ADMIN = 'ADMIN'
}

export enum VerificationStatus {
  NOT_VERIFIED = 'NOT_VERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  profile?: {
    bio?: string;
    location?: {
      country: string;
      city?: string;
    };
    preferences?: {
      notifications: boolean;
      language: string;
    };
  };
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  profile?: {
    bio?: string;
    location?: {
      country?: string;
      city?: string;
    };
    preferences?: {
      notifications?: boolean;
      language?: string;
    };
  };
}

export interface TravelerProfile {
  userId: string;
  currentLocation: {
    country: string;
    city?: string;
  };
  destinations: string[]; // Preferred destination countries
  travelSchedule: {
    from: Date;
    to: Date;
    route: string[];
    capacity: {
      weight: number; // kg
      dimensions?: {
        length: number;
        width: number;
        height: number;
      };
    };
  }[];
  preferences: {
    maxDistance: number; // km
    productTypes: string[];
    minReward: number;
  };
  stats: {
    totalDeliveries: number;
    successRate: number;
    averageDeliveryTime: number; // days
    totalEarnings: number;
  };
}

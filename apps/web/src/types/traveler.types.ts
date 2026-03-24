/**
 * Traveler Types and Interfaces
 * Foundation for traveler journey UI (no financial execution)
 */

export enum TravelerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum VerificationStatus {
  NOT_VERIFIED = 'NOT_VERIFIED',
  ID_VERIFIED = 'ID_VERIFIED',
  RATING_BADGE = 'RATING_BADGE',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  FULLY_VERIFIED = 'FULLY_VERIFIED'
}

export enum TripStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface TravelerRoute {
  id: string;
  fromCountry: string;
  toCountry: string;
  fromCity?: string;
  toCity?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  nextAvailable?: string;
  estimatedDuration?: number; // in hours
  capacity?: number; // max items/weight
}

export interface Traveler {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  status: TravelerStatus;
  verificationStatus: {
    idVerified: boolean;
    ratingBadge: boolean;
    backgroundCheck: boolean;
  };
  routes: TravelerRoute[];
  feeModel: {
    type: 'flat' | 'percentage';
    amount: number;
    currency: string;
  };
  rating: number;
  completedOrders: number;
  totalEarnings: number; // READ-ONLY
  joinedAt: string;
  lastActive: string;
  bio?: string;
  languages: string[];
  preferredCategories: string[];
}

export interface Trip {
  id: string;
  travelerId: string;
  origin: {
    country: string;
    city?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    country: string;
    city?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity: {
    weight?: number; // in kg
    volume?: number; // in cubic cm
    items?: number; // max number of items
  };
  departureDate?: string;
  arrivalDate?: string;
  status: TripStatus;
  acceptedRequests: DeliveryRequest[];
  earnings: number; // READ-ONLY
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRequest {
  id: string;
  tripId: string;
  requesterId: string;
  itemDescription: string;
  weight?: number;
  volume?: number;
  value?: number;
  urgency: 'standard' | 'express' | 'urgent';
  specialInstructions?: string;
  status: DeliveryStatus;
  timeline: DeliveryTimeline[];
  estimatedDelivery?: string;
  actualDelivery?: string;
  compensation?: {
    amount: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryTimeline {
  id: string;
  requestId: string;
  status: DeliveryStatus;
  timestamp: string;
  location?: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  description: string;
  actor: 'traveler' | 'requester' | 'system';
  notes?: string;
}

export interface TravelerDashboard {
  traveler: Traveler;
  activeTrips: Trip[];
  recentActivity: {
    type: 'trip_created' | 'request_accepted' | 'delivery_completed' | 'rating_received';
    description: string;
    timestamp: string;
  }[];
  stats: {
    totalTrips: number;
    completedTrips: number;
    totalEarnings: number; // READ-ONLY
    averageRating: number;
    activeRequests: number;
    pendingEarnings: number; // READ-ONLY
  };
}

export interface CreateTripData {
  origin: {
    country: string;
    city?: string;
    address?: string;
  };
  destination: {
    country: string;
    city?: string;
    address?: string;
  };
  capacity: {
    weight?: number;
    volume?: number;
    items?: number;
  };
  departureDate?: string;
  arrivalDate?: string;
  frequency?: 'one-time' | 'weekly' | 'monthly';
  notes?: string;
}

export interface TripFilters {
  status?: TripStatus[];
  origin?: string;
  destination?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  capacity?: {
    min?: number;
    max?: number;
  };
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'departureDate' | 'earnings';
  sortOrder?: 'asc' | 'desc';
}

// Helper functions for traveler status and verification
export const getTravelerStatusColor = (status: TravelerStatus): string => {
  switch (status) {
    case TravelerStatus.APPROVED:
    case TravelerStatus.ACTIVE:
      return '#10b981'; // Green
    case TravelerStatus.PENDING:
      return '#f59e0b'; // Yellow
    case TravelerStatus.SUSPENDED:
    case TravelerStatus.INACTIVE:
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

export const getTravelerStatusLabel = (status: TravelerStatus): string => {
  switch (status) {
    case TravelerStatus.APPROVED:
      return 'Approved';
    case TravelerStatus.ACTIVE:
      return 'Active';
    case TravelerStatus.PENDING:
      return 'Pending';
    case TravelerStatus.SUSPENDED:
      return 'Suspended';
    case TravelerStatus.INACTIVE:
      return 'Inactive';
    default:
      return 'Unknown';
  }
};

export const getVerificationStatusColor = (status: VerificationStatus): string => {
  switch (status) {
    case VerificationStatus.FULLY_VERIFIED:
    case VerificationStatus.BACKGROUND_CHECK:
      return '#10b981'; // Green
    case VerificationStatus.ID_VERIFIED:
    case VerificationStatus.RATING_BADGE:
      return '#3b82f6'; // Blue
    case VerificationStatus.NOT_VERIFIED:
      return '#6b7280'; // Gray
    default:
      return '#f59e0b'; // Yellow
  }
};

export const getTripStatusColor = (status: TripStatus): string => {
  switch (status) {
    case TripStatus.PUBLISHED:
    case TripStatus.ACCEPTED:
    case TripStatus.IN_PROGRESS:
      return '#10b981'; // Green
    case TripStatus.DRAFT:
      return '#6b7280'; // Gray
    case TripStatus.COMPLETED:
      return '#3b82f6'; // Blue
    case TripStatus.CANCELLED:
    case TripStatus.EXPIRED:
      return '#ef4444'; // Red
    default:
      return '#f59e0b'; // Yellow
  }
};

export const getTripStatusLabel = (status: TripStatus): string => {
  switch (status) {
    case TripStatus.DRAFT:
      return 'Draft';
    case TripStatus.PUBLISHED:
      return 'Published';
    case TripStatus.ACCEPTED:
      return 'Accepted';
    case TripStatus.IN_PROGRESS:
      return 'In Progress';
    case TripStatus.COMPLETED:
      return 'Completed';
    case TripStatus.CANCELLED:
      return 'Cancelled';
    case TripStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Unknown';
  }
};

export const getDeliveryStatusColor = (status: DeliveryStatus): string => {
  switch (status) {
    case DeliveryStatus.DELIVERED:
      return '#10b981'; // Green
    case DeliveryStatus.ACCEPTED:
    case DeliveryStatus.PICKED_UP:
    case DeliveryStatus.IN_TRANSIT:
      return '#3b82f6'; // Blue
    case DeliveryStatus.PENDING:
      return '#f59e0b'; // Yellow
    case DeliveryStatus.FAILED:
    case DeliveryStatus.CANCELLED:
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

export const getDeliveryStatusLabel = (status: DeliveryStatus): string => {
  switch (status) {
    case DeliveryStatus.PENDING:
      return 'Pending';
    case DeliveryStatus.ACCEPTED:
      return 'Accepted';
    case DeliveryStatus.PICKED_UP:
      return 'Picked Up';
    case DeliveryStatus.IN_TRANSIT:
      return 'In Transit';
    case DeliveryStatus.DELIVERED:
      return 'Delivered';
    case DeliveryStatus.FAILED:
      return 'Failed';
    case DeliveryStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isTripActive = (trip: Trip): boolean => {
  const now = new Date();
  const departure = trip.departureDate ? new Date(trip.departureDate) : null;
  const arrival = trip.arrivalDate ? new Date(trip.arrivalDate) : null;
  
  return trip.status === TripStatus.PUBLISHED || 
         trip.status === TripStatus.ACCEPTED || 
         trip.status === TripStatus.IN_PROGRESS;
};

export const getTripProgress = (trip: Trip): number => {
  switch (trip.status) {
    case TripStatus.DRAFT:
      return 0;
    case TripStatus.PUBLISHED:
      return 20;
    case TripStatus.ACCEPTED:
      return 40;
    case TripStatus.IN_PROGRESS:
      return 60;
    case TripStatus.COMPLETED:
      return 100;
    case TripStatus.CANCELLED:
    case TripStatus.EXPIRED:
      return 0;
    default:
      return 0;
  }
};

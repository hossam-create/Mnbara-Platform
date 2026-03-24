// Delivery Entity - Domain Model
// Represents a delivery request from a shopper

export type DeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export type PackageSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface DeliveryLocation {
  id: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  instructions?: string;
}

export interface PackageDetails {
  description: string;
  size: PackageSize;
  weight: number; // in kg
  fragile: boolean;
  handlingInstructions?: string;
}

export interface DeliveryMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  uploadedAt: string;
}

export interface DeliveryPricing {
  basePrice: number;
  serviceFee: number;
  totalPrice: number;
  currency: string;
  estimatedEarnings: number;
}

export interface Delivery {
  id: string;
  shopperId: string;
  shopperName: string;
  shopperAvatar?: string;
  travelerId?: string;
  travelerName?: string;
  travelerAvatar?: string;
  
  // Pickup details
  pickup: DeliveryLocation;
  pickupDate: string;
  pickupTimeWindow: {
    start: string;
    end: string;
  };
  
  // Delivery details
  dropoff: DeliveryLocation;
  deliveryDate: string;
  deliveryTimeWindow: {
    start: string;
    end: string;
  };
  
  // Package details
  package: PackageDetails;
  media: DeliveryMedia[];
  
  // Pricing
  pricing: DeliveryPricing;
  
  // Status tracking
  status: DeliveryStatus;
  statusHistory: Array<{
    status: DeliveryStatus;
    timestamp: string;
    note?: string;
  }>;
  
  // Matching
  matchedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  
  // Communication
  hasChat: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Create Delivery Request DTO
export interface CreateDeliveryRequest {
  pickup: Omit<DeliveryLocation, 'id'>;
  pickupDate: string;
  pickupTimeWindow: {
    start: string;
    end: string;
  };
  dropoff: Omit<DeliveryLocation, 'id'>;
  deliveryDate: string;
  deliveryTimeWindow: {
    start: string;
    end: string;
  };
  package: PackageDetails;
  media?: File[];
}

// Update Delivery Request DTO
export interface UpdateDeliveryRequest {
  pickup?: Partial<Omit<DeliveryLocation, 'id'>>;
  dropoff?: Partial<Omit<DeliveryLocation, 'id'>>;
  pickupDate?: string;
  deliveryDate?: string;
  package?: Partial<PackageDetails>;
  status?: DeliveryStatus;
}

// Delivery List Filter
export interface DeliveryFilter {
  status?: DeliveryStatus[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'deliveryDate' | 'price';
  sortOrder?: 'asc' | 'desc';
}

// Delivery Statistics
export interface DeliveryStats {
  total: number;
  pending: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
}

// Delivery Response from API
export interface DeliveryResponse {
  data: Delivery;
  success: boolean;
  message?: string;
}

// Delivery List Response from API
export interface DeliveryListResponse {
  data: Delivery[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

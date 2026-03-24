// Trip Entity - Domain Model
// Represents a trip from a traveler

export type TripStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface TripLocation {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface TripStop {
  location: TripLocation;
  arrivalDate: string;
  departureDate: string;
  order: number;
}

export interface TripPricing {
  pricePerKg: number;
  maxWeight: number;
  currency: string;
  estimatedEarnings: number;
}

export interface Trip {
  id: string;
  travelerId: string;
  travelerName: string;
  travelerAvatar?: string;
  travelerRating: number;
  travelerCompletedTrips: number;
  
  // Route details
  stops: TripStop[];
  origin: TripLocation;
  destination: TripLocation;
  
  // Trip dates
  departureDate: string;
  arrivalDate: string;
  
  // Availability
  availableWeight: number; // in kg
  maxWeight: number;
  currentWeight: number;
  
  // Pricing
  pricing: TripPricing;
  
  // Status
  status: TripStatus;
  
  // Description
  description?: string;
  notes?: string;
  
  // Matching
  activeMatches: number;
  completedDeliveries: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Create Trip Request DTO
export interface CreateTripRequest {
  origin: Omit<TripLocation, 'id'>;
  destination: Omit<TripLocation, 'id'>;
  stops?: Array<{
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    arrivalDate: string;
    departureDate: string;
  }>;
  departureDate: string;
  arrivalDate: string;
  maxWeight: number;
  pricePerKg: number;
  currency: string;
  description?: string;
  notes?: string;
}

// Update Trip Request DTO
export interface UpdateTripRequest {
  departureDate?: string;
  arrivalDate?: string;
  maxWeight?: number;
  pricePerKg?: number;
  description?: string;
  notes?: string;
  status?: TripStatus;
}

// Trip Filter
export interface TripFilter {
  originCity?: string;
  destinationCity?: string;
  dateFrom?: string;
  dateTo?: string;
  maxWeight?: number;
  sortBy?: 'price' | 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// Trip Statistics
export interface TripStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
}

// Trip Response from API
export interface TripResponse {
  data: Trip;
  success: boolean;
  message?: string;
}

// Trip List Response from API
export interface TripListResponse {
  data: Trip[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

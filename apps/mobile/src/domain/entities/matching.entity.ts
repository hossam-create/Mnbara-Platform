// Matching Entity - Domain Model
// Represents the matching between deliveries and trips

export type MatchStatus =
  | 'pending'
  | 'suggested'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'completed';

export type MatchScoreReason =
  | 'route_overlap'
  | 'timing'
  | 'price'
  | 'rating'
  | 'reviews';

export interface MatchScore {
  overall: number;
  routeMatch: number;
  timingMatch: number;
  priceMatch: number;
  ratingMatch: number;
  reasons: MatchScoreReason[];
}

export interface MatchLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface MatchDelivery {
  id: string;
  pickup: MatchLocation;
  dropoff: MatchLocation;
  pickupDate: string;
  deliveryDate: string;
  packageSize: string;
  weight: number;
  price: number;
}

export interface MatchTrip {
  id: string;
  origin: MatchLocation;
  destination: MatchLocation;
  departureDate: string;
  arrivalDate: string;
  availableWeight: number;
  pricePerKg: number;
  travelerName: string;
  travelerRating: number;
}

export interface Match {
  id: string;
  delivery: MatchDelivery;
  trip: MatchTrip;
  
  // Match details
  score: MatchScore;
  status: MatchStatus;
  
  // Earnings
  potentialEarnings: number;
  commission: number;
  netEarnings: number;
  
  // Timestamps
  suggestedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  completedAt?: string;
  expiresAt: string;
  
  // Notes
  travelerNote?: string;
  shopperNote?: string;
}

// Create Match Request DTO
export interface CreateMatchRequest {
  deliveryId: string;
  tripId: string;
  travelerNote?: string;
}

// Accept Match Request DTO
export interface AcceptMatchRequest {
  matchId: string;
  shopperNote?: string;
}

// Match Filter
export interface MatchFilter {
  status?: MatchStatus[];
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  sortBy?: 'score' | 'price' | 'date';
  sortOrder?: 'asc' | 'desc';
}

// Match Statistics
export interface MatchStats {
  total: number;
  pending: number;
  accepted: number;
  completed: number;
  declined: number;
  totalEarnings: number;
}

// Match Response from API
export interface MatchResponse {
  data: Match;
  success: boolean;
  message?: string;
}

// Match List Response from API
export interface MatchListResponse {
  data: Match[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Search Request
export interface SearchRequest {
  type: 'delivery' | 'trip';
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  weight?: number;
  maxPrice?: number;
  minRating?: number;
}

// Search Result
export interface SearchResult<T> {
  item: T;
  matchScore: number;
  highlightedFields?: string[];
}

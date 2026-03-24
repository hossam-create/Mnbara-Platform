/**
 * Traveler Service
 * Client-side traveler journey management (no financial execution)
 */

import {
  Traveler,
  Trip,
  DeliveryRequest,
  TravelerDashboard,
  TripStatus,
  DeliveryStatus,
  CreateTripData,
  TripFilters,
  formatCurrency,
  formatDate,
  isTripActive,
  getTripProgress
} from '../types/traveler.types';

// Mock traveler data
const mockTraveler: Traveler = {
  id: 'traveler_001',
  name: 'Ahmed Hassan',
  email: 'ahmed.hassan@mnbara.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4?w=150&h=150&fit=crop&crop=face',
  phone: '+20 123 456 7890',
  status: 'APPROVED' as any,
  verificationStatus: {
    idVerified: true,
    ratingBadge: true,
    backgroundCheck: true
  },
  routes: [
    {
      id: 'route_001',
      fromCountry: 'Egypt',
      toCountry: 'UAE',
      fromCity: 'Cairo',
      toCity: 'Dubai',
      frequency: 'weekly',
      nextAvailable: '2025-01-20',
      estimatedDuration: 3,
      capacity: 50
    },
    {
      id: 'route_002',
      fromCountry: 'UAE',
      toCountry: 'Saudi Arabia',
      fromCity: 'Dubai',
      toCity: 'Riyadh',
      frequency: 'daily',
      nextAvailable: '2025-01-18',
      estimatedDuration: 2,
      capacity: 30
    }
  ],
  feeModel: {
    type: 'percentage',
    amount: 5,
    currency: 'USD'
  },
  rating: 4.8,
  completedOrders: 127,
  totalEarnings: 15420.50,
  joinedAt: '2024-01-15T10:30:00Z',
  lastActive: '2025-01-17T14:20:00Z',
  bio: 'Professional traveler with 3+ years experience. Specialized in electronics and luxury items transport.',
  languages: ['Arabic', 'English', 'French'],
  preferredCategories: ['Electronics', 'Fashion', 'Luxury Goods']
};

// Mock trips data
const mockTrips: Trip[] = [
  {
    id: 'trip_001',
    travelerId: 'traveler_001',
    origin: {
      country: 'Egypt',
      city: 'Cairo',
      address: 'Cairo International Airport'
    },
    destination: {
      country: 'UAE',
      city: 'Dubai',
      address: 'Dubai International Airport'
    },
    capacity: {
      weight: 25,
      volume: 50000,
      items: 10
    },
    departureDate: '2025-01-20T08:00:00Z',
    arrivalDate: '2025-01-20T14:00:00Z',
    status: 'PUBLISHED' as any,
    acceptedRequests: [
      {
        id: 'req_001',
        tripId: 'trip_001',
        requesterId: 'user_001',
        itemDescription: 'Electronics package - 2kg',
        weight: 2,
        volume: 5000,
        value: 1500,
        urgency: 'standard',
        specialInstructions: 'Handle with care',
        status: 'ACCEPTED' as any,
        timeline: [
          {
            id: 'timeline_001',
            requestId: 'req_001',
            status: 'PENDING' as any,
            timestamp: '2025-01-18T10:30:00Z',
            description: 'Request submitted',
            actor: 'requester'
          },
          {
            id: 'timeline_002',
            requestId: 'req_001',
            status: 'ACCEPTED' as any,
            timestamp: '2025-01-18T11:15:00Z',
            description: 'Request accepted by traveler',
            actor: 'traveler'
          }
        ],
        estimatedDelivery: '2025-01-20T16:00:00Z',
        createdAt: '2025-01-18T10:30:00Z',
        updatedAt: '2025-01-18T11:15:00Z'
      }
    ],
    earnings: 75.00,
    createdAt: '2025-01-17T09:00:00Z',
    updatedAt: '2025-01-18T11:15:00Z'
  },
  {
    id: 'trip_002',
    travelerId: 'traveler_001',
    origin: {
      country: 'UAE',
      city: 'Dubai',
      address: 'Dubai International Airport'
    },
    destination: {
      country: 'Saudi Arabia',
      city: 'Riyadh',
      address: 'King Khalid International Airport'
    },
    capacity: {
      weight: 30,
      volume: 60000,
      items: 15
    },
    departureDate: '2025-01-22T09:00:00Z',
    arrivalDate: '2025-01-22T11:00:00Z',
    status: 'DRAFT' as any,
    acceptedRequests: [],
    earnings: 0,
    createdAt: '2025-01-17T14:00:00Z',
    updatedAt: '2025-01-17T14:00:00Z'
  }
];

export const travelerService = {
  /**
   * Get traveler dashboard data
   */
  async getTravelerDashboard(travelerId: string): Promise<TravelerDashboard | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (travelerId !== 'traveler_001') return null;
    
    const activeTrips = mockTrips.filter(trip => isTripActive(trip));
    const recentActivity = [
      {
        type: 'trip_created' as const,
        description: 'Created new trip: Cairo to Dubai',
        timestamp: '2025-01-17T14:00:00Z'
      },
      {
        type: 'request_accepted' as const,
        description: 'Accepted delivery request for electronics package',
        timestamp: '2025-01-18T11:15:00Z'
      },
      {
        type: 'delivery_completed' as const,
        description: 'Completed delivery: Dubai to Riyadh',
        timestamp: '2025-01-15T16:30:00Z'
      },
      {
        type: 'rating_received' as const,
        description: 'Received 5-star rating from customer',
        timestamp: '2025-01-15T17:00:00Z'
      }
    ];
    
    return {
      traveler: mockTraveler,
      activeTrips,
      recentActivity,
      stats: {
        totalTrips: mockTrips.length,
        completedTrips: 127,
        totalEarnings: 15420.50, // READ-ONLY
        averageRating: 4.8,
        activeRequests: 1,
        pendingEarnings: 75.00 // READ-ONLY
      }
    };
  },

  /**
   * Get traveler profile
   */
  async getTravelerProfile(travelerId: string): Promise<Traveler | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return travelerId === 'traveler_001' ? mockTraveler : null;
  },

  /**
   * Get trips for traveler
   */
  async getTrips(travelerId: string, filters: TripFilters = {}): Promise<{ trips: Trip[], total: number }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let filteredTrips = mockTrips.filter(trip => trip.travelerId === travelerId);
    
    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filteredTrips = filteredTrips.filter(trip => filters.status!.includes(trip.status));
    }
    
    if (filters.origin) {
      filteredTrips = filteredTrips.filter(trip => 
        trip.origin.country.toLowerCase().includes(filters.origin!.toLowerCase()) ||
        trip.origin.city?.toLowerCase().includes(filters.origin!.toLowerCase())
      );
    }
    
    if (filters.destination) {
      filteredTrips = filteredTrips.filter(trip => 
        trip.destination.country.toLowerCase().includes(filters.destination!.toLowerCase()) ||
        trip.destination.city?.toLowerCase().includes(filters.destination!.toLowerCase())
      );
    }
    
    // Apply sorting
    if (filters.sortBy) {
      filteredTrips.sort((a, b) => {
        let aValue: number;
        let bValue: number;
        
        switch (filters.sortBy) {
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'departureDate':
            aValue = a.departureDate ? new Date(a.departureDate).getTime() : 0;
            bValue = b.departureDate ? new Date(b.departureDate).getTime() : 0;
            break;
          case 'earnings':
            aValue = a.earnings;
            bValue = b.earnings;
            break;
          default:
            return 0;
        }
        
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        return (aValue - bValue) * order;
      });
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      trips: filteredTrips.slice(startIndex, endIndex),
      total: filteredTrips.length
    };
  },

  /**
   * Create new trip (UI only)
   */
  async createTrip(travelerId: string, tripData: CreateTripData): Promise<Trip | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (travelerId !== 'traveler_001') return null;
    
    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      travelerId,
      origin: tripData.origin,
      destination: tripData.destination,
      capacity: tripData.capacity,
      departureDate: tripData.departureDate,
      arrivalDate: tripData.arrivalDate,
      status: 'DRAFT' as any,
      acceptedRequests: [],
      earnings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to mock data (UI only)
    mockTrips.push(newTrip);
    
    return newTrip;
  },

  /**
   * Update trip status (UI only)
   */
  async updateTripStatus(tripId: string, status: TripStatus): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const trip = mockTrips.find(t => t.id === tripId);
    if (trip) {
      trip.status = status;
      trip.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  },

  /**
   * Get delivery requests for trip
   */
  async getDeliveryRequests(tripId: string): Promise<DeliveryRequest[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const trip = mockTrips.find(t => t.id === tripId);
    return trip ? trip.acceptedRequests : [];
  },

  /**
   * Accept delivery request (UI only)
   */
  async acceptDeliveryRequest(requestId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Find and update request (UI only)
    for (const trip of mockTrips) {
      const request = trip.acceptedRequests.find(r => r.id === requestId);
      if (request) {
        request.status = 'ACCEPTED' as any;
        request.updatedAt = new Date().toISOString();
        
        // Add timeline entry
        request.timeline.push({
          id: `timeline_${Date.now()}`,
          requestId,
          status: 'ACCEPTED' as any,
          timestamp: new Date().toISOString(),
          description: 'Request accepted by traveler',
          actor: 'traveler'
        });
        
        return true;
      }
    }
    return false;
  },

  /**
   * Update delivery status (UI only)
   */
  async updateDeliveryStatus(requestId: string, status: DeliveryStatus, location?: string, notes?: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Find and update request (UI only)
    for (const trip of mockTrips) {
      const request = trip.acceptedRequests.find(r => r.id === requestId);
      if (request) {
        request.status = status;
        request.updatedAt = new Date().toISOString();
        
        // Add timeline entry
        request.timeline.push({
          id: `timeline_${Date.now()}`,
          requestId,
          status,
          timestamp: new Date().toISOString(),
          description: notes || `Status updated to ${status}`,
          actor: 'traveler',
          notes
        });
        
        return true;
      }
    }
    return false;
  },

  /**
   * Format currency for display
   */
  formatCurrency: (amount: number, currency: string = 'USD') => {
    return formatCurrency(amount, currency);
  },

  /**
   * Format date for display
   */
  formatDate: (dateString: string) => {
    return formatDate(dateString);
  },

  /**
   * Check if trip is active
   */
  isTripActive: (trip: Trip) => {
    return isTripActive(trip);
  },

  /**
   * Get trip progress percentage
   */
  getTripProgress: (trip: Trip) => {
    return getTripProgress(trip);
  }
};

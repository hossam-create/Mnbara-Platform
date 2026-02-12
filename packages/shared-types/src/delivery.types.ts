// Delivery Status Enum
export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  NEARBY = 'nearby',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

// Delivery Type Enum
export enum DeliveryType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SCHEDULED = 'scheduled',
  SAME_DAY = 'same_day'
}

// Delivery Priority Enum
export enum DeliveryPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Delivery Interface
export interface Delivery {
  id: string;
  orderId: string;
  trackingNumber: string;
  driverId?: string;
  status: DeliveryStatus;
  type: DeliveryType;
  priority: DeliveryPriority;
  pickupAddress: Address;
  deliveryAddress: DeliveryAddress;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  distance?: number;
  duration?: number;
  currentLocation?: GeoLocation;
  route?: GeoLocation[];
  proofOfDelivery?: ProofOfDelivery;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Address Interface (re-exported for convenience)
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: GeoLocation;
  instructions?: string;
}

// Delivery Address Interface
export interface DeliveryAddress extends Address {
  recipientName: string;
  recipientPhone: string;
  deliveryInstructions?: string;
  gateCode?: string;
  buildingNumber?: string;
  landmark?: string;
}

// Geo Location Interface
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: Date;
}

// Proof of Delivery Interface
export interface ProofOfDelivery {
  signature?: string;
  photo?: string;
  otp?: string;
  notes?: string;
  deliveredAt: Date;
  receivedBy?: string;
}

// Delivery Tracking Event Interface
export interface DeliveryTrackingEvent {
  id: string;
  deliveryId: string;
  status: DeliveryStatus;
  location?: GeoLocation;
  timestamp: Date;
  description: string;
}

// Delivery Assignment Interface
export interface DeliveryAssignment {
  deliveryId: string;
  driverId: string;
  assignedAt: Date;
  assignedBy?: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
}

// Delivery Filter Interface
export interface DeliveryFilter {
  status?: DeliveryStatus[];
  type?: DeliveryType[];
  driverId?: string;
  vendorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Delivery Pagination Params
export interface DeliveryPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: DeliveryFilter;
}

// Delivery Statistics Interface
export interface DeliveryStatistics {
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  inProgressDeliveries: number;
  averageDeliveryTime: number;
  averageRating: number;
}

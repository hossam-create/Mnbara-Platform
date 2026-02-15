import { RequestStatus, RequestTransition } from './enums/RequestStatus';

export interface Request {
  id: string;
  requesterId: string;
  travelerId?: string;
  productId: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
    currency: string;
    url: string;
  };
  delivery: {
    origin: {
      country: string;
      city?: string;
      address?: string;
      postalCode?: string;
    };
    destination: {
      country: string;
      city?: string;
      address?: string;
      postalCode?: string;
    };
    deadline: Date;
    instructions?: string;
  };
  status: RequestStatus;
  statusHistory: RequestStatusHistory[];
  timeline: RequestTimeline[];
  preferences: {
    packaging?: 'STANDARD' | 'FRAGILE' | 'ELECTRONICS';
    insurance?: boolean;
    tracking?: boolean;
    urgency?: 'STANDARD' | 'EXPRESS' | 'URGENT';
  };
  metadata: {
    estimatedDistance?: number; // km
    estimatedDuration?: number; // days
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  transition: RequestTransition;
  reason?: string;
  changedBy: string; // user ID
  changedAt: Date;
}

export interface RequestTimeline {
  id: string;
  requestId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  data?: Record<string, any>;
  createdBy: string; // user ID
  createdAt: Date;
}

export enum TimelineEventType {
  REQUEST_CREATED = 'REQUEST_CREATED',
  REQUEST_VISIBLE = 'REQUEST_VISIBLE',
  REQUEST_ACCEPTED = 'REQUEST_ACCEPTED',
  DELIVERY_STARTED = 'DELIVERY_STARTED',
  DELIVERY_IN_TRANSIT = 'DELIVERY_IN_TRANSIT',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  REQUEST_EXPIRED = 'REQUEST_EXPIRED',
  STATUS_UPDATED = 'STATUS_UPDATED',
  NOTE_ADDED = 'NOTE_ADDED',
  PHOTO_UPLOADED = 'PHOTO_UPLOADED'
}

export interface CreateRequestData {
  productId: string;
  delivery: {
    origin: {
      country: string;
      city?: string;
      address?: string;
      postalCode?: string;
    };
    destination: {
      country: string;
      city?: string;
      address?: string;
      postalCode?: string;
    };
    deadline: Date;
    instructions?: string;
  };
  preferences?: {
    packaging?: 'STANDARD' | 'FRAGILE' | 'ELECTRONICS';
    insurance?: boolean;
    tracking?: boolean;
    urgency?: 'STANDARD' | 'EXPRESS' | 'URGENT';
  };
}

export interface UpdateRequestData {
  delivery?: {
    origin?: {
      country?: string;
      city?: string;
      address?: string;
      postalCode?: string;
    };
    destination?: {
      country?: string;
      city?: string;
      address?: string;
      postalCode?: string;
    };
    deadline?: Date;
    instructions?: string;
  };
  preferences?: {
    packaging?: 'STANDARD' | 'FRAGILE' | 'ELECTRONICS';
    insurance?: boolean;
    tracking?: boolean;
    urgency?: 'STANDARD' | 'EXPRESS' | 'URGENT';
  };
}

export interface RequestFilters {
  status?: RequestStatus[];
  requesterId?: string;
  travelerId?: string;
  originCountry?: string;
  destinationCountry?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  urgency?: 'STANDARD' | 'EXPRESS' | 'URGENT';
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'deadline' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface RequestListResponse {
  requests: Request[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

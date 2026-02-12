// Order Status Enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed'
}

// Order Type Enum
export enum OrderType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
  SCHEDULED = 'scheduled'
}

// Payment Status Enum (for order)
export enum OrderPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Base Order Interface
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  vendorId: string;
  driverId?: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  deliveryAddress: DeliveryAddress;
  pickupAddress: Address;
  scheduledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Item Interface
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: OrderItemOption[];
  notes?: string;
}

// Order Item Option Interface
export interface OrderItemOption {
  name: string;
  value: string;
  price: number;
}

// Address Interface (simplified for pickup)
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  instructions?: string;
}

// Delivery Address Interface (extends Address)
export interface DeliveryAddress extends Address {
  recipientName: string;
  recipientPhone: string;
  deliveryInstructions?: string;
  gateCode?: string;
  buildingNumber?: string;
}

// Order Summary Interface
export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

// Order Filter Interface
export interface OrderFilter {
  status?: OrderStatus[];
  type?: OrderType[];
  customerId?: string;
  vendorId?: string;
  driverId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Order Pagination Params
export interface OrderPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: OrderFilter;
}

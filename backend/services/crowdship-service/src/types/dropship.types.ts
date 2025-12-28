export enum DropshipStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    DISPUTED = 'DISPUTED'
}

export interface CreateDropshipRequestDto {
    supplierId: string;
    productId: string;
    quantity: number;
    customerAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    estimatedDelivery?: Date;
    specialInstructions?: string;
}

export interface SupplierInfo {
    id: string;
    businessName: string;
    location: string;
    rating: number;
    isVerified: boolean;
    isDropshipEnabled: boolean;
    categories: string[];
    stats?: SupplierStats;
}

export interface SupplierStats {
    totalDropshipOrders: number;
    avgDeliveryTime: number; // in days
    dropshipSuccessRate: number; // percentage
    totalRevenue: number;
    lastOrderAt: Date;
}

export interface DropshipOrder {
    id: string;
    userId: string;
    supplierId: string;
    productId: string;
    quantity: number;
    customerAddress: any;
    totalAmount: number;
    platformFee: number;
    supplierPayout: number;
    status: DropshipStatus;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
    acceptedAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    specialInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
    user?: any;
    supplier?: SupplierInfo;
    product?: any;
}

export interface DropshipNotification {
    type: 'NEW_ORDER' | 'ORDER_ACCEPTED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED';
    recipientId: string;
    orderId: string;
    amount?: number;
    trackingNumber?: string;
    carrier?: string;
}

export interface DropshipPricing {
    totalAmount: number;
    platformFee: number;
    supplierPayout: number;
    shippingCost: number;
    taxes: number;
}

export interface DropshipFilters {
    category?: string;
    minRating?: number;
    maxDeliveryTime?: number;
    location?: string;
    priceRange?: {
        min: number;
        max: number;
    };
}

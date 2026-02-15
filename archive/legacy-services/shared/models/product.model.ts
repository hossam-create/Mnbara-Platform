// Product Model - نموذج المنتج الأساسي

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  originalPrice?: number;
  discount: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  stock: number;
  rating: number;
  reviewCount: number;
  views: number;
  likes: number;
  condition: ProductCondition;
  specifications: ProductSpecifications;
  shipping: ProductShipping;
  warranty: ProductWarranty;
  promotion?: ProductPromotion;
  location?: ProductLocation;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProductSpecifications {
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  material?: string;
  // Dynamic specifications based on category
  [key: string]: any;
}

export interface ProductShipping {
  cost: number;
  freeShipping: boolean;
  estimatedDelivery: string;
  shippingFrom: string;
  shippingTo: string[];
  returnPolicy: string;
}

export interface ProductWarranty {
  type: string; // manufacturer, seller, none
  duration: string; // 1 year, 2 years, etc.
  details?: string;
}

export interface ProductPromotion {
  type: 'featured' | 'discount' | 'flash_sale' | 'bundle';
  discountPercentage?: number;
  startDate: Date;
  endDate: Date;
  targetRegions?: string[];
}

export interface ProductLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CreateProductRequest {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  stock: number;
  condition: ProductCondition;
  specifications: ProductSpecifications;
  shipping: ProductShipping;
  warranty: ProductWarranty;
  location?: ProductLocation;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

// Product Analytics - إحصائيات المنتج
export interface ProductAnalytics {
  productId: string;
  dailyViews: number;
  monthlySales: number;
  conversionRate: number;
  averageRating: number;
  stockAlerts: number;
  revenue: number;
}

// Product Review - تقييم المنتج
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
}

// Product Comparison - مقارنة المنتجات
export interface ProductComparison {
  products: Product[];
  comparisonAttributes: string[];
  scores: {
    productId: string;
    overallScore: number;
    priceScore: number;
    ratingScore: number;
    popularityScore: number;
  }[];
}

// Export enums from search model
export { ProductCondition, ShippingOption, SortBy } from './search.model';
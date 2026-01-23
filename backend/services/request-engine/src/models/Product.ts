export interface Product {
  id: string;
  url: string;
  title: string;
  description?: string;
  image: string;
  price: number;
  currency: string;
  originalPrice?: number;
  availability: boolean;
  seller: {
    name: string;
    rating?: number;
    url?: string;
  };
  specifications?: Record<string, any>;
  extractedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductExtractionResult {
  success: boolean;
  product?: Product;
  error?: string;
  metadata?: {
    source: string;
    extractionTime: number;
    confidence: number;
  };
}

export interface CreateProductData {
  url: string;
  title: string;
  description?: string;
  image: string;
  price: number;
  currency: string;
  originalPrice?: number;
  seller?: {
    name: string;
    rating?: number;
    url?: string;
  };
  specifications?: Record<string, any>;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  originalPrice?: number;
  availability?: boolean;
  seller?: {
    name?: string;
    rating?: number;
    url?: string;
  };
  specifications?: Record<string, any>;
}

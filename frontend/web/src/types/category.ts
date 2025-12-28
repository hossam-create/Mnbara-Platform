export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon?: string;
  image?: string;
  productCount: number;
  subcategories?: Category[];
  parentId?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  searchKeywords: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryFilters {
  isActive?: boolean;
  isFeatured?: boolean;
  level?: number;
  parentId?: string;
}

export interface CreateCategoryRequest {
  nameAr: string;
  nameEn: string;
  icon?: string;
  image?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  searchKeywords?: string[];
}
// Category Model - نموذج التصنيفات الأساسي

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
  createdAt: Date;
  updatedAt?: Date;
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

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

// Category Tree - شجرة التصنيفات الكاملة
export interface CategoryTree {
  categories: Category[];
  totalCount: number;
  maxLevel: number;
}

// Default Categories - التصنيفات الافتراضية (مثل إيباي)
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'electronics',
    nameAr: 'إلكترونيات',
    nameEn: 'Electronics',
    icon: '📱',
    productCount: 0,
    level: 1,
    sortOrder: 1,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['موبايل', 'لابتوب', 'كمبيوتر', 'تلفزيون'],
    createdAt: new Date(),
  },
  {
    id: 'fashion',
    nameAr: 'موضة',
    nameEn: 'Fashion',
    icon: '👕',
    productCount: 0,
    level: 1,
    sortOrder: 2,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['ملابس', 'أحذية', 'إكسسوارات', 'عطور'],
    createdAt: new Date(),
  },
  {
    id: 'home',
    nameAr: 'المنزل',
    nameEn: 'Home',
    icon: '🏠',
    productCount: 0,
    level: 1,
    sortOrder: 3,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['أثاث', 'أجهزة', 'ديكور', 'مطبخ'],
    createdAt: new Date(),
  },
  {
    id: 'vehicles',
    nameAr: 'مركبات',
    nameEn: 'Vehicles',
    icon: '🚗',
    productCount: 0,
    level: 1,
    sortOrder: 4,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['سيارات', 'دراجات', 'قطع غيار', 'إطارات'],
    createdAt: new Date(),
  },
  {
    id: 'sports',
    nameAr: 'رياضة',
    nameEn: 'Sports',
    icon: '⚽',
    productCount: 0,
    level: 1,
    sortOrder: 5,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['ملابس رياضية', 'معدات', 'أحذية رياضية', 'لياقة'],
    createdAt: new Date(),
  },
];
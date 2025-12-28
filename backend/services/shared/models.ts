// Shared Models - النماذج المشتركة بين الخدمات
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

export interface UpdateCategoryRequest {
  nameAr?: string;
  nameEn?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  searchKeywords?: string[];
}

export interface CategoryTree {
  categories: Category[];
  totalCount: number;
  maxLevel: number;
}

// Default Categories - التصنيفات الافتراضية
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
    searchKeywords: ['موبايل', 'لابتوب', 'كمبيوتر', 'تلفزيون', 'هاتف'],
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
    searchKeywords: ['ملابس', 'أحذية', 'إكسسوارات', 'عطور', 'حقائب'],
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
    searchKeywords: ['أثاث', 'أجهزة', 'ديكور', 'مطبخ', 'حديقة'],
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
    searchKeywords: ['سيارات', 'دراجات', 'قطع غيار', 'إطارات', 'موتوسيكل'],
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
    searchKeywords: ['ملابس رياضية', 'معدات', 'أحذية رياضية', 'لياقة', 'جيم'],
    createdAt: new Date(),
  },
  {
    id: 'beauty',
    nameAr: 'جمال',
    nameEn: 'Beauty',
    icon: '💄',
    productCount: 0,
    level: 1,
    sortOrder: 6,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['مكياج', 'عناية', 'بشرة', 'شعر', 'عطور'],
    createdAt: new Date(),
  },
  {
    id: 'toys',
    nameAr: 'ألعاب',
    nameEn: 'Toys',
    icon: '🧸',
    productCount: 0,
    level: 1,
    sortOrder: 7,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['أطفال', 'تعليمية', 'هوايات', 'مجسمات', 'ألعاب فيديو'],
    createdAt: new Date(),
  },
  {
    id: 'books',
    nameAr: 'كتب',
    nameEn: 'Books',
    icon: '📚',
    productCount: 0,
    level: 1,
    sortOrder: 8,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['روايات', 'تعليم', 'أدب', 'ثقافة', 'مراجع'],
    createdAt: new Date(),
  },
  {
    id: 'food',
    nameAr: 'طعام',
    nameEn: 'Food',
    icon: '🍎',
    productCount: 0,
    level: 1,
    sortOrder: 9,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['مأكولات', 'مشروبات', 'حلويات', 'مكسرات', 'قهوة'],
    createdAt: new Date(),
  },
  {
    id: 'services',
    nameAr: 'خدمات',
    nameEn: 'Services',
    icon: '🔧',
    productCount: 0,
    level: 1,
    sortOrder: 10,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['تصليح', 'تركيب', 'تنظيف', 'تدريس', 'استشارات'],
    createdAt: new Date(),
  },
];

// Subcategories for Electronics - التصنيفات الفرعية للإلكترونيات
export const ELECTRONICS_SUBCATEGORIES: Category[] = [
  {
    id: 'smartphones',
    nameAr: 'هواتف ذكية',
    nameEn: 'Smartphones',
    icon: '📱',
    productCount: 0,
    parentId: 'electronics',
    level: 2,
    sortOrder: 1,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['آيفون', 'سامسونج', 'هواوي', 'شاومي', 'موتورولا'],
    createdAt: new Date(),
  },
  {
    id: 'laptops',
    nameAr: 'لابتوبات',
    nameEn: 'Laptops',
    icon: '💻',
    productCount: 0,
    parentId: 'electronics',
    level: 2,
    sortOrder: 2,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['ديل', 'اتش بي', 'لينوفو', 'ماك بوك', 'اسوس'],
    createdAt: new Date(),
  },
  {
    id: 'tvs',
    nameAr: 'تلفزيونات',
    nameEn: 'TVs',
    icon: '📺',
    productCount: 0,
    parentId: 'electronics',
    level: 2,
    sortOrder: 3,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['سامسونج', 'ال جي', 'سوني', 'توشيبا', 'شاشات'],
    createdAt: new Date(),
  },
  {
    id: 'cameras',
    nameAr: 'كاميرات',
    nameEn: 'Cameras',
    icon: '📷',
    productCount: 0,
    parentId: 'electronics',
    level: 2,
    sortOrder: 4,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['كانون', 'نيكون', 'سوني', 'اكشن كام', 'مراقبة'],
    createdAt: new Date(),
  },
  {
    id: 'accessories',
    nameAr: 'إكسسوارات',
    nameEn: 'Accessories',
    icon: '🎧',
    productCount: 0,
    parentId: 'electronics',
    level: 2,
    sortOrder: 5,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['سماعات', 'شواحن', 'كابلات', 'حافظات', 'ماوس'],
    createdAt: new Date(),
  },
];

// Subcategories for Fashion - التصنيفات الفرعية للموضة
export const FASHION_SUBCATEGORIES: Category[] = [
  {
    id: 'mens_clothing',
    nameAr: 'ملابس رجالي',
    nameEn: 'Men\'s Clothing',
    icon: '👔',
    productCount: 0,
    parentId: 'fashion',
    level: 2,
    sortOrder: 1,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['تي شيرت', 'بنطلون', 'جاكيت', 'بدلة', 'قميص'],
    createdAt: new Date(),
  },
  {
    id: 'womens_clothing',
    nameAr: 'ملابس نسائي',
    nameEn: 'Women\'s Clothing',
    icon: '👗',
    productCount: 0,
    parentId: 'fashion',
    level: 2,
    sortOrder: 2,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['فساتين', 'بلوزات', 'تنانير', 'جينز', 'عبايات'],
    createdAt: new Date(),
  },
  {
    id: 'shoes',
    nameAr: 'أحذية',
    nameEn: 'Shoes',
    icon: '👟',
    productCount: 0,
    parentId: 'fashion',
    level: 2,
    sortOrder: 3,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['رياضية', 'كاجوال', 'رسمية', 'صنادل', 'بوت'],
    createdAt: new Date(),
  },
  {
    id: 'accessories_fashion',
    nameAr: 'إكسسوارات',
    nameEn: 'Accessories',
    icon: '👜',
    productCount: 0,
    parentId: 'fashion',
    level: 2,
    sortOrder: 4,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['ساعات', 'نظارات', 'حقائب', 'مجوهرات', 'أحزمة'],
    createdAt: new Date(),
  },
  {
    id: 'perfumes',
    nameAr: 'عطور',
    nameEn: 'Perfumes',
    icon: '🧴',
    productCount: 0,
    parentId: 'fashion',
    level: 2,
    sortOrder: 5,
    isActive: true,
    isFeatured: true,
    searchKeywords: ['عطر', 'ماء تواليت', 'كولونيا', 'عود', 'بخور'],
    createdAt: new Date(),
  },
];

// Complete categories list with subcategories - القائمة الكاملة مع التصنيفات الفرعية
export const ALL_CATEGORIES: Category[] = [
  ...DEFAULT_CATEGORIES,
  ...ELECTRONICS_SUBCATEGORIES,
  ...FASHION_SUBCATEGORIES,
];
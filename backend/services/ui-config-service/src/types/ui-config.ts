// ==========================================
// UI Configuration Types for Mnbara Platform
// ==========================================

// Component Slugs - These are the building blocks
export type ComponentSlug =
  | 'featured_services'      // شريط الخدمات المميزة
  | 'new_services'           // شريط الخدمات الجديدة
  | 'popular_services'       // شريط الخدمات الشائعة
  | 'rewards_carousel'       // Carousel المكافآت
  | 'exclusive_offers'       // شريط العروض الحصرية
  | 'vertical_slider'        // Slider عمودي
  | 'horizontal_slider'      // Slider أفقي
  | 'blog_articles'          // أحدث مقالات المدونة
  | 'multi_slider'           // Slider متعدد
  | 'icon_bar'               // شريط الأيقونات
  | 'banner_single'          // بانر مفرد
  | 'banner_carousel'        // بانر متعدد
  | 'category_grid'          // شبكة التصنيفات
  | 'product_grid'           // شبكة المنتجات
  | 'countdown_timer'        // عداد تنازلي
  | 'video_section'          // قسم فيديو
  | 'testimonials'           // آراء العملاء
  | 'brands_slider'          // شريط العلامات التجارية
  | 'quick_actions'          // إجراءات سريعة
  | 'search_bar'             // شريط البحث
  | 'custom_html';           // محتوى مخصص

// Action Types for links
export type ActionType = 'internal' | 'external' | 'deeplink' | 'none';

// Platform targets
export type Platform = 'ios' | 'android' | 'web';

// User types for targeting
export type UserType = 'all' | 'guest' | 'registered' | 'premium' | 'seller';

// Reference types for items
export type ReferenceType = 'product' | 'category' | 'service' | 'blog' | 'page' | 'custom';

// ==========================================
// Component Configuration Schemas
// ==========================================

export interface BaseComponentConfig {
  show_title?: boolean;
  show_subtitle?: boolean;
  show_view_all?: boolean;
  view_all_action?: ActionConfig;
  items_per_row?: number;
  max_items?: number;
  auto_scroll?: boolean;
  scroll_interval?: number; // milliseconds
  show_indicators?: boolean;
  show_arrows?: boolean;
}

export interface ActionConfig {
  type: ActionType;
  url?: string;
  screen?: string; // For internal navigation
  params?: Record<string, any>;
}

export interface SliderConfig extends BaseComponentConfig {
  slider_type: 'horizontal' | 'vertical' | 'carousel';
  item_width?: number;
  item_height?: number;
  spacing?: number;
  snap_to_item?: boolean;
  infinite_scroll?: boolean;
}

export interface GridConfig extends BaseComponentConfig {
  columns: number;
  columns_mobile?: number;
  gap?: number;
  aspect_ratio?: string; // e.g., "1:1", "16:9"
}

export interface BannerConfig extends BaseComponentConfig {
  height?: number;
  height_mobile?: number;
  border_radius?: number;
  overlay_color?: string;
  overlay_opacity?: number;
}

export interface CountdownConfig extends BaseComponentConfig {
  end_date: string; // ISO date string
  show_days?: boolean;
  show_hours?: boolean;
  show_minutes?: boolean;
  show_seconds?: boolean;
  expired_action?: ActionConfig;
}

// ==========================================
// Section & Item Interfaces
// ==========================================

export interface UISection {
  id: string;
  component_slug: ComponentSlug;
  sort_order: number;
  is_active: boolean;
  is_visible: boolean;
  
  // Scheduling
  start_date?: string;
  end_date?: string;
  
  // Targeting
  target_platforms: Platform[];
  target_user_types: UserType[];
  target_countries: string[];
  
  // Content
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  
  // Configuration
  config: BaseComponentConfig | SliderConfig | GridConfig | BannerConfig | CountdownConfig;
  
  // Styling
  background_color?: string;
  text_color?: string;
  padding?: SpacingConfig;
  margin?: SpacingConfig;
  
  // Items
  items: UISectionItem[];
}

export interface UISectionItem {
  id: string;
  sort_order: number;
  is_active: boolean;
  
  // Content
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  description_ar?: string;
  description_en?: string;
  
  // Media
  image_url?: string;
  image_url_ar?: string;
  icon?: string;
  video_url?: string;
  
  // Action
  action?: ActionConfig;
  
  // Badge
  badge?: {
    text_ar?: string;
    text_en?: string;
    color?: string;
  };
  
  // Pricing
  price?: number;
  original_price?: number;
  currency?: string;
  
  // Reference
  reference?: {
    type: ReferenceType;
    id: string;
  };
  
  // Custom data
  custom_data?: Record<string, any>;
}

export interface SpacingConfig {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

// ==========================================
// API Response Types
// ==========================================

export interface UIConfigResponse {
  version: number;
  last_updated: string;
  cache_ttl: number; // seconds
  theme: UITheme;
  sections: UISection[];
  banners: Banner[];
  app_config: Record<string, any>;
}

export interface UITheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_primary: string;
  text_secondary: string;
  error_color: string;
  success_color: string;
  font_family_ar: string;
  font_family_en: string;
  border_radius: string;
}

export interface Banner {
  id: string;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  image_url: string;
  image_url_ar?: string;
  mobile_image_url?: string;
  action?: ActionConfig;
  position: string;
  sort_order: number;
}

// ==========================================
// Dashboard Types
// ==========================================

export interface CreateSectionDTO {
  component_slug: ComponentSlug;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  config?: Record<string, any>;
  target_platforms?: Platform[];
  target_user_types?: UserType[];
  start_date?: string;
  end_date?: string;
}

export interface UpdateSectionDTO extends Partial<CreateSectionDTO> {
  sort_order?: number;
  is_active?: boolean;
  is_visible?: boolean;
  background_color?: string;
  text_color?: string;
  padding?: SpacingConfig;
  margin?: SpacingConfig;
}

export interface CreateItemDTO {
  section_id: string;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  description_ar?: string;
  description_en?: string;
  image_url?: string;
  image_url_ar?: string;
  icon?: string;
  action_type?: ActionType;
  action_url?: string;
  action_params?: Record<string, any>;
  badge_text_ar?: string;
  badge_text_en?: string;
  badge_color?: string;
  price?: number;
  original_price?: number;
  reference_type?: ReferenceType;
  reference_id?: string;
  custom_data?: Record<string, any>;
}

export interface ReorderDTO {
  items: { id: string; sort_order: number }[];
}

// ==========================================
// Component Type Definitions (for Dashboard)
// ==========================================

export const COMPONENT_DEFINITIONS: Record<ComponentSlug, {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  supports_items: boolean;
  default_config: Record<string, any>;
}> = {
  featured_services: {
    name_ar: 'الخدمات المميزة',
    name_en: 'Featured Services',
    description_ar: 'عرض الخدمات المميزة في شريط أفقي',
    description_en: 'Display featured services in a horizontal strip',
    icon: 'star',
    supports_items: true,
    default_config: { items_per_row: 4, show_title: true, auto_scroll: false }
  },
  new_services: {
    name_ar: 'الخدمات الجديدة',
    name_en: 'New Services',
    description_ar: 'عرض أحدث الخدمات المضافة',
    description_en: 'Display newly added services',
    icon: 'sparkles',
    supports_items: true,
    default_config: { items_per_row: 3, show_title: true, max_items: 6 }
  },
  popular_services: {
    name_ar: 'الخدمات الشائعة',
    name_en: 'Popular Services',
    description_ar: 'عرض الخدمات الأكثر طلباً',
    description_en: 'Display most requested services',
    icon: 'fire',
    supports_items: true,
    default_config: { items_per_row: 4, show_title: true, show_view_all: true }
  },
  rewards_carousel: {
    name_ar: 'المكافآت',
    name_en: 'Rewards Carousel',
    description_ar: 'عرض المكافآت والنقاط',
    description_en: 'Display rewards and points carousel',
    icon: 'gift',
    supports_items: true,
    default_config: { auto_scroll: true, scroll_interval: 5000, show_indicators: true }
  },
  exclusive_offers: {
    name_ar: 'العروض الحصرية',
    name_en: 'Exclusive Offers',
    description_ar: 'عرض العروض والخصومات الحصرية',
    description_en: 'Display exclusive offers and discounts',
    icon: 'tag',
    supports_items: true,
    default_config: { show_title: true, show_countdown: true }
  },
  vertical_slider: {
    name_ar: 'سلايدر عمودي',
    name_en: 'Vertical Slider',
    description_ar: 'عرض المحتوى في سلايدر عمودي',
    description_en: 'Display content in vertical slider',
    icon: 'arrows-up-down',
    supports_items: true,
    default_config: { slider_type: 'vertical', snap_to_item: true }
  },
  horizontal_slider: {
    name_ar: 'سلايدر أفقي',
    name_en: 'Horizontal Slider',
    description_ar: 'عرض المحتوى في سلايدر أفقي',
    description_en: 'Display content in horizontal slider',
    icon: 'arrows-left-right',
    supports_items: true,
    default_config: { slider_type: 'horizontal', snap_to_item: true, show_arrows: true }
  },
  blog_articles: {
    name_ar: 'مقالات المدونة',
    name_en: 'Blog Articles',
    description_ar: 'عرض أحدث مقالات المدونة',
    description_en: 'Display latest blog articles',
    icon: 'newspaper',
    supports_items: true,
    default_config: { max_items: 5, show_title: true, show_view_all: true }
  },
  multi_slider: {
    name_ar: 'سلايدر متعدد',
    name_en: 'Multi Slider',
    description_ar: 'سلايدر يعرض عدة عناصر في وقت واحد',
    description_en: 'Slider showing multiple items at once',
    icon: 'squares-2x2',
    supports_items: true,
    default_config: { items_per_row: 3, infinite_scroll: true }
  },
  icon_bar: {
    name_ar: 'شريط الأيقونات',
    name_en: 'Icon Bar',
    description_ar: 'شريط أيقونات للتنقل السريع',
    description_en: 'Icon bar for quick navigation',
    icon: 'squares-plus',
    supports_items: true,
    default_config: { items_per_row: 5, show_labels: true }
  },
  banner_single: {
    name_ar: 'بانر مفرد',
    name_en: 'Single Banner',
    description_ar: 'بانر إعلاني مفرد',
    description_en: 'Single promotional banner',
    icon: 'photo',
    supports_items: false,
    default_config: { height: 200, border_radius: 12 }
  },
  banner_carousel: {
    name_ar: 'بانر متعدد',
    name_en: 'Banner Carousel',
    description_ar: 'مجموعة بانرات في كاروسيل',
    description_en: 'Multiple banners in carousel',
    icon: 'photos',
    supports_items: true,
    default_config: { auto_scroll: true, scroll_interval: 4000, show_indicators: true }
  },
  category_grid: {
    name_ar: 'شبكة التصنيفات',
    name_en: 'Category Grid',
    description_ar: 'عرض التصنيفات في شبكة',
    description_en: 'Display categories in grid',
    icon: 'view-grid',
    supports_items: true,
    default_config: { columns: 4, columns_mobile: 2, gap: 12 }
  },
  product_grid: {
    name_ar: 'شبكة المنتجات',
    name_en: 'Product Grid',
    description_ar: 'عرض المنتجات في شبكة',
    description_en: 'Display products in grid',
    icon: 'shopping-bag',
    supports_items: true,
    default_config: { columns: 2, columns_mobile: 2, gap: 16, show_price: true }
  },
  countdown_timer: {
    name_ar: 'عداد تنازلي',
    name_en: 'Countdown Timer',
    description_ar: 'عداد تنازلي للعروض',
    description_en: 'Countdown timer for offers',
    icon: 'clock',
    supports_items: false,
    default_config: { show_days: true, show_hours: true, show_minutes: true, show_seconds: true }
  },
  video_section: {
    name_ar: 'قسم فيديو',
    name_en: 'Video Section',
    description_ar: 'عرض فيديو ترويجي',
    description_en: 'Display promotional video',
    icon: 'play',
    supports_items: false,
    default_config: { autoplay: false, muted: true, loop: false }
  },
  testimonials: {
    name_ar: 'آراء العملاء',
    name_en: 'Testimonials',
    description_ar: 'عرض آراء وتقييمات العملاء',
    description_en: 'Display customer reviews and ratings',
    icon: 'chat-bubble-left-right',
    supports_items: true,
    default_config: { auto_scroll: true, show_rating: true }
  },
  brands_slider: {
    name_ar: 'العلامات التجارية',
    name_en: 'Brands Slider',
    description_ar: 'عرض شعارات العلامات التجارية',
    description_en: 'Display brand logos',
    icon: 'building-storefront',
    supports_items: true,
    default_config: { items_per_row: 6, grayscale: true }
  },
  quick_actions: {
    name_ar: 'إجراءات سريعة',
    name_en: 'Quick Actions',
    description_ar: 'أزرار للإجراءات السريعة',
    description_en: 'Quick action buttons',
    icon: 'bolt',
    supports_items: true,
    default_config: { items_per_row: 4, style: 'rounded' }
  },
  search_bar: {
    name_ar: 'شريط البحث',
    name_en: 'Search Bar',
    description_ar: 'شريط بحث مع اقتراحات',
    description_en: 'Search bar with suggestions',
    icon: 'magnifying-glass',
    supports_items: false,
    default_config: { show_suggestions: true, show_recent: true }
  },
  custom_html: {
    name_ar: 'محتوى مخصص',
    name_en: 'Custom Content',
    description_ar: 'محتوى HTML مخصص',
    description_en: 'Custom HTML content',
    icon: 'code-bracket',
    supports_items: false,
    default_config: {}
  }
};

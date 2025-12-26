// Component Definitions for Dashboard
export const COMPONENT_DEFINITIONS: Record<string, {
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  icon: string
  supports_items: boolean
}> = {
  featured_services: {
    name_ar: 'الخدمات المميزة',
    name_en: 'Featured Services',
    description_ar: 'عرض الخدمات المميزة في شريط أفقي',
    description_en: 'Display featured services in a horizontal strip',
    icon: 'star',
    supports_items: true
  },
  new_services: {
    name_ar: 'الخدمات الجديدة',
    name_en: 'New Services',
    description_ar: 'عرض أحدث الخدمات المضافة',
    description_en: 'Display newly added services',
    icon: 'sparkles',
    supports_items: true
  },
  popular_services: {
    name_ar: 'الخدمات الشائعة',
    name_en: 'Popular Services',
    description_ar: 'عرض الخدمات الأكثر طلباً',
    description_en: 'Display most requested services',
    icon: 'fire',
    supports_items: true
  },
  rewards_carousel: {
    name_ar: 'المكافآت',
    name_en: 'Rewards Carousel',
    description_ar: 'عرض المكافآت والنقاط',
    description_en: 'Display rewards and points carousel',
    icon: 'gift',
    supports_items: true
  },
  exclusive_offers: {
    name_ar: 'العروض الحصرية',
    name_en: 'Exclusive Offers',
    description_ar: 'عرض العروض والخصومات الحصرية',
    description_en: 'Display exclusive offers and discounts',
    icon: 'tag',
    supports_items: true
  },
  vertical_slider: {
    name_ar: 'سلايدر عمودي',
    name_en: 'Vertical Slider',
    description_ar: 'عرض المحتوى في سلايدر عمودي',
    description_en: 'Display content in vertical slider',
    icon: 'arrows-up-down',
    supports_items: true
  },
  horizontal_slider: {
    name_ar: 'سلايدر أفقي',
    name_en: 'Horizontal Slider',
    description_ar: 'عرض المحتوى في سلايدر أفقي',
    description_en: 'Display content in horizontal slider',
    icon: 'arrows-left-right',
    supports_items: true
  },
  blog_articles: {
    name_ar: 'مقالات المدونة',
    name_en: 'Blog Articles',
    description_ar: 'عرض أحدث مقالات المدونة',
    description_en: 'Display latest blog articles',
    icon: 'newspaper',
    supports_items: true
  },
  multi_slider: {
    name_ar: 'سلايدر متعدد',
    name_en: 'Multi Slider',
    description_ar: 'سلايدر يعرض عدة عناصر في وقت واحد',
    description_en: 'Slider showing multiple items at once',
    icon: 'squares-2x2',
    supports_items: true
  },
  icon_bar: {
    name_ar: 'شريط الأيقونات',
    name_en: 'Icon Bar',
    description_ar: 'شريط أيقونات للتنقل السريع',
    description_en: 'Icon bar for quick navigation',
    icon: 'squares-plus',
    supports_items: true
  },
  banner_single: {
    name_ar: 'بانر مفرد',
    name_en: 'Single Banner',
    description_ar: 'بانر إعلاني مفرد',
    description_en: 'Single promotional banner',
    icon: 'photo',
    supports_items: false
  },
  banner_carousel: {
    name_ar: 'بانر متعدد',
    name_en: 'Banner Carousel',
    description_ar: 'مجموعة بانرات في كاروسيل',
    description_en: 'Multiple banners in carousel',
    icon: 'photos',
    supports_items: true
  },
  category_grid: {
    name_ar: 'شبكة التصنيفات',
    name_en: 'Category Grid',
    description_ar: 'عرض التصنيفات في شبكة',
    description_en: 'Display categories in grid',
    icon: 'view-grid',
    supports_items: true
  },
  product_grid: {
    name_ar: 'شبكة المنتجات',
    name_en: 'Product Grid',
    description_ar: 'عرض المنتجات في شبكة',
    description_en: 'Display products in grid',
    icon: 'shopping-bag',
    supports_items: true
  },
  countdown_timer: {
    name_ar: 'عداد تنازلي',
    name_en: 'Countdown Timer',
    description_ar: 'عداد تنازلي للعروض',
    description_en: 'Countdown timer for offers',
    icon: 'clock',
    supports_items: false
  },
  video_section: {
    name_ar: 'قسم فيديو',
    name_en: 'Video Section',
    description_ar: 'عرض فيديو ترويجي',
    description_en: 'Display promotional video',
    icon: 'play',
    supports_items: false
  },
  testimonials: {
    name_ar: 'آراء العملاء',
    name_en: 'Testimonials',
    description_ar: 'عرض آراء وتقييمات العملاء',
    description_en: 'Display customer reviews and ratings',
    icon: 'chat-bubble-left-right',
    supports_items: true
  },
  brands_slider: {
    name_ar: 'العلامات التجارية',
    name_en: 'Brands Slider',
    description_ar: 'عرض شعارات العلامات التجارية',
    description_en: 'Display brand logos',
    icon: 'building-storefront',
    supports_items: true
  },
  quick_actions: {
    name_ar: 'إجراءات سريعة',
    name_en: 'Quick Actions',
    description_ar: 'أزرار للإجراءات السريعة',
    description_en: 'Quick action buttons',
    icon: 'bolt',
    supports_items: true
  },
  search_bar: {
    name_ar: 'شريط البحث',
    name_en: 'Search Bar',
    description_ar: 'شريط بحث مع اقتراحات',
    description_en: 'Search bar with suggestions',
    icon: 'magnifying-glass',
    supports_items: false
  },
  custom_html: {
    name_ar: 'محتوى مخصص',
    name_en: 'Custom Content',
    description_ar: 'محتوى HTML مخصص',
    description_en: 'Custom HTML content',
    icon: 'code-bracket',
    supports_items: false
  }
}

export type ComponentSlug = keyof typeof COMPONENT_DEFINITIONS

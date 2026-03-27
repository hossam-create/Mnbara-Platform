import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const componentTypes = [
  { slug: 'featured_services', name_ar: 'الخدمات المميزة', name_en: 'Featured Services', description_ar: 'عرض الخدمات المميزة في شريط أفقي', description_en: 'Display featured services in a horizontal strip', icon: 'star', schema: { items_per_row: 4, show_title: true, auto_scroll: false } },
  { slug: 'new_services', name_ar: 'الخدمات الجديدة', name_en: 'New Services', description_ar: 'عرض أحدث الخدمات المضافة', description_en: 'Display newly added services', icon: 'sparkles', schema: { items_per_row: 3, show_title: true, max_items: 6 } },
  { slug: 'popular_services', name_ar: 'الخدمات الشائعة', name_en: 'Popular Services', description_ar: 'عرض الخدمات الأكثر طلباً', description_en: 'Display most requested services', icon: 'fire', schema: { items_per_row: 4, show_title: true, show_view_all: true } },
  { slug: 'rewards_carousel', name_ar: 'المكافآت', name_en: 'Rewards Carousel', description_ar: 'عرض المكافآت والنقاط', description_en: 'Display rewards and points carousel', icon: 'gift', schema: { auto_scroll: true, scroll_interval: 5000, show_indicators: true } },
  { slug: 'exclusive_offers', name_ar: 'العروض الحصرية', name_en: 'Exclusive Offers', description_ar: 'عرض العروض والخصومات الحصرية', description_en: 'Display exclusive offers and discounts', icon: 'tag', schema: { show_title: true, show_countdown: true } },
  { slug: 'vertical_slider', name_ar: 'سلايدر عمودي', name_en: 'Vertical Slider', description_ar: 'عرض المحتوى في سلايدر عمودي', description_en: 'Display content in vertical slider', icon: 'arrows-up-down', schema: { slider_type: 'vertical', snap_to_item: true } },
  { slug: 'horizontal_slider', name_ar: 'سلايدر أفقي', name_en: 'Horizontal Slider', description_ar: 'عرض المحتوى في سلايدر أفقي', description_en: 'Display content in horizontal slider', icon: 'arrows-left-right', schema: { slider_type: 'horizontal', snap_to_item: true, show_arrows: true } },
  { slug: 'blog_articles', name_ar: 'مقالات المدونة', name_en: 'Blog Articles', description_ar: 'عرض أحدث مقالات المدونة', description_en: 'Display latest blog articles', icon: 'newspaper', schema: { max_items: 5, show_title: true, show_view_all: true } },
  { slug: 'multi_slider', name_ar: 'سلايدر متعدد', name_en: 'Multi Slider', description_ar: 'سلايدر يعرض عدة عناصر في وقت واحد', description_en: 'Slider showing multiple items at once', icon: 'squares-2x2', schema: { items_per_row: 3, infinite_scroll: true } },
  { slug: 'icon_bar', name_ar: 'شريط الأيقونات', name_en: 'Icon Bar', description_ar: 'شريط أيقونات للتنقل السريع', description_en: 'Icon bar for quick navigation', icon: 'squares-plus', schema: { items_per_row: 5, show_labels: true } },
  { slug: 'banner_single', name_ar: 'بانر مفرد', name_en: 'Single Banner', description_ar: 'بانر إعلاني مفرد', description_en: 'Single promotional banner', icon: 'photo', schema: { height: 200, border_radius: 12 } },
  { slug: 'banner_carousel', name_ar: 'بانر متعدد', name_en: 'Banner Carousel', description_ar: 'مجموعة بانرات في كاروسيل', description_en: 'Multiple banners in carousel', icon: 'photos', schema: { auto_scroll: true, scroll_interval: 4000, show_indicators: true } },
  { slug: 'category_grid', name_ar: 'شبكة التصنيفات', name_en: 'Category Grid', description_ar: 'عرض التصنيفات في شبكة', description_en: 'Display categories in grid', icon: 'view-grid', schema: { columns: 4, columns_mobile: 2, gap: 12 } },
  { slug: 'product_grid', name_ar: 'شبكة المنتجات', name_en: 'Product Grid', description_ar: 'عرض المنتجات في شبكة', description_en: 'Display products in grid', icon: 'shopping-bag', schema: { columns: 2, columns_mobile: 2, gap: 16, show_price: true } },
  { slug: 'countdown_timer', name_ar: 'عداد تنازلي', name_en: 'Countdown Timer', description_ar: 'عداد تنازلي للعروض', description_en: 'Countdown timer for offers', icon: 'clock', schema: { show_days: true, show_hours: true, show_minutes: true, show_seconds: true } },
  { slug: 'testimonials', name_ar: 'آراء العملاء', name_en: 'Testimonials', description_ar: 'عرض آراء وتقييمات العملاء', description_en: 'Display customer reviews and ratings', icon: 'chat-bubble-left-right', schema: { auto_scroll: true, show_rating: true } },
  { slug: 'brands_slider', name_ar: 'العلامات التجارية', name_en: 'Brands Slider', description_ar: 'عرض شعارات العلامات التجارية', description_en: 'Display brand logos', icon: 'building-storefront', schema: { items_per_row: 6, grayscale: true } },
  { slug: 'quick_actions', name_ar: 'إجراءات سريعة', name_en: 'Quick Actions', description_ar: 'أزرار للإجراءات السريعة', description_en: 'Quick action buttons', icon: 'bolt', schema: { items_per_row: 4, style: 'rounded' } }
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed component types
  for (const type of componentTypes) {
    await prisma.componentType.upsert({
      where: { slug: type.slug },
      update: type,
      create: type
    });
  }
  console.log('✅ Component types seeded');

  // Seed default theme
  await prisma.uITheme.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Theme',
      slug: 'default',
      is_active: true,
      is_default: true
    }
  });
  console.log('✅ Default theme created');

  // Seed initial version
  const existingVersion = await prisma.uIConfigVersion.findFirst();
  if (!existingVersion) {
    await prisma.uIConfigVersion.create({
      data: {
        version_number: 1,
        name: 'Initial Version',
        description: 'Initial UI configuration',
        config_snapshot: { sections: [], banners: [], theme: null },
        is_published: true,
        published_at: new Date(),
        created_by: 'system'
      }
    });
    console.log('✅ Initial version created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

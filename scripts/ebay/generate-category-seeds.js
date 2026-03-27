"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Main categories with Arabic translations
const mainCategories = [
    { name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', level: 1 },
    { name: 'Fashion', nameAr: 'أزياء', slug: 'fashion', level: 1 },
    { name: 'Home & Garden', nameAr: 'منزل وحديقة', slug: 'home-garden', level: 1 },
    { name: 'Sports & Outdoors', nameAr: 'رياضة وهواء طلق', slug: 'sports-outdoors', level: 1 },
    { name: 'Toys & Hobbies', nameAr: 'ألعاب وهوايات', slug: 'toys-hobbies', level: 1 },
    { name: 'Health & Beauty', nameAr: 'صحة وجمال', slug: 'health-beauty', level: 1 },
    { name: 'Automotive', nameAr: 'سيارات', slug: 'automotive', level: 1 },
    { name: 'Books', nameAr: 'كتب', slug: 'books', level: 1 },
    { name: 'Baby & Kids', nameAr: 'أطفال', slug: 'baby-kids', level: 1 },
    { name: 'Jewelry & Watches', nameAr: 'مجوهرات وساعات', slug: 'jewelry-watches', level: 1 },
    { name: 'Art & Collectibles', nameAr: 'فن ومقتنيات', slug: 'art-collectibles', level: 1 },
    { name: 'Music & Instruments', nameAr: 'موسيقى وآلات', slug: 'music-instruments', level: 1 },
    { name: 'Movies & Entertainment', nameAr: 'أفلام وترفيه', slug: 'movies-entertainment', level: 1 },
    { name: 'Video Games', nameAr: 'ألعاب فيديو', slug: 'video-games', level: 1 },
    { name: 'Office & School', nameAr: 'مكتب ومدرسة', slug: 'office-school', level: 1 },
    { name: 'Pet Supplies', nameAr: 'مستلزمات حيوانات', slug: 'pet-supplies', level: 1 },
    { name: 'Real Estate', nameAr: 'عقارات', slug: 'real-estate', level: 1 },
    { name: 'Services', nameAr: 'خدمات', slug: 'services', level: 1 },
    { name: 'Food & Beverages', nameAr: 'طعام ومشروبات', slug: 'food-beverages', level: 1 },
    { name: 'Travel & Tickets', nameAr: 'سفر وتذاكر', slug: 'travel-tickets', level: 1 },
];
// Electronics subcategories
const electronicsSubCategories = [
    { name: 'Mobile Phones', nameAr: 'هواتف محمولة', slug: 'mobile-phones', level: 2, parentName: 'Electronics' },
    { name: 'Laptops & Computers', nameAr: 'لابتوب وكمبيوتر', slug: 'laptops-computers', level: 2, parentName: 'Electronics' },
    { name: 'Tablets', nameAr: 'تابلت', slug: 'tablets', level: 2, parentName: 'Electronics' },
    { name: 'TVs & Audio', nameAr: 'تلفزيون وصوتيات', slug: 'tvs-audio', level: 2, parentName: 'Electronics' },
    { name: 'Cameras & Photography', nameAr: 'كاميرات وتصوير', slug: 'cameras-photography', level: 2, parentName: 'Electronics' },
    { name: 'Gaming Consoles', nameAr: 'أجهزة ألعاب', slug: 'gaming-consoles', level: 2, parentName: 'Electronics' },
    { name: 'Smart Home', nameAr: 'منزل ذكي', slug: 'smart-home', level: 2, parentName: 'Electronics' },
    { name: 'Wearables', nameAr: 'أجهزة قابلة للارتداء', slug: 'wearables', level: 2, parentName: 'Electronics' },
    { name: 'Accessories', nameAr: 'إكسسوارات', slug: 'accessories', level: 2, parentName: 'Electronics' },
];
// Fashion subcategories
const fashionSubCategories = [
    { name: "Men's Clothing", nameAr: 'ملابس رجالية', slug: 'mens-clothing', level: 2, parentName: 'Fashion' },
    { name: "Women's Clothing", nameAr: 'ملابس نسائية', slug: 'womens-clothing', level: 2, parentName: 'Fashion' },
    { name: "Kids' Clothing", nameAr: 'ملابس أطفال', slug: 'kids-clothing', level: 2, parentName: 'Fashion' },
    { name: 'Shoes', nameAr: 'أحذية', slug: 'shoes', level: 2, parentName: 'Fashion' },
    { name: 'Bags & Luggage', nameAr: 'حقائب', slug: 'bags-luggage', level: 2, parentName: 'Fashion' },
    { name: 'Accessories', nameAr: 'إكسسوارات', slug: 'fashion-accessories', level: 2, parentName: 'Fashion' },
    { name: 'Traditional Clothing', nameAr: 'ملابس تقليدية', slug: 'traditional-clothing', level: 2, parentName: 'Fashion' },
];
// Combine all categories
const allCategories = [
    ...mainCategories,
    ...electronicsSubCategories,
    ...fashionSubCategories,
];
// Generate seed data
function generateSeedData() {
    let seedData = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  // Create main categories first
  const categoryMap = new Map<string, number>();
`;
    // Add main categories
    mainCategories.forEach((cat, index) => {
        seedData += `
  const ${cat.slug.replace(/-/g, '_')} = await prisma.category.create({
    data: {
      name: '${cat.name}',
      nameAr: '${cat.nameAr}',
      slug: '${cat.slug}',
      level: ${cat.level},
      displayOrder: ${index + 1},
      isActive: true,
    },
  });
  categoryMap.set('${cat.name}', ${cat.slug.replace(/-/g, '_')}.id);
  console.log('✅ Created: ${cat.name}');
`;
    });
    // Add subcategories
    seedData += `
  // Create subcategories
`;
    [...electronicsSubCategories, ...fashionSubCategories].forEach((cat, index) => {
        seedData += `
  await prisma.category.create({
    data: {
      name: '${cat.name}',
      nameAr: '${cat.nameAr}',
      slug: '${cat.slug}',
      level: ${cat.level},
      parentId: categoryMap.get('${cat.parentName}'),
      displayOrder: ${index + 1},
      isActive: true,
    },
  });
  console.log('✅ Created: ${cat.parentName} > ${cat.name}');
`;
    });
    seedData += `
  console.log('✨ Categories seeded successfully!');
}

seedCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default seedCategories;
`;
    return seedData;
}
// Write to file
const seedData = generateSeedData();
const outputPath = path_1.default.join(__dirname, '../prisma/seeds/categories.seed.ts');
fs_1.default.mkdirSync(path_1.default.dirname(outputPath), { recursive: true });
fs_1.default.writeFileSync(outputPath, seedData);
console.log(`✅ Seed file created: ${outputPath}`);
console.log(`📊 Total categories: ${allCategories.length}`);
console.log(`   - Main: ${mainCategories.length}`);
console.log(`   - Electronics sub: ${electronicsSubCategories.length}`);
console.log(`   - Fashion sub: ${fashionSubCategories.length}`);
//# sourceMappingURL=generate-category-seeds.js.map
import { PrismaClient, ProductCondition, ListingType, ProductStatus, SellerType, AttributeType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to generate slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Helper to generate random price
function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Helper to pick random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Product name templates by category
const productTemplates: Record<string, string[]> = {
  'Electronics': ['Smart TV 55"', 'Wireless Earbuds', 'Bluetooth Speaker', 'Power Bank 20000mAh', 'USB-C Hub', 'Webcam HD', 'Gaming Mouse', 'Mechanical Keyboard'],
  'Computers': ['Gaming Laptop', 'Desktop PC', 'Monitor 27"', 'SSD 1TB', 'RAM 16GB DDR4', 'Graphics Card RTX', 'Wireless Router', 'External HDD'],
  'Cell Phones': ['iPhone 15 Pro', 'Samsung Galaxy S24', 'Google Pixel 8', 'OnePlus 12', 'Phone Case', 'Screen Protector', 'Wireless Charger', 'Car Mount'],
  'Clothing': ['Cotton T-Shirt', 'Denim Jeans', 'Leather Jacket', 'Running Shoes', 'Winter Coat', 'Casual Dress', 'Sports Shorts', 'Wool Sweater'],
  'Home': ['Coffee Maker', 'Air Fryer', 'Robot Vacuum', 'Blender', 'Toaster Oven', 'Pressure Cooker', 'Stand Mixer', 'Food Processor'],
  'Sports': ['Yoga Mat', 'Dumbbells Set', 'Resistance Bands', 'Running Watch', 'Basketball', 'Tennis Racket', 'Cycling Helmet', 'Gym Bag'],
  'Toys': ['LEGO Set', 'Action Figure', 'Board Game', 'RC Car', 'Puzzle 1000pc', 'Plush Toy', 'Building Blocks', 'Drone Mini'],
  'Books': ['Bestseller Novel', 'Cookbook', 'Self-Help Book', 'History Book', 'Science Fiction', 'Biography', 'Art Book', 'Travel Guide'],
  'Collectibles': ['Vintage Coin', 'Trading Cards', 'Antique Clock', 'Rare Stamp', 'Sports Memorabilia', 'Comic Book', 'Vinyl Record', 'Movie Poster'],
  'default': ['Premium Item', 'Quality Product', 'Best Seller', 'Top Rated', 'New Arrival', 'Limited Edition', 'Exclusive Deal', 'Popular Choice']
};

// Brands by category
const brandsByCategory: Record<string, string[]> = {
  'Electronics': ['Sony', 'Samsung', 'LG', 'Panasonic', 'Philips', 'JBL', 'Bose', 'Anker'],
  'Computers': ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Apple', 'Razer'],
  'Cell Phones': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Motorola', 'Nokia', 'Sony'],
  'Clothing': ['Nike', 'Adidas', 'Zara', 'H&M', 'Levis', 'Gap', 'Uniqlo', 'Puma'],
  'Home': ['KitchenAid', 'Cuisinart', 'Ninja', 'Instant Pot', 'Dyson', 'iRobot', 'Breville', 'Hamilton Beach'],
  'Sports': ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok', 'Wilson', 'Spalding', 'Garmin'],
  'default': ['Generic', 'Premium', 'Pro', 'Elite', 'Standard', 'Classic', 'Modern', 'Quality']
};

// Image URLs (placeholder)
const categoryImages: Record<string, string> = {
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
  'Computers': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
  'Cell Phones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
  'Clothing': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
  'Home': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
  'Toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
  'Books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
  'Collectibles': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  'default': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
};

interface CategoryNode {
  name: string;
  slug: string;
  level: number;
  children: CategoryNode[];
  parentSlug?: string;
}

// Parse eBay categories file
function parseEbayCategories(filePath: string): CategoryNode[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('http'));
  
  const rootCategories: CategoryNode[] = [];
  const stack: { node: CategoryNode; indent: number }[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Show more') || trimmed.includes(':')) continue;
    
    // Calculate indent level
    const indent = line.length - line.trimStart().length;
    const level = Math.floor(indent / 2);
    
    const node: CategoryNode = {
      name: trimmed,
      slug: slugify(trimmed),
      level,
      children: []
    };
    
    // Find parent
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      rootCategories.push(node);
    } else {
      const parent = stack[stack.length - 1].node;
      node.parentSlug = parent.slug;
      parent.children.push(node);
    }
    
    stack.push({ node, indent });
  }
  
  return rootCategories;
}


// Main categories to seed (top 20 from eBay)
const mainCategories = [
  { name: 'Electronics', nameAr: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
  { name: 'Computers & Networking', nameAr: 'كمبيوتر وشبكات', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400' },
  { name: 'Cell Phones & Accessories', nameAr: 'هواتف وإكسسوارات', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
  { name: 'Clothing, Shoes & Accessories', nameAr: 'ملابس وأحذية', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
  { name: 'Home & Garden', nameAr: 'منزل وحديقة', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  { name: 'Sports & Outdoors', nameAr: 'رياضة', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400' },
  { name: 'Toys & Hobbies', nameAr: 'ألعاب وهوايات', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400' },
  { name: 'Books', nameAr: 'كتب', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
  { name: 'Collectibles & Art', nameAr: 'مقتنيات وفن', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400' },
  { name: 'Jewelry & Watches', nameAr: 'مجوهرات وساعات', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
  { name: 'Health & Beauty', nameAr: 'صحة وجمال', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
  { name: 'Baby', nameAr: 'منتجات الأطفال', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400' },
  { name: 'Pet Supplies', nameAr: 'مستلزمات الحيوانات', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400' },
  { name: 'Automotive', nameAr: 'سيارات', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400' },
  { name: 'Musical Instruments', nameAr: 'آلات موسيقية', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400' },
  { name: 'Cameras & Photo', nameAr: 'كاميرات وتصوير', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' },
  { name: 'Video Games & Consoles', nameAr: 'ألعاب فيديو', image: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400' },
  { name: 'Movies & TV', nameAr: 'أفلام وتلفزيون', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400' },
  { name: 'Music', nameAr: 'موسيقى', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
  { name: 'Business & Industrial', nameAr: 'أعمال وصناعة', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400' },
];

// Subcategories for each main category
const subcategories: Record<string, string[]> = {
  'Electronics': ['TVs', 'Audio', 'Headphones', 'Smart Home', 'Wearables', 'Portable Audio', 'Home Theater', 'Accessories'],
  'Computers & Networking': ['Laptops', 'Desktops', 'Tablets', 'Monitors', 'Components', 'Networking', 'Storage', 'Printers'],
  'Cell Phones & Accessories': ['Smartphones', 'Cases', 'Chargers', 'Screen Protectors', 'Cables', 'Mounts', 'Batteries', 'Headsets'],
  'Clothing, Shoes & Accessories': ['Men\'s Clothing', 'Women\'s Clothing', 'Shoes', 'Bags', 'Watches', 'Sunglasses', 'Jewelry', 'Accessories'],
  'Home & Garden': ['Furniture', 'Kitchen', 'Bedding', 'Bath', 'Decor', 'Garden', 'Tools', 'Lighting'],
  'Sports & Outdoors': ['Fitness', 'Cycling', 'Camping', 'Water Sports', 'Team Sports', 'Golf', 'Running', 'Yoga'],
  'Toys & Hobbies': ['Action Figures', 'Building Toys', 'Dolls', 'Games', 'Puzzles', 'RC Toys', 'Educational', 'Outdoor'],
  'Books': ['Fiction', 'Non-Fiction', 'Children\'s', 'Textbooks', 'Comics', 'Magazines', 'Audiobooks', 'eBooks'],
  'Collectibles & Art': ['Coins', 'Stamps', 'Trading Cards', 'Antiques', 'Art', 'Memorabilia', 'Vintage', 'Posters'],
  'Jewelry & Watches': ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Men\'s Watches', 'Women\'s Watches', 'Smart Watches', 'Luxury'],
  'Health & Beauty': ['Skincare', 'Makeup', 'Hair Care', 'Fragrances', 'Personal Care', 'Vitamins', 'Medical', 'Oral Care'],
  'Baby': ['Clothing', 'Feeding', 'Diapers', 'Toys', 'Gear', 'Nursery', 'Safety', 'Bath'],
  'Pet Supplies': ['Dog', 'Cat', 'Fish', 'Bird', 'Small Animals', 'Reptile', 'Food', 'Accessories'],
  'Automotive': ['Parts', 'Accessories', 'Tools', 'Car Care', 'Electronics', 'Tires', 'Oils', 'Safety'],
  'Musical Instruments': ['Guitars', 'Keyboards', 'Drums', 'Wind', 'String', 'DJ Equipment', 'Recording', 'Accessories'],
  'Cameras & Photo': ['Digital Cameras', 'Lenses', 'Tripods', 'Lighting', 'Bags', 'Memory Cards', 'Drones', 'Film'],
  'Video Games & Consoles': ['PlayStation', 'Xbox', 'Nintendo', 'PC Gaming', 'Accessories', 'Retro', 'VR', 'Mobile Gaming'],
  'Movies & TV': ['DVDs', 'Blu-ray', '4K', 'Box Sets', 'TV Series', 'Documentaries', 'Kids', 'International'],
  'Music': ['CDs', 'Vinyl', 'Digital', 'Merchandise', 'Instruments', 'Equipment', 'Memorabilia', 'Sheet Music'],
  'Business & Industrial': ['Office', 'Industrial', 'Restaurant', 'Medical', 'Construction', 'Agriculture', 'Retail', 'Wholesale'],
};

// Conditions with weights
const conditions: { value: ProductCondition; weight: number }[] = [
  { value: 'NEW', weight: 50 },
  { value: 'LIKE_NEW', weight: 15 },
  { value: 'EXCELLENT', weight: 10 },
  { value: 'VERY_GOOD', weight: 10 },
  { value: 'GOOD', weight: 10 },
  { value: 'ACCEPTABLE', weight: 4 },
  { value: 'FOR_PARTS', weight: 1 },
];

// Listing types with weights
const listingTypes: { value: ListingType; weight: number }[] = [
  { value: 'FIXED_PRICE', weight: 70 },
  { value: 'AUCTION', weight: 25 },
  { value: 'CLASSIFIED_AD', weight: 5 },
];

function weightedRandom<T>(items: { value: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  return items[0].value;
}

// Generate product description
function generateDescription(productName: string, brand: string, category: string): string {
  const descriptions = [
    `High-quality ${productName} from ${brand}. Perfect for ${category.toLowerCase()} enthusiasts.`,
    `Brand new ${productName} by ${brand}. Excellent condition with all original accessories.`,
    `${brand} ${productName} - Top rated product in ${category}. Fast shipping available.`,
    `Premium ${productName} from trusted brand ${brand}. Great value for money.`,
    `Authentic ${brand} ${productName}. Ideal for everyday use. Satisfaction guaranteed.`,
  ];
  return randomItem(descriptions);
}

// Generate seller IDs
const sellerIds = Array.from({ length: 100 }, (_, i) => `seller-${i + 1}`);
const sellerTypes: SellerType[] = ['INDIVIDUAL', 'BUSINESS', 'POWER_SELLER', 'TOP_RATED'];


async function main() {
  console.log('🌱 Starting comprehensive seed...');
  console.log('');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.productAttribute.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVideo.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.productWatcher.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.searchQuery.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  console.log('✅ Cleared existing data');
  console.log('');

  // Create main categories
  console.log('📁 Creating categories...');
  const categoryMap = new Map<string, string>(); // slug -> id
  
  for (let i = 0; i < mainCategories.length; i++) {
    const cat = mainCategories[i];
    const slug = slugify(cat.name);
    
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug,
        description: `Browse ${cat.name} products`,
        imageUrl: cat.image,
        displayOrder: i,
        isActive: true,
        isFeatured: i < 8, // First 8 are featured
        allowsAuctions: true,
        allowsFixedPrice: true,
        commissionRate: 0.10,
      }
    });
    
    categoryMap.set(slug, created.id);
    console.log(`  ✓ ${cat.name}`);
    
    // Create subcategories
    const subs = subcategories[cat.name] || [];
    for (let j = 0; j < subs.length; j++) {
      const subSlug = slugify(`${cat.name}-${subs[j]}`);
      const subCreated = await prisma.category.create({
        data: {
          name: subs[j],
          slug: subSlug,
          description: `${subs[j]} in ${cat.name}`,
          parentId: created.id,
          displayOrder: j,
          isActive: true,
          isFeatured: j < 3,
          allowsAuctions: true,
          allowsFixedPrice: true,
          commissionRate: 0.10,
        }
      });
      categoryMap.set(subSlug, subCreated.id);
    }
  }
  
  const totalCategories = categoryMap.size;
  console.log(`✅ Created ${totalCategories} categories`);
  console.log('');

  // Create category attributes
  console.log('🏷️  Creating category attributes...');
  const categoryIds = Array.from(categoryMap.values());
  
  const commonAttributes = [
    { name: 'Brand', type: 'TEXT' as AttributeType, isRequired: false, isFilterable: true },
    { name: 'Model', type: 'TEXT' as AttributeType, isRequired: false, isFilterable: true },
    { name: 'Color', type: 'SELECT' as AttributeType, isRequired: false, isFilterable: true, options: ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Pink'] },
    { name: 'Size', type: 'SELECT' as AttributeType, isRequired: false, isFilterable: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Material', type: 'TEXT' as AttributeType, isRequired: false, isFilterable: true },
  ];

  for (const catId of categoryIds.slice(0, 20)) { // Add attributes to main categories
    for (let i = 0; i < commonAttributes.length; i++) {
      const attr = commonAttributes[i];
      await prisma.categoryAttribute.create({
        data: {
          categoryId: catId,
          name: attr.name,
          type: attr.type,
          isRequired: attr.isRequired,
          isFilterable: attr.isFilterable,
          isSearchable: true,
          options: attr.options || [],
          displayOrder: i,
          isActive: true,
        }
      });
    }
  }
  console.log('✅ Created category attributes');
  console.log('');

  // Create products
  console.log('📦 Creating 5000+ products...');
  const categoryEntries = Array.from(categoryMap.entries());
  let productCount = 0;
  const batchSize = 100;
  const targetProducts = 5000;
  
  while (productCount < targetProducts) {
    const products = [];
    
    for (let i = 0; i < batchSize && productCount + i < targetProducts; i++) {
      const [catSlug, catId] = randomItem(categoryEntries);
      const catName = catSlug.split('-')[0];
      const templates = productTemplates[catName] || productTemplates['default'];
      const brands = brandsByCategory[catName] || brandsByCategory['default'];
      
      const productName = randomItem(templates);
      const brand = randomItem(brands);
      const condition = weightedRandom(conditions);
      const listingType = weightedRandom(listingTypes);
      const sellerId = randomItem(sellerIds);
      const sellerType = randomItem(sellerTypes);
      
      // Price based on condition
      let basePrice = randomPrice(10, 2000);
      if (condition === 'NEW') basePrice *= 1;
      else if (condition === 'LIKE_NEW') basePrice *= 0.85;
      else if (condition === 'EXCELLENT') basePrice *= 0.75;
      else if (condition === 'VERY_GOOD') basePrice *= 0.65;
      else if (condition === 'GOOD') basePrice *= 0.55;
      else if (condition === 'ACCEPTABLE') basePrice *= 0.40;
      else basePrice *= 0.25;
      
      const fixedPrice = Math.round(basePrice * 100) / 100;
      const startingPrice = listingType === 'AUCTION' ? Math.round(fixedPrice * 0.5 * 100) / 100 : null;
      
      const uniqueSlug = `${slugify(productName)}-${brand.toLowerCase()}-${Date.now()}-${productCount + i}`;
      
      products.push({
        title: `${brand} ${productName}`,
        slug: uniqueSlug,
        description: generateDescription(productName, brand, catName),
        shortDescription: `${brand} ${productName} - ${condition.replace('_', ' ')}`,
        categoryId: catId,
        sellerId,
        sellerType,
        brand,
        condition,
        listingType,
        startingPrice,
        fixedPrice: listingType === 'FIXED_PRICE' ? fixedPrice : null,
        currentPrice: listingType === 'AUCTION' ? startingPrice : fixedPrice,
        buyItNowPrice: listingType === 'AUCTION' ? fixedPrice : null,
        allowsBuyItNow: listingType === 'AUCTION',
        quantity: Math.floor(Math.random() * 50) + 1,
        quantityAvailable: Math.floor(Math.random() * 50) + 1,
        freeShipping: Math.random() > 0.3,
        shippingCost: Math.random() > 0.3 ? null : randomPrice(5, 25),
        location: randomItem(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego']),
        country: 'US',
        status: 'ACTIVE' as ProductStatus,
        isActive: true,
        isFeatured: Math.random() > 0.9,
        isPromoted: Math.random() > 0.95,
        hasReturns: Math.random() > 0.2,
        returnPolicy: '30 days return policy',
        viewCount: Math.floor(Math.random() * 1000),
        watchCount: Math.floor(Math.random() * 100),
        keywords: [brand.toLowerCase(), productName.toLowerCase(), catName.toLowerCase()],
        tags: [condition.toLowerCase(), listingType.toLowerCase()],
        auctionDuration: listingType === 'AUCTION' ? randomItem([24, 72, 168, 240]) : null,
        auctionEndTime: listingType === 'AUCTION' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
      });
    }
    
    await prisma.product.createMany({ data: products });
    productCount += products.length;
    
    if (productCount % 500 === 0) {
      console.log(`  📦 Created ${productCount} products...`);
    }
  }
  
  console.log(`✅ Created ${productCount} products`);
  console.log('');

  // Add images to products
  console.log('🖼️  Adding product images...');
  const allProducts = await prisma.product.findMany({ select: { id: true, categoryId: true } });
  
  for (const product of allProducts) {
    const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
    const catName = category?.name.split(' ')[0] || 'default';
    const imageUrl = categoryImages[catName] || categoryImages['default'];
    
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        altText: 'Product image',
        isPrimary: true,
        sortOrder: 0,
      }
    });
  }
  console.log(`✅ Added images to ${allProducts.length} products`);
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════');
  console.log(`📁 Categories: ${totalCategories}`);
  console.log(`📦 Products: ${productCount}`);
  console.log(`🖼️  Images: ${allProducts.length}`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

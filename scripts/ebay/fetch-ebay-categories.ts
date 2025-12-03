import axios from 'axios';
import fs from 'fs';
import path from 'path';

// eBay API Configuration
const EBAY_API_URL = 'https://api.ebay.com/commerce/taxonomy/v1';
const EBAY_AUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

// TODO: Replace with your eBay API credentials
// Get them from: https://developer.ebay.com/
const CLIENT_ID = process.env.EBAY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';

interface EbayCategory {
  categoryId: string;
  categoryName: string;
  categoryTreeNodeLevel: number;
  parentCategoryId?: string;
  childCategoryTreeNodes?: EbayCategory[];
}

interface CategoryData {
  name: string;
  nameAr: string;
  slug: string;
  level: number;
  parentSlug?: string;
  displayOrder: number;
  ebayId: string;
}

// Arabic translations map (basic - can be expanded)
const arabicTranslations: Record<string, string> = {
  // Main categories
  'Antiques': 'تحف',
  'Art': 'فنون',
  'Baby': 'أطفال رضع',
  'Books': 'كتب',
  'Business & Industrial': 'أعمال وصناعة',
  'Cameras & Photo': 'كاميرات وتصوير',
  'Cell Phones & Accessories': 'هواتف محمولة وإكسسوارات',
  'Clothing, Shoes & Accessories': 'ملابس وأحذية وإكسسوارات',
  'Coins & Paper Money': 'عملات ونقود',
  'Collectibles': 'مقتنيات',
  'Computers/Tablets & Networking': 'كمبيوتر وتابلت وشبكات',
  'Consumer Electronics': 'إلكترونيات استهلاكية',
  'Crafts': 'حرف يدوية',
  'Dolls & Bears': 'دمى ودببة',
  'DVDs & Movies': 'أقراص وأفلام',
  'eBay Motors': 'سيارات ومركبات',
  'Entertainment Memorabilia': 'تذكارات ترفيهية',
  'Gift Cards & Coupons': 'بطاقات هدايا وكوبونات',
  'Health & Beauty': 'صحة وجمال',
  'Home & Garden': 'منزل وحديقة',
  'Jewelry & Watches': 'مجوهرات وساعات',
  'Music': 'موسيقى',
  'Musical Instruments & Gear': 'آلات موسيقية ومعدات',
  'Pet Supplies': 'مستلزمات حيوانات أليفة',
  'Pottery & Glass': 'فخار وزجاج',
  'Real Estate': 'عقارات',
  'Specialty Services': 'خدمات متخصصة',
  'Sporting Goods': 'معدات رياضية',
  'Sports Mem, Cards & Fan Shop': 'تذكارات رياضية وبطاقات',
  'Stamps': 'طوابع',
  'Tickets & Experiences': 'تذاكر وتجارب',
  'Toys & Hobbies': 'ألعاب وهوايات',
  'Travel': 'سفر',
  'Video Games & Consoles': 'ألعاب فيديو وأجهزة',
  'Everything Else': 'كل شيء آخر',
  
  // Common subcategories
  'Women': 'نساء',
  'Men': 'رجال',
  'Kids': 'أطفال',
  'Furniture': 'أثاث',
  'Electronics': 'إلكترونيات',
  'Parts & Accessories': 'قطع وإكسسوارات',
  'Clothing': 'ملابس',
  'Shoes': 'أحذية',
  'Bags': 'حقائب',
  'Watches': 'ساعات',
  'Other': 'أخرى',
};

/**
 * Get OAuth access token from eBay
 */
async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      EBAY_AUTH_URL,
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
      }
    );
    
    return response.data.access_token;
  } catch (error: any) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch category tree from eBay API
 */
async function getCategoryTree(token: string, marketplaceId: string = '0'): Promise<any> {
  try {
    const response = await axios.get(
      `${EBAY_API_URL}/category_tree/${marketplaceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching category tree:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Convert eBay category name to slug
 */
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&,]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Translate category name to Arabic
 */
function translateToArabic(name: string): string {
  // Check if we have a direct translation
  if (arabicTranslations[name]) {
    return arabicTranslations[name];
  }
  
  // Try to find partial match
  for (const [key, value] of Object.entries(arabicTranslations)) {
    if (name.includes(key)) {
      return name.replace(key, value);
    }
  }
  
  // Return original if no translation found
  return name;
}

/**
 * Flatten eBay category tree into array
 */
function flattenCategories(
  node: EbayCategory,
  level: number = 1,
  parentSlug?: string,
  displayOrder: number = 1
): CategoryData[] {
  const categories: CategoryData[] = [];
  
  const slug = nameToSlug(node.categoryName);
  
  categories.push({
    name: node.categoryName,
    nameAr: translateToArabic(node.categoryName),
    slug,
    level,
    parentSlug,
    displayOrder,
    ebayId: node.categoryId,
  });
  
  if (node.childCategoryTreeNodes && node.childCategoryTreeNodes.length > 0) {
    node.childCategoryTreeNodes.forEach((child, index) => {
      const childCategories = flattenCategories(child, level + 1, slug, index + 1);
      categories.push(...childCategories);
    });
  }
  
  return categories;
}

/**
 * Generate TypeScript seed file
 */
function generateSeedFile(categories: CategoryData[]): string {
  let code = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  nameAr: string;
  slug: string;
  level: number;
  parentSlug?: string;
  displayOrder: number;
  ebayId: string;
}

// Auto-generated from eBay Taxonomy API
// Generated on: ${new Date().toISOString()}
// Total categories: ${categories.length}

const ebayCategories: CategoryData[] = [\n`;

  categories.forEach(cat => {
    code += '  {\n';
    code += `    name: '${cat.name.replace(/'/g, "\\'")}',\n`;
    code += `    nameAr: '${cat.nameAr.replace(/'/g, "\\'")}',\n`;
    code += `    slug: '${cat.slug}',\n`;
    code += `    level: ${cat.level},\n`;
    if (cat.parentSlug) {
      code += `    parentSlug: '${cat.parentSlug}',\n`;
    }
    code += `    displayOrder: ${cat.displayOrder},\n`;
    code += `    ebayId: '${cat.ebayId}',\n`;
    code += '  },\n';
  });

  code += '];\n\n';
  
  code += `async function seedCategories() {
  console.log('🌱 Starting eBay categories seed...');
  console.log(\`📊 Total categories to import: \${ebayCategories.length}\`);

  try {
    // Clear existing categories
    console.log('🗑️  Clearing existing categories...');
    await prisma.category.deleteMany({});
    console.log('✅ Existing categories cleared\\n');

    const categoryMap = new Map<string, number>();

    // Group by level
    const level1 = ebayCategories.filter(c => c.level === 1);
    const level2 = ebayCategories.filter(c => c.level === 2);
    const level3 = ebayCategories.filter(c => c.level === 3);
    const level4Plus = ebayCategories.filter(c => c.level > 3);

    // Create Level 1
    console.log(\`📦 Creating \${level1.length} Level 1 categories...\`);
    for (const cat of level1) {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          nameAr: cat.nameAr,
          slug: cat.slug,
          level: cat.level,
          displayOrder: cat.displayOrder,
          isActive: true,
        },
      });
      categoryMap.set(cat.slug, created.id);
    }
    console.log(\`✅ Level 1 complete\\n\`);

    // Create Level 2
    console.log(\`📦 Creating \${level2.length} Level 2 categories...\`);
    for (const cat of level2) {
      const parentId = cat.parentSlug ? categoryMap.get(cat.parentSlug) : null;
      if (!parentId && cat.parentSlug) continue;
      
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          nameAr: cat.nameAr,
          slug: cat.slug,
          level: cat.level,
          parentId,
          displayOrder: cat.displayOrder,
          isActive: true,
        },
      });
      categoryMap.set(cat.slug, created.id);
    }
    console.log(\`✅ Level 2 complete\\n\`);

    // Create Level 3
    console.log(\`📦 Creating \${level3.length} Level 3 categories...\`);
    for (const cat of level3) {
      const parentId = cat.parentSlug ? categoryMap.get(cat.parentSlug) : null;
      if (!parentId && cat.parentSlug) continue;
      
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          nameAr: cat.nameAr,
          slug: cat.slug,
          level: cat.level,
          parentId,
          displayOrder: cat.displayOrder,
          isActive: true,
        },
      });
      categoryMap.set(cat.slug, created.id);
    }
    console.log(\`✅ Level 3 complete\\n\`);

    // Create Level 4+
    if (level4Plus.length > 0) {
      console.log(\`📦 Creating \${level4Plus.length} Level 4+ categories...\`);
      for (const cat of level4Plus) {
        const parentId = cat.parentSlug ? categoryMap.get(cat.parentSlug) : null;
        if (!parentId && cat.parentSlug) continue;
        
        await prisma.category.create({
          data: {
            name: cat.name,
            nameAr: cat.nameAr,
            slug: cat.slug,
            level: cat.level,
            parentId,
            displayOrder: cat.displayOrder,
            isActive: true,
          },
        });
      }
      console.log(\`✅ Level 4+ complete\\n\`);
    }

    const total = await prisma.category.count();
    console.log('═══════════════════════════════════════');
    console.log('🎉 Categories seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log(\`📊 Total categories: \${total}\`);
    console.log('═══════════════════════════════════════\\n');

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
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

  return code;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 eBay Category Fetcher');
  console.log('═══════════════════════════════════════\n');

  // Check credentials
  if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE') {
    console.error('❌ Error: Please set your eBay API credentials!');
    console.log('\n📝 Instructions:');
    console.log('1. Go to https://developer.ebay.com/');
    console.log('2. Create an application');
    console.log('3. Get your Client ID and Client Secret');
    console.log('4. Set environment variables:');
    console.log('   export EBAY_CLIENT_ID="your_client_id"');
    console.log('   export EBAY_CLIENT_SECRET="your_client_secret"');
    console.log('\nOr edit this file and replace YOUR_CLIENT_ID_HERE and YOUR_CLIENT_SECRET_HERE\n');
    process.exit(1);
  }

  try {
    // Step 1: Get access token
    console.log('🔑 Step 1: Getting OAuth access token...');
    const token = await getAccessToken();
    console.log('✅ Access token obtained\n');

    // Step 2: Fetch category tree
    console.log('📦 Step 2: Fetching eBay category tree (US marketplace)...');
    const categoryTree = await getCategoryTree(token, '0'); // 0 = US
    console.log('✅ Category tree fetched\n');

    // Step 3: Flatten categories
    console.log('🔄 Step 3: Processing categories...');
    const categories = flattenCategories(categoryTree.rootCategoryNode);
    console.log(`✅ Processed ${categories.length} categories\n`);

    // Step 4: Save raw JSON
    console.log('💾 Step 4: Saving raw data...');
    const jsonPath = path.join(__dirname, '../prisma/seeds/ebay-categories-raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify(categoryTree, null, 2));
    console.log(`✅ Raw data saved to: ${jsonPath}\n`);

    // Step 5: Generate seed file
    console.log('📝 Step 5: Generating TypeScript seed file...');
    const seedCode = generateSeedFile(categories);
    const seedPath = path.join(__dirname, '../prisma/seeds/ebay-categories-full.seed.ts');
    fs.writeFileSync(seedPath, seedCode);
    console.log(`✅ Seed file generated: ${seedPath}\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Success!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total categories: ${categories.length}`);
    
    const byLevel = categories.reduce((acc, cat) => {
      acc[cat.level] = (acc[cat.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    Object.keys(byLevel).sort().forEach(level => {
      console.log(`   - Level ${level}: ${byLevel[Number(level)]}`);
    });
    
    console.log('\n📁 Files created:');
    console.log(`   - ${jsonPath}`);
    console.log(`   - ${seedPath}`);
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Review the generated seed file');
    console.log('   2. Run: npx ts-node prisma/seeds/ebay-categories-full.seed.ts');
    console.log('═══════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as fetchEbayCategories };

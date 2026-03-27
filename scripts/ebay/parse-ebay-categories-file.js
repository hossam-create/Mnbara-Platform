"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Arabic translations
const arabicTranslations = {
    // Main categories
    'Antiques': 'تحف',
    'Art': 'فنون',
    'Baby': 'أطفال رضع',
    'Boats': 'قوارب',
    'Books': 'كتب',
    'Business & Industrial': 'أعمال وصناعة',
    'Cameras & Photo': 'كاميرات وتصوير',
    'Cell Phones & Accessories': 'هواتف محمولة',
    'Clothing, Shoes & Accessories': 'ملابس وأحذية',
    'Coins & Paper Money': 'عملات ونقود',
    'Collectibles': 'مقتنيات',
    'Computers/Tablets & Networking': 'كمبيوتر وتابلت',
    'Consumer Electronics': 'إلكترونيات',
    'Crafts': 'حرف يدوية',
    'Dolls & Bears': 'دمى ودببة',
    'DVDs & Movies': 'أقراص وأفلام',
    'eBay Motors': 'سيارات',
    'Entertainment Memorabilia': 'تذكارات ترفيهية',
    'Gift Cards': 'بطاقات هدايا',
    'Health & Beauty': 'صحة وجمال',
    'Home & Garden': 'منزل وحديقة',
    'Jewelry & Watches': 'مجوهرات وساعات',
    'Music': 'موسيقى',
    'Musical Instruments': 'آلات موسيقية',
    'Pet Supplies': 'مستلزمات حيوانات',
    'Pottery & Glass': 'فخار وزجاج',
    'Real Estate': 'عقارات',
    'Specialty Services': 'خدمات متخصصة',
    'Sporting Goods': 'معدات رياضية',
    'Sports Mem, Cards & Fan Shop': 'تذكارات رياضية',
    'Stamps': 'طوابع',
    'Tickets & Experiences': 'تذاكر وتجارب',
    'Toys & Hobbies': 'ألعاب وهوايات',
    'Travel': 'سفر',
    'Video Games & Consoles': 'ألعاب فيديو',
    'Everything Else': 'كل شيء آخر',
    // Common words
    'Other': 'أخرى',
    'Accessories': 'إكسسوارات',
    'Parts': 'قطع',
    'Furniture': 'أثاث',
    'Clothing': 'ملابس',
    'Shoes': 'أحذية',
    'Bags': 'حقائب',
    'Watches': 'ساعات',
    'Women': 'نساء',
    'Men': 'رجال',
    'Kids': 'أطفال',
    'Baby': 'رضيع',
    'Vintage': 'قديم',
    'Modern': 'حديث',
    'Contemporary': 'معاصر',
    'Antique': 'تحفة',
};
function nameToSlug(name) {
    return name
        .toLowerCase()
        .replace(/[&,]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[()]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
}
function translateToArabic(name) {
    if (arabicTranslations[name]) {
        return arabicTranslations[name];
    }
    for (const [key, value] of Object.entries(arabicTranslations)) {
        if (name.includes(key)) {
            return name.replace(key, value);
        }
    }
    return name;
}
function parseEbayCategoriesFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const categories = [];
    let currentLevel1 = null;
    let currentLevel2 = null;
    let level1Order = 0;
    let level2Order = 0;
    let level3Order = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip URL line
        if (line.startsWith('http'))
            continue;
        // Skip "Show all" lines
        if (line.startsWith('Show all'))
            continue;
        // Detect level by context
        const nextLine = lines[i + 1];
        const isLevel1 = !currentLevel1 || (nextLine && !nextLine.startsWith(' ') && nextLine !== 'Other');
        if (isLevel1 && line !== 'Other') {
            // Level 1 category
            currentLevel1 = line;
            currentLevel2 = null;
            level1Order++;
            level2Order = 0;
            level3Order = 0;
            categories.push({
                name: line,
                nameAr: translateToArabic(line),
                slug: nameToSlug(line),
                level: 1,
                displayOrder: level1Order,
            });
        }
        else if (currentLevel1) {
            // Check if it's a Level 2 or Level 3
            // Simple heuristic: if previous was Level 2 and this is short/specific, it's Level 3
            const isLikelyLevel3 = currentLevel2 && (line.length < 30 ||
                line.match(/^\d/) || // Starts with number
                line.includes('(') || // Has parentheses
                line === 'Other');
            if (isLikelyLevel3) {
                // Level 3
                level3Order++;
                categories.push({
                    name: line,
                    nameAr: translateToArabic(line),
                    slug: nameToSlug(line),
                    level: 3,
                    parentSlug: currentLevel2 ? nameToSlug(currentLevel2) : nameToSlug(currentLevel1),
                    displayOrder: level3Order,
                });
            }
            else {
                // Level 2
                currentLevel2 = line;
                level2Order++;
                level3Order = 0;
                categories.push({
                    name: line,
                    nameAr: translateToArabic(line),
                    slug: nameToSlug(line),
                    level: 2,
                    parentSlug: nameToSlug(currentLevel1),
                    displayOrder: level2Order,
                });
            }
        }
    }
    return categories;
}
function generateSeedFile(categories) {
    let code = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Auto-generated from eBay categories text file
// Generated on: ${new Date().toISOString()}
// Total categories: ${categories.length}

const ebayCategories = [\n`;
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
        code += '  },\n';
    });
    code += '];\n\n';
    code += `async function seedCategories() {
  console.log('🌱 Starting eBay categories seed from text file...');
  console.log(\`📊 Total categories: \${ebayCategories.length}\`);

  try {
    console.log('🗑️  Clearing existing categories...');
    await prisma.category.deleteMany({});
    console.log('✅ Cleared\\n');

    const categoryMap = new Map<string, number>();

    // Group by level
    const byLevel = ebayCategories.reduce((acc, cat) => {
      if (!acc[cat.level]) acc[cat.level] = [];
      acc[cat.level].push(cat);
      return acc;
    }, {} as Record<number, typeof ebayCategories>);

    // Create categories level by level
    for (let level = 1; level <= Math.max(...Object.keys(byLevel).map(Number)); level++) {
      const cats = byLevel[level] || [];
      if (cats.length === 0) continue;
      
      console.log(\`📦 Creating \${cats.length} Level \${level} categories...\`);
      
      for (const cat of cats) {
        const parentId = cat.parentSlug ? categoryMap.get(cat.parentSlug) : null;
        if (cat.parentSlug && !parentId) {
          console.warn(\`  ⚠️  Skipping '\${cat.name}' - parent '\${cat.parentSlug}' not found\`);
          continue;
        }
        
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
      console.log(\`✅ Level \${level} complete\\n\`);
    }

    const total = await prisma.category.count();
    console.log('═══════════════════════════════════════');
    console.log('🎉 Categories seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log(\`📊 Total categories: \${total}\`);
    
    Object.keys(byLevel).sort().forEach(level => {
      console.log(\`   - Level \${level}: \${byLevel[Number(level)].length}\`);
    });
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
// Main execution
const inputFile = path_1.default.join(__dirname, '../ebay catogery.txt');
const outputFile = path_1.default.join(__dirname, '../services/auth-service/prisma/seeds/ebay-categories-from-file.seed.ts');
console.log('🚀 eBay Categories Parser');
console.log('═══════════════════════════════════════\n');
console.log(`Reading file: ${inputFile}`);
const categories = parseEbayCategoriesFile(inputFile);
console.log(`✅ Parsed ${categories.length} categories\n`);
// Stats
const byLevel = categories.reduce((acc, cat) => {
    acc[cat.level] = (acc[cat.level] || 0) + 1;
    return acc;
}, {});
console.log('Statistics:');
Object.keys(byLevel).sort().forEach(level => {
    console.log(`   - Level ${level}: ${byLevel[Number(level)]}`);
});
console.log();
console.log(`Generating seed file: ${outputFile}`);
const seedCode = generateSeedFile(categories);
fs_1.default.writeFileSync(outputFile, seedCode);
console.log('Seed file generated\n');
console.log('═══════════════════════════════════════');
console.log('Success!');
console.log('═══════════════════════════════════════');
console.log(`Output: ${outputFile}`);
console.log('\nNext step:');
console.log('   cd services/auth-service');
console.log('   npx ts-node prisma/seeds/ebay-categories-from-file.seed.ts');
console.log('═══════════════════════════════════════\\n');
//# sourceMappingURL=parse-ebay-categories-file.js.map
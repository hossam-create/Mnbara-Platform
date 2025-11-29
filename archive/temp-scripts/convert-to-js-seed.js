const fs = require('fs');
const path = require('path');

// Simple parser for eBay categories text file -> JS Seed
function parseFile() {
  const inputFile = path.join(__dirname, '../ebay catogery.txt');
  const outputFile = path.join(__dirname, '../services/auth-service/prisma/seeds/ebay-categories.seed.js');
  
  console.log('Reading file...');
  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('http') && !l.startsWith('Show all'));
  
  const categories = [];
  let level1 = null;
  let level2 = null;
  let order1 = 0, order2 = 0, order3 = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNewSection = i === 0 || (i > 0 && lines[i-1] === '');
    
    if (isNewSection || (!level1 && line.length > 0)) {
      level1 = line;
      level2 = null;
      order1++;
      order2 = 0;
      order3 = 0;
      categories.push({ name: line, slug: toSlug(line), level: 1, order: order1 });
    } else if (level1) {
      const isShort = line.length < 25;
      const hasParens = line.includes('(');
      const isOther = line === 'Other';
      
      if (level2 && (isShort || hasParens || isOther)) {
        order3++;
        categories.push({ name: line, slug: toSlug(line), level: 3, parent: toSlug(level2), order: order3 });
      } else {
        level2 = line;
        order2++;
        order3 = 0;
        categories.push({ name: line, slug: toSlug(line), level: 2, parent: toSlug(level1), order: order2 });
      }
    }
  }
  
  console.log(`Parsed ${categories.length} categories`);
  
  // Generate JS seed file
  let code = `const { PrismaClient } = require('@prisma/client');\n\n`;
  code += `const prisma = new PrismaClient();\n\n`;
  code += `const categories = [\n`;
  
  categories.forEach(cat => {
    code += `  { name: "${cat.name.replace(/"/g, '\\"')}", slug: "${cat.slug}", level: ${cat.level}`;
    if (cat.parent) code += `, parent: "${cat.parent}"`;
    code += `, order: ${cat.order} },\n`;
  });
  
  code += `];\n\n`;
  code += `async function seed() {\n`;
  code += `  console.log('Seeding categories...');\n`;
  code += `  try {\n`;
  code += `    await prisma.category.deleteMany({});\n`;
  code += `    const map = new Map();\n`;
  code += `    for (const cat of categories) {\n`;
  code += `      const parentId = cat.parent ? map.get(cat.parent) : null;\n`;
  code += `      const created = await prisma.category.create({\n`;
  code += `        data: { name: cat.name, nameAr: cat.name, slug: cat.slug, level: cat.level, parentId, displayOrder: cat.order, isActive: true }\n`;
  code += `      });\n`;
  code += `      map.set(cat.slug, created.id);\n`;
  code += `    }\n`;
  code += `    console.log('Done! Created', categories.length, 'categories');\n`;
  code += `  } catch (e) {\n`;
  code += `    console.error(e);\n`;
  code += `    process.exit(1);\n`;
  code += `  } finally {\n`;
  code += `    await prisma.$disconnect();\n`;
  code += `  }\n`;
  code += `}\n\n`;
  code += `seed();\n`;
  
  fs.writeFileSync(outputFile, code);
  console.log(`Generated JS seed: ${outputFile}`);
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

parseFile();

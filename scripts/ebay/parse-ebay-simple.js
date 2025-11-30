const fs = require('fs');
const path = require('path');

// Simple parser for eBay categories text file
function parseFile() {
  const inputFile = path.join(__dirname, '../ebay catogery.txt');
  const outputFile = path.join(__dirname, '../services/auth-service/prisma/seeds/ebay-categories-from-file.seed.ts');
  
  console.log('Reading file...');
  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('http') && !l.startsWith('Show all'));
  
  console.log(`Found ${lines.length} lines`);
  
  const categories = [];
  let level1 = null;
  let level2 = null;
  let order1 = 0, order2 = 0, order3 = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    
    // Detect if this is a new Level 1 category
    // Simple heuristic: if it's not indented and next line exists
    const isNewSection = i === 0 || (i > 0 && lines[i-1] === '');
    
    if (isNewSection || (!level1 && line.length > 0)) {
      // Level 1
      level1 = line;
      level2 = null;
      order1++;
      order2 = 0;
      order3 = 0;
      
      categories.push({
        name: line,
        slug: line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        level: 1,
        order: order1
      });
    } else if (level1) {
      // Check if it's Level 2 or 3
      const isShort = line.length < 25;
      const hasParens = line.includes('(');
      const isOther = line === 'Other';
      
      if (level2 && (isShort || hasParens || isOther)) {
        // Level 3
        order3++;
        categories.push({
          name: line,
          slug: line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          level: 3,
          parent: level2.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          order: order3
        });
      } else {
        // Level 2
        level2 = line;
        order2++;
        order3 = 0;
        
        categories.push({
          name: line,
          slug: line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          level: 2,
          parent: level1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          order: order2
        });
      }
    }
  }
  
  console.log(`Parsed ${categories.length} categories`);
  
  // Generate seed file
  let code = `import { PrismaClient } from '@prisma/client';\n\n`;
  code += `const prisma = new PrismaClient();\n\n`;
  code += `// Generated from ebay catogery.txt\n`;
  code += `// Total: ${categories.length} categories\n\n`;
  code += `const categories = [\n`;
  
  categories.forEach(cat => {
    code += `  { name: "${cat.name.replace(/"/g, '\\"')}", slug: "${cat.slug}", level: ${cat.level}`;
    if (cat.parent) code += `, parent: "${cat.parent}"`;
    code += `, order: ${cat.order} },\n`;
  });
  
  code += `];\n\n`;
  code += `async function seed() {\n`;
  code += `  console.log('Seeding categories...');\n`;
  code += `  await prisma.category.deleteMany({});\n`;
  code += `  const map = new Map();\n`;
  code += `  for (const cat of categories) {\n`;
  code += `    const parentId = cat.parent ? map.get(cat.parent) : null;\n`;
  code += `    const created = await prisma.category.create({\n`;
  code += `      data: { name: cat.name, nameAr: cat.name, slug: cat.slug, level: cat.level, parentId, displayOrder: cat.order, isActive: true }\n`;
  code += `    });\n`;
  code += `    map.set(cat.slug, created.id);\n`;
  code += `  }\n`;
  code += `  console.log('Done! Created', categories.length, 'categories');\n`;
  code += `}\n\n`;
  code += `seed().finally(() => prisma.$disconnect());\n`;
  
  fs.writeFileSync(outputFile, code);
  console.log(`Generated: ${outputFile}`);
  console.log('Done!');
}

parseFile();

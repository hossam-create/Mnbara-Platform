const fs = require('fs');

// Read the seed file
const seedContent = fs.readFileSync('services/auth-service/prisma/seeds/ebay-categories.seed.js', 'utf-8');

// Extract the categories array using regex
const match = seedContent.match(/const categories = \[([\s\S]*?)\];/);
if (!match) {
  console.error('Could not find categories array');
  process.exit(1);
}

let sql = `-- eBay Categories Seed
BEGIN;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS "Category" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL,
  "parentId" INTEGER,
  "displayOrder" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data
TRUNCATE TABLE "Category" RESTART IDENTITY CASCADE;

-- Insert categories
`;

// Parse categories from the matched content
const categoriesStr = match[1];
const categoryRegex = /\{ name: "([^"]+)", slug: "([^"]+)", level: (\d+)(?:, parent: "([^"]+)")?, order: (\d+) \}/g;

const categories = [];
const slugCounts = new Map();
let catMatch;
while ((catMatch = categoryRegex.exec(categoriesStr)) !== null) {
  let slug = catMatch[2];
  
  // Handle duplicate slugs
  if (slugCounts.has(slug)) {
    const count = slugCounts.get(slug);
    slug = `${slug}-${count}`;
    slugCounts.set(catMatch[2], count + 1);
  } else {
    slugCounts.set(slug, 1);
  }
  
  categories.push({
    name: catMatch[1].replace(/'/g, "''"),
    slug: slug,
    level: parseInt(catMatch[3]),
    parentSlug: catMatch[4],
    order: parseInt(catMatch[5])
  });
}

console.log(`Found ${categories.length} categories`);

// Build slug to ID map
sql += `\n-- Level 1 categories\n`;
categories.filter(c => c.level === 1).forEach(cat => {
  sql += `INSERT INTO "Category" (name, "nameAr", slug, level, "displayOrder", "isActive") VALUES ('${cat.name}', '${cat.name}', '${cat.slug}', ${cat.level}, ${cat.order}, true) ON CONFLICT (slug) DO NOTHING;\n`;
});

sql += `\n-- Level 2 categories\n`;
categories.filter(c => c.level === 2).forEach(cat => {
  sql += `INSERT INTO "Category" (name, "nameAr", slug, level, "parentId", "displayOrder", "isActive") 
VALUES ('${cat.name}', '${cat.name}', '${cat.slug}', ${cat.level}, 
(SELECT id FROM "Category" WHERE slug = '${cat.parentSlug}'), ${cat.order}, true) ON CONFLICT (slug) DO NOTHING;\n`;
});

sql += `\n-- Level 3 categories\n`;
categories.filter(c => c.level === 3).forEach(cat => {
  sql += `INSERT INTO "Category" (name, "nameAr", slug, level, "parentId", "displayOrder", "isActive") 
VALUES ('${cat.name}', '${cat.name}', '${cat.slug}', ${cat.level}, 
(SELECT id FROM "Category" WHERE slug = '${cat.parentSlug}'), ${cat.order}, true) ON CONFLICT (slug) DO NOTHING;\n`;
});

sql += '\nCOMMIT;\n';

fs.writeFileSync('services/auth-service/seed-categories.sql', sql);
console.log('Generated seed-categories.sql');

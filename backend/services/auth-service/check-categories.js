const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load .env manually to be sure
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'DATABASE_URL') {
        process.env.DATABASE_URL = value;
        console.log('Loaded DATABASE_URL from .env');
      }
    }
  });
}

const prisma = new PrismaClient();

async function check() {
  try {
    console.log('Connecting to database...');
    const count = await prisma.category.count();
    console.log(`📊 Total Categories in DB: ${count}`);
    
    if (count > 0) {
      const sample = await prisma.category.findFirst({
        where: { level: 1 }
      });
      console.log('✅ Sample Category:', sample.name);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();

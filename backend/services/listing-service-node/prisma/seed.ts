import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.product.deleteMany();
  console.log('✅ Cleared existing products');

  // Sample products
  const products = [
    {
      title: 'iPhone 15 Pro Max',
      description: 'Latest Apple iPhone with A17 Pro chip, 256GB storage',
      price: 1199.99,
      category: 'Electronics',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=iPhone+15'],
      sellerId: 'seller-1',
      stock: 10,
      status: 'active',
    },
    {
      title: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android phone with S Pen, 512GB',
      price: 1099.99,
      category: 'Electronics',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=Galaxy+S24'],
      sellerId: 'seller-1',
      stock: 15,
      status: 'active',
    },
    {
      title: 'MacBook Pro 16" M3',
      description: 'Powerful laptop for professionals, 32GB RAM, 1TB SSD',
      price: 2499.99,
      category: 'Electronics',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=MacBook+Pro'],
      sellerId: 'seller-2',
      stock: 5,
      status: 'active',
    },
    {
      title: 'Sony WH-1000XM5',
      description: 'Premium noise-cancelling headphones',
      price: 399.99,
      category: 'Electronics',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=Sony+Headphones'],
      sellerId: 'seller-2',
      stock: 20,
      status: 'active',
    },
    {
      title: 'Nike Air Max 2024',
      description: 'Comfortable running shoes, size 10',
      price: 149.99,
      category: 'Fashion',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=Nike+Shoes'],
      sellerId: 'seller-3',
      stock: 30,
      status: 'active',
    },
    {
      title: 'Adidas Ultraboost',
      description: 'Premium running shoes with boost technology',
      price: 179.99,
      category: 'Fashion',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=Adidas+Shoes'],
      sellerId: 'seller-3',
      stock: 25,
      status: 'active',
    },
    {
      title: 'Vintage Leather Jacket',
      description: 'Genuine leather jacket, size M',
      price: 299.99,
      category: 'Fashion',
      condition: 'used',
      images: ['https://via.placeholder.com/400x400?text=Leather+Jacket'],
      sellerId: 'seller-4',
      stock: 1,
      status: 'active',
    },
    {
      title: 'Gaming Chair RGB',
      description: 'Ergonomic gaming chair with RGB lighting',
      price: 349.99,
      category: 'Home',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=Gaming+Chair'],
      sellerId: 'seller-4',
      stock: 12,
      status: 'active',
    },
    {
      title: 'Standing Desk Electric',
      description: 'Adjustable height standing desk, 60x30 inches',
      price: 599.99,
      category: 'Home',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=Standing+Desk'],
      sellerId: 'seller-5',
      stock: 8,
      status: 'active',
    },
    {
      title: 'Dyson V15 Vacuum',
      description: 'Cordless vacuum cleaner with laser detection',
      price: 649.99,
      category: 'Home',
      condition: 'new',
      images: ['https://via.placeholder.com/400x400?text=Dyson+Vacuum'],
      sellerId: 'seller-5',
      stock: 6,
      status: 'active',
    },
  ];

  // Create products
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`✅ Created ${products.length} products`);
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

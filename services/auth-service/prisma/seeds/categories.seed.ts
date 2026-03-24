import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
    console.log('🌱 Seeding categories...');

    // Create main categories first
    const categoryMap = new Map<string, number>();

    const electronics = await prisma.category.create({
        data: {
            name: 'Electronics',
            nameAr: 'إلكترونيات',
            slug: 'electronics',
            level: 1,
            displayOrder: 1,
            isActive: true,
        },
    });
    categoryMap.set('Electronics', electronics.id);
    console.log('✅ Created: Electronics');

    const fashion = await prisma.category.create({
        data: {
            name: 'Fashion',
            nameAr: 'أزياء',
            slug: 'fashion',
            level: 1,
            displayOrder: 2,
            isActive: true,
        },
    });
    categoryMap.set('Fashion', fashion.id);
    console.log('✅ Created: Fashion');

    const home_garden = await prisma.category.create({
        data: {
            name: 'Home & Garden',
            nameAr: 'منزل وحديقة',
            slug: 'home-garden',
            level: 1,
            displayOrder: 3,
            isActive: true,
        },
    });
    categoryMap.set('Home & Garden', home_garden.id);
    console.log('✅ Created: Home & Garden');

    const sports_outdoors = await prisma.category.create({
        data: {
            name: 'Sports & Outdoors',
            nameAr: 'رياضة وهواء طلق',
            slug: 'sports-outdoors',
            level: 1,
            displayOrder: 4,
            isActive: true,
        },
    });
    categoryMap.set('Sports & Outdoors', sports_outdoors.id);
    console.log('✅ Created: Sports & Outdoors');

    const toys_hobbies = await prisma.category.create({
        data: {
            name: 'Toys & Hobbies',
            nameAr: 'ألعاب وهوايات',
            slug: 'toys-hobbies',
            level: 1,
            displayOrder: 5,
            isActive: true,
        },
    });
    categoryMap.set('Toys & Hobbies', toys_hobbies.id);
    console.log('✅ Created: Toys & Hobbies');

    const health_beauty = await prisma.category.create({
        data: {
            name: 'Health & Beauty',
            nameAr: 'صحة وجمال',
            slug: 'health-beauty',
            level: 1,
            displayOrder: 6,
            isActive: true,
        },
    });
    categoryMap.set('Health & Beauty', health_beauty.id);
    console.log('✅ Created: Health & Beauty');

    const automotive = await prisma.category.create({
        data: {
            name: 'Automotive',
            nameAr: 'سيارات',
            slug: 'automotive',
            level: 1,
            displayOrder: 7,
            isActive: true,
        },
    });
    categoryMap.set('Automotive', automotive.id);
    console.log('✅ Created: Automotive');

    const books = await prisma.category.create({
        data: {
            name: 'Books',
            nameAr: 'كتب',
            slug: 'books',
            level: 1,
            displayOrder: 8,
            isActive: true,
        },
    });
    categoryMap.set('Books', books.id);
    console.log('✅ Created: Books');

    const baby_kids = await prisma.category.create({
        data: {
            name: 'Baby & Kids',
            nameAr: 'أطفال',
            slug: 'baby-kids',
            level: 1,
            displayOrder: 9,
            isActive: true,
        },
    });
    categoryMap.set('Baby & Kids', baby_kids.id);
    console.log('✅ Created: Baby & Kids');

    const jewelry_watches = await prisma.category.create({
        data: {
            name: 'Jewelry & Watches',
            nameAr: 'مجوهرات وساعات',
            slug: 'jewelry-watches',
            level: 1,
            displayOrder: 10,
            isActive: true,
        },
    });
    categoryMap.set('Jewelry & Watches', jewelry_watches.id);
    console.log('✅ Created: Jewelry & Watches');

    // Create subcategories for Electronics
    await prisma.category.create({
        data: {
            name: 'Mobile Phones',
            nameAr: 'هواتف محمولة',
            slug: 'mobile-phones',
            level: 2,
            parentId: categoryMap.get('Electronics'),
            displayOrder: 1,
            isActive: true,
        },
    });
    console.log('✅ Created: Electronics > Mobile Phones');

    await prisma.category.create({
        data: {
            name: 'Laptops & Computers',
            nameAr: 'لابتوب وكمبيوتر',
            slug: 'laptops-computers',
            level: 2,
            parentId: categoryMap.get('Electronics'),
            displayOrder: 2,
            isActive: true,
        },
    });
    console.log('✅ Created: Electronics > Laptops & Computers');

    await prisma.category.create({
        data: {
            name: 'Tablets',
            nameAr: 'تابلت',
            slug: 'tablets',
            level: 2,
            parentId: categoryMap.get('Electronics'),
            displayOrder: 3,
            isActive: true,
        },
    });
    console.log('✅ Created: Electronics > Tablets');

    await prisma.category.create({
        data: {
            name: 'TVs & Audio',
            nameAr: 'تلفزيون وصوتيات',
            slug: 'tvs-audio',
            level: 2,
            parentId: categoryMap.get('Electronics'),
            displayOrder: 4,
            isActive: true,
        },
    });
    console.log('✅ Created: Electronics > TVs & Audio');

    await prisma.category.create({
        data: {
            name: 'Cameras & Photography',
            nameAr: 'كاميرات وتصوير',
            slug: 'cameras-photography',
            level: 2,
            parentId: categoryMap.get('Electronics'),
            displayOrder: 5,
            isActive: true,
        },
    });
    console.log('✅ Created: Electronics > Cameras & Photography');

    // Create subcategories for Fashion
    await prisma.category.create({
        data: {
            name: "Men's Clothing",
            nameAr: 'ملابس رجالية',
            slug: 'mens-clothing',
            level: 2,
            parentId: categoryMap.get('Fashion'),
            displayOrder: 1,
            isActive: true,
        },
    });
    console.log("✅ Created: Fashion > Men's Clothing");

    await prisma.category.create({
        data: {
            name: "Women's Clothing",
            nameAr: 'ملابس نسائية',
            slug: 'womens-clothing',
            level: 2,
            parentId: categoryMap.get('Fashion'),
            displayOrder: 2,
            isActive: true,
        },
    });
    console.log("✅ Created: Fashion > Women's Clothing");

    await prisma.category.create({
        data: {
            name: 'Shoes',
            nameAr: 'أحذية',
            slug: 'shoes',
            level: 2,
            parentId: categoryMap.get('Fashion'),
            displayOrder: 3,
            isActive: true,
        },
    });
    console.log('✅ Created: Fashion > Shoes');

    await prisma.category.create({
        data: {
            name: 'Bags & Luggage',
            nameAr: 'حقائب',
            slug: 'bags-luggage',
            level: 2,
            parentId: categoryMap.get('Fashion'),
            displayOrder: 4,
            isActive: true,
        },
    });
    console.log('✅ Created: Fashion > Bags & Luggage');

    await prisma.category.create({
        data: {
            name: 'Traditional Clothing',
            nameAr: 'ملابس تقليدية',
            slug: 'traditional-clothing',
            level: 2,
            parentId: categoryMap.get('Fashion'),
            displayOrder: 5,
            isActive: true,
        },
    });
    console.log('✅ Created: Fashion > Traditional Clothing');

    console.log('✨ Categories seeded successfully!');
    console.log('📊 Total: 10 main categories + 10 subcategories = 20 categories');
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

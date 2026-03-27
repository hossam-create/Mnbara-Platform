import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  nameAr: string;
  slug: string;
  description?: string;
  level: number;
  parentSlug?: string;
  displayOrder: number;
  icon?: string;
}

// eBay-style comprehensive categories with Arabic translations
const ebayCategories: CategoryData[] = [
  // ========================================
  // LEVEL 1: MAIN CATEGORIES (20)
  // ========================================
  
  // 1. Antiques & Collectibles
  { name: 'Antiques & Collectibles', nameAr: 'تحف ومقتنيات', slug: 'antiques-collectibles', level: 1, displayOrder: 1, icon: '🏺' },
  
  // 2. Art
  { name: 'Art', nameAr: 'فنون', slug: 'art', level: 1, displayOrder: 2, icon: '🎨' },
  
  // 3. Baby
  { name: 'Baby', nameAr: 'أطفال رضع', slug: 'baby', level: 1, displayOrder: 3, icon: '👶' },
  
  // 4. Books, Movies & Music
  { name: 'Books, Movies & Music', nameAr: 'كتب وأفلام وموسيقى', slug: 'books-movies-music', level: 1, displayOrder: 4, icon: '📚' },
  
  // 5. Business & Industrial
  { name: 'Business & Industrial', nameAr: 'أعمال وصناعة', slug: 'business-industrial', level: 1, displayOrder: 5, icon: '🏭' },
  
  // 6. Cameras & Photo
  { name: 'Cameras & Photo', nameAr: 'كاميرات وتصوير', slug: 'cameras-photo', level: 1, displayOrder: 6, icon: '📷' },
  
  // 7. Cell Phones & Accessories
  { name: 'Cell Phones & Accessories', nameAr: 'هواتف محمولة وإكسسوارات', slug: 'cell-phones-accessories', level: 1, displayOrder: 7, icon: '📱' },
  
  // 8. Clothing, Shoes & Accessories
  { name: 'Clothing, Shoes & Accessories', nameAr: 'ملابس وأحذية وإكسسوارات', slug: 'clothing-shoes-accessories', level: 1, displayOrder: 8, icon: '👔' },
  
  // 9. Coins & Paper Money
  { name: 'Coins & Paper Money', nameAr: 'عملات ونقود ورقية', slug: 'coins-paper-money', level: 1, displayOrder: 9, icon: '💰' },
  
  // 10. Collectibles
  { name: 'Collectibles', nameAr: 'مقتنيات', slug: 'collectibles', level: 1, displayOrder: 10, icon: '🎁' },
  
  // 11. Computers/Tablets & Networking
  { name: 'Computers/Tablets & Networking', nameAr: 'كمبيوتر وتابلت وشبكات', slug: 'computers-tablets-networking', level: 1, displayOrder: 11, icon: '💻' },
  
  // 12. Consumer Electronics
  { name: 'Consumer Electronics', nameAr: 'إلكترونيات استهلاكية', slug: 'consumer-electronics', level: 1, displayOrder: 12, icon: '🔌' },
  
  // 13. Crafts
  { name: 'Crafts', nameAr: 'حرف يدوية', slug: 'crafts', level: 1, displayOrder: 13, icon: '✂️' },
  
  // 14. Dolls & Bears
  { name: 'Dolls & Bears', nameAr: 'دمى ودببة', slug: 'dolls-bears', level: 1, displayOrder: 14, icon: '🧸' },
  
  // 15. DVDs & Movies
  { name: 'DVDs & Movies', nameAr: 'أقراص وأفلام', slug: 'dvds-movies', level: 1, displayOrder: 15, icon: '📀' },
  
  // 16. eBay Motors
  { name: 'eBay Motors', nameAr: 'سيارات ومركبات', slug: 'ebay-motors', level: 1, displayOrder: 16, icon: '🚗' },
  
  // 17. Entertainment Memorabilia
  { name: 'Entertainment Memorabilia', nameAr: 'تذكارات ترفيهية', slug: 'entertainment-memorabilia', level: 1, displayOrder: 17, icon: '🎬' },
  
  // 18. Gift Cards & Coupons
  { name: 'Gift Cards & Coupons', nameAr: 'بطاقات هدايا وكوبونات', slug: 'gift-cards-coupons', level: 1, displayOrder: 18, icon: '🎫' },
  
  // 19. Health & Beauty
  { name: 'Health & Beauty', nameAr: 'صحة وجمال', slug: 'health-beauty', level: 1, displayOrder: 19, icon: '💄' },
  
  // 20. Home & Garden
  { name: 'Home & Garden', nameAr: 'منزل وحديقة', slug: 'home-garden', level: 1, displayOrder: 20, icon: '🏡' },
  
  // 21. Jewelry & Watches
  { name: 'Jewelry & Watches', nameAr: 'مجوهرات وساعات', slug: 'jewelry-watches', level: 1, displayOrder: 21, icon: '💎' },
  
  // 22. Music
  { name: 'Music', nameAr: 'موسيقى', slug: 'music', level: 1, displayOrder: 22, icon: '🎵' },
  
  // 23. Musical Instruments & Gear
  { name: 'Musical Instruments & Gear', nameAr: 'آلات موسيقية ومعدات', slug: 'musical-instruments-gear', level: 1, displayOrder: 23, icon: '🎸' },
  
  // 24. Pet Supplies
  { name: 'Pet Supplies', nameAr: 'مستلزمات حيوانات أليفة', slug: 'pet-supplies', level: 1, displayOrder: 24, icon: '🐾' },
  
  // 25. Pottery & Glass
  { name: 'Pottery & Glass', nameAr: 'فخار وزجاج', slug: 'pottery-glass', level: 1, displayOrder: 25, icon: '🏺' },
  
  // 26. Real Estate
  { name: 'Real Estate', nameAr: 'عقارات', slug: 'real-estate', level: 1, displayOrder: 26, icon: '🏠' },
  
  // 27. Specialty Services
  { name: 'Specialty Services', nameAr: 'خدمات متخصصة', slug: 'specialty-services', level: 1, displayOrder: 27, icon: '🛠️' },
  
  // 28. Sporting Goods
  { name: 'Sporting Goods', nameAr: 'معدات رياضية', slug: 'sporting-goods', level: 1, displayOrder: 28, icon: '⚽' },
  
  // 29. Sports Mem, Cards & Fan Shop
  { name: 'Sports Mem, Cards & Fan Shop', nameAr: 'تذكارات رياضية وبطاقات', slug: 'sports-mem-cards-fan-shop', level: 1, displayOrder: 29, icon: '🏆' },
  
  // 30. Stamps
  { name: 'Stamps', nameAr: 'طوابع', slug: 'stamps', level: 1, displayOrder: 30, icon: '📮' },
  
  // 31. Tickets & Experiences
  { name: 'Tickets & Experiences', nameAr: 'تذاكر وتجارب', slug: 'tickets-experiences', level: 1, displayOrder: 31, icon: '🎟️' },
  
  // 32. Toys & Hobbies
  { name: 'Toys & Hobbies', nameAr: 'ألعاب وهوايات', slug: 'toys-hobbies', level: 1, displayOrder: 32, icon: '🎮' },
  
  // 33. Travel
  { name: 'Travel', nameAr: 'سفر', slug: 'travel', level: 1, displayOrder: 33, icon: '✈️' },
  
  // 34. Video Games & Consoles
  { name: 'Video Games & Consoles', nameAr: 'ألعاب فيديو وأجهزة', slug: 'video-games-consoles', level: 1, displayOrder: 34, icon: '🎮' },
  
  // 35. Everything Else
  { name: 'Everything Else', nameAr: 'كل شيء آخر', slug: 'everything-else', level: 1, displayOrder: 35, icon: '📦' },

  // ========================================
  // LEVEL 2: ANTIQUES & COLLECTIBLES SUBCATEGORIES
  // ========================================
  { name: 'Antiquities', nameAr: 'آثار قديمة', slug: 'antiquities', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 1 },
  { name: 'Architectural & Garden', nameAr: 'معمارية وحدائق', slug: 'architectural-garden', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 2 },
  { name: 'Asian Antiques', nameAr: 'تحف آسيوية', slug: 'asian-antiques', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 3 },
  { name: 'Books & Manuscripts', nameAr: 'كتب ومخطوطات', slug: 'books-manuscripts-antique', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 4 },
  { name: 'Decorative Arts', nameAr: 'فنون زخرفية', slug: 'decorative-arts', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 5 },
  { name: 'Ethnographic', nameAr: 'إثنوغرافية', slug: 'ethnographic', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 6 },
  { name: 'Furniture', nameAr: 'أثاث', slug: 'furniture-antique', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 7 },
  { name: 'Home & Hearth', nameAr: 'منزل ومدفأة', slug: 'home-hearth', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 8 },
  { name: 'Linens & Textiles (Pre-1930)', nameAr: 'أقمشة ومنسوجات (قبل 1930)', slug: 'linens-textiles-pre1930', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 9 },
  { name: 'Maps, Atlases & Globes', nameAr: 'خرائط وأطالس وكرات أرضية', slug: 'maps-atlases-globes', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 10 },
  { name: 'Maritime', nameAr: 'بحرية', slug: 'maritime', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 11 },
  { name: 'Mercantile, Trades & Factories', nameAr: 'تجارية وحرف ومصانع', slug: 'mercantile-trades-factories', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 12 },
  { name: 'Musical Instruments (Pre-1930)', nameAr: 'آلات موسيقية (قبل 1930)', slug: 'musical-instruments-pre1930', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 13 },
  { name: 'Periods & Styles', nameAr: 'فترات وأنماط', slug: 'periods-styles', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 14 },
  { name: 'Primitives', nameAr: 'بدائيات', slug: 'primitives', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 15 },
  { name: 'Reproduction Antiques', nameAr: 'تحف مستنسخة', slug: 'reproduction-antiques', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 16 },
  { name: 'Restoration & Care', nameAr: 'ترميم وعناية', slug: 'restoration-care', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 17 },
  { name: 'Rugs & Carpets', nameAr: 'سجاد وبسط', slug: 'rugs-carpets-antique', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 18 },
  { name: 'Science & Medicine (Pre-1930)', nameAr: 'علوم وطب (قبل 1930)', slug: 'science-medicine-pre1930', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 19 },
  { name: 'Sewing (Pre-1930)', nameAr: 'خياطة (قبل 1930)', slug: 'sewing-pre1930', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 20 },
  { name: 'Silver', nameAr: 'فضيات', slug: 'silver-antique', level: 2, parentSlug: 'antiques-collectibles', displayOrder: 21 },

  // ========================================
  // LEVEL 2: CONSUMER ELECTRONICS SUBCATEGORIES
  // ========================================
  { name: 'Home Audio & Theater', nameAr: 'صوتيات منزلية ومسرح', slug: 'home-audio-theater', level: 2, parentSlug: 'consumer-electronics', displayOrder: 1 },
  { name: 'Portable Audio & Headphones', nameAr: 'صوتيات محمولة وسماعات', slug: 'portable-audio-headphones', level: 2, parentSlug: 'consumer-electronics', displayOrder: 2 },
  { name: 'TV, Video & Home Audio', nameAr: 'تلفزيون وفيديو وصوتيات', slug: 'tv-video-home-audio', level: 2, parentSlug: 'consumer-electronics', displayOrder: 3 },
  { name: 'Vehicle Electronics & GPS', nameAr: 'إلكترونيات مركبات وGPS', slug: 'vehicle-electronics-gps', level: 2, parentSlug: 'consumer-electronics', displayOrder: 4 },
  { name: 'Vintage Electronics', nameAr: 'إلكترونيات قديمة', slug: 'vintage-electronics', level: 2, parentSlug: 'consumer-electronics', displayOrder: 5 },
  { name: 'Video Game Consoles', nameAr: 'أجهزة ألعاب فيديو', slug: 'video-game-consoles', level: 2, parentSlug: 'consumer-electronics', displayOrder: 6 },
  { name: 'Gadgets & Other Electronics', nameAr: 'أدوات وإلكترونيات أخرى', slug: 'gadgets-other-electronics', level: 2, parentSlug: 'consumer-electronics', displayOrder: 7 },

  // ========================================
  // LEVEL 2: COMPUTERS/TABLETS & NETWORKING
  // ========================================
  { name: 'Desktops & All-In-Ones', nameAr: 'كمبيوتر مكتبي ومتكامل', slug: 'desktops-all-in-ones', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 1 },
  { name: 'Laptops & Netbooks', nameAr: 'لابتوب ونت بوك', slug: 'laptops-netbooks', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 2 },
  { name: 'iPad/Tablet/eBook Readers', nameAr: 'آيباد وتابلت وقارئات إلكترونية', slug: 'ipad-tablet-ebook-readers', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 3 },
  { name: 'Computer Components & Parts', nameAr: 'مكونات وقطع كمبيوتر', slug: 'computer-components-parts', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 4 },
  { name: 'Monitors, Projectors & Accs', nameAr: 'شاشات وبروجكتر وملحقات', slug: 'monitors-projectors-accs', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 5 },
  { name: 'Printers, Scanners & Supplies', nameAr: 'طابعات وماسحات ومستلزمات', slug: 'printers-scanners-supplies', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 6 },
  { name: 'Networking & Communication', nameAr: 'شبكات واتصالات', slug: 'networking-communication', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 7 },
  { name: 'Drives, Storage & Blank Media', nameAr: 'محركات وتخزين ووسائط فارغة', slug: 'drives-storage-blank-media', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 8 },
  { name: 'Software', nameAr: 'برمجيات', slug: 'software', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 9 },
  { name: 'Keyboards, Mice & Pointers', nameAr: 'لوحات مفاتيح وفأرات ومؤشرات', slug: 'keyboards-mice-pointers', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 10 },
  { name: 'Laptop & Desktop Accessories', nameAr: 'ملحقات لابتوب ومكتبي', slug: 'laptop-desktop-accessories', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 11 },
  { name: 'Vintage Computing', nameAr: 'حوسبة قديمة', slug: 'vintage-computing', level: 2, parentSlug: 'computers-tablets-networking', displayOrder: 12 },

  // ========================================
  // LEVEL 2: CELL PHONES & ACCESSORIES
  // ========================================
  { name: 'Cell Phones & Smartphones', nameAr: 'هواتف محمولة وذكية', slug: 'cell-phones-smartphones', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 1 },
  { name: 'Cases, Covers & Skins', nameAr: 'حافظات وأغطية', slug: 'cases-covers-skins', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 2 },
  { name: 'Chargers & Cradles', nameAr: 'شواحن وقواعد', slug: 'chargers-cradles', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 3 },
  { name: 'Batteries', nameAr: 'بطاريات', slug: 'batteries-phone', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 4 },
  { name: 'Screen Protectors', nameAr: 'واقيات شاشة', slug: 'screen-protectors', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 5 },
  { name: 'Headsets', nameAr: 'سماعات رأس', slug: 'headsets', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 6 },
  { name: 'Bluetooth Headsets', nameAr: 'سماعات بلوتوث', slug: 'bluetooth-headsets', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 7 },
  { name: 'Smart Watches', nameAr: 'ساعات ذكية', slug: 'smart-watches', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 8 },
  { name: 'Cell Phone Parts', nameAr: 'قطع غيار هواتف', slug: 'cell-phone-parts', level: 2, parentSlug: 'cell-phones-accessories', displayOrder: 9 },

  // ========================================
  // LEVEL 2: CLOTHING, SHOES & ACCESSORIES
  // ========================================
  { name: "Women's Clothing", nameAr: 'ملابس نسائية', slug: 'womens-clothing', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 1 },
  { name: "Men's Clothing", nameAr: 'ملابس رجالية', slug: 'mens-clothing', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 2 },
  { name: "Women's Shoes", nameAr: 'أحذية نسائية', slug: 'womens-shoes', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 3 },
  { name: "Men's Shoes", nameAr: 'أحذية رجالية', slug: 'mens-shoes', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 4 },
  { name: "Women's Accessories", nameAr: 'إكسسوارات نسائية', slug: 'womens-accessories', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 5 },
  { name: "Men's Accessories", nameAr: 'إكسسوارات رجالية', slug: 'mens-accessories', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 6 },
  { name: 'Kids & Baby', nameAr: 'أطفال ورضع', slug: 'kids-baby-clothing', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 7 },
  { name: 'Unisex Clothing', nameAr: 'ملابس للجنسين', slug: 'unisex-clothing', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 8 },
  { name: 'Vintage', nameAr: 'ملابس قديمة', slug: 'vintage-clothing', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 9 },
  { name: 'Costumes', nameAr: 'أزياء تنكرية', slug: 'costumes', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 10 },
  { name: 'Wedding & Formal', nameAr: 'زفاف ورسمي', slug: 'wedding-formal', level: 2, parentSlug: 'clothing-shoes-accessories', displayOrder: 11 },

  // ========================================
  // LEVEL 2: SPORTING GOODS
  // ========================================
  { name: 'Exercise & Fitness', nameAr: 'تمارين ولياقة', slug: 'exercise-fitness', level: 2, parentSlug: 'sporting-goods', displayOrder: 1 },
  { name: 'Cycling', nameAr: 'دراجات', slug: 'cycling', level: 2, parentSlug: 'sporting-goods', displayOrder: 2 },
  { name: 'Outdoor Sports', nameAr: 'رياضات خارجية', slug: 'outdoor-sports', level: 2, parentSlug: 'sporting-goods', displayOrder: 3 },
  { name: 'Water Sports', nameAr: 'رياضات مائية', slug: 'water-sports', level: 2, parentSlug: 'sporting-goods', displayOrder: 4 },
  { name: 'Winter Sports', nameAr: 'رياضات شتوية', slug: 'winter-sports', level: 2, parentSlug: 'sporting-goods', displayOrder: 5 },
  { name: 'Team Sports', nameAr: 'رياضات جماعية', slug: 'team-sports', level: 2, parentSlug: 'sporting-goods', displayOrder: 6 },
  { name: 'Golf', nameAr: 'جولف', slug: 'golf', level: 2, parentSlug: 'sporting-goods', displayOrder: 7 },
  { name: 'Tennis & Racquet Sports', nameAr: 'تنس ورياضات مضرب', slug: 'tennis-racquet-sports', level: 2, parentSlug: 'sporting-goods', displayOrder: 8 },
  { name: 'Hunting', nameAr: 'صيد', slug: 'hunting', level: 2, parentSlug: 'sporting-goods', displayOrder: 9 },
  { name: 'Fishing', nameAr: 'صيد سمك', slug: 'fishing', level: 2, parentSlug: 'sporting-goods', displayOrder: 10 },
  { name: 'Boxing, Martial Arts & MMA', nameAr: 'ملاكمة وفنون قتالية', slug: 'boxing-martial-arts-mma', level: 2, parentSlug: 'sporting-goods', displayOrder: 11 },

  // ========================================
  // LEVEL 2: TOYS & HOBBIES
  // ========================================
  { name: 'Action Figures', nameAr: 'شخصيات حركية', slug: 'action-figures', level: 2, parentSlug: 'toys-hobbies', displayOrder: 1 },
  { name: 'Building Toys', nameAr: 'ألعاب بناء', slug: 'building-toys', level: 2, parentSlug: 'toys-hobbies', displayOrder: 2 },
  { name: 'Diecast & Toy Vehicles', nameAr: 'مركبات لعب ومعدنية', slug: 'diecast-toy-vehicles', level: 2, parentSlug: 'toys-hobbies', displayOrder: 3 },
  { name: 'Games', nameAr: 'ألعاب', slug: 'games', level: 2, parentSlug: 'toys-hobbies', displayOrder: 4 },
  { name: 'Model Railroads & Trains', nameAr: 'قطارات نموذجية', slug: 'model-railroads-trains', level: 2, parentSlug: 'toys-hobbies', displayOrder: 5 },
  { name: 'Radio Control & Control Line', nameAr: 'تحكم لاسلكي', slug: 'radio-control', level: 2, parentSlug: 'toys-hobbies', displayOrder: 6 },
  { name: 'Robots, Monsters & Space Toys', nameAr: 'روبوتات ووحوش وفضاء', slug: 'robots-monsters-space-toys', level: 2, parentSlug: 'toys-hobbies', displayOrder: 7 },
  { name: 'Slot Cars', nameAr: 'سيارات مسار', slug: 'slot-cars', level: 2, parentSlug: 'toys-hobbies', displayOrder: 8 },
  { name: 'Stuffed Animals', nameAr: 'حيوانات محشوة', slug: 'stuffed-animals', level: 2, parentSlug: 'toys-hobbies', displayOrder: 9 },
  { name: 'Vintage & Antique Toys', nameAr: 'ألعاب قديمة وتحف', slug: 'vintage-antique-toys', level: 2, parentSlug: 'toys-hobbies', displayOrder: 10 },
  { name: 'Outdoor Toys & Structures', nameAr: 'ألعاب خارجية', slug: 'outdoor-toys-structures', level: 2, parentSlug: 'toys-hobbies', displayOrder: 11 },
  { name: 'Preschool Toys & Pretend Play', nameAr: 'ألعاب ما قبل المدرسة', slug: 'preschool-toys-pretend-play', level: 2, parentSlug: 'toys-hobbies', displayOrder: 12 },

  // ========================================
  // LEVEL 2: HOME & GARDEN
  // ========================================
  { name: 'Furniture', nameAr: 'أثاث', slug: 'furniture', level: 2, parentSlug: 'home-garden', displayOrder: 1 },
  { name: 'Home Décor', nameAr: 'ديكور منزلي', slug: 'home-decor', level: 2, parentSlug: 'home-garden', displayOrder: 2 },
  { name: 'Kitchen, Dining & Bar', nameAr: 'مطبخ وطعام وبار', slug: 'kitchen-dining-bar', level: 2, parentSlug: 'home-garden', displayOrder: 3 },
  { name: 'Bedding', nameAr: 'أغطية سرير', slug: 'bedding', level: 2, parentSlug: 'home-garden', displayOrder: 4 },
  { name: 'Bath', nameAr: 'حمام', slug: 'bath', level: 2, parentSlug: 'home-garden', displayOrder: 5 },
  { name: 'Rugs & Carpets', nameAr: 'سجاد وبسط', slug: 'rugs-carpets', level: 2, parentSlug: 'home-garden', displayOrder: 6 },
  { name: 'Lamps, Lighting & Ceiling Fans', nameAr: 'مصابيح وإضاءة ومراوح', slug: 'lamps-lighting-ceiling-fans', level: 2, parentSlug: 'home-garden', displayOrder: 7 },
  { name: 'Home Improvement', nameAr: 'تحسين منزلي', slug: 'home-improvement', level: 2, parentSlug: 'home-garden', displayOrder: 8 },
  { name: 'Tools & Workshop Equipment', nameAr: 'أدوات ومعدات ورشة', slug: 'tools-workshop-equipment', level: 2, parentSlug: 'home-garden', displayOrder: 9 },
  { name: 'Yard, Garden & Outdoor Living', nameAr: 'فناء وحديقة ومعيشة خارجية', slug: 'yard-garden-outdoor-living', level: 2, parentSlug: 'home-garden', displayOrder: 10 },
  { name: 'Major Appliances', nameAr: 'أجهزة رئيسية', slug: 'major-appliances', level: 2, parentSlug: 'home-garden', displayOrder: 11 },
  { name: 'Household Appliances', nameAr: 'أجهزة منزلية', slug: 'household-appliances', level: 2, parentSlug: 'home-garden', displayOrder: 12 },
  { name: 'Food & Beverages', nameAr: 'طعام ومشروبات', slug: 'food-beverages', level: 2, parentSlug: 'home-garden', displayOrder: 13 },
  { name: 'Greeting Cards & Party Supply', nameAr: 'بطاقات تهنئة ومستلزمات حفلات', slug: 'greeting-cards-party-supply', level: 2, parentSlug: 'home-garden', displayOrder: 14 },

  // ========================================
  // LEVEL 2: JEWELRY & WATCHES
  // ========================================
  { name: 'Fine Jewelry', nameAr: 'مجوهرات فاخرة', slug: 'fine-jewelry', level: 2, parentSlug: 'jewelry-watches', displayOrder: 1 },
  { name: 'Fashion Jewelry', nameAr: 'مجوهرات أزياء', slug: 'fashion-jewelry', level: 2, parentSlug: 'jewelry-watches', displayOrder: 2 },
  { name: 'Vintage & Antique Jewelry', nameAr: 'مجوهرات قديمة وتحف', slug: 'vintage-antique-jewelry', level: 2, parentSlug: 'jewelry-watches', displayOrder: 3 },
  { name: 'Wristwatches', nameAr: 'ساعات يد', slug: 'wristwatches', level: 2, parentSlug: 'jewelry-watches', displayOrder: 4 },
  { name: 'Parts, Tools & Guides', nameAr: 'قطع وأدوات وأدلة', slug: 'parts-tools-guides-jewelry', level: 2, parentSlug: 'jewelry-watches', displayOrder: 5 },
  { name: 'Loose Diamonds & Gemstones', nameAr: 'ألماس وأحجار كريمة', slug: 'loose-diamonds-gemstones', level: 2, parentSlug: 'jewelry-watches', displayOrder: 6 },
  { name: 'Ethnic, Regional & Tribal', nameAr: 'إثنية وإقليمية وقبلية', slug: 'ethnic-regional-tribal-jewelry', level: 2, parentSlug: 'jewelry-watches', displayOrder: 7 },
  { name: 'Engagement & Wedding', nameAr: 'خطوبة وزفاف', slug: 'engagement-wedding-jewelry', level: 2, parentSlug: 'jewelry-watches', displayOrder: 8 },

  // ========================================
  // LEVEL 2: HEALTH & BEAUTY
  // ========================================
  { name: 'Fragrances', nameAr: 'عطور', slug: 'fragrances', level: 2, parentSlug: 'health-beauty', displayOrder: 1 },
  { name: 'Makeup', nameAr: 'مكياج', slug: 'makeup', level: 2, parentSlug: 'health-beauty', displayOrder: 2 },
  { name: 'Skin Care', nameAr: 'عناية بالبشرة', slug: 'skin-care', level: 2, parentSlug: 'health-beauty', displayOrder: 3 },
  { name: 'Hair Care & Styling', nameAr: 'عناية وتصفيف شعر', slug: 'hair-care-styling', level: 2, parentSlug: 'health-beauty', displayOrder: 4 },
  { name: 'Shaving & Hair Removal', nameAr: 'حلاقة وإزالة شعر', slug: 'shaving-hair-removal', level: 2, parentSlug: 'health-beauty', displayOrder: 5 },
  { name: 'Oral Care', nameAr: 'عناية بالفم', slug: 'oral-care', level: 2, parentSlug: 'health-beauty', displayOrder: 6 },
  { name: 'Vitamins & Dietary Supplements', nameAr: 'فيتامينات ومكملات غذائية', slug: 'vitamins-dietary-supplements', level: 2, parentSlug: 'health-beauty', displayOrder: 7 },
  { name: 'Health Care', nameAr: 'رعاية صحية', slug: 'health-care', level: 2, parentSlug: 'health-beauty', displayOrder: 8 },
  { name: 'Nail Care, Manicure & Pedicure', nameAr: 'عناية بالأظافر', slug: 'nail-care-manicure-pedicure', level: 2, parentSlug: 'health-beauty', displayOrder: 9 },
  { name: 'Natural & Alternative Remedies', nameAr: 'علاجات طبيعية وبديلة', slug: 'natural-alternative-remedies', level: 2, parentSlug: 'health-beauty', displayOrder: 10 },
  { name: 'Medical & Mobility', nameAr: 'طبي وتنقل', slug: 'medical-mobility', level: 2, parentSlug: 'health-beauty', displayOrder: 11 },
  { name: 'Vision Care', nameAr: 'عناية بالبصر', slug: 'vision-care', level: 2, parentSlug: 'health-beauty', displayOrder: 12 },
];

async function seedCategories() {
  console.log('🌱 Starting eBay categories seed...\n');

  try {
    // Clear existing categories
    console.log('🗑️  Clearing existing categories...');
    await prisma.category.deleteMany({});
    console.log('✅ Existing categories cleared\n');

    // Create a map to store category IDs
    const categoryMap = new Map<string, number>();

    // First pass: Create all level 1 categories
    console.log('📦 Creating Level 1 categories (Main categories)...');
    const level1Categories = ebayCategories.filter(cat => cat.level === 1);
    
    for (const cat of level1Categories) {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          nameAr: cat.nameAr,
          slug: cat.slug,
          description: cat.description,
          level: cat.level,
          displayOrder: cat.displayOrder,
          icon: cat.icon,
          isActive: true,
        },
      });
      categoryMap.set(cat.slug, created.id);
      console.log(`  ✅ ${cat.icon || '📁'} ${cat.name} (${cat.nameAr})`);
    }
    console.log(`\n✨ Created ${level1Categories.length} main categories\n`);

    // Second pass: Create all level 2 categories
    console.log('📦 Creating Level 2 categories (Subcategories)...');
    const level2Categories = ebayCategories.filter(cat => cat.level === 2);
    
    for (const cat of level2Categories) {
      const parentId = cat.parentSlug ? categoryMap.get(cat.parentSlug) : null;
      
      if (!parentId && cat.parentSlug) {
        console.warn(`  ⚠️  Warning: Parent '${cat.parentSlug}' not found for '${cat.name}'`);
        continue;
      }

      const created = await prisma.category.create({
        data: {
          name: cat.name,
          nameAr: cat.nameAr,
          slug: cat.slug,
          description: cat.description,
          level: cat.level,
          parentId: parentId,
          displayOrder: cat.displayOrder,
          isActive: true,
        },
      });
      categoryMap.set(cat.slug, created.id);
      console.log(`  ✅ ${cat.name} (${cat.nameAr}) → ${cat.parentSlug}`);
    }
    console.log(`\n✨ Created ${level2Categories.length} subcategories\n`);

    // Summary
    const totalCategories = await prisma.category.count();
    console.log('═══════════════════════════════════════');
    console.log('🎉 Categories seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total categories: ${totalCategories}`);
    console.log(`   - Level 1 (Main): ${level1Categories.length}`);
    console.log(`   - Level 2 (Sub): ${level2Categories.length}`);
    console.log('═══════════════════════════════════════\n');

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

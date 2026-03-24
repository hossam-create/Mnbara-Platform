// Feature Management Service - Seed Data
// بيانات البذر لخدمة إدارة الميزات

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Feature Management Database...');

  // ==========================================
  // 🚀 PLATFORM FEATURES
  // ==========================================

  const features = [
    // FINTECH Features
    {
      key: 'bnpl_service',
      name: 'Buy Now Pay Later',
      nameAr: 'اشتري الآن وادفع لاحقاً',
      description: 'Enable installment payments for purchases',
      descriptionAr: 'تفعيل الدفع بالتقسيط للمشتريات',
      category: 'FINTECH',
      service: 'bnpl-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '💳',
      color: '#4CAF50'
    },
    {
      key: 'crypto_payments',
      name: 'Cryptocurrency Payments',
      nameAr: 'الدفع بالعملات الرقمية',
      description: 'Accept Bitcoin, Ethereum, USDC, USDT',
      descriptionAr: 'قبول البيتكوين والإيثريوم والعملات المستقرة',
      category: 'FINTECH',
      service: 'crypto-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '₿',
      color: '#F7931A'
    },
    {
      key: 'multi_currency_wallet',
      name: 'Multi-Currency Wallet',
      nameAr: 'المحفظة متعددة العملات',
      description: 'Hold and exchange multiple currencies',
      descriptionAr: 'احتفظ وتبادل عملات متعددة',
      category: 'FINTECH',
      service: 'wallet-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '💰',
      color: '#2196F3'
    },
    {
      key: 'escrow_protection',
      name: 'Escrow Payment Protection',
      nameAr: 'حماية الدفع بالضمان',
      description: 'Secure payments with escrow service',
      descriptionAr: 'مدفوعات آمنة مع خدمة الضمان',
      category: 'FINTECH',
      service: 'escrow-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '🔒',
      color: '#9C27B0'
    },
    {
      key: 'paypal_integration',
      name: 'PayPal Integration',
      nameAr: 'تكامل باي بال',
      description: 'Pay with PayPal account',
      descriptionAr: 'الدفع بحساب باي بال',
      category: 'FINTECH',
      service: 'paypal-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '🅿️',
      color: '#003087'
    },

    // AI Features
    {
      key: 'ai_assistant',
      name: 'AI Shopping Assistant',
      nameAr: 'مساعد التسوق الذكي',
      description: 'AI-powered shopping recommendations',
      descriptionAr: 'توصيات تسوق مدعومة بالذكاء الاصطناعي',
      category: 'AI',
      service: 'ai-assistant-service',
      version: '10.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '🤖',
      color: '#00BCD4'
    },
    {
      key: 'mnbara_ai_engine',
      name: 'Mnbara AI Engine',
      nameAr: 'محرك منبرة للذكاء الاصطناعي',
      description: 'Custom AI like Siri with voice support',
      descriptionAr: 'ذكاء اصطناعي مخصص مثل سيري مع دعم الصوت',
      category: 'AI',
      service: 'mnbara-ai-engine',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: true,
      isBeta: true,
      icon: '🧠',
      color: '#E91E63'
    },
    {
      key: 'ai_fraud_detection',
      name: 'AI Fraud Detection',
      nameAr: 'كشف الاحتيال بالذكاء الاصطناعي',
      description: 'Real-time fraud detection and prevention',
      descriptionAr: 'كشف ومنع الاحتيال في الوقت الفعلي',
      category: 'SECURITY',
      service: 'ai-assistant-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: false,
      isPremium: false,
      icon: '🛡️',
      color: '#F44336'
    },
    {
      key: 'ai_price_optimization',
      name: 'AI Price Optimization',
      nameAr: 'تحسين الأسعار بالذكاء الاصطناعي',
      description: 'Dynamic pricing recommendations for sellers',
      descriptionAr: 'توصيات تسعير ديناميكية للبائعين',
      category: 'AI',
      service: 'ai-assistant-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: true,
      icon: '📈',
      color: '#FF9800'
    },

    // MARKETPLACE Features
    {
      key: 'wholesale_marketplace',
      name: 'B2B Wholesale Marketplace',
      nameAr: 'سوق البيع بالجملة',
      description: 'Bulk orders and tiered pricing for businesses',
      descriptionAr: 'طلبات بالجملة وتسعير متدرج للشركات',
      category: 'MARKETPLACE',
      service: 'wholesale-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '🏢',
      color: '#795548'
    },
    {
      key: 'auction_system',
      name: 'Auction System',
      nameAr: 'نظام المزادات',
      description: 'Live and timed auctions',
      descriptionAr: 'مزادات حية ومؤقتة',
      category: 'MARKETPLACE',
      service: 'auction-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '🔨',
      color: '#607D8B'
    },

    // LOGISTICS Features
    {
      key: 'smart_delivery',
      name: 'Smart Delivery',
      nameAr: 'التوصيل الذكي',
      description: 'AI-optimized delivery routes',
      descriptionAr: 'مسارات توصيل محسنة بالذكاء الاصطناعي',
      category: 'LOGISTICS',
      service: 'smart-delivery-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '🚚',
      color: '#3F51B5'
    },
    {
      key: 'crowdshipping',
      name: 'Crowdshipping',
      nameAr: 'الشحن الجماعي',
      description: 'Peer-to-peer delivery by travelers',
      descriptionAr: 'توصيل من نظير إلى نظير عبر المسافرين',
      category: 'LOGISTICS',
      service: 'crowdship-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '✈️',
      color: '#009688'
    },
    {
      key: 'live_tracking',
      name: 'Live Location Tracking',
      nameAr: 'تتبع الموقع المباشر',
      description: 'Real-time traveler location tracking',
      descriptionAr: 'تتبع موقع المسافر في الوقت الفعلي',
      category: 'LOGISTICS',
      service: 'crowdship-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      dependsOn: ['crowdshipping'],
      icon: '📍',
      color: '#4CAF50'
    },

    // COMMUNICATION Features
    {
      key: 'real_time_chat',
      name: 'Real-time Chat',
      nameAr: 'الدردشة الفورية',
      description: 'Instant messaging between buyers and sellers',
      descriptionAr: 'رسائل فورية بين المشترين والبائعين',
      category: 'COMMUNICATION',
      service: 'notification-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '💬',
      color: '#00BCD4'
    },
    {
      key: 'push_notifications',
      name: 'Push Notifications',
      nameAr: 'الإشعارات الفورية',
      description: 'Mobile and web push notifications',
      descriptionAr: 'إشعارات فورية للموبايل والويب',
      category: 'COMMUNICATION',
      service: 'notification-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      icon: '🔔',
      color: '#FF5722'
    },

    // ANALYTICS Features
    {
      key: 'seller_analytics',
      name: 'Seller Analytics Dashboard',
      nameAr: 'لوحة تحليلات البائع',
      description: 'Advanced analytics for sellers',
      descriptionAr: 'تحليلات متقدمة للبائعين',
      category: 'ANALYTICS',
      service: 'analytics-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: true,
      icon: '📊',
      color: '#673AB7'
    },

    // EXPERIMENTAL Features
    {
      key: 'voice_search',
      name: 'Voice Search',
      nameAr: 'البحث الصوتي',
      description: 'Search products using voice',
      descriptionAr: 'البحث عن المنتجات بالصوت',
      category: 'EXPERIMENTAL',
      service: 'voice-commerce-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      isBeta: false,
      rolloutPercentage: 100,
      icon: '🎤',
      color: '#E91E63'
    },
    {
      key: 'vr_showroom',
      name: 'VR Showroom',
      nameAr: 'صالة العرض الافتراضية',
      description: 'Virtual reality shopping experience',
      descriptionAr: 'تجربة تسوق بالواقع الافتراضي',
      category: 'EXPERIMENTAL',
      service: 'vr-showroom-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: true,
      isBeta: true,
      rolloutPercentage: 100,
      icon: '🥽',
      color: '#673AB7'
    },
    {
      key: 'ai_chatbot',
      name: 'AI Chatbot',
      nameAr: 'المساعد الذكي',
      description: '24/7 AI-powered customer support',
      descriptionAr: 'دعم عملاء ذكي على مدار الساعة',
      category: 'AI',
      service: 'ai-chatbot-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: false,
      isBeta: false,
      rolloutPercentage: 100,
      icon: '🤖',
      color: '#2196F3'
    },
    {
      key: 'ar_product_preview',
      name: 'AR Product Preview',
      nameAr: 'معاينة المنتج بالواقع المعزز',
      description: 'View products in augmented reality',
      descriptionAr: 'عرض المنتجات بالواقع المعزز',
      category: 'EXPERIMENTAL',
      service: 'ar-preview-service',
      version: '1.0.0',
      isEnabled: true,
      isPublic: true,
      isPremium: true,
      isBeta: false,
      rolloutPercentage: 100,
      icon: '👓',
      color: '#FF9800'
    }
  ];

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { key: feature.key },
      update: feature,
      create: feature as any
    });
    console.log(`  ✅ Feature: ${feature.name}`);
  }

  // ==========================================
  // 📦 SAMPLE RELEASES
  // ==========================================

  const releases = [
    {
      version: '1.0.0',
      name: 'Initial Launch',
      nameAr: 'الإطلاق الأولي',
      description: 'Mnbara Platform Initial Release',
      descriptionAr: 'الإصدار الأولي لمنصة منبرة',
      releaseNotes: 'Core marketplace features including listings, orders, and payments.',
      releaseNotesAr: 'ميزات السوق الأساسية بما في ذلك القوائم والطلبات والمدفوعات.',
      features: ['real_time_chat', 'push_notifications'],
      status: 'RELEASED',
      releasedAt: new Date('2025-01-01'),
      createdBy: 'system'
    },
    {
      version: '2.0.0',
      name: 'FinTech Revolution',
      nameAr: 'ثورة التكنولوجيا المالية',
      description: 'Q1 2026 FinTech Features',
      descriptionAr: 'ميزات التكنولوجيا المالية للربع الأول 2026',
      releaseNotes: 'BNPL, Crypto Payments, Multi-Currency Wallet, Escrow, PayPal Integration',
      releaseNotesAr: 'اشتري الآن وادفع لاحقاً، الدفع بالعملات الرقمية، المحفظة متعددة العملات، الضمان، تكامل باي بال',
      features: ['bnpl_service', 'crypto_payments', 'multi_currency_wallet', 'escrow_protection', 'paypal_integration'],
      status: 'RELEASED',
      releasedAt: new Date('2026-03-01'),
      createdBy: 'system'
    },
    {
      version: '2.1.0',
      name: 'AI Powerhouse',
      nameAr: 'قوة الذكاء الاصطناعي',
      description: 'AI Services Release',
      descriptionAr: 'إصدار خدمات الذكاء الاصطناعي',
      releaseNotes: 'AI Assistant Gen 10, Mnbara AI Engine, Fraud Detection, Price Optimization',
      releaseNotesAr: 'مساعد الذكاء الاصطناعي الجيل 10، محرك منبرة للذكاء الاصطناعي، كشف الاحتيال، تحسين الأسعار',
      features: ['ai_assistant', 'mnbara_ai_engine', 'ai_fraud_detection', 'ai_price_optimization'],
      status: 'RELEASED',
      releasedAt: new Date('2026-03-15'),
      createdBy: 'system'
    },
    {
      version: '3.0.0',
      name: 'Q2 Expansion',
      nameAr: 'توسع الربع الثاني',
      description: 'Q2 2026 Major Features',
      descriptionAr: 'الميزات الرئيسية للربع الثاني 2026',
      releaseNotes: 'Wholesale Marketplace, Smart Delivery with AI Route Optimization',
      releaseNotesAr: 'سوق البيع بالجملة، التوصيل الذكي مع تحسين المسارات بالذكاء الاصطناعي',
      features: ['wholesale_marketplace', 'smart_delivery'],
      status: 'RELEASED',
      releasedAt: new Date(),
      createdBy: 'system'
    },
    {
      version: '3.1.0',
      name: 'Advanced Features',
      nameAr: 'الميزات المتقدمة',
      description: 'AR, VR, Voice, and AI Chatbot',
      descriptionAr: 'الواقع المعزز والافتراضي والبحث الصوتي والمساعد الذكي',
      releaseNotes: 'AR Product Preview, VR Showroom, Voice Search, AI Chatbot',
      releaseNotesAr: 'معاينة المنتج بالواقع المعزز، صالة العرض الافتراضية، البحث الصوتي، المساعد الذكي',
      features: ['ar_product_preview', 'vr_showroom', 'voice_search', 'ai_chatbot'],
      status: 'RELEASED',
      releasedAt: new Date(),
      createdBy: 'system'
    }
  ];

  for (const release of releases) {
    await prisma.release.upsert({
      where: { version: release.version },
      update: release,
      create: release as any
    });
    console.log(`  📦 Release: ${release.version} - ${release.name}`);
  }

  // ==========================================
  // ⚙️ SYSTEM CONFIGS
  // ==========================================

  const configs = [
    {
      key: 'feature_cache_ttl',
      value: { seconds: 60 },
      category: 'performance',
      description: 'Feature flag cache TTL in seconds'
    },
    {
      key: 'max_rollout_speed',
      value: { percentPerHour: 10 },
      category: 'rollout',
      description: 'Maximum rollout speed per hour'
    },
    {
      key: 'default_rollout_strategy',
      value: { strategy: 'PERCENTAGE' },
      category: 'rollout',
      description: 'Default rollout strategy for new features'
    },
    {
      key: 'metrics_retention_days',
      value: { days: 90 },
      category: 'analytics',
      description: 'How long to keep feature metrics'
    }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config
    });
    console.log(`  ⚙️ Config: ${config.key}`);
  }

  console.log('\n✅ Seeding completed successfully!');
  console.log(`   📊 ${features.length} Features`);
  console.log(`   📦 ${releases.length} Releases`);
  console.log(`   ⚙️ ${configs.length} Configs`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

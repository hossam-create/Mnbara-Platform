# شرح ميزات تطبيق MNBara

## 🏠 الشاشة الرئيسية (Home Screen)

### المكونات الرئيسية:
1. **شريط البحث** - البحث عن المنتجات
2. **الفئات** - تصفح الفئات المختلفة
3. **العروض الحية** - Live Deals Section
4. **المنتجات الموصى بها** - AI Recommendations
5. **المنتجات الشهيرة** - Trending Products
6. **الملحقات** - Endless Accessories

### الملفات المرتبطة:
```
lib/features/home/
├── screens/home_screen.dart
├── screens/main_screen.dart
├── widgets/search_bar_widget.dart
└── widgets/home_app_bar.dart
```

---

## 🔍 البحث والتصفية (Search)

### الميزات:
- البحث المتقدم بـ Elasticsearch
- تصفية حسب السعر والفئة والعلامة التجارية
- الفرز حسب الأفضل والسعر والمسافة
- اقتراحات البحث الذكية

### الملفات:
```
lib/features/search/
├── screens/search_screen.dart
├── providers/search_provider.dart
└── widgets/
    ├── search_bar.dart
    ├── search_filters.dart
    └── search_results.dart
```

---

## 🛍️ المنتجات والسلة (Products & Cart)

### عرض المنتجات:
- صور عالية الجودة
- التقييمات والمراجعات
- معلومات البائع
- خيارات الشراء (Buy Now, Auction, Make Offer)

### السلة:
- إضافة/حذف المنتجات
- تعديل الكمية
- حساب الإجمالي والضرائب
- الانتقال للدفع

### الملفات:
```
lib/features/
├── products/
│   ├── screens/product_details_screen.dart
│   ├── models/product_model.dart
│   └── services/product_service.dart
└── cart/
    ├── screens/cart_screen.dart
    ├── providers/cart_provider.dart
    └── models/cart_model.dart
```

---

## 💳 الدفع والطلبات (Checkout & Orders)

### خطوات الدفع:
1. مراجعة السلة
2. إدخال عنوان التسليم
3. اختيار طريقة الشحن
4. اختيار طريقة الدفع
5. تأكيد الطلب

### طرق الدفع المدعومة:
- Stripe (بطاقات ائتمان)
- PayPal
- Crypto (Bitcoin, Ethereum)
- BNPL (Buy Now Pay Later)

### الملفات:
```
lib/features/
├── checkout/
│   ├── screens/checkout_screen.dart
│   ├── screens/payment_screen.dart
│   └── screens/order_success_screen.dart
└── orders/
    ├── screens/orders_screen.dart
    ├── screens/order_details_screen.dart
    └── models/order_model.dart
```

---

## 👤 الملف الشخصي (Profile)

### المعلومات:
- بيانات المستخدم
- العناوين المحفوظة
- الطلبات السابقة
- المفضلة
- الإعدادات

### الملفات:
```
lib/features/profile/
├── screens/profile_screen.dart
├── screens/edit_profile_screen.dart
├── screens/addresses_screen.dart
├── screens/add_address_screen.dart
└── providers/address_provider.dart
```

---

## 🎤 البحث بالصوت (Voice Search)

### الميزات:
- تحويل الصوت إلى نص
- البحث الفوري
- الأوامر الصوتية

### الملفات:
```
lib/features/voice_commerce/
├── screens/voice_search_screen.dart
├── services/voice_service.dart
└── models/voice_model.dart
```

---

## 📍 التتبع الحي (Live Tracking)

### الميزات:
- تتبع الطلب في الوقت الفعلي
- موقع المندوب على الخريطة
- إشعارات التحديث
- إثبات التسليم

### الملفات:
```
lib/features/buyer/
├── screens/live_tracking_screen.dart
├── services/location_websocket_service.dart
├── providers/location_tracking_provider.dart
└── models/traveler_location_model.dart
```

---

## 🏪 البيع والمتجر (Seller)

### إنشاء قائمة:
- اختيار الفئة
- إدخال التفاصيل
- رفع الصور
- تحديد السعر
- اختيار نوع البيع (Auction/Buy Now)

### إدارة المتجر:
- عرض القوائم
- تحليلات المبيعات
- إدارة الطلبات
- تقييمات البائع

### الملفات:
```
lib/features/seller/
├── screens/seller_dashboard_screen.dart
├── screens/create_listing_screen.dart
├── screens/my_listings_screen.dart
└── screens/seller_analytics_screen.dart
```

---

## 🤖 الميزات المتقدمة

### 1. معاينة AR
```
lib/features/ar_preview/
├── screens/ar_preview_screen.dart
└── services/ar_service.dart
```

### 2. عرض VR
```
lib/features/vr_showroom/
├── screens/vr_showroom_screen.dart
└── services/vr_service.dart
```

### 3. التوصيات بـ AI
```
lib/features/smart_buyer/
├── screens/smart_buyer_screen.dart
├── services/smart_buyer_service.dart
└── providers/smart_buyer_provider.dart
```

### 4. المحفظة والعملات الرقمية
```
lib/features/crypto_wallet/
├── screens/crypto_wallet_screen.dart
└── services/crypto_service.dart
```

---

## 📊 الإحصائيات والتحليلات

### لوحة التحكم:
- عدد الطلبات
- إجمالي المبيعات
- معدل التحويل
- أفضل المنتجات

### الملفات:
```
lib/features/analytics/
├── screens/analytics_dashboard_screen.dart
└── services/analytics_service.dart
```

---

## 🔔 الإشعارات

### أنواع الإشعارات:
- تحديثات الطلبات
- عروض خاصة
- رسائل من البائع
- تنبيهات الأسعار

### الملفات:
```
lib/features/notifications/
├── screens/notifications_screen.dart
├── screens/notification_settings_screen.dart
└── providers/notifications_provider.dart
```

---

## ⚙️ الإعدادات

### الخيارات:
- اللغة والمنطقة الزمنية
- إشعارات
- الخصوصية
- الأمان
- تسجيل الخروج

### الملفات:
```
lib/features/settings/
├── screens/settings_screen.dart
└── providers/settings_provider.dart
```

---

**آخر تحديث:** 28 ديسمبر 2025

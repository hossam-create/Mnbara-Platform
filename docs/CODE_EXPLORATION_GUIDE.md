# دليل استكشاف كود التطبيق

## 📂 هيكل المشروع الرئيسي

```
mobile/flutter_app/
├── lib/
│   ├── main.dart                    # نقطة الدخول
│   ├── core/                        # الأساسيات
│   │   ├── network/api_client.dart
│   │   ├── router/app_router.dart
│   │   ├── theme/app_theme.dart
│   │   └── l10n/app_localizations.dart
│   ├── features/                    # الميزات الرئيسية
│   ├── models/                      # نماذج البيانات
│   ├── services/                    # الخدمات
│   ├── providers/                   # Riverpod providers
│   ├── widgets/                     # الـ widgets المشتركة
│   └── theme/                       # الثيم والألوان
├── android/                         # كود Android
├── ios/                             # كود iOS
├── assets/                          # الصور والخطوط
├── test/                            # الاختبارات
└── pubspec.yaml                     # المتطلبات
```

---

## 🎯 الملفات الأساسية

### 1. main.dart - نقطة الدخول

```dart
// lib/main.dart
void main() async {
  // تهيئة Firebase
  // تهيئة Hive
  // تشغيل التطبيق
  runApp(const MyApp());
}
```

### 2. app_router.dart - التوجيه

```dart
// lib/core/router/app_router.dart
// تعريف جميع المسارات
// التنقل بين الشاشات
```

### 3. app_theme.dart - الثيم

```dart
// lib/core/theme/app_theme.dart
// الألوان والخطوط
// أنماط الـ widgets
```

---

## 🏗️ هيكل الميزات (Features)

كل ميزة تحتوي على:

```
feature_name/
├── screens/              # الشاشات الرئيسية
├── widgets/              # الـ widgets الفرعية
├── models/               # نماذج البيانات
├── services/             # الخدمات والـ API
├── providers/            # Riverpod providers
└── repositories/         # طبقة البيانات
```

---

## 🔍 استكشاف الميزات الرئيسية

### 1. ميزة المصادقة (Auth)

```
lib/features/auth/
├── screens/
│   ├── login_screen.dart
│   ├── register_screen.dart
│   ├── forgot_password_screen.dart
│   └── otp_verification_screen.dart
├── services/auth_service.dart
├── providers/auth_provider.dart
└── models/auth_model.dart
```

**الملفات المهمة:**
- `auth_service.dart` - منطق المصادقة
- `auth_provider.dart` - إدارة الحالة
- `login_screen.dart` - واجهة تسجيل الدخول

### 2. ميزة المنتجات (Products)

```
lib/features/products/
├── screens/product_details_screen.dart
├── models/product_model.dart
├── services/product_service.dart
└── widgets/product_card.dart
```

**الملفات المهمة:**
- `product_model.dart` - نموذج المنتج
- `product_service.dart` - جلب البيانات
- `product_details_screen.dart` - عرض التفاصيل

### 3. ميزة السلة (Cart)

```
lib/features/cart/
├── screens/cart_screen.dart
├── providers/cart_provider.dart
├── models/cart_model.dart
└── widgets/cart_item.dart
```

**الملفات المهمة:**
- `cart_provider.dart` - إدارة السلة
- `cart_screen.dart` - عرض السلة

### 4. ميزة الطلبات (Orders)

```
lib/features/orders/
├── screens/
│   ├── orders_screen.dart
│   └── order_details_screen.dart
├── models/order_model.dart
└── services/order_service.dart
```

### 5. ميزة البيع (Seller)

```
lib/features/seller/
├── screens/
│   ├── seller_dashboard_screen.dart
│   ├── create_listing_screen.dart
│   ├── my_listings_screen.dart
│   └── seller_analytics_screen.dart
├── services/seller_service.dart
└── models/listing_model.dart
```

---

## 🔌 الخدمات الرئيسية

### 1. API Client

```dart
// lib/core/network/api_client.dart
// إعدادات الـ HTTP
// المصادقة
// معالجة الأخطاء
```

### 2. Firebase Service

```dart
// lib/services/firebase_service.dart
// الإشعارات
// التحليلات
// المصادقة
```

### 3. Storage Service

```dart
// lib/services/storage_service.dart
// حفظ البيانات محلياً
// Hive و SharedPreferences
```

---

## 🎨 الـ Widgets المشتركة

```
lib/widgets/
├── components/
│   ├── product_grid.dart
│   ├── category_grid.dart
│   ├── banner_carousel.dart
│   ├── countdown_timer.dart
│   └── testimonials.dart
├── custom_text_field.dart
├── custom_button.dart
└── product_card.dart
```

---

## 📊 إدارة الحالة (State Management)

### استخدام Riverpod

```dart
// تعريف provider
final productProvider = FutureProvider<List<Product>>((ref) async {
  final service = ref.watch(productServiceProvider);
  return service.getProducts();
});

// استخدام في الـ widget
@override
Widget build(BuildContext context, WidgetRef ref) {
  final products = ref.watch(productProvider);
  return products.when(
    data: (data) => ListView(...),
    loading: () => LoadingSpinner(),
    error: (err, stack) => ErrorWidget(),
  );
}
```

---

## 🌐 الاتصال بـ API

### مثال على استدعاء API

```dart
// lib/services/product_service.dart
class ProductService {
  final ApiClient _apiClient;
  
  Future<List<Product>> getProducts() async {
    final response = await _apiClient.get('/products');
    return (response as List)
        .map((p) => Product.fromJson(p))
        .toList();
  }
}
```

---

## 🧪 الاختبارات

```
test/
├── unit/
│   ├── services/
│   ├── models/
│   └── providers/
└── integration/
    ├── auth_test.dart
    ├── product_test.dart
    └── order_test.dart
```

**تشغيل الاختبارات:**
```bash
flutter test
```

---

## 🔐 الأمان والمصادقة

### حفظ التوكن

```dart
// lib/services/storage_service.dart
final storage = FlutterSecureStorage();
await storage.write(key: 'auth_token', value: token);
```

### استخدام التوكن

```dart
// lib/core/network/api_client.dart
final token = await storage.read(key: 'auth_token');
headers['Authorization'] = 'Bearer $token';
```

---

## 🎯 نقاط الدخول الرئيسية

### 1. تسجيل الدخول
- `lib/features/auth/screens/login_screen.dart`
- `lib/features/auth/services/auth_service.dart`

### 2. الصفحة الرئيسية
- `lib/features/home/screens/home_screen.dart`
- `lib/features/home/screens/main_screen.dart`

### 3. البحث
- `lib/features/search/screens/search_screen.dart`
- `lib/features/search/providers/search_provider.dart`

### 4. السلة والدفع
- `lib/features/cart/screens/cart_screen.dart`
- `lib/features/checkout/screens/checkout_screen.dart`

### 5. الملف الشخصي
- `lib/features/profile/screens/profile_screen.dart`

---

## 📝 نصائح للتطوير

### 1. استخدام Hot Reload
```bash
# اضغط r في Terminal أثناء التشغيل
```

### 2. تصحيح الأخطاء
```bash
# استخدم debugPrint
debugPrint('Debug message: $value');
```

### 3. تحليل الأداء
```bash
# استخدم DevTools
flutter pub global activate devtools
devtools
```

### 4. إضافة ميزة جديدة
```
1. أنشئ مجلد جديد في lib/features/
2. أنشئ screens, models, services
3. أضف providers للحالة
4. أضف المسار في app_router.dart
5. اختبر الميزة
```

---

## 🔗 الملفات المرتبطة

### Backend APIs
- `backend/services/listing-service-node/` - خدمة المنتجات
- `backend/services/order-service/` - خدمة الطلبات
- `backend/services/payment-service/` - خدمة الدفع
- `backend/services/auth-service/` - خدمة المصادقة

### Frontend Web
- `frontend/web-app/` - تطبيق الويب

---

**آخر تحديث:** 28 ديسمبر 2025

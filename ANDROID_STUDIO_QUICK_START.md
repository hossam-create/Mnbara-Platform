# 🚀 دليل البدء السريع - فتح التطبيق على Android Studio

**آخر تحديث:** 28 ديسمبر 2025

---

## ⚡ البدء في 5 دقائق

### الخطوة 1: تثبيت المتطلبات (إذا لم تكن مثبتة)

```bash
# تحقق من التثبيت
flutter doctor

# إذا كان هناك مشاكل، ثبت المتطلبات الناقصة
flutter doctor --android-licenses
```

### الخطوة 2: فتح المشروع

```bash
# الطريقة 1: من سطر الأوامر
cd mobile/flutter_app
flutter pub get
flutter run

# الطريقة 2: من Android Studio
# File > Open > اختر مجلد mobile/flutter_app
```

### الخطوة 3: اختر جهاز

```bash
# عرض الأجهزة المتاحة
flutter devices

# إذا لم يكن هناك جهاز، أنشئ محاكي جديد
# Tools > Device Manager > Create Device
```

### الخطوة 4: شغّل التطبيق

```bash
# من Terminal
flutter run

# أو من Android Studio
# اضغط على زر Run (▶) أو Shift + F10
```

---

## 📱 إنشاء محاكي جديد (إذا لزم الأمر)

```
Android Studio > Tools > Device Manager > Create Device
├─ Select Hardware: Pixel 6 Pro
├─ Select System Image: Android 14 (API 34)
├─ Verify Configuration
└─ Finish

# ثم شغّل المحاكي
Tools > Device Manager > Play (▶)
```

---

## 🎯 الميزات الرئيسية للتطبيق

### 🏠 الصفحة الرئيسية
- عرض المنتجات الموصى بها
- البحث والتصفية
- العروض الحية
- الفئات

### 🛍️ التسوق
- عرض تفاصيل المنتج
- إضافة إلى السلة
- المفضلة
- الدفع الآمن

### 💳 الدفع
- Stripe (بطاقات ائتمان)
- PayPal
- Crypto (Bitcoin, Ethereum)
- BNPL (تقسيط)

### 📦 الطلبات
- تتبع الطلب
- تتبع التسليم الحي
- إدارة الطلبات
- المراجعات

### 🏪 البيع
- إنشاء قوائم
- إدارة المخزون
- تحليلات المبيعات
- إدارة الطلبات

### 🤖 الميزات المتقدمة
- البحث بالصوت
- معاينة AR
- عرض VR
- التوصيات بـ AI
- المحفظة الرقمية

---

## 📂 استكشاف الكود

### الملفات المهمة

```
mobile/flutter_app/lib/
├── main.dart                    # نقطة الدخول
├── core/
│   ├── network/api_client.dart  # الاتصال بـ API
│   ├── router/app_router.dart   # التوجيه
│   └── theme/app_theme.dart     # الثيم
├── features/
│   ├── auth/                    # المصادقة
│   ├── home/                    # الصفحة الرئيسية
│   ├── products/                # المنتجات
│   ├── cart/                    # السلة
│   ├── checkout/                # الدفع
│   ├── orders/                  # الطلبات
│   ├── seller/                  # البيع
│   ├── search/                  # البحث
│   ├── profile/                 # الملف الشخصي
│   └── ...                      # ميزات أخرى
└── services/                    # الخدمات
```

### الملفات الرئيسية للاستكشاف

1. **lib/main.dart** - نقطة البداية
2. **lib/features/home/screens/home_screen.dart** - الصفحة الرئيسية
3. **lib/features/auth/screens/login_screen.dart** - تسجيل الدخول
4. **lib/features/products/screens/product_details_screen.dart** - تفاصيل المنتج
5. **lib/features/cart/screens/cart_screen.dart** - السلة

---

## 🔧 الأوامر المهمة

```bash
# تنظيف المشروع
flutter clean

# تثبيت المتطلبات
flutter pub get

# تحديث المتطلبات
flutter pub upgrade

# إنشاء الملفات المولدة
flutter pub run build_runner build

# تشغيل الاختبارات
flutter test

# تحليل الكود
flutter analyze

# معلومات النظام
flutter doctor -v

# بناء APK
flutter build apk --release

# بناء App Bundle
flutter build appbundle --release
```

---

## 🐛 استكشاف الأخطاء الشائعة

### المشكلة: "Flutter SDK not found"
```bash
# الحل:
flutter config --android-sdk /path/to/android/sdk
```

### المشكلة: "Gradle build failed"
```bash
# الحل:
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### المشكلة: "Emulator not starting"
```bash
# الحل:
# 1. تحقق من تفعيل Virtualization في BIOS
# 2. استخدم:
emulator -avd Pixel_6_Pro_API_34 -no-snapshot-load
```

### المشكلة: "Dependencies conflict"
```bash
# الحل:
flutter pub get
flutter pub upgrade
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 📊 معلومات المشروع

### التكنولوجيا المستخدمة
- **Framework:** Flutter 3.2.0+
- **Language:** Dart
- **State Management:** Riverpod
- **Navigation:** GoRouter
- **Backend:** Node.js, Java, Python
- **Database:** PostgreSQL, MongoDB
- **Payment:** Stripe, PayPal, Crypto
- **Maps:** Google Maps
- **Notifications:** Firebase Cloud Messaging

### الأذونات المطلوبة
- الإنترنت
- الموقع
- الكاميرا
- التخزين
- البيومتريا

---

## 🎯 خطوات التطوير

### 1. فهم الهيكل
- اقرأ `lib/main.dart`
- استكشف `lib/features/`
- افهم `lib/core/`

### 2. تشغيل التطبيق
- استخدم `flutter run`
- جرّب الميزات المختلفة
- استكشف الواجهات

### 3. تعديل الكود
- استخدم Hot Reload (اضغط r)
- شاهد التغييرات فوراً
- اختبر الميزات الجديدة

### 4. إضافة ميزة جديدة
- أنشئ مجلد في `lib/features/`
- أضف screens, models, services
- أضف providers للحالة
- أضف المسار في `app_router.dart`

---

## 📚 الموارد الإضافية

### الملفات التوثيقية
- `docs/ANDROID_STUDIO_SETUP_GUIDE.md` - دليل الإعداد الكامل
- `docs/APP_FEATURES_WALKTHROUGH.md` - شرح الميزات
- `docs/CODE_EXPLORATION_GUIDE.md` - دليل استكشاف الكود
- `docs/QUICK_COMMANDS.md` - الأوامر السريعة

### الروابط المفيدة
- [Flutter Documentation](https://flutter.dev/docs)
- [Android Studio Help](https://developer.android.com/studio)
- [Dart Language Guide](https://dart.dev/guides)
- [Riverpod Documentation](https://riverpod.dev)

---

## ✅ قائمة التحقق

- [ ] تثبيت Flutter SDK
- [ ] تثبيت Android Studio
- [ ] تشغيل `flutter doctor` بنجاح
- [ ] إنشاء محاكي أو توصيل جهاز
- [ ] تشغيل `flutter pub get`
- [ ] تشغيل `flutter run`
- [ ] استكشاف الميزات الرئيسية
- [ ] قراءة الملفات التوثيقية

---

## 🎉 تم!

أنت الآن جاهز لاستكشاف تطبيق MNBara على Android Studio!

**الخطوة التالية:**
1. شغّل التطبيق: `flutter run`
2. استكشف الميزات
3. اقرأ الملفات التوثيقية
4. ابدأ التطوير!

---

**Status:** ✅ جاهز للاستخدام

**آخر تحديث:** 28 ديسمبر 2025

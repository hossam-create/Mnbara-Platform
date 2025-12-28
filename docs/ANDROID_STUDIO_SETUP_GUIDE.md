# دليل فتح تطبيق MNBara على Android Studio

**آخر تحديث:** 28 ديسمبر 2025

---

## 📋 المتطلبات الأساسية

### 1. البرامج المطلوبة
- ✅ **Android Studio** (أحدث إصدار)
- ✅ **Flutter SDK** (v3.2.0 أو أحدث)
- ✅ **Java Development Kit (JDK)** 11 أو أحدث
- ✅ **Android SDK** (API Level 23+)
- ✅ **Git** (للتحكم بالإصدارات)

### 2. متطلبات النظام
- **RAM:** 8GB على الأقل (16GB موصى به)
- **Storage:** 50GB مساحة حرة
- **OS:** Windows 10+, macOS 10.15+, أو Linux

---

## 🚀 خطوات الإعداد الأولي

### الخطوة 1: تثبيت Flutter SDK

```bash
# Windows (PowerShell)
# 1. حمل Flutter من: https://flutter.dev/docs/get-started/install
# 2. استخرج الملف إلى مجلد (مثلاً: C:\flutter)
# 3. أضف Flutter إلى PATH

# macOS / Linux
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"
```

### الخطوة 2: التحقق من التثبيت

```bash
flutter doctor
```

**النتيجة المتوقعة:**
```
✓ Flutter (Channel stable)
✓ Android toolchain
✓ Android Studio
✓ VS Code
✓ Connected device
```

### الخطوة 3: تثبيت المتطلبات الناقصة

```bash
# تثبيت Android SDK
flutter config --android-sdk /path/to/android/sdk

# قبول رخص Android
flutter doctor --android-licenses

# تثبيت المتطلبات الناقصة
flutter pub get
```

---

## 📂 فتح المشروع على Android Studio

### الطريقة 1: فتح المشروع الكامل

```bash
# 1. انتقل إلى مجلد المشروع
cd /path/to/mnbara

# 2. افتح Android Studio
# 3. اختر: File > Open
# 4. اختر مجلد المشروع الرئيسي (mnbara)
# 5. اختر "Open as Project"
```

### الطريقة 2: فتح مشروع Android مباشرة

```bash
# 1. افتح Android Studio
# 2. اختر: File > Open
# 3. انتقل إلى: mobile/flutter_app/android
# 4. اختر مجلد "android" وافتحه
```

### الطريقة 3: من سطر الأوامر

```bash
# Windows
cd mobile\flutter_app
flutter pub get
flutter run -d emulator-5554

# macOS / Linux
cd mobile/flutter_app
flutter pub get
flutter run -d emulator-5554
```

---

## ⚙️ إعدادات Android Studio

### 1. تكوين SDK

```
File > Settings > Languages & Frameworks > Flutter
├─ Flutter SDK path: /path/to/flutter
├─ Dart SDK path: /path/to/flutter/bin/cache/dart-sdk
└─ Enable Dart support: ✓
```

### 2. تكوين Android SDK

```
File > Settings > Appearance & Behavior > System Settings > Android SDK
├─ SDK Platforms:
│  ├─ Android 14 (API 34)
│  ├─ Android 13 (API 33)
│  └─ Android 12 (API 31)
├─ SDK Tools:
│  ├─ Android SDK Build-Tools
│  ├─ Android Emulator
│  ├─ Android SDK Platform-Tools
│  └─ Google Play services
└─ Apply > OK
```

### 3. تكوين Java

```
File > Settings > Build, Execution, Deployment > Build Tools > Gradle
├─ Gradle JDK: 11 أو أحدث
└─ Apply > OK
```

---

## 📱 إعداد المحاكي (Emulator)

### إنشاء جهاز افتراضي جديد

```
Tools > Device Manager > Create Device
├─ Select Hardware: Pixel 6 Pro (أو أي جهاز آخر)
├─ Select System Image: Android 14 (API 34)
├─ Verify Configuration
└─ Finish
```

### تشغيل المحاكي

```bash
# من سطر الأوامر
emulator -avd Pixel_6_Pro_API_34

# أو من Android Studio
Tools > Device Manager > Play (▶)
```

---

## 🔧 إعدادات المشروع

### 1. ملف local.properties

```properties
# mobile/flutter_app/android/local.properties
sdk.dir=/path/to/android/sdk
flutter.sdk=/path/to/flutter
flutter.buildMode=debug
flutter.versionName=1.0.0
flutter.versionCode=1
```

### 2. ملف key.properties (للإصدار)

```properties
# mobile/flutter_app/android/key.properties
keyAlias=mnbara_key
keyPassword=your_key_password
storeFile=/path/to/keystore.jks
storePassword=your_store_password
```

### 3. متغيرات البيئة

```bash
# Windows (PowerShell)
$env:MAPS_API_KEY = "your_google_maps_api_key"
$env:STRIPE_PUBLISHABLE_KEY = "your_stripe_key"

# macOS / Linux
export MAPS_API_KEY="your_google_maps_api_key"
export STRIPE_PUBLISHABLE_KEY="your_stripe_key"
```

---

## 📦 تثبيت المتطلبات

### 1. تحديث المتطلبات

```bash
cd mobile/flutter_app

# تحديث pub dependencies
flutter pub get

# تحديث build files
flutter pub upgrade

# إنشاء generated files
flutter pub run build_runner build
```

### 2. تنظيف المشروع

```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 🏃 تشغيل التطبيق

### الطريقة 1: من Android Studio

```
1. اختر جهاز من قائمة الأجهزة (Device Selector)
2. اضغط على زر Run (▶) أو Shift + F10
3. انتظر حتى يتم بناء وتشغيل التطبيق
```

### الطريقة 2: من سطر الأوامر

```bash
cd mobile/flutter_app

# تشغيل على المحاكي
flutter run

# تشغيل على جهاز حقيقي
flutter run -d <device_id>

# تشغيل مع وضع debug
flutter run -v

# تشغيل مع hot reload
flutter run --hot
```

### الطريقة 3: بناء APK

```bash
# بناء APK للاختبار
flutter build apk --debug

# بناء APK للإصدار
flutter build apk --release

# بناء App Bundle
flutter build appbundle --release
```

---

## 🐛 استكشاف الأخطاء

### المشكلة 1: "Flutter SDK not found"

```bash
# الحل:
flutter config --android-sdk /path/to/android/sdk
flutter config --android-studio-dir /path/to/android/studio
```

### المشكلة 2: "Gradle build failed"

```bash
# الحل:
cd mobile/flutter_app/android
./gradlew clean
./gradlew build
```

### المشكلة 3: "Emulator not starting"

```bash
# الحل:
# 1. تحقق من تفعيل Virtualization في BIOS
# 2. استخدم emulator بدلاً من محاكي Android Studio
emulator -avd Pixel_6_Pro_API_34 -no-snapshot-load
```

### المشكلة 4: "Dependencies conflict"

```bash
# الحل:
flutter pub get
flutter pub upgrade
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 📊 هيكل المشروع

```
mobile/flutter_app/
├── android/                          # كود Android native
│   ├── app/
│   │   ├── build.gradle             # إعدادات البناء
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml  # الأذونات والإعدادات
│   │   │   ├── kotlin/              # كود Kotlin
│   │   │   └── res/                 # الموارد
│   │   └── proguard-rules.pro       # قواعد ProGuard
│   ├── gradle/                       # ملفات Gradle
│   ├── settings.gradle               # إعدادات Gradle
│   └── local.properties              # الخصائص المحلية
├── ios/                              # كود iOS
├── lib/                              # كود Dart الرئيسي
│   ├── main.dart                     # نقطة الدخول
│   ├── core/                         # الأساسيات
│   ├── features/                     # الميزات
│   ├── models/                       # نماذج البيانات
│   ├── services/                     # الخدمات
│   ├── providers/                    # Riverpod providers
│   ├── widgets/                      # الـ widgets المشتركة
│   └── theme/                        # الثيم والألوان
├── assets/                           # الصور والخطوط
├── test/                             # اختبارات
├── pubspec.yaml                      # المتطلبات
└── README.md                         # التوثيق
```

---

## 🎯 الميزات الرئيسية للتطبيق

### 1. المصادقة والتسجيل
- ✅ تسجيل بالبريد الإلكتروني
- ✅ تسجيل الدخول بـ Google
- ✅ تسجيل الدخول بـ Apple
- ✅ تسجيل الدخول بـ Facebook
- ✅ التحقق بـ OTP

### 2. المتجر الرئيسي
- ✅ عرض المنتجات
- ✅ البحث والتصفية
- ✅ عرض التفاصيل
- ✅ إضافة إلى السلة
- ✅ المفضلة

### 3. الشراء والدفع
- ✅ سلة التسوق
- ✅ عملية الدفع
- ✅ دفع بـ Stripe
- ✅ دفع بـ PayPal
- ✅ دفع بـ Crypto

### 4. المبيعات والبيع
- ✅ إنشاء قوائم
- ✅ إدارة المخزون
- ✅ تحليلات المبيعات
- ✅ إدارة الطلبات

### 5. الميزات المتقدمة
- ✅ البحث بالصوت
- ✅ معاينة AR
- ✅ عرض VR
- ✅ التوصيات بـ AI
- ✅ الدعم الفوري

### 6. التتبع والتسليم
- ✅ تتبع الطلبات
- ✅ تتبع التسليم الحي
- ✅ إشعارات التسليم
- ✅ إثبات التسليم

---

## 🔐 الأمان والأذونات

### الأذونات المطلوبة

```xml
<!-- الإنترنت -->
<uses-permission android:name="android.permission.INTERNET"/>

<!-- الموقع -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

<!-- الكاميرا -->
<uses-permission android:name="android.permission.CAMERA"/>

<!-- التخزين -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>

<!-- البيومتريا -->
<uses-permission android:name="android.permission.USE_BIOMETRIC"/>
<uses-permission android:name="android.permission.USE_FINGERPRINT"/>
```

### طلب الأذونات في التطبيق

```dart
import 'package:permission_handler/permission_handler.dart';

// طلب إذن الموقع
final status = await Permission.location.request();
if (status.isGranted) {
  // الإذن ممنوح
}

// طلب إذن الكاميرا
final cameraStatus = await Permission.camera.request();
```

---

## 📈 الأداء والتحسينات

### 1. تحسين البناء

```bash
# بناء سريع
flutter build apk --debug --split-per-abi

# بناء محسّن
flutter build apk --release --obfuscate --split-debug-info=./symbols
```

### 2. تحليل الأداء

```bash
# تشغيل مع تحليل الأداء
flutter run --profile

# تحليل حجم التطبيق
flutter build apk --analyze-size
```

### 3. اختبار الأداء

```bash
# تشغيل الاختبارات
flutter test

# اختبارات التكامل
flutter drive --target=test_driver/app.dart
```

---

## 🚀 نشر التطبيق

### على Google Play Store

```bash
# 1. بناء App Bundle
flutter build appbundle --release

# 2. التوقيع الرقمي (تلقائي إذا كان key.properties موجود)

# 3. رفع على Google Play Console
# - انتقل إلى https://play.google.com/console
# - اختر التطبيق
# - اختر Release > Production
# - رفع الـ AAB
```

### على متجر تطبيقات آخر

```bash
# بناء APK للتوزيع
flutter build apk --release --split-per-abi

# النتيجة:
# - app-armeabi-v7a-release.apk
# - app-arm64-v8a-release.apk
# - app-x86_64-release.apk
```

---

## 📞 الدعم والمساعدة

### الموارد المفيدة

- [Flutter Documentation](https://flutter.dev/docs)
- [Android Studio Help](https://developer.android.com/studio/intro)
- [Dart Language Guide](https://dart.dev/guides)
- [Firebase Documentation](https://firebase.google.com/docs)

### الأوامر المهمة

```bash
# معلومات النظام
flutter doctor -v

# تحديث Flutter
flutter upgrade

# تنظيف المشروع
flutter clean

# إعادة بناء الملفات المولدة
flutter pub run build_runner build --delete-conflicting-outputs

# تشغيل الاختبارات
flutter test

# تحليل الكود
flutter analyze
```

---

## ✅ قائمة التحقق قبل البدء

- [ ] تثبيت Flutter SDK
- [ ] تثبيت Android Studio
- [ ] تثبيت Java JDK 11+
- [ ] تثبيت Android SDK (API 23+)
- [ ] تشغيل `flutter doctor` بنجاح
- [ ] إنشاء جهاز افتراضي
- [ ] تثبيت المتطلبات: `flutter pub get`
- [ ] تشغيل التطبيق: `flutter run`

---

**Status:** ✅ جاهز للتطوير والاختبار

**آخر تحديث:** 28 ديسمبر 2025

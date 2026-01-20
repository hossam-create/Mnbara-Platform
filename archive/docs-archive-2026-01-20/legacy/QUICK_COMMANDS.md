# أوامر سريعة لتشغيل التطبيق

## 🚀 البدء السريع

```bash
# 1. الانتقال إلى مجلد التطبيق
cd mobile/flutter_app

# 2. تثبيت المتطلبات
flutter pub get

# 3. تشغيل التطبيق
flutter run
```

---

## 📱 تشغيل على أجهزة مختلفة

```bash
# عرض الأجهزة المتاحة
flutter devices

# تشغيل على جهاز محدد
flutter run -d <device_id>

# تشغيل على المحاكي
flutter run -d emulator-5554

# تشغيل على جهاز حقيقي
flutter run -d <phone_id>
```

---

## 🔧 الأوامر المهمة

```bash
# تنظيف المشروع
flutter clean

# تحديث المتطلبات
flutter pub upgrade

# إنشاء الملفات المولدة
flutter pub run build_runner build

# حذف الملفات المتضاربة
flutter pub run build_runner build --delete-conflicting-outputs

# تحليل الكود
flutter analyze

# تشغيل الاختبارات
flutter test

# معلومات النظام
flutter doctor -v
```

---

## 📦 بناء التطبيق

```bash
# بناء APK للاختبار
flutter build apk --debug

# بناء APK للإصدار
flutter build apk --release

# بناء App Bundle
flutter build appbundle --release

# بناء مع تحليل الحجم
flutter build apk --analyze-size
```

---

## 🐛 استكشاف الأخطاء

```bash
# تشغيل مع معلومات مفصلة
flutter run -v

# تشغيل مع وضع profile
flutter run --profile

# تشغيل مع وضع release
flutter run --release

# عرض السجلات
flutter logs
```

---

## 🔄 Hot Reload و Hot Restart

```bash
# Hot Reload (تحديث سريع)
# اضغط: r في Terminal

# Hot Restart (إعادة تشغيل)
# اضغط: R في Terminal

# Stop
# اضغط: q في Terminal
```

---

## 📊 الأداء والتحليل

```bash
# تشغيل مع تحليل الأداء
flutter run --profile

# تحليل حجم التطبيق
flutter build apk --analyze-size

# عرض معلومات الذاكرة
flutter run --profile --verbose
```

---

## 🌐 متغيرات البيئة

```bash
# Windows (PowerShell)
$env:MAPS_API_KEY = "your_key"
$env:STRIPE_PUBLISHABLE_KEY = "your_key"

# macOS / Linux
export MAPS_API_KEY="your_key"
export STRIPE_PUBLISHABLE_KEY="your_key"
```

---

## 📝 ملفات مهمة

```
mobile/flutter_app/
├── pubspec.yaml              # المتطلبات
├── lib/main.dart             # نقطة الدخول
├── android/build.gradle      # إعدادات Android
├── android/local.properties  # الخصائص المحلية
└── android/key.properties    # مفاتيح التوقيع
```

---

**آخر تحديث:** 28 ديسمبر 2025

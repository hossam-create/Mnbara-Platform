# رفع مشروع Mnbara على GitHub - دليل سريع

# Quick GitHub Upload Guide

## 🚀 الطريقة السريعة (3 خطوات)

### 1️⃣ تحقق من الجاهزية

```powershell
.\check_before_upload.ps1
```

### 2️⃣ أنشئ Repository على GitHub

1. اذهب إلى https://github.com/new
2. اسم المستودع: `mnbara-platform`
3. خاص (Private) ✅
4. اضغط "Create repository"
5. **انسخ الرابط** مثل: `https://github.com/username/mnbara-platform.git`

### 3️⃣ ارفع المشروع

```powershell
.\upload_to_github.ps1
```

**أدخل الرابط عندما يطلب منك**

---

## ✅ ما تم إصلاحه:

- ✅ تحديث `.gitignore` لاستثناء 128 مجلد `node_modules`
- ✅ استثناء ملفات البناء والcache
- ✅ حجم الرفع: **~100 MB** بدلاً من 1 GB+
- ✅ فقط الكود المصدري سيتم رفعه

---

## 📱 أو يدوياً:

```bash
# 1. تهيئة Git
git init

# 2. إضافة الملفات
git add .

# 3. Commit
git commit -m "Initial commit - Mnbara Platform"

# 4. ربط بـ GitHub (استبدل YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/mnbara-platform.git

# 5. الرفع
git branch -M main
git push -u origin main
```

---

## ⚠️ ملاحظات مهمة:

1. **لا تقلق** من حجم 1 GB - هذا بسبب node_modules
2. **فقط الكود** سيتم رفعه (~100 MB)
3. **node_modules** سيتم تجاهله تلقائياً
4. **الـ .env** لن يتم رفعه (أمان)

---

## 📚 للتفاصيل الكاملة:

افتح: `GITHUB_UPLOAD_GUIDE.md`

---

**وقت الرفع المتوقع**: 2-5 دقائق ⏱️

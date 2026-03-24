# 🔑 استرجاع/إعادة تعيين كلمة مرور PostgreSQL

## الطريقة 1️⃣: جرب الباسوردات الشائعة

افتح PowerShell وجرب:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "SELECT version();"
```

جرب واحد من الباسوردات دي:
- `postgres`
- `admin`
- `root`
- `password`
- `123456`
- (فاضي - اضغط Enter مباشرة)

---

## الطريقة 2️⃣: إعادة تعيين الباسورد تلقائياً

افتح PowerShell كـ **Administrator** ونفذ:

```powershell
scripts\reset-postgres-password.bat
```

هيعمل:
1. إيقاف PostgreSQL
2. تعديل ملف التكوين للسماح بالدخول بدون باسورد مؤقتاً
3. تشغيل PostgreSQL
4. تغيير الباسورد إلى `postgres123`
5. إرجاع ملف التكوين الأصلي
6. إعادة تشغيل PostgreSQL

**الباسورد الجديد**: `postgres123`

---

## الطريقة 3️⃣: يدوياً عبر pgAdmin

إذا عندك pgAdmin مثبت:

1. افتح pgAdmin
2. اضغط على Servers → PostgreSQL 18
3. إذا طلب باسورد، جرب الباسوردات الشائعة
4. اضغط كليك يمين على "Login/Group Roles" → "postgres"
5. اختر "Properties"
6. اذهب لتبويب "Definition"
7. غير الباسورد
8. احفظ

---

## الطريقة 4️⃣: يدوياً عبر ملف التكوين

### الخطوة 1: إيقاف PostgreSQL
```powershell
sc stop postgresql-x64-18
```

### الخطوة 2: تعديل pg_hba.conf
1. افتح الملف: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
2. ابحث عن السطور اللي فيها `md5` أو `scram-sha-256`
3. غيرها إلى `trust` مؤقتاً:

```
# قبل:
host    all             all             127.0.0.1/32            scram-sha-256

# بعد:
host    all             all             127.0.0.1/32            trust
```

### الخطوة 3: تشغيل PostgreSQL
```powershell
sc start postgresql-x64-18
```

### الخطوة 4: تغيير الباسورد
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres123';"
```

### الخطوة 5: إرجاع pg_hba.conf
ارجع السطور إلى `scram-sha-256`

### الخطوة 6: إعادة تشغيل PostgreSQL
```powershell
sc stop postgresql-x64-18
sc start postgresql-x64-18
```

---

## ✅ بعد استرجاع الباسورد

الحين عدل السكريبت عشان يستخدم الباسورد الجديد:

### إذا الباسورد الجديد `postgres123`:

السكريبتات جاهزة! فقط نفذ:

```powershell
scripts\setup-local-postgres.bat
```

واكتب `postgres123` لما يطلب الباسورد.

---

## 🆘 إذا ما نفعت أي طريقة

1. **إعادة تثبيت PostgreSQL**:
   - احذف PostgreSQL من Control Panel
   - حمل النسخة الجديدة من: https://www.postgresql.org/download/windows/
   - أثناء التثبيت، اختر باسورد بسيط مثل `postgres123`
   - سجل الباسورد في مكان آمن!

2. **استخدام Docker PostgreSQL بدلاً من Windows**:
   ```powershell
   docker run -d --name postgres-local -e POSTGRES_PASSWORD=postgres123 -p 5432:5432 postgres:15-alpine
   ```

---

## 📝 ملاحظات مهمة

- الباسورد مش هيظهر وانت بتكتبه - ده طبيعي في PostgreSQL
- تأكد إنك تشغل PowerShell كـ Administrator
- إذا PostgreSQL مش مثبت في `C:\Program Files\PostgreSQL\18`، غير المسار في السكريبتات

---

**🔒 بعد ما تسترجع الباسورد، ارجع لملف `ابدأ_هنا.md` وكمل الخطوات!**

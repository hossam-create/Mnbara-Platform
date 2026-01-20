# 🚀 Quick Start: Node.js Environment Fix

## الحل السريع (2 دقيقة)

### على Linux/Mac:
```bash
bash scripts/fix-nodejs-env.sh
```

### على Windows:
```cmd
scripts\fix-nodejs-env.bat
```

---

## ماذا يحدث؟

الـ script يقوم بـ:
1. ✅ حذف جميع node_modules
2. ✅ مسح npm cache
3. ✅ تثبيت جميع الـ dependencies
4. ✅ التحقق من التثبيت

**الوقت:** 10-15 دقيقة

---

## بعد الانتهاء

### تشغيل MVP كامل:
```bash
npm run start:mvp        # Linux/Mac
npm run start:mvp:win    # Windows
```

### أو تشغيل services فردية:
```bash
npm run dev:listing      # Listing Service
npm run dev:cart         # Cart Service
npm run dev:payment      # Payment Service
```

---

## التحقق من النجاح

```bash
# Linux/Mac
bash scripts/verify-nodejs-setup.sh

# Windows
scripts\verify-nodejs-setup.bat
```

**النتيجة المتوقعة:**
```
✓ Node.js installed
✓ npm installed
✓ All node_modules exist
✓ Vite available
✓ TypeScript available
✓ Docker installed

All checks passed! ✓
```

---

## الـ Services ستكون متاحة على:

- 🛍️ **Listing Service:** http://localhost:3001
- 🛒 **Cart Service:** http://localhost:3002
- 💳 **Payment Service:** http://localhost:3003
- 🚚 **Crowdship Service:** http://localhost:3004
- ✅ **Compliance Service:** http://localhost:3005

---

## إذا حدثت مشاكل

### المشكلة: "Permission denied"
```bash
chmod +x scripts/fix-nodejs-env.sh
bash scripts/fix-nodejs-env.sh
```

### المشكلة: "npm not found"
- تأكد من تثبيت Node.js
- أعد تشغيل الـ terminal

### المشكلة: "Docker not running"
```bash
docker-compose -f docker-compose.dev.yml up -d
```

---

## للمزيد من المعلومات

📖 اقرأ: `NODE_ENV_SETUP.md`

---

**Ready?** 🚀 تشغيل الـ fix script الآن!

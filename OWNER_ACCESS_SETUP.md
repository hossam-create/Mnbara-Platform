# 👑 Owner Access Setup - صاحب المشروع

## 🎯 **بيانات الدخول لصاحب المشروع**

### 1. 🏢 **Website Admin Dashboard** (Port 3000)
**URL:** http://localhost:3000

#### 🔑 **بيانات الدخول:**
```
Email: owner@mnbarh.com
Password: MnbaraOwner2026!
Role: SUPER_ADMIN
Permissions: ALL_PERMISSIONS
```

#### 🎖️ **صلاحياتك كصاحب المشروع:**
- ✅ **إدارة كاملة للمستخدمين**
- ✅ **إدارة جميع الطلبات والنزاعات**
- ✅ **الوصول لجميع التحليلات والتقارير**
- ✅ **إدارة المحتوى والإعلانات**
- ✅ **إدارة الأموال والمدفوعات**
- ✅ **إعدادات النظام الكاملة**

---

### 2. 🚀 **System Control Dashboard** (Port 3001)
**URL:** http://localhost:3001

#### 🔑 **بيانات الدخول:**
```
Email: owner@mnbarh.com
Password: SystemControl2026!
MFA Code: [سيتم إرساله على هاتفك]
Role: SYSTEM_ADMIN
Clearance Level: L5 (أعلى مستوى)
Department: EXECUTIVE
```

#### 🎖️ **صلاحياتك كصاحب المشروع:**
- ✅ **الوصول لجميع أنظمة المراقبة**
- ✅ **ضوابط الطوارئ الكاملة**
- ✅ **AI Problem Solver**
- ✅ **إدارة جميع الأقسام التقنية**
- ✅ **مراقبة الأمان والأداء**
- ✅ **صلاحيات الطوارئ**

---

## 🛠️ **إعداد الحسابات (للمطورين):**

### 📝 **Database Seed Script:**
```sql
-- Admin Dashboard Owner Account
INSERT INTO admin_users (
  id, email, password_hash, name, role, permissions, 
  created_at, updated_at, is_active, is_owner
) VALUES (
  'owner-001',
  'owner@mnbarh.com',
  '$2b$12$hashed_password_here', -- MnbaraOwner2026!
  'Project Owner',
  'SUPER_ADMIN',
  '["ALL_PERMISSIONS"]',
  NOW(),
  NOW(),
  true,
  true
);

-- System Control Owner Account
INSERT INTO system_users (
  id, email, password_hash, name, role, clearance_level,
  department, permissions, mfa_enabled, created_at, updated_at
) VALUES (
  'sys-owner-001',
  'owner@mnbarh.com',
  '$2b$12$hashed_password_here', -- SystemControl2026!
  'Project Owner',
  'SYSTEM_ADMIN',
  'L5',
  'EXECUTIVE',
  '["ALL_SYSTEM_PERMISSIONS", "EMERGENCY_CONTROLS", "AI_PROBLEM_SOLVER"]',
  true,
  NOW(),
  NOW()
);
```

---

## 🔐 **إعداد MFA للنظام التقني:**

### 📱 **خطوات تفعيل MFA:**
1. حمل تطبيق **Google Authenticator** أو **Authy**
2. امسح الـ QR Code الذي سيظهر عند أول تسجيل دخول
3. أدخل الرمز المكون من 6 أرقام
4. احتفظ بـ backup codes في مكان آمن

### 🔑 **Backup Codes (احتفظ بها):**
```
123456
789012
345678
901234
567890
```

---

## 🚀 **كيفية الدخول لأول مرة:**

### 1. **Admin Dashboard:**
1. اذهب إلى: http://localhost:3000
2. أدخل: owner@mnbarh.com
3. أدخل: MnbaraOwner2026!
4. ستدخل مباشرة بصلاحيات كاملة

### 2. **System Control Dashboard:**
1. اذهب إلى: http://localhost:3001
2. أدخل: owner@mnbarh.com
3. أدخل: SystemControl2026!
4. أدخل MFA Code من التطبيق
5. ستدخل لكابينة الطيارة بأعلى صلاحيات

---

## 👥 **إنشاء حسابات للفريق:**

### 🏢 **Admin Dashboard - أدوار الفريق:**
```javascript
// مدير عام
{
  role: "ADMIN",
  permissions: ["USER_MANAGEMENT", "ORDER_MANAGEMENT", "ANALYTICS"]
}

// مدير قسم
{
  role: "MANAGER", 
  permissions: ["DEPARTMENT_MANAGEMENT", "REPORTS"]
}

// دعم فني
{
  role: "SUPPORT",
  permissions: ["USER_SUPPORT", "DISPUTE_RESOLUTION"]
}
```

### 🚀 **System Control - أدوار تقنية:**
```javascript
// مهندس DevOps
{
  role: "DEVOPS_ENGINEER",
  clearanceLevel: "L3",
  permissions: ["SYSTEM_MONITORING", "DEPLOYMENT"]
}

// مدير عمليات
{
  role: "OPERATIONS_MANAGER",
  clearanceLevel: "L4", 
  permissions: ["EMERGENCY_CONTROLS", "TEAM_MANAGEMENT"]
}
```

---

## 🔒 **إعدادات الأمان الإضافية:**

### 🌐 **IP Whitelisting (اختياري):**
```env
# إضافة IP الخاص بك
ALLOWED_IPS=192.168.1.100,10.0.0.50,YOUR_PUBLIC_IP
```

### ⏰ **Session Settings:**
```env
# Admin Dashboard
ADMIN_SESSION_TIMEOUT=7200  # 2 hours

# System Control  
SYSTEM_SESSION_TIMEOUT=3600  # 1 hour
SYSTEM_MFA_TIMEOUT=300      # 5 minutes
```

---

## 📞 **الدعم والمساعدة:**

### 🆘 **في حالة نسيان كلمة المرور:**
1. استخدم "Forgot Password" في صفحة Login
2. أو اتصل بفريق التطوير لإعادة تعيينها
3. أو استخدم Database access لتغييرها مباشرة

### 🔧 **في حالة مشاكل MFA:**
1. استخدم أحد الـ backup codes
2. أو اتصل بفريق الأمان لإعادة تعيين MFA
3. أو استخدم Emergency access إذا متوفر

---

## ✅ **الخلاصة:**

### 👑 **أنت صاحب المشروع - لديك:**
- 🔑 **حسابين منفصلين** للنظامين
- 🎖️ **أعلى صلاحيات** في كلا النظامين  
- 🛡️ **أمان قوي** مع MFA للنظام التقني
- 👥 **قدرة على إنشاء حسابات** لفريقك
- 📊 **وصول كامل** لجميع البيانات والتحليلات

**مبروك! أنت الآن تملك السيطرة الكاملة على منصة Mnbara!** 🎉👑
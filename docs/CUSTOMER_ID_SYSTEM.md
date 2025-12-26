# 🆔 نظام معرفات العملاء - Customer ID System

**آخر تحديث:** 25 ديسمبر 2025

---

## 📋 نظرة عامة

نظام معرفات فريدة وسهلة التتبع لكل عميل في منبرة. كل عميل يحصل على 4 صيغ مختلفة من المعرف:

| الصيغة | المثال | الاستخدام |
|--------|--------|-----------|
| **Standard** | `MNB-2025-001234` | الفواتير والتقارير |
| **Short** | `MNB001234` | الرسائل والإشعارات |
| **UUID** | `mnb_550e8400-e29b-41d4-a716-446655440000` | قاعدة البيانات والـ APIs |
| **Numeric** | `1704067200001234` | الباركود والـ QR Code |

---

## 🎯 الميزات

### 1️⃣ معرفات فريدة وسهلة التذكر
```
MNB-2025-001234  ← سهل التذكر والكتابة
```

### 2️⃣ تتبع سهل
```
MNB = Mnbara
2025 = السنة
001234 = الرقم التسلسلي
```

### 3️⃣ دعم أنواع مختلفة من العملاء
- 👤 Buyer (المشتري)
- 🏪 Seller (البائع)
- 🚗 Traveler (المسافر/الشحن)

### 4️⃣ QR Code و Barcode
```
QR Code: https://mnbara.com/customer/MNB-2025-001234
Barcode: MNB001234
```

---

## 🚀 الاستخدام

### إنشاء معرف عميل جديد
```bash
POST /api/customer-id/generate
Content-Type: application/json

{
  "userId": "user-123",
  "userType": "buyer"  // buyer, seller, traveler
}
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "standardID": "MNB-2025-001234",
    "shortID": "MNB001234",
    "uuidID": "mnb_550e8400-e29b-41d4-a716-446655440000",
    "numericID": "1704067200001234",
    "sequentialNumber": 1234,
    "createdAt": "2025-12-25T10:00:00Z",
    "qrCode": "https://mnbara.com/customer/MNB-2025-001234",
    "barcode": "MNB001234"
  }
}
```

### البحث عن عميل
```bash
GET /api/customer-id/MNB-2025-001234
# أو
GET /api/customer-id/MNB001234
# أو
GET /api/customer-id/mnb_550e8400-e29b-41d4-a716-446655440000
```

### الإحصائيات
```bash
GET /api/customer-id/stats/overview
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 15234,
    "activeCustomers": 14890,
    "byType": [
      { "type": "buyer", "count": 10000 },
      { "type": "seller", "count": 3500 },
      { "type": "traveler", "count": 1734 }
    ]
  }
}
```

### تصدير المعرفات
```bash
GET /api/customer-id/export/csv?limit=1000
```

---

## 💡 الاقتراحات والإضافات

### 1️⃣ Loyalty Program Integration
```typescript
// ربط مع برنامج الولاء
interface CustomerLoyalty {
  customerId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinDate: Date;
  totalSpent: number;
}
```

### 2️⃣ Customer Tier System
```
🥉 Bronze: 0-1000 نقطة
🥈 Silver: 1001-5000 نقطة
🥇 Gold: 5001-10000 نقطة
💎 Platinum: 10000+ نقطة
```

**الفوائد:**
- خصومات تدريجية
- أولوية في الدعم
- عروض حصرية

### 3️⃣ Customer Referral Program
```typescript
interface Referral {
  referrerId: string;
  referredId: string;
  reward: number;
  status: 'pending' | 'completed';
}
```

**الآلية:**
- كل عميل يحصل على رابط إحالة فريد
- عند إحالة عميل جديد: +100 نقطة
- العميل الجديد: +50 نقطة

### 4️⃣ Customer Segmentation
```typescript
enum CustomerSegment {
  VIP = 'vip',                    // أعلى المشترين
  FREQUENT = 'frequent',          // المشترون المتكررون
  OCCASIONAL = 'occasional',      // المشترون العرضيون
  INACTIVE = 'inactive',          // غير نشطين
  AT_RISK = 'at_risk',           // قد يتركون المنصة
}
```

### 5️⃣ Personalized Offers
```typescript
interface PersonalizedOffer {
  customerId: string;
  offerId: string;
  discount: number;
  validUntil: Date;
  category: string;
  reason: string; // "Based on your purchase history"
}
```

### 6️⃣ Customer Analytics Dashboard
```
📊 Dashboard يعرض:
- عدد المشتريات
- إجمالي الإنفاق
- المنتجات المفضلة
- تاريخ آخر شراء
- معدل الرضا
- النقاط المتراكمة
```

### 7️⃣ SMS/Email Notifications
```typescript
interface CustomerNotification {
  customerId: string;
  type: 'sms' | 'email' | 'push';
  message: string;
  template: string;
  variables: Record<string, any>;
}

// مثال:
{
  customerId: "MNB-2025-001234",
  type: "sms",
  message: "مرحباً {name}، لديك عرض خاص بقيمة {discount}%",
  template: "special_offer",
  variables: {
    name: "أحمد",
    discount: 20
  }
}
```

### 8️⃣ Birthday/Anniversary Rewards
```typescript
interface SpecialDateReward {
  customerId: string;
  dateType: 'birthday' | 'anniversary' | 'registration';
  reward: number;
  message: string;
}
```

### 9️⃣ Customer Support Ticket Integration
```typescript
interface SupportTicket {
  ticketId: string;
  customerId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
}
```

### 🔟 Fraud Detection
```typescript
interface FraudAlert {
  customerId: string;
  riskScore: number;
  reason: string;
  action: 'block' | 'verify' | 'monitor';
}

// مثال:
{
  customerId: "MNB-2025-001234",
  riskScore: 85,
  reason: "Multiple failed login attempts",
  action: "verify"
}
```

---

## 📱 Mobile App Integration

### عرض معرف العميل
```dart
// في Flutter App
class CustomerIDCard extends StatelessWidget {
  final String customerId;
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text('معرف العميل', style: TextStyle(fontSize: 18)),
          Text(customerId, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          QrImage(data: 'https://mnbara.com/customer/$customerId'),
          ElevatedButton(
            onPressed: () => _shareCustomerId(),
            child: Text('مشاركة'),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔐 الأمان

### حماية معرف العميل
- ✅ تشفير في قاعدة البيانات
- ✅ HTTPS فقط للـ APIs
- ✅ Rate limiting على الطلبات
- ✅ Audit logging لكل عملية

---

## 📊 الإحصائيات المتوقعة

| المقياس | القيمة |
|--------|--------|
| عملاء جدد يومياً | 500-1000 |
| معرفات مُنشأة | 100,000+ |
| معدل الاستخدام | 95%+ |
| وقت الاستجابة | <100ms |

---

## 🎁 حالات الاستخدام

### 1. الفواتير والإيصالات
```
الفاتورة رقم: INV-2025-001234
معرف العميل: MNB-2025-001234
```

### 2. برنامج الولاء
```
نقاطك: 2,500
المستوى: Gold
معرف العميل: MNB-2025-001234
```

### 3. الدعم الفني
```
تذكرة الدعم: TKT-2025-001234
معرف العميل: MNB-2025-001234
```

### 4. الشحن والتتبع
```
رقم الشحنة: SHP-2025-001234
معرف العميل: MNB-2025-001234
```

---

## 🚀 الخطوات التالية

1. ✅ إنشاء نظام المعرفات الأساسي
2. ⏳ إضافة برنامج الولاء
3. ⏳ تطبيق نظام الإحالات
4. ⏳ إضافة التحليلات المتقدمة
5. ⏳ تكامل مع الدعم الفني

---

**آخر تحديث:** 25 ديسمبر 2025

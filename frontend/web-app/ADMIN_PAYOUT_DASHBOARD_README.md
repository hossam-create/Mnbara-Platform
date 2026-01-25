# Admin Payout Dashboard - دليل الاستخدام

## نظرة عامة

لوحة تحكم إدارية كاملة لإدارة طلبات سحب الأموال من المستخدمين مع جميع المميزات المطلوبة.

## المميزات المنفذة ✅

### 1. جدول عرض طلبات السحب
- ✅ عرض معلومات المستخدم (الاسم، البريد الإلكتروني، شارة التوثيق)
- ✅ عرض المبلغ والعملة
- ✅ تاريخ الطلب
- ✅ شارة الحالة (Status Badge) بألوان مختلفة
- ✅ طريقة السحب
- ✅ أزرار الإجراءات (عرض التفاصيل)
- ✅ ترتيب الأعمدة (Sorting)
- ✅ تصميم responsive

### 2. الفلاتر
- ✅ قائمة منسدلة للحالة (Status dropdown)
- ✅ قائمة منسدلة لطريقة السحب
- ✅ اختيار نطاق التاريخ (Date range picker)
- ✅ بحث بالاسم أو البريد الإلكتروني
- ✅ نطاق المبلغ (Amount range)
- ✅ فلاتر متقدمة قابلة للإخفاء/الإظهار

### 3. Modal التفاصيل
- ✅ معلومات المستخدم الكاملة
- ✅ سجل المحفظة (آخر 5 معاملات)
- ✅ تفاصيل الحساب المشفرة (فك التشفير للإدارة)
- ✅ ملاحظات المستخدم
- ✅ أزرار الإجراءات (موافقة/رفض/إتمام)
- ✅ تصميم responsive

### 4. سير عمل الموافقة
- ✅ مراجعة الإدارة
- ✅ إضافة ملاحظات
- ✅ تأكيد الموافقة
- ✅ إشعارات Toast للنجاح/الفشل
- ✅ تحديث تلقائي للبيانات

### 5. بطاقات الإحصائيات
- ✅ المبلغ المعلق (Pending amount)
- ✅ الموافق عليه اليوم (Approved today)
- ✅ المكتمل هذا الأسبوع (Completed this week)
- ✅ إجمالي المعالج (Total processed)

## التقنيات المستخدمة

- ✅ React + TypeScript
- ✅ Tailwind CSS
- ✅ React Query (@tanstack/react-query) للـ data fetching
- ✅ TanStack Table للجدول
- ✅ Headless UI للـ Modal
- ✅ Heroicons للأيقونات
- ✅ date-fns للتواريخ
- ✅ react-hot-toast للإشعارات
- ✅ axios للـ API calls

## هيكل الملفات

```
frontend/web-app/src/
├── types/
│   └── payout.types.ts              # أنواع TypeScript
├── api/
│   └── payoutApi.ts                 # API client
├── hooks/
│   └── usePayouts.ts                # React Query hooks
└── components/admin/
    ├── PayoutDashboard.tsx          # المكون الرئيسي
    ├── PayoutStatsCards.tsx         # بطاقات الإحصائيات
    ├── PayoutFiltersBar.tsx         # شريط الفلاتر
    ├── PayoutTable.tsx              # جدول العرض
    └── PayoutDetailsModal.tsx       # Modal التفاصيل
```

## التثبيت

### 1. تثبيت Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-table
npm install @headlessui/react @heroicons/react
npm install axios date-fns react-hot-toast
```

### 2. إضافة React Query Provider

في `app/layout.tsx` أو `_app.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-center" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 3. إضافة الصفحة

في `app/admin/payouts/page.tsx`:

```typescript
import PayoutDashboard from '@/components/admin/PayoutDashboard';

export default function PayoutsPage() {
  return <PayoutDashboard />;
}
```

## الاستخدام

### 1. تكوين API URL

في `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3010
```

### 2. المصادقة

تأكد من حفظ token الإدارة في localStorage:

```typescript
localStorage.setItem('adminToken', 'your-admin-token');
```

### 3. الوصول للوحة التحكم

```
http://localhost:3000/admin/payouts
```

## API Endpoints المطلوبة

يجب أن يوفر Backend الـ endpoints التالية:

```typescript
// Get pending payouts
GET /api/admin/payouts/pending?minAmount=100&limit=50

// Get all payouts with filters
GET /api/admin/payouts?status=PENDING&method=BANK_TRANSFER

// Get payout details (with decrypted account info)
GET /api/admin/payouts/:id

// Approve payout
POST /api/admin/payouts/:id/approve

// Reject payout
POST /api/admin/payouts/:id/reject
Body: { rejectionReason: string }

// Mark as processing
POST /api/admin/payouts/:id/process

// Complete payout
POST /api/admin/payouts/:id/complete
Body: { notes?: string }

// Get stats
GET /api/admin/payouts/stats

// Get user wallet history
GET /api/admin/wallets/:userId/transactions
```

## المميزات الإضافية

### Responsive Design
- ✅ يعمل على جميع أحجام الشاشات
- ✅ Grid responsive للبطاقات
- ✅ جدول قابل للتمرير أفقياً على الشاشات الصغيرة
- ✅ Modal متجاوب

### Real-time Updates
- ✅ تحديث تلقائي كل 30 ثانية للطلبات المعلقة
- ✅ تحديث تلقائي للإحصائيات كل دقيقة
- ✅ Invalidation تلقائي بعد كل إجراء

### User Experience
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Confirmation dialogs
- ✅ Empty states
- ✅ Hover effects
- ✅ Smooth transitions

### Accessibility
- ✅ RTL support
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus management
- ✅ Color contrast

## التخصيص

### تغيير الألوان

في `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ... your colors
        },
      },
    },
  },
};
```

### تغيير اللغة

جميع النصوص موجودة في المكونات ويمكن استبدالها بسهولة أو استخدام i18n library.

### إضافة فلاتر جديدة

في `PayoutFiltersBar.tsx`:

```typescript
// Add new filter
<select
  value={localFilters.newFilter || ''}
  onChange={(e) =>
    setLocalFilters({
      ...localFilters,
      newFilter: e.target.value,
    })
  }
>
  {/* options */}
</select>
```

## الاختبار

### Manual Testing Checklist

- [ ] تحميل البيانات بنجاح
- [ ] الفلاتر تعمل بشكل صحيح
- [ ] الترتيب يعمل على جميع الأعمدة
- [ ] Modal يفتح ويغلق بشكل صحيح
- [ ] الموافقة تعمل وتظهر toast
- [ ] الرفض يطلب سبب ويعمل بشكل صحيح
- [ ] بدء المعالجة يعمل
- [ ] إتمام السحب يعمل
- [ ] الإحصائيات تتحدث بعد كل إجراء
- [ ] Responsive على جميع الأحجام

## الأداء

### Optimizations المطبقة

- ✅ React Query caching
- ✅ Stale time configuration
- ✅ Automatic refetching
- ✅ Optimistic updates
- ✅ Memoization في الجدول
- ✅ Lazy loading للـ Modal

## الأمان

### Security Measures

- ✅ JWT authentication
- ✅ Admin role verification
- ✅ HTTPS only في الإنتاج
- ✅ XSS protection
- ✅ CSRF protection (يجب إضافته في Backend)

## الدعم

للمساعدة أو الأسئلة:
- راجع الكود المصدري
- تحقق من console للأخطاء
- راجع Network tab في DevTools

---

**تاريخ الإنشاء:** 23 يناير 2026
**الإصدار:** 1.0.0
**الحالة:** ✅ جاهز للاستخدام

# Cleanup & Archive Plan
**Date**: January 31, 2026

## الهدف
نقل كل الملفات المكتملة للأرشيف وترك الملفات النشطة فقط في الـ root

---

## الملفات النشطة (تبقى في Root)

### 1. Core Documentation
- `README.md` - الوثيقة الرئيسية
- `Mnbarh_BUILD_MAP.md` - خريطة المشروع الكاملة
- `PHASE_1_EXECUTION_CHECKLIST.md` - الخطة الحالية
- `FAST_TRACK_LAUNCH_STRATEGY.md` - استراتيجية الإطلاق السريع

### 2. Active Specs
- `.kiro/specs/` - كل المواصفات النشطة

### 3. Source Code
- `backend/` - كل الكود
- `frontend/` - كل الكود
- `mobile/` - كل الكود
- `contracts/` - Smart contracts
- `scripts/` - Scripts نشطة

### 4. Configuration
- `package.json`
- `docker-compose.yml`
- `.env*` files
- `tsconfig.json`
- All config files

---

## الملفات للأرشفة (تنقل لـ archive/)

### Phase Reports (100+ files)
- `PHASE_*.md` - كل تقارير الـ phases
- `CUSTODII_*.md` - تقارير Custodii
- `P2P_EXCHANGE_*.md` - تقارير P2P
- `DISPUTES_*.md` - تقارير Disputes
- `RATE_LIMITING_*.md` - تقارير Rate Limiting
- `EVENT_*.md` - تقارير Event Logging
- `RULES_ENGINE_*.md` - تقارير Rules Engine
- `TASK_*.md` - تقارير Tasks
- `WALLET_*.md` - تقارير Wallet
- `PAYMENTS_*.md` - تقارير Payments
- `AUCTION_*.md` - تقارير Auction

### Implementation Reports
- `*_COMPLETE.md` - كل الملفات المكتملة
- `*_COMPLETION_REPORT.md` - تقارير الإنجاز
- `*_SUMMARY.md` - الملخصات
- `*_IMPLEMENTATION_*.md` - تقارير التنفيذ
- `*_CERTIFICATION.md` - شهادات الإنتاج

### Testing & QA
- `BACKEND_TESTS_*.md`
- `MOCK_DATA_*.md`
- `DEBUG_*.md`
- `REFACTORING_*.md`
- `OPTIMIZATION_*.md`

### Project Management
- `PROJECT_*.md` - تقارير المشروع
- `IMPLEMENTATION_PROGRESS_TRACKER.md`
- `REALITY_CHECK_*.md`
- `ORIGINAL_VISION_VS_CURRENT_REALITY.md`

---

## الهيكل الجديد

```
/
├── README.md
├── Mnbarh_BUILD_MAP.md
├── PHASE_1_EXECUTION_CHECKLIST.md
├── FAST_TRACK_LAUNCH_STRATEGY.md
├── package.json
├── docker-compose.yml
├── backend/
├── frontend/
├── mobile/
├── contracts/
├── scripts/
├── .kiro/
│   └── specs/
└── archive/
    ├── phase-reports/
    │   ├── custodii/
    │   ├── p2p-exchange/
    │   ├── disputes/
    │   ├── auction/
    │   ├── payments/
    │   └── wallet/
    ├── implementation-reports/
    ├── testing-reports/
    └── project-management/
```

---

## الخطوات

1. إنشاء المجلدات في archive/
2. نقل الملفات حسب الفئة
3. إنشاء INDEX.md في كل مجلد
4. تحديث README.md الرئيسي

---

## الملفات المهمة للرجوع إليها

سيتم إنشاء `archive/QUICK_REFERENCE.md` يحتوي على:
- روابط لأهم التقارير
- ملخص كل phase
- الإنجازات الرئيسية

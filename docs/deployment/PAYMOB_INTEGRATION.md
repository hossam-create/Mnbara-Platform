# تكامل Paymob - متغيرات البيئة والتكوين

## نظرة عامة
يتكامل نظام Mnbara مع بوابة الدفع Paymob لدعم المدفوعات في منطقة الشرق الأوسط وشمال أفريقيا (MENA). يدعم النظام:
- 💳 مدفوعات البطاقات (Visa/Mastercard)
- 📱 محافظ الهواتف المحمولة
- 🌍 طرق الدفع المحلية

## متغيرات البيئة المطلوبة

### المتغيرات الأساسية
| المتغير | الوصف | القيمة النموذجية |
|---------|-------|------------------|
| `PAYMOB_API_KEY` | مفتاح API من لوحة تحكم Paymob | `sk_test_...` |
| `PAYMOB_INTEGRATION_ID` | معرّف تكامل البطاقات | رقم (من لوحة تحكم Paymob) |
| `PAYMOB_WALLET_INTEGRATION_ID` | معرّف تكامل المحافظ المحمولة | رقم (من لوحة تحكم Paymob) |
| `PAYMOB_IFRAME_ID` | معرّف Iframe لدمج بوابة الدفع | رقم (من لوحة تحكم Paymob) |
| `PAYMOB_HMAC_SECRET` | سر HMAC للتحقق من webhooks | سلسلة نصية سرية |

### كيفية الحصول على المتغيرات
1. **تسجيل الدخول إلى Paymob**: https://accept.paymob.com/
2. **الذهاب إلى الإعدادات → API Keys**: لإنشاء/الحصول على `PAYMOB_API_KEY`
3. **التكاملات → Card Integration**: للحصول على `PAYMOB_INTEGRATION_ID`
4. **التكاملات → Mobile Wallets**: للحصول على `PAYMOB_WALLET_INTEGRATION_ID`
5. **التكاملات → Iframe**: للحصول على `PAYMOB_IFRAME_ID`
6. **الإعدادات → Webhooks**: لتعيين `PAYMOB_HMAC_SECRET`

## مثال تكوين كامل
```env
# ============================================
# PAYMOB CONFIGURATION (MENA Region)
# ============================================

# Paymob API Key (from Paymob dashboard)
PAYMOB_API_KEY=sk_test_abcdef123456

# Paymob Card Integration ID
PAYMOB_INTEGRATION_ID=1234567

# Paymob Mobile Wallet Integration ID
PAYMOB_WALLET_INTEGRATION_ID=7654321

# Paymob Iframe ID
PAYMOB_IFRAME_ID=999888777

# Paymob HMAC Secret (for webhook verification)
PAYMOB_HMAC_SECRET=your_super_secret_hmac_key_here
```

## إعداد Webhooks
لضمان الأمان، يجب تكوين webhooks في لوحة تحكم Paymob:

### URLs المطلوبة
- **Success URL**: `https://api.yourdomain.com/payments/paymob/success`
- **Failure URL**: `https://api.yourdomain.com/payments/paymob/failure`
- **Webhook URL**: `https://api.yourdomain.com/payments/paymob/webhook`

### أحداث Webhook المطلوبة
- `TRANSACTION_SUCCESS_CALLBACK`
- `TRANSACTION_DECLINED_CALLBACK`
- `DELIVERY_STATUS_CALLBACK`

## اختبار التكامل

### البيئة التجريبية (Sandbox)
```env
PAYMOB_API_KEY=sk_test_your_test_key_here
PAYMOB_INTEGRATION_ID=12345  # test integration
PAYMOB_WALLET_INTEGRATION_ID=67890  # test wallet
```

### بطاقات اختبار Paymob
| النوع | الرقم | CVV | النتيجة |
|-------|-------|-----|---------|
| Visa | `4186123456789012` | `123` | ناجح |
| Visa | `4186123456789013` | `456` | مرفوض |
| Mastercard | `5123456789012346` | `789` | ناجح |

## استكشاف الأخطاء وإصلاحها

### أخطاء شائعة
1. **API Key غير صالح**: تأكد من نسخ المفتاح بشكل صحيح
2. **Integration ID خاطئ**: تحقق من معرّف التكامل في لوحة تحكم Paymob
3. **مشاكل HMAC**: تأكد من تطابق `PAYMOB_HMAC_SECRET` مع الإعدادات في Paymob

### السجلات والمراقبة
- يتم تسجيل جميع معاملات Paymob في `payment_audit_log`
- يتم تتبع الأخطاء في `payment_error_log`
- المراقبة عبر `/admin/payments` في لوحة التحكم

## الأمان والامتثال

### معايير PCI DSS
- يتم تخزين بيانات البطاقات بشكل آمن في Paymob (لا يتم تخزينها محلياً)
- يتم استخدام iframe لتضمين بوابة الدفع الآمنة
- يتم التحقق من جميع webhooks باستخدام HMAC

### حماية البيانات
- يتوافق التكامل مع GDPR ولوائح الخصوصية المحلية
- يتم تشفير جميع البيانات أثناء النقل (TLS 1.2+)
- الحد الأدنى من تخزين بيانات الدفع

## المراجع
- [وثائق Paymob الرسمية](https://docs.paymob.com/)
- [دليل التكامل](https://docs.paymob.com/docs/accept-introduction)
- [لوحة تحكم Paymob](https://accept.paymob.com/portal2/en/)
export type LegalSlug =
  | 'user-agreement'
  | 'privacy'
  | 'cookies'
  | 'trust-and-guarantee'
  | 'dispute-policy';

export type LegalSection = {
  id: string;
  headingEn: string;
  bodyEn: string;
  headingAr: string;
  bodyAr: string;
};

export type LegalPageContent = {
  slug: LegalSlug;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  updated: string;
  sections: LegalSection[];
};

const makeSection = (
  id: string,
  headingEn: string,
  bodyEn: string,
  headingAr: string,
  bodyAr: string,
): LegalSection => ({ id, headingEn, bodyEn, headingAr, bodyAr });

export const legalPages: Record<LegalSlug, LegalPageContent> = {
  'user-agreement': {
    slug: 'user-agreement',
    titleEn: 'Mnbarh User Agreement',
    titleAr: 'اتفاقية مستخدمي منبره',
    summaryEn:
      'This agreement mirrors eBay’s marketplace standards and governs how seekers, travelers, and partners operate on Mnbarh.',
    summaryAr:
      'هذه الاتفاقية تعكس معايير eBay لسوق التجارة وتحدد كيفية تفاعل الباحثين والمسافرين والشركاء داخل منبره.',
    updated: 'September 12, 2025',
    sections: [
      makeSection(
        'ua-1',
        'Account eligibility & verification',
        'All members must maintain accurate profile information, provide verifiable identification when prompted, and refrain from operating duplicate accounts.',
        'أهلية الحساب والتحقق',
        'يجب على جميع الأعضاء الحفاظ على بيانات دقيقة في ملفاتهم، وتقديم هوية قابلة للتحقق عند الطلب، وعدم تشغيل حسابات مكررة.',
      ),
      makeSection(
        'ua-2',
        'Marketplace conduct',
        'Transactions must stay advisory-only until both parties manually confirm. Automated matching, off-platform solicitation, or reward manipulation are prohibited.',
        'سلوك السوق',
        'يجب أن تبقى المعاملات استشارية فقط حتى يؤكد الطرفان يدوياً. يُحظر المطابقة الآلية أو الاستقطاب خارج المنصة أو التلاعب بالمكافآت.',
      ),
      makeSection(
        'ua-3',
        'Fees, disputes, and enforcement',
        'Mnbarh may assess service fees similar to eBay’s final value fees. Violations can trigger holds, suspensions, or permanent removal.',
        'الرسوم والنزاعات والتنفيذ',
        'قد تفرض منبره رسوماً خدمية مشابهة لرسوم eBay النهائية. المخالفات قد تؤدي إلى حجز، أو تعليق، أو إزالة دائمة.',
      ),
    ],
  },
  privacy: {
    slug: 'privacy',
    titleEn: 'Privacy & Data Practices',
    titleAr: 'سياسة الخصوصية وحماية البيانات',
    summaryEn:
      'Mnbarh protects personal information with layered encryption and uses data only to fulfill advisory-trade workflows inspired by eBay’s compliance model.',
    summaryAr:
      'تحمي منبره المعلومات الشخصية بتشفير متعدد الطبقات، ولا تُستخدم البيانات إلا لدعم تدفقات التداول الاستشارية وفق نموذج التزام مشابه لـ eBay.',
    updated: 'September 5, 2025',
    sections: [
      makeSection(
        'pr-1',
        'Information we collect',
        'Profile details, travel itineraries, payout data, and device signals are collected to validate trust badges and coordinate deliveries.',
        'المعلومات التي نجمعها',
        'نقوم بجمع بيانات الملف الشخصي، ومسارات السفر، وبيانات الدفع، وإشارات الأجهزة للتحقق من شارات الثقة وتنسيق التسليمات.',
      ),
      makeSection(
        'pr-2',
        'How data is shared',
        'Only the minimum viable information is shared with counterparties. Third-party processors follow SOC 2 controls and eBay-grade audit trails.',
        'كيفية مشاركة البيانات',
        'نشارك الحد الأدنى من المعلومات مع الأطراف المقابلة. مقدمو الخدمات الخارجيون يلتزمون بضوابط SOC 2 وسجلات تدقيق بمستوى eBay.',
      ),
      makeSection(
        'pr-3',
        'Your controls',
        'Members can request exports, corrections, or deletion at any point. Mnbarh responds within 72 hours for most access requests.',
        'حقوقك وخياراتك',
        'يمكن للأعضاء طلب تصدير بياناتهم أو تصحيحها أو حذفها في أي وقت. تستجيب منبره خلال 72 ساعة لمعظم طلبات الوصول.',
      ),
    ],
  },
  cookies: {
    slug: 'cookies',
    titleEn: 'Cookies & Tracking Policy',
    titleAr: 'سياسة ملفات تعريف الارتباط والتتبع',
    summaryEn:
      'Our cookie usage matches eBay’s layered consent approach—analytics stay advisory, and ad personalization is strictly opt-in.',
    summaryAr:
      'استخدامنا لملفات الارتباط يطابق نهج eBay القائم على الموافقات المتدرجة؛ التحليلات استشارية، وإضفاء الطابع الشخصي على الإعلانات اختياري تماماً.',
    updated: 'August 28, 2025',
    sections: [
      makeSection(
        'ck-1',
        'Essential cookies',
        'Session, security, and localization cookies keep your experience stable. Blocking them can impair checkout flows.',
        'ملفات الارتباط الأساسية',
        'ملفات الارتباط الخاصة بالجلسة والأمان وتحديد الموقع تحافظ على استقرار التجربة. حظرها قد يؤثر على خطوات الإكمال.',
      ),
      makeSection(
        'ck-2',
        'Performance & analytics',
        'We rely on privacy-enhanced metrics with aggregated reporting. Data is never sold or shared with brokers.',
        'ملفات الأداء والتحليلات',
        'نعتمد على مقاييس معززة للخصوصية وتقارير مجمعة. لا تُباع البيانات أبداً ولا تُشارك مع سماسرة.',
      ),
      makeSection(
        'ck-3',
        'Managing preferences',
        'You can adjust consent from the footer controls or via account settings. Preferences sync across devices when signed in.',
        'إدارة التفضيلات',
        'يمكنك تعديل الموافقات من عناصر التحكم في التذييل أو من إعدادات الحساب. تُزامَن التفضيلات عبر الأجهزة عند تسجيل الدخول.',
      ),
    ],
  },
  'trust-and-guarantee': {
    slug: 'trust-and-guarantee',
    titleEn: 'Trust & Guarantee Program',
    titleAr: 'برنامج الضمان والثقة',
    summaryEn:
      'Mnbarh mirrors eBay’s Money Back Guarantee principles—funds are escrowed, and delivery disputes follow a human-reviewed ladder.',
    summaryAr:
      'تعكس منبره مبادئ ضمان استرداد الأموال لدى eBay؛ تُحتجز الأموال في وسيط، وتخضع نزاعات التسليم لسلم مراجعة بشري.',
    updated: 'October 2, 2025',
    sections: [
      makeSection(
        'tg-1',
        'Coverage scope',
        'Eligible requests are protected when seekers pay on-platform and confirm receipt within 72 hours of meetup.',
        'نطاق التغطية',
        'تحظى الطلبات المؤهلة بالحماية عند الدفع داخل المنصة وتأكيد الاستلام خلال 72 ساعة من اللقاء.',
      ),
      makeSection(
        'tg-2',
        'Escrow release rules',
        'Funds release only after both parties signal completion. Travelers with repeated disputes undergo additional holds.',
        'قواعد تحرير الضمان',
        'يتم تحرير الأموال فقط بعد إشارة الطرفين إلى اكتمال المعاملة. يخضع المسافرون ذوو النزاعات المتكررة لعمليات حجز إضافية.',
      ),
      makeSection(
        'tg-3',
        'Human escalation path',
        'Tiered support teams mediate photo evidence, itinerary proof, and customs documentation before issuing refunds.',
        'مسار التصعيد البشري',
        'تقوم فرق دعم متعددة المستويات بالتحكيم في صور الأدلة، وإثبات مسار السفر، ووثائق الجمارك قبل إصدار أي رد أموال.',
      ),
    ],
  },
  'dispute-policy': {
    slug: 'dispute-policy',
    titleEn: 'Dispute Resolution Policy',
    titleAr: 'سياسة حل النزاعات',
    summaryEn:
      'Conflicts follow eBay-style mediation: self-resolution first, Mnbarh agents second, and binding arbitration where required.',
    summaryAr:
      'تتبع النزاعات نهج eBay في الوساطة: الحل الذاتي أولاً، ثم وكلاء منبره، وأخيراً التحكيم الملزم عند الحاجة.',
    updated: 'September 30, 2025',
    sections: [
      makeSection(
        'dp-1',
        'Self-resolution window',
        'Parties have 48 hours to trade messages and upload evidence before Mnbarh steps in.',
        'نافذة الحل الذاتي',
        'يملك الطرفان 48 ساعة لتبادل الرسائل ورفع الأدلة قبل تدخل منبره.',
      ),
      makeSection(
        'dp-2',
        'Mnbarh mediation',
        'Trust ops reviews delivery logs, payout holds, and communication threads to recommend a fair remedy.',
        'وساطة منبره',
        'يقوم فريق الثقة بمراجعة سجلات التسليم، وحجوزات المدفوعات، وسلاسل التواصل لتقديم توصية منصفة.',
      ),
      makeSection(
        'dp-3',
        'Arbitration & enforcement',
        'If mediation fails, disputes move to region-specific arbitration partners. Non-compliance can result in permanent bans.',
        'التحكيم والتنفيذ',
        'إذا فشلت الوساطة، تُحال النزاعات إلى شركاء تحكيم خاصين بكل منطقة. وقد يؤدي عدم الامتثال إلى حظر دائم.',
      ),
    ],
  },
};

export const legalPageSlugs = Object.keys(legalPages) as LegalSlug[];

export const legalModalPreviews: Record<LegalSlug, { previewEn: string; previewAr: string }> = {
  'user-agreement': {
    previewEn:
      'You agree to keep Mnbarh transactions advisory-only, maintain accurate identity info, and follow the same listing ethics enforced on eBay.',
    previewAr:
      'أنت توافق على إبقاء معاملات منبره استشارية فقط، والحفاظ على هوية دقيقة، واتباع أخلاقيات الإدراج ذاتها المطبقة في eBay.',
  },
  privacy: {
    previewEn:
      'Mnbarh uses layered encryption and never sells your data. Access, rectification, and deletion controls mirror eBay privacy centers.',
    previewAr:
      'تستخدم منبره تشفيراً متعدد الطبقات ولا تبيع بياناتك مطلقاً. التحكم بالوصول والتصحيح والحذف يعكس مراكز خصوصية eBay.',
  },
  cookies: {
    previewEn:
      'Essential cookies keep sign-ins secure. Analytics remain opt-in, mirroring eBay’s consent banner.',
    previewAr:
      'ملفات الارتباط الأساسية تحفظ تسجيل الدخول آمناً. وتظل التحليلات اختيارية، تماماً كما في لوائح موافقة eBay.',
  },
  'trust-and-guarantee': {
    previewEn:
      'Funds stay escrowed until you confirm delivery. Mnbarh’s guarantee follows the same dispute ladder as eBay’s Money Back program.',
    previewAr:
      'تبقى الأموال في الضمان حتى تؤكد التسليم. يتبع ضمان منبره سلم النزاعات ذاته لبرنامج استرداد الأموال في eBay.',
  },
  'dispute-policy': {
    previewEn:
      'Disputes escalate from self-resolution to Mnbarh mediation, then to binding arbitration if needed.',
    previewAr:
      'تصعد النزاعات من الحل الذاتي إلى وساطة منبره، ثم إلى التحكيم الملزم إذا لزم الأمر.',
  },
};

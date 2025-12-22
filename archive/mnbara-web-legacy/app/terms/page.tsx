import { Metadata } from 'next';
import LegalLayout from '../components/LegalLayout';

export const metadata: Metadata = {
  title: 'شروط الخدمة - منبرة | Terms of Service - Mnbara',
  description: 'شروط وأحكام استخدام منصة منبرة كوسيط ثقة | Terms and conditions for using Mnbara platform as a trust intermediary',
};

export default function TermsPage() {
  return (
    <LegalLayout title="شروط الخدمة | Terms of Service">
      <div className="space-y-8">
        {/* Arabic Content */}
        <div lang="ar" dir="rtl" className="border-b pb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            شروط وأحكام استخدام منصة منبرة
          </h2>
          
          <p className="text-gray-700 mb-4">
            مرحباً بك في منبرة، منصة الوساطة بالثقة التي تربط بين المسافرين والأشخاص الراغبين في الحصول على منتجات من حول العالم.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            💡 طبيعة الخدمة
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>منبرة هي وسيط ثقة وليست بنكاً أو مزود خدمات دفع</li>
            <li>نحن لا نقدم خدمات الدفع الآلي أو التحويلات التلقائية</li>
            <li>جميع العمليات تتطلب تأكيداً بشرياً ومراجعة يدوية</li>
            <li>نحن نقدم خدمات الاستشارة والضمان فقط كوسيط موثوق</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            📋 مسؤوليات المستخدم
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>تقديم معلومات صحيحة وكاملة عند التسجيل</li>
            <li>الالتزام باللوائح والقوانين المحلية والدولية</li>
            <li>احترام حقوق الملكية الفكرية للآخرين</li>
            <li>المحافظة على سرية معلومات الحساب</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            ⚖️ المسؤولية القانونية
          </h3>
          <p className="text-gray-700 mb-4">
            منبرة لا تتحمل مسؤولية الخسائر الناتجة عن:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>سوء استخدام المنصة من قبل المستخدمين</li>
            <li>التغيرات في القوانين واللوائح الحكومية</li>
            <li>الأحداث الخارجة عن إرادتنا (القوة القاهرة)</li>
          </ul>
        </div>

        {/* English Content */}
        <div lang="en" dir="ltr" className="border-b pb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Terms and Conditions of Mnbara Platform
          </h2>
          
          <p className="text-gray-700 mb-4">
            Welcome to Mnbara, a trust intermediary platform connecting travelers with people seeking products from around the world.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            💡 Service Nature
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Mnbara is a trust intermediary, not a bank or payment provider</li>
            <li>We do not offer automated payment services or automatic transfers</li>
            <li>All operations require human confirmation and manual review</li>
            <li>We provide advisory and guarantee services only as a trusted intermediary</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            📋 User Responsibilities
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Provide accurate and complete information during registration</li>
            <li>Comply with local and international regulations and laws</li>
            <li>Respect others' intellectual property rights</li>
            <li>Maintain account information confidentiality</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            ⚖️ Legal Liability
          </h3>
          <p className="text-gray-700 mb-4">
            Mnbara is not liable for losses resulting from:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Misuse of the platform by users</li>
            <li>Changes in government laws and regulations</li>
            <li>Events beyond our control (force majeure)</li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            📞 Contact Information
          </h3>
          <p className="text-blue-700">
            For questions about these terms, please contact us at legal@mnbara.com
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}
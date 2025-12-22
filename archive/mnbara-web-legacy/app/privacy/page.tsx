import { Metadata } from 'next';
import LegalLayout from '../components/LegalLayout';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية - منبرة | Privacy Policy - Mnbara',
  description: 'سياسة الخصوصية وحماية البيانات الشخصية في منصة منبرة | Privacy policy and data protection for Mnbara platform',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="سياسة الخصوصية | Privacy Policy">
      <div className="space-y-8">
        {/* Arabic Content */}
        <div lang="ar" dir="rtl" className="border-b pb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            سياسة الخصوصية وحماية البيانات
          </h2>
          
          <p className="text-gray-700 mb-4">
            في منبرة، نحن نعتبر خصوصيتك وحماية بياناتك الشخصية من أولوياتنا الأساسية. هذه السياسة توضح كيف نجمع ونستخدم ونحمي معلوماتك.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            📊 البيانات التي نجمعها
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>معلومات التسجيل الأساسية (الاسم، البريد الإلكتروني، رقم الهاتف)</li>
            <li>معلومات الملف الشخصي والتفضيلات</li>
            <li>سجل التفاعلات والمعاملات على المنصة</li>
            <li>بيانات التواصل والمراسلات</li>
            <li>معلومات الجهاز والمتصفح لأغراض أمنية</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            🛡️ كيف نحمي بياناتك
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>التشفير المتقدم للبيانات الحساسة</li>
            <li>الوصول المحدود للموظفين المصرح لهم فقط</li>
            <li>مراجعات أمنية منتظمة للأنظمة</li>
            <li>التدريب المستمر لفريق الحماية والخصوصية</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            🔄 مشاركة البيانات
          </h3>
          <p className="text-gray-700 mb-4">
            نحن لا نبيع أو نؤجر بياناتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>مزودي الخدمات الأساسيين لتشغيل المنصة</li>
            <li>السلطات القانونية عند وجود طلب قانوني</li>
            <li>الشركاء الاستشاريين لأغراض تحسين الخدمة فقط</li>
          </ul>
        </div>

        {/* English Content */}
        <div lang="en" dir="ltr" className="border-b pb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Privacy and Data Protection Policy
          </h2>
          
          <p className="text-gray-700 mb-4">
            At Mnbara, we consider your privacy and the protection of your personal data among our top priorities. This policy explains how we collect, use, and protect your information.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            📊 Data We Collect
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Basic registration information (name, email, phone number)</li>
            <li>Profile information and preferences</li>
            <li>Interaction and transaction history on the platform</li>
            <li>Communication and correspondence data</li>
            <li>Device and browser information for security purposes</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            🛡️ How We Protect Your Data
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Advanced encryption of sensitive data</li>
            <li>Limited access to authorized employees only</li>
            <li>Regular security reviews of systems</li>
            <li>Ongoing training for privacy and protection team</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            🔄 Data Sharing
          </h3>
          <p className="text-gray-700 mb-4">
            We do not sell or rent your personal data to third parties. We may share information with:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Essential service providers for platform operation</li>
            <li>Legal authorities when required by law</li>
            <li>Consulting partners for service improvement purposes only</li>
          </ul>
        </div>

        {/* Rights Section */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            📋 حقوقك في البيانات | Your Data Rights
          </h3>
          <p className="text-green-700 mb-2">
            لديك الحق في الوصول إلى بياناتك وتصحيحها وحذفها وتقييد معالجتها. يمكنك ممارسة هذه الحقوق عن طريق التواصل معنا.
          </p>
          <p className="text-green-700">
            You have the right to access, correct, delete, and restrict processing of your data. You can exercise these rights by contacting us.
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            📞 Contact Information
          </h3>
          <p className="text-blue-700">
            For privacy-related inquiries: privacy@mnbara.com
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}
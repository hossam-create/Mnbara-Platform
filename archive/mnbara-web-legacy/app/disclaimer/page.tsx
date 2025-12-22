import { Metadata } from 'next';
import LegalLayout from '../components/LegalLayout';

export const metadata: Metadata = {
  title: 'إخلاء المسؤولية - منبرة | Disclaimer - Mnbara',
  description: 'إخلاء المسؤولية القانونية لاستخدام منصة منبرة كوسيط ثقة | Legal disclaimer for using Mnbara platform as a trust intermediary',
};

export default function DisclaimerPage() {
  return (
    <LegalLayout title="إخلاء المسؤولية | Disclaimer">
      <div className="space-y-8">
        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-yellow-800 text-lg mr-2">⚠️</span>
            <h3 className="text-lg font-medium text-yellow-800">
              تنبيه هام | Important Notice
            </h3>
          </div>
          <p className="text-yellow-700 text-sm">
            منبرة هي وسيط ثقة فقط وليست مزود خدمات دفع أو بنك. جميع العمليات تتطلب تأكيداً بشرياً.
            <br />
            Mnbara is a trust intermediary only, not a payment provider or bank. All operations require human confirmation.
          </p>
        </div>

        {/* Arabic Content */}
        <div lang="ar" dir="rtl" className="border-b pb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            إخلاء المسؤولية القانونية
          </h2>
          
          <p className="text-gray-700 mb-4">
            يرجى قراءة هذا الإخلاء بعناية قبل استخدام منصة منبرة. باستخدامك للمنصة، فإنك توافق على هذه الشروط.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            🚫 طبيعة الخدمة المحدودة
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>منبرة هي وسيط ثقة وليست بنكاً أو مؤسسة مالية</li>
            <li>لا نقدم خدمات الدفع أو التحويلات النقدية</li>
            <li>لا نتحمل مسؤولية القرارات المالية للمستخدمين</li>
            <li>نحن نقدم خدمات الاستشارة والضمان كوسيط موثوق فقط</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            ⚠️ تحذيرات الاستخدام
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>جميع المعاملات تخضع للمراجعة والتأكيد البشري</li>
            <li>لا توجد عمليات آلية أو تلقائية في النظام</li>
            <li>المستخدم يتحمل المسؤولية النهائية لقراراته</li>
            <li>نحن لا نضمن نتائج محددة أو أرباح مضمونة</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            📝 إقرارات المستخدم
          </h3>
          <p className="text-gray-700 mb-4">
            بتسجيلك في منبرة، فإنك تقر وتوافق على:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>أنك فهمت طبيعة الخدمة كوسيط ثقة فقط</li>
            <li>أنك تتحمل المسؤولية الكاملة عن قراراتك</li>
            <li>أنك لن تستخدم المنصة لأغراض غير قانونية</li>
            <li>أنك توافق على الشروط والأحكام المذكورة</li>
          </ul>
        </div>

        {/* English Content */}
        <div lang="en" dir="ltr" className="border-b pb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Legal Disclaimer
          </h2>
          
          <p className="text-gray-700 mb-4">
            Please read this disclaimer carefully before using the Mnbara platform. By using our platform, you agree to these terms.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            🚫 Limited Service Nature
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Mnbara is a trust intermediary, not a bank or financial institution</li>
            <li>We do not provide payment services or cash transfers</li>
            <li>We are not responsible for users' financial decisions</li>
            <li>We provide advisory and guarantee services as a trusted intermediary only</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            ⚠️ Usage Warnings
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>All transactions are subject to human review and confirmation</li>
            <li>There are no automated or automatic processes in the system</li>
            <li>The user bears ultimate responsibility for their decisions</li>
            <li>We do not guarantee specific outcomes or guaranteed profits</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">
            📝 User Acknowledgments
          </h3>
          <p className="text-gray-700 mb-4">
            By registering with Mnbara, you acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>You understand the service nature as a trust intermediary only</li>
            <li>You bear full responsibility for your decisions</li>
            <li>You will not use the platform for illegal purposes</li>
            <li>You agree to the stated terms and conditions</li>
          </ul>
        </div>

        {/* Final Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-red-800 text-lg mr-2">❗</span>
            <h3 className="text-lg font-medium text-red-800">
              تنبيه نهائي | Final Notice
            </h3>
          </div>
          <p className="text-red-700 text-sm">
            استخدامك لمنبرة يعني موافقتك الكاملة على جميع بنود إخلاء المسؤولية هذا. إذا لم توافق على هذه الشروط، يرجى عدم استخدام المنصة.
            <br />
            Your use of Mnbara constitutes your full acceptance of all terms of this disclaimer. If you do not agree to these terms, please do not use the platform.
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            📞 Contact Information
          </h3>
          <p className="text-blue-700">
            For disclaimer-related inquiries: legal@mnbara.com
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}
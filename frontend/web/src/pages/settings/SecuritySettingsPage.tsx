import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api.service';
import TwoFactorSetup from '../../components/security/TwoFactorSetup';

interface Device {
  id: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  lastSeenAt: string;
  createdAt: string;
}

interface SecurityResponse {
  devices?: Device[];
  twoFactorEnabled?: boolean;
}

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
    {children}
  </section>
);

export const SecuritySettingsPage: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const response = await apiClient.get<SecurityResponse>('/security/devices');
      setDevices(response.data.devices || []);
      setTwoFactorEnabled(Boolean(response.data.twoFactorEnabled));
    } catch (error) {
      console.error('Failed to load security settings', error);
      setFeedback('تعذر تحميل بيانات الأمان حالياً. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (!enabled) {
      const confirmDisable = window.confirm(
        'هل أنت متأكد من تعطيل التحقق بخطوتين؟ هذا سيقلل مستوى الأمان.'
      );
      if (!confirmDisable) return;

      try {
        await apiClient.post('/security/2fa/disable');
        setTwoFactorEnabled(false);
        setFeedback('تم تعطيل التحقق بخطوتين.');
      } catch (error) {
        console.error('Failed to disable 2FA', error);
        setFeedback('فشل تعطيل التحقق بخطوتين.');
      }
    } else {
      setShowTwoFactorSetup(true);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    const confirmed = window.confirm('إزالة هذا الجهاز من القائمة الموثوقة؟');
    if (!confirmed) return;

    try {
      await apiClient.delete(`/security/device/${deviceId}`);
      setDevices((prev) => prev.filter((device) => device.id !== deviceId));
      setFeedback('تمت إزالة الجهاز.');
    } catch (error) {
      console.error('Failed to remove device', error);
      setFeedback('تعذر إزالة الجهاز.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-8">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Security</p>
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-2">
            راجع حماية حسابك، فعّل التحقق بخطوتين، وتتبّع الأجهزة الموثوقة.
          </p>
        </header>

        {feedback && (
          <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            {feedback}
          </div>
        )}

        <SectionCard
          title="Two-Factor Authentication"
          description="إضافة طبقة أمان إضافية عند تسجيل الدخول أو تنفيذ العمليات الحساسة."
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 font-medium">
                {twoFactorEnabled ? 'التوثيق مفعل' : 'التوثيق معطل'}
              </p>
              <p className="text-sm text-gray-500">
                {twoFactorEnabled
                  ? 'لن يتمكن أحد من الدخول بدون رمز إضافي.'
                  : 'ننصح بتفعيل التحقق بخطوتين لحماية حسابك.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTwoFactorToggle(!twoFactorEnabled)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
              disabled={loading}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  twoFactorEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {twoFactorEnabled && (
            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
              حسابك محمي حالياً بالتحقق بخطوتين.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Trusted Devices"
          description="الأجهزة التي سجلت الدخول إليها ويمكنها تجاوز بعض خطوات التحقق."
        >
          {loading && (
            <p className="text-sm text-gray-500 mb-4">جارٍ تحميل الأجهزة الموثوقة...</p>
          )}

          {!loading && devices.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              لا توجد أجهزة مسجلة حالياً. قم بتسجيل الدخول من جهاز لتتم إضافته هنا.
            </div>
          )}

          {devices.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {devices.map((device) => (
                <li key={device.id} className="py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{device.deviceName}</p>
                    <p className="text-sm text-gray-500">{device.userAgent}</p>
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
                      <p>IP: {device.ipAddress}</p>
                      <p>آخر ظهور: {formatDate(device.lastSeenAt)}</p>
                      <p>تاريخ الإضافة: {formatDate(device.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDevice(device.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    إزالة
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={loadSecuritySettings}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              تحديث القائمة
            </button>
            <button
              type="button"
              onClick={() => setShowTwoFactorSetup(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800"
            >
              تسجيل الجهاز الحالي
            </button>
          </div>
        </SectionCard>
      </div>

      {showTwoFactorSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Set up 2FA</h3>
              <button
                type="button"
                onClick={() => setShowTwoFactorSetup(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <TwoFactorSetup
              onSuccess={() => {
                setShowTwoFactorSetup(false);
                setTwoFactorEnabled(true);
                setFeedback('تم تمكين التحقق بخطوتين.');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettingsPage;

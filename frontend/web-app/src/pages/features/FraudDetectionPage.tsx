import React from 'react'

const FraudDetectionPage: React.FC = () => {

  const securityStatus = {
    overallScore: 92,
    status: 'آمن جداً',
    lastChecked: '2025-12-23 10:30',
    alerts: 0
  }

  const recentActivity = [
    { type: 'login', device: 'Chrome - Windows', location: 'الرياض', time: '2025-12-23 10:15', status: 'verified' },
    { type: 'purchase', device: 'Safari - iPhone', location: 'الرياض', time: '2025-12-22 14:30', status: 'verified' },
    { type: 'login', device: 'Chrome - Windows', location: 'الرياض', time: '2025-12-22 09:00', status: 'verified' },
    { type: 'password_change', device: 'Chrome - Windows', location: 'الرياض', time: '2025-12-20 16:45', status: 'verified' },
  ]

  const securitySettings = [
    { title: 'المصادقة الثنائية', status: 'مفعل', icon: '🔐' },
    { title: 'كلمة المرور القوية', status: 'مفعل', icon: '🔑' },
    { title: 'التحقق من البريد الإلكتروني', status: 'مفعل', icon: '📧' },
    { title: 'التحقق من رقم الهاتف', status: 'مفعل', icon: '📱' },
  ]

  const fraudAlerts = [
    { id: 1, title: 'محاولة دخول من موقع جديد', date: '2025-12-15', action: 'تم التحقق' },
    { id: 2, title: 'عملية شراء بقيمة كبيرة', date: '2025-12-10', action: 'تم التحقق' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🛡️ الأمان والحماية</h1>
          <p className="text-lg text-gray-600">حماية حسابك من الاحتيال والتهديدات</p>
        </div>

        {/* Security Score */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 mb-2">درجة الأمان</p>
              <h2 className="text-3xl font-bold text-gray-900">{securityStatus.status}</h2>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white">
                <span className="text-4xl font-bold">{securityStatus.overallScore}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">من 100</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-gray-600">آخر فحص</p>
              <p className="font-medium text-gray-900">{securityStatus.lastChecked}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-gray-600">التنبيهات النشطة</p>
              <p className="font-medium text-green-600">{securityStatus.alerts} تنبيهات</p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ إعدادات الأمان</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securitySettings.map((setting, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{setting.icon}</span>
                  <span className="font-medium text-gray-900">{setting.title}</span>
                </div>
                <span className="px-3 py-1 bg-green-200 text-green-700 rounded-full text-xs font-bold">
                  ✓ {setting.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 النشاط الأخير</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {activity.type === 'login' ? '🔓' : activity.type === 'purchase' ? '🛍️' : '🔑'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.type === 'login' ? 'دخول' : activity.type === 'purchase' ? 'عملية شراء' : 'تغيير كلمة المرور'}
                    </p>
                    <p className="text-sm text-gray-600">{activity.device} • {activity.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{activity.time}</p>
                  <p className="text-xs text-green-600 font-medium">✓ {activity.status === 'verified' ? 'تم التحقق' : 'قيد الانتظار'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud Alerts */}
        {fraudAlerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚠️ تنبيهات الأمان</h2>
            <div className="space-y-4">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.date}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-200 text-yellow-700 rounded-full text-xs font-bold">
                    {alert.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tips */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💡 نصائح الأمان</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'استخدم كلمة مرور قوية', desc: 'استخدم مزيجاً من الأحرف والأرقام والرموز' },
              { title: 'فعّل المصادقة الثنائية', desc: 'أضف طبقة أمان إضافية لحسابك' },
              { title: 'تحقق من النشاط بانتظام', desc: 'راجع سجل النشاط الخاص بك بشكل دوري' },
              { title: 'لا تشارك بيانات حسابك', desc: 'لا تخبر أحداً بكلمة المرور أو رموز التحقق' },
            ].map((tip, i) => (
              <div key={i} className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">✓ {tip.title}</h3>
                <p className="text-sm text-gray-600">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FraudDetectionPage

import React, { useState } from 'react'

const SupportTicketsPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  const tickets = [
    {
      id: 'TKT-2025-001',
      title: 'المنتج لم يصل بعد',
      category: 'الشحن',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2025-12-20',
      updatedAt: '2025-12-23',
      description: 'طلبت منتج ولم يصل حتى الآن',
      comments: 3
    },
    {
      id: 'TKT-2025-002',
      title: 'المنتج معيب',
      category: 'جودة المنتج',
      priority: 'high',
      status: 'resolved',
      createdAt: '2025-12-15',
      updatedAt: '2025-12-22',
      description: 'المنتج وصل معيب',
      comments: 5
    },
    {
      id: 'TKT-2025-003',
      title: 'استفسار عن الضمان',
      category: 'استفسارات عامة',
      priority: 'low',
      status: 'open',
      createdAt: '2025-12-10',
      updatedAt: '2025-12-23',
      description: 'هل المنتج مغطى بالضمان؟',
      comments: 2
    },
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'bg-blue-100 text-blue-700'
      case 'in_progress': return 'bg-yellow-100 text-yellow-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-orange-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'open': return 'مفتوح'
      case 'in_progress': return 'قيد المعالجة'
      case 'resolved': return 'مغلق'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎫 تذاكر الدعم</h1>
          <p className="text-lg text-gray-600">إدارة طلبات الدعم والاستفسارات</p>
        </div>

        {/* Create Ticket Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {showCreateForm ? '✕ إلغاء' : '+ إنشاء تذكرة جديدة'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">إنشاء تذكرة دعم جديدة</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الموضوع</label>
                <input
                  type="text"
                  placeholder="اكتب موضوع التذكرة"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الفئة</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>الشحن</option>
                  <option>جودة المنتج</option>
                  <option>الدفع</option>
                  <option>استفسارات عامة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الأولوية</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>منخفضة</option>
                  <option>متوسطة</option>
                  <option>عالية</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الوصف</label>
                <textarea
                  placeholder="اكتب تفاصيل المشكلة"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                إرسال التذكرة
              </button>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id.toString())}
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-600">{ticket.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{ticket.title}</h3>
                </div>
                <span className={`text-lg font-bold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority === 'high' ? '🔴' : ticket.priority === 'medium' ? '🟡' : '🟢'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">الفئة</p>
                  <p className="font-medium text-gray-900">{ticket.category}</p>
                </div>
                <div>
                  <p className="text-gray-600">تاريخ الإنشاء</p>
                  <p className="font-medium text-gray-900">{ticket.createdAt}</p>
                </div>
                <div>
                  <p className="text-gray-600">آخر تحديث</p>
                  <p className="font-medium text-gray-900">{ticket.updatedAt}</p>
                </div>
                <div>
                  <p className="text-gray-600">التعليقات</p>
                  <p className="font-medium text-gray-900">{ticket.comments}</p>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedTicket === ticket.id.toString() && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-gray-700 mb-4">{ticket.description}</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">آخر تعليق:</p>
                    <p className="text-sm text-gray-600">تم استقبال طلبك وجاري معالجته. سيتم التواصل معك قريباً.</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                    إضافة تعليق
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-2">إجمالي التذاكر</p>
            <p className="text-4xl font-bold text-gray-900">{tickets.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-2">مفتوحة</p>
            <p className="text-4xl font-bold text-blue-600">{tickets.filter(t => t.status === 'open').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-2">قيد المعالجة</p>
            <p className="text-4xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'in_progress').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-2">مغلقة</p>
            <p className="text-4xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportTicketsPage

// ============================================
// ⚖️ Disputes Dashboard - Dispute Resolution Center
// ============================================

import { useState } from 'react';

interface Dispute {
  id: string;
  caseNumber: string;
  buyer: string;
  seller: string;
  traveler?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'under_review' | 'resolved' | 'escalated' | 'cancelled';
  category: string;
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidenceCount: number;
}

interface DisputeStats {
  total: number;
  pending: number;
  underReview: number;
  resolved: number;
  escalated: number;
  averageResolutionTime: string;
  resolutionRate: number;
}

export function DisputesDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'analytics' | 'settings'>('overview');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const stats: DisputeStats = {
    total: 156,
    pending: 42,
    underReview: 23,
    resolved: 87,
    escalated: 4,
    averageResolutionTime: '2.3 days',
    resolutionRate: 85.7,
  };

  const disputes: Dispute[] = [
    {
      id: 'd1',
      caseNumber: 'DIS-2025-001',
      buyer: 'Ahmed Mohamed',
      seller: 'TechGadgets Inc.',
      traveler: 'Sarah Johnson',
      amount: 1200,
      currency: 'USD',
      status: 'pending',
      category: 'Item Not Received',
      createdAt: '2025-12-20',
      updatedAt: '2025-12-21',
      priority: 'high',
      evidenceCount: 3,
    },
    {
      id: 'd2',
      caseNumber: 'DIS-2025-002',
      buyer: 'Maria Garcia',
      seller: 'FashionHub',
      amount: 350,
      currency: 'USD',
      status: 'under_review',
      category: 'Item Not as Described',
      createdAt: '2025-12-19',
      updatedAt: '2025-12-21',
      priority: 'medium',
      evidenceCount: 5,
    },
    {
      id: 'd3',
      caseNumber: 'DIS-2025-003',
      buyer: 'John Smith',
      seller: 'ElectroWorld',
      traveler: 'Mike Chen',
      amount: 890,
      currency: 'USD',
      status: 'resolved',
      category: 'Damaged Item',
      createdAt: '2025-12-18',
      updatedAt: '2025-12-20',
      priority: 'medium',
      evidenceCount: 7,
    },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'queue' as const, label: 'Queue', icon: '📋', count: stats.pending },
    { id: 'analytics' as const, label: 'Analytics', icon: '📈' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️' },
  ];

  const getStatusBadge = (status: Dispute['status']) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      under_review: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      escalated: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return badges[status];
  };

  const getPriorityBadge = (priority: Dispute['priority']) => {
    const badges = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return badges[priority];
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution Center</h1>
                <p className="text-gray-600">Manage and resolve customer disputes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                Export Data
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg">
                New Case
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Disputes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-xl">⏰</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolution Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolutionRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Resolution Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageResolutionTime}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">⏱️</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {activeTab === 'queue' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Dispute Queue</h2>
                <div className="flex items-center gap-3">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>All Statuses</option>
                    <option>Pending</option>
                    <option>Under Review</option>
                    <option>Resolved</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search disputes..."
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600">Case #</th>
                      <th className="text-left py-3 font-medium text-gray-600">Parties</th>
                      <th className="text-left py-3 font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 font-medium text-gray-600">Priority</th>
                      <th className="text-left py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr key={dispute.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4">
                          <div className="font-mono text-sm text-gray-900">{dispute.caseNumber}</div>
                          <div className="text-xs text-gray-500">{dispute.createdAt}</div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm font-medium text-gray-900">{dispute.buyer}</div>
                          <div className="text-xs text-gray-500">vs {dispute.seller}</div>
                          {dispute.traveler && (
                            <div className="text-xs text-blue-600">Traveler: {dispute.traveler}</div>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(dispute.amount, dispute.currency)}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-gray-700">{dispute.category}</span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(dispute.status)}`}>
                            {dispute.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(dispute.priority)}`}>
                            {dispute.priority}
                          </span>
                        </td>
                        <td className="py-4">
                          <button 
                            onClick={() => setSelectedDispute(dispute)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Dispute Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Resolution Timeline</h3>
                  <div className="h-48 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Timeline chart will be displayed here</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Category Distribution</h3>
                  <div className="h-48 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Pie chart will be displayed here</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Dispute Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Automatic Escalation</h3>
                    <p className="text-sm text-gray-600">Automatically escalate disputes after 48 hours</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Send email updates for new disputes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">AI Recommendations</h3>
                    <p className="text-sm text-gray-600">Show AI-powered dispute resolution suggestions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Dispute Details</h2>
              <button 
                onClick={() => setSelectedDispute(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Case Information</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Case Number:</span> {selectedDispute.caseNumber}</p>
                  <p><span className="text-gray-600">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedDispute.status)}`}>
                      {selectedDispute.status.replace('_', ' ')}
                    </span>
                  </p>
                  <p><span className="text-gray-600">Priority:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getPriorityBadge(selectedDispute.priority)}`}>
                      {selectedDispute.priority}
                    </span>
                  </p>
                  <p><span className="text-gray-600">Category:</span> {selectedDispute.category}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Financial Details</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Amount:</span> 
                    {formatCurrency(selectedDispute.amount, selectedDispute.currency)}
                  </p>
                  <p><span className="text-gray-600">Evidence Count:</span> {selectedDispute.evidenceCount}</p>
                  <p><span className="text-gray-600">Created:</span> {selectedDispute.createdAt}</p>
                  <p><span className="text-gray-600">Updated:</span> {selectedDispute.updatedAt}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Review Evidence
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Resolve Case
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
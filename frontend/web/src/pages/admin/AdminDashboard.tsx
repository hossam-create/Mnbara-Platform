// ============================================
// 👑 Admin Dashboard - Complete Control Panel
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';

type AdminTab = 'overview' | 'users' | 'products' | 'orders' | 'auctions' | 'travelers' | 'kyc' | 'reports' | 'settings';

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalProducts: number;
  activeAuctions: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  revenueToday: number;
  activeTravelers: number;
  pendingKYC: number;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [dateRange, setDateRange] = useState('7d');

  const stats: DashboardStats = {
    totalUsers: 125430,
    newUsersToday: 342,
    totalProducts: 45670,
    activeAuctions: 1234,
    totalOrders: 89560,
    pendingOrders: 456,
    totalRevenue: 2450000,
    revenueToday: 45600,
    activeTravelers: 3450,
    pendingKYC: 89,
  };

  const recentUsers = [
    { id: 'u1', name: 'Ahmed Mohamed', email: 'ahmed@example.com', role: 'buyer', status: 'active', joined: '2025-12-07' },
    { id: 'u2', name: 'Sarah Williams', email: 'sarah@example.com', role: 'seller', status: 'active', joined: '2025-12-07' },
    { id: 'u3', name: 'Mike Johnson', email: 'mike@example.com', role: 'traveler', status: 'pending', joined: '2025-12-06' },
  ];

  const recentOrders = [
    { id: '#ORD-12345', customer: 'John Doe', product: 'iPhone 15 Pro', amount: 1199, status: 'processing', date: '2025-12-07' },
    { id: '#ORD-12344', customer: 'Jane Smith', product: 'MacBook Pro M3', amount: 2499, status: 'shipped', date: '2025-12-06' },
    { id: '#ORD-12343', customer: 'Bob Wilson', product: 'AirPods Pro', amount: 249, status: 'delivered', date: '2025-12-05' },
  ];

  const pendingKYC = [
    { id: 'k1', user: 'Ahmed Ali', email: 'ahmed.ali@example.com', level: 2, submitted: '2025-12-07 10:30', documents: 3 },
    { id: 'k2', user: 'Maria Garcia', email: 'maria@example.com', level: 3, submitted: '2025-12-07 09:15', documents: 4 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);
  };

  const tabs: { id: AdminTab; label: string; icon: string; count?: number }[] = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥', count: stats.newUsersToday },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '🛒', count: stats.pendingOrders },
    { id: 'auctions', label: 'Auctions', icon: '⚡', count: stats.activeAuctions },
    { id: 'travelers', label: 'Travelers', icon: '✈️' },
    { id: 'kyc', label: 'KYC Review', icon: '🔐', count: stats.pendingKYC },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      suspended: 'bg-red-100 text-red-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center font-bold text-white">
              M
            </div>
            <div>
              <h1 className="font-bold text-lg">Mnbara Admin</h1>
              <p className="text-gray-400 text-sm">Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 relative">
              🔔
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                A
              </div>
              <div className="hidden md:block">
                <div className="font-medium">Admin User</div>
                <div className="text-sm text-gray-400">Super Admin</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <nav className="bg-white rounded-2xl p-4 shadow-sm sticky top-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </span>
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                        👥
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalUsers)}</div>
                        <div className="text-gray-500 text-sm">Total Users</div>
                        <div className="text-green-500 text-xs">+{stats.newUsersToday} today</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                        💰
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
                        <div className="text-gray-500 text-sm">Total Revenue</div>
                        <div className="text-green-500 text-xs">+{formatCurrency(stats.revenueToday)} today</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                        🛒
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalOrders)}</div>
                        <div className="text-gray-500 text-sm">Total Orders</div>
                        <div className="text-yellow-500 text-xs">{stats.pendingOrders} pending</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                        ✈️
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.activeTravelers)}</div>
                        <div className="text-gray-500 text-sm">Active Travelers</div>
                        <div className="text-blue-500 text-xs">Online now: 234</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Center Quick Links */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Control Center</h3>
                  <p className="text-gray-600 mb-6">Quick access to advanced management modules</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a 
                      href="/admin/disputes"
                      className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all text-center"
                    >
                      <div className="text-2xl mb-2">⚖️</div>
                      <div className="font-medium">Disputes</div>
                      <div className="text-sm opacity-80">Resolution Center</div>
                    </a>
                    
                    <a 
                      href="/admin/analytics"
                      className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all text-center"
                    >
                      <div className="text-2xl mb-2">📊</div>
                      <div className="font-medium">Analytics</div>
                      <div className="text-sm opacity-80">Business Intelligence</div>
                    </a>
                    
                    <a 
                      href="/admin/feature-flags"
                      className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all text-center"
                    >
                      <div className="text-2xl mb-2">🚩</div>
                      <div className="font-medium">Feature Flags</div>
                      <div className="text-sm opacity-80">Release Management</div>
                    </a>
                    
                    <div className="p-4 bg-gray-100 rounded-xl text-center">
                      <div className="text-2xl mb-2">⚙️</div>
                      <div className="font-medium text-gray-600">More Modules</div>
                      <div className="text-sm text-gray-500">Coming Soon</div>
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-900">Revenue Overview</h3>
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-3 py-1 border rounded-lg text-sm"
                      >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                      </select>
                    </div>
                    <div className="h-64 flex items-end gap-2">
                      {[45, 62, 55, 78, 95, 82, 100].map((height, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-pink-500 to-indigo-500 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-gray-500">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Distribution */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">User Distribution</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Buyers', value: 65, color: 'bg-blue-500' },
                        { label: 'Sellers', value: 25, color: 'bg-green-500' },
                        { label: 'Travelers', value: 10, color: 'bg-purple-500' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{item.label}</span>
                            <span className="font-medium">{item.value}%</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all`}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Recent Orders</h3>
                      <button onClick={() => setActiveTab('orders')} className="text-pink-500 text-sm font-medium hover:underline">
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">📦</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{order.product}</div>
                            <div className="text-sm text-gray-500">{order.customer}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(order.amount)}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending KYC */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Pending KYC Verification</h3>
                      <button onClick={() => setActiveTab('kyc')} className="text-pink-500 text-sm font-medium hover:underline">
                        Review All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {pendingKYC.map((kyc) => (
                        <div key={kyc.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">🔐</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{kyc.user}</div>
                            <div className="text-sm text-gray-500">Level {kyc.level} • {kyc.documents} docs</div>
                          </div>
                          <button className="px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg hover:bg-pink-600">
                            Review
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                  <div className="flex gap-3">
                    <input
                      type="search"
                      placeholder="Search users..."
                      className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-pink-500"
                    />
                    <select className="px-4 py-2 border rounded-xl">
                      <option>All Roles</option>
                      <option>Buyers</option>
                      <option>Sellers</option>
                      <option>Travelers</option>
                    </select>
                    <button className="px-4 py-2 bg-pink-500 text-white rounded-xl font-medium">
                      + Add User
                    </button>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 text-gray-500 font-medium">User</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Role</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Joined</th>
                      <th className="text-right py-3 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 capitalize">{user.role}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 text-gray-600">{user.joined}</td>
                        <td className="py-4 text-right">
                          <button className="text-gray-400 hover:text-gray-600 mr-3">✏️</button>
                          <button className="text-gray-400 hover:text-red-500">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* KYC Review Tab */}
            {activeTab === 'kyc' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">KYC Verification Queue</h2>
                <div className="grid gap-4">
                  {pendingKYC.map((kyc) => (
                    <div key={kyc.id} className="border rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                            {kyc.user.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{kyc.user}</h3>
                            <p className="text-gray-500">{kyc.email}</p>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                              Level {kyc.level} Verification
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          Submitted: {kyc.submitted}
                        </div>
                      </div>
                      <div className="flex gap-4 mb-4">
                        {['🪪 ID Front', '🪪 ID Back', '🤳 Selfie', '📄 Address Proof'].slice(0, kyc.documents).map((doc, i) => (
                          <div key={i} className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            {doc}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600">
                          ✓ Approve
                        </button>
                        <button className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600">
                          ✗ Reject
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">
                          Request More Info
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Settings</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                      <input type="text" defaultValue="Mnbara" className="w-full px-4 py-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                      <input type="email" defaultValue="support@mnbara.com" className="w-full px-4 py-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                      <input type="number" defaultValue="5" className="w-full px-4 py-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                      <select className="w-full px-4 py-2 border rounded-xl">
                        <option>USD</option>
                        <option>EUR</option>
                        <option>EGP</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Feature Toggles</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Enable Auctions', enabled: true },
                      { label: 'Enable Traveler Delivery', enabled: true },
                      { label: 'Enable Wallet Payments', enabled: true },
                      { label: 'Require KYC for Sellers', enabled: true },
                      { label: 'Enable Push Notifications', enabled: false },
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <span className="font-medium">{feature.label}</span>
                        <button className={`w-12 h-6 rounded-full transition-colors ${
                          feature.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            feature.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Tabs Placeholder */}
            {['products', 'orders', 'auctions', 'travelers', 'reports'].includes(activeTab) && (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                <div className="text-6xl mb-4">{tabs.find(t => t.id === activeTab)?.icon}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">{activeTab} Management</h2>
                <p className="text-gray-500">This section is ready for implementation</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

// ============================================
// 👤 User Dashboard - Unified Profile
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile, UserStats, ActivityItem, Wallet } from '../../types/chat-wallet';

type DashboardSection = 'overview' | 'orders' | 'wishlist' | 'reviews' | 'settings';

export function UserDashboard() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  // Mock user data
  const user: UserProfile = {
    id: 'me',
    email: 'hossam@example.com',
    phone: '+20 100 123 4567',
    fullName: 'Hossam Elsefy',
    avatarUrl: '',
    role: 'hybrid',
    kycStatus: 'verified',
    kycLevel: 2,
    rating: 4.9,
    totalReviews: 128,
    memberSince: '2023-03-15',
    lastActive: new Date().toISOString(),
    isVerified: true,
    badges: [
      { id: 'b1', name: 'Trusted Seller', icon: '🏆', description: 'Completed 50+ sales', earnedAt: '2024-01-15' },
      { id: 'b2', name: 'Top Traveler', icon: '✈️', description: 'Completed 20+ deliveries', earnedAt: '2024-02-20' },
      { id: 'b3', name: 'Early Adopter', icon: '🌟', description: 'Joined in 2023', earnedAt: '2023-03-15' },
    ],
  };

  const wallet: Wallet = {
    id: 'w1',
    userId: 'me',
    balance: 2840.50,
    currency: 'USD',
    pendingBalance: 350.00,
    frozenBalance: 1200.00,
    totalEarnings: 8540.00,
    totalSpent: 3250.00,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const stats: UserStats = {
    totalOrders: 24,
    totalSpent: 3250,
    activeOrders: 3,
    totalProducts: 48,
    totalSales: 156,
    totalRevenue: 12580,
    pendingOrders: 8,
    totalTrips: 12,
    totalDeliveries: 45,
    totalEarnings: 2840,
    activeDeliveries: 3,
    rating: 4.9,
    reviewsCount: 128,
    responseRate: 98,
    responseTime: '< 1 hour',
  };

  const recentActivity: ActivityItem[] = [
    { id: 'a1', type: 'order_placed', title: 'Order Placed', description: 'iPhone 15 Pro - $1,199', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), icon: '🛒' },
    { id: 'a2', type: 'payment_received', title: 'Payment Received', description: 'Order #12345 - $120 earning', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), icon: '💰' },
    { id: 'a3', type: 'review_received', title: 'New Review', description: '⭐⭐⭐⭐⭐ "Excellent seller!"', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), icon: '⭐' },
    { id: 'a4', type: 'delivery_completed', title: 'Delivery Completed', description: 'Delivered MacBook to Cairo', timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), icon: '📦' },
  ];

  const recentOrders = [
    { id: '#12350', product: 'iPhone 15 Pro', date: '2025-12-05', status: 'processing', amount: 1199 },
    { id: '#12349', product: 'AirPods Pro', date: '2025-12-03', status: 'shipped', amount: 249 },
    { id: '#12348', product: 'Apple Watch', date: '2025-12-01', status: 'delivered', amount: 799 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const sections = [
    { id: 'overview' as DashboardSection, label: 'Overview', icon: '📊' },
    { id: 'orders' as DashboardSection, label: 'My Orders', icon: '📦' },
    { id: 'wishlist' as DashboardSection, label: 'Wishlist', icon: '❤️' },
    { id: 'reviews' as DashboardSection, label: 'Reviews', icon: '⭐' },
    { id: 'settings' as DashboardSection, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Profile Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              {user.isVerified && (
                <span className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow">
                  ✓
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
                {user.kycStatus === 'verified' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">KYC Verified</span>
                )}
              </div>
              <p className="text-gray-500 mb-3">{user.email} • Member since {new Date(user.memberSince).toLocaleDateString()}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <span key={badge.id} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                    <span>{badge.icon}</span>
                    <span className="font-medium">{badge.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Rating & Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                  {user.rating}
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-500">{user.totalReviews} reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.responseRate}%</div>
                <div className="text-sm text-gray-500">Response</div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex gap-4">
            <Link
              to="/seller"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              🏪 Seller Dashboard
            </Link>
            <Link
              to="/traveler"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              ✈️ Traveler Dashboard
            </Link>
            <Link
              to="/wallet"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              💰 Wallet
            </Link>
            <Link
              to="/chat"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              💬 Messages
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <nav className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-24">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Overview */}
            {activeSection === 'overview' && (
              <div className="space-y-8">
                {/* Wallet Card */}
                <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white/80">Wallet Balance</h2>
                    <Link to="/wallet" className="text-white/80 hover:text-white text-sm">View All →</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="text-3xl font-bold">{formatCurrency(wallet.balance)}</div>
                      <div className="text-white/60 text-sm">Available</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{formatCurrency(wallet.pendingBalance)}</div>
                      <div className="text-white/60 text-sm">Pending</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{formatCurrency(wallet.frozenBalance)}</div>
                      <div className="text-white/60 text-sm">In Escrow</div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
                    <div className="text-gray-500 text-sm">Orders</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
                    <div className="text-gray-500 text-sm">Products Listed</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</div>
                    <div className="text-gray-500 text-sm">Deliveries</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarnings || 0)}</div>
                    <div className="text-gray-500 text-sm">Total Earnings</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{activity.title}</div>
                          <div className="text-sm text-gray-500">{activity.description}</div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Orders */}
            {activeSection === 'orders' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                  <select className="px-4 py-2 border rounded-xl">
                    <option>All Orders</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                        📱
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{order.product}</div>
                        <div className="text-sm text-gray-500">Order {order.id} • {order.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(order.amount)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <button className="text-pink-500 hover:underline font-medium">View</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wishlist */}
            {activeSection === 'wishlist' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">My Wishlist</h2>
                <div className="text-center py-12 text-gray-500">
                  Your wishlist items will appear here
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeSection === 'reviews' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews</h2>
                <div className="text-center py-12 text-gray-500">
                  Reviews you've received and given
                </div>
              </div>
            )}

            {/* Settings */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" defaultValue={user.fullName} className="w-full px-4 py-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" defaultValue={user.email} className="w-full px-4 py-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" defaultValue={user.phone} className="w-full px-4 py-2 border rounded-xl" />
                    </div>
                    <button className="px-6 py-2 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Security</h2>
                  <button className="px-6 py-2 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;

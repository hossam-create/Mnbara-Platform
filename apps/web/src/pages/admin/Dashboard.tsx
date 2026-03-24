export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand-blue to-blue-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Mnbara Admin</h1>
        <p className="text-blue-100">
          Manage your marketplace content, monitor performance, and configure settings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">24,567</p>
              <p className="text-sm text-green-600 mt-1">+12% from last month</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">8,234</p>
              <p className="text-sm text-green-600 mt-1">+8% from last month</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$124,567</p>
              <p className="text-sm text-green-600 mt-1">+23% from last month</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Orders</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-red-600 mt-1">-3% from last month</p>
            </div>
            <div className="text-3xl">🛒</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-all text-left">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-medium text-gray-900">Manage CMS</h3>
            <p className="text-sm text-gray-500 mt-1">Update homepage content and sections</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-all text-left">
            <div className="text-2xl mb-2">📢</div>
            <h3 className="font-medium text-gray-900">Manage Ads</h3>
            <p className="text-sm text-gray-500 mt-1">Configure advertisements and promotions</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-all text-left">
            <div className="text-2xl mb-2">✈️</div>
            <h3 className="font-medium text-gray-900">Manage Travelers</h3>
            <p className="text-sm text-gray-500 mt-1">Handle traveler accounts and verifications</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-all text-left">
            <div className="text-2xl mb-2">🔨</div>
            <h3 className="font-medium text-gray-900">Manage Auctions</h3>
            <p className="text-sm text-gray-500 mt-1">Monitor and manage auction activities</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-all text-left">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-medium text-gray-900">Manage Finance</h3>
            <p className="text-sm text-gray-500 mt-1">View financial reports and transactions</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-all text-left">
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-medium text-gray-900">Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Configure platform settings and preferences</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">New product listing: iPhone 14 Pro Max</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">New user registration: John Doe</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Order #12345 completed</p>
              <p className="text-xs text-gray-500">10 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">CMS homepage updated</p>
              <p className="text-xs text-gray-500">15 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

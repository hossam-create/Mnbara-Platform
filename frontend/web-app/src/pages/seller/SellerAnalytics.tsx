import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

const SellerAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('30d')

  const stats = [
    { label: 'Total Revenue', value: '45,680 SAR', change: '+12.5%', positive: true, icon: CurrencyDollarIcon },
    { label: 'Total Orders', value: '156', change: '+8.2%', positive: true, icon: ShoppingBagIcon },
    { label: 'Page Views', value: '3,420', change: '+15.3%', positive: true, icon: EyeIcon },
    { label: 'Unique Visitors', value: '1,890', change: '-2.1%', positive: false, icon: UserGroupIcon }
  ]

  const topProducts = [
    { name: 'iPhone 15 Pro Max', sales: 45, revenue: 224955, views: 1250 },
    { name: 'MacBook Air M3', sales: 28, revenue: 153972, views: 890 },
    { name: 'AirPods Pro', sales: 67, revenue: 60233, views: 2100 },
    { name: 'iPad Pro 12.9"', sales: 12, revenue: 51588, views: 456 },
    { name: 'Apple Watch Ultra', sales: 8, revenue: 25592, views: 320 }
  ]

  const recentActivity = [
    { type: 'sale', message: 'iPhone 15 Pro sold to Ahmed M.', time: '2 hours ago', amount: 4999 },
    { type: 'view', message: 'MacBook Air M3 received 50 new views', time: '4 hours ago' },
    { type: 'review', message: 'New 5-star review on AirPods Pro', time: '6 hours ago' },
    { type: 'sale', message: 'Apple Watch Ultra sold to Sara K.', time: '1 day ago', amount: 3199 }
  ]

  return (
    <>
      <Helmet>
        <title>Analytics - Mnbara Seller</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track your store performance</p>
            </div>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.positive ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Placeholder */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Revenue Overview</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-center">
                  <div className="flex items-end justify-center gap-2 mb-4">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="w-8 bg-blue-500 rounded-t" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Revenue trend for the selected period</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'sale' ? 'bg-green-500' :
                      activity.type === 'view' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-semibold text-green-600">+{activity.amount} SAR</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Products</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Sales</th>
                    <th className="pb-3 font-medium">Revenue</th>
                    <th className="pb-3 font-medium">Views</th>
                    <th className="pb-3 font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {topProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td className="py-4 text-gray-600 dark:text-gray-400">{product.sales}</td>
                      <td className="py-4 text-gray-600 dark:text-gray-400">{product.revenue.toLocaleString()} SAR</td>
                      <td className="py-4 text-gray-600 dark:text-gray-400">{product.views.toLocaleString()}</td>
                      <td className="py-4">
                        <span className="text-green-600 font-medium">
                          {((product.sales / product.views) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SellerAnalytics

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  EyeIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalSales: number
  totalRevenue: number
  activeListings: number
  totalViews: number
  rating: number
  pendingOrders: number
}

interface RecentOrder {
  id: string
  product: string
  buyer: string
  amount: number
  status: 'pending' | 'shipped' | 'delivered'
  date: string
}

const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 156,
    totalRevenue: 45680,
    activeListings: 24,
    totalViews: 3420,
    rating: 4.8,
    pendingOrders: 5
  })

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([
    { id: 'ORD-001', product: 'iPhone 15 Pro', buyer: 'Ahmed M.', amount: 4999, status: 'pending', date: '2025-12-24' },
    { id: 'ORD-002', product: 'MacBook Air M3', buyer: 'Sara K.', amount: 5499, status: 'shipped', date: '2025-12-23' },
    { id: 'ORD-003', product: 'AirPods Pro', buyer: 'Mohammed A.', amount: 899, status: 'delivered', date: '2025-12-22' }
  ])

  const statCards = [
    { label: 'Total Revenue', value: `${stats.totalRevenue.toLocaleString()} SAR`, icon: CurrencyDollarIcon, change: '+12%', positive: true, color: 'blue' },
    { label: 'Total Sales', value: stats.totalSales, icon: ShoppingBagIcon, change: '+8%', positive: true, color: 'green' },
    { label: 'Active Listings', value: stats.activeListings, icon: ClockIcon, change: '+3', positive: true, color: 'purple' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: EyeIcon, change: '+15%', positive: true, color: 'orange' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Helmet>
        <title>Seller Dashboard - Mnbara</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your store overview.</p>
            </div>
            <Link
              to="/seller/listings/create"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              New Listing
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.positive ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
                <Link to="/seller/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{order.product}</p>
                        <p className="text-sm text-gray-500">{order.buyer} • {order.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{order.amount} SAR</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Rating */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Rating</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`w-6 h-6 ${i < Math.floor(stats.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rating}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Based on {stats.totalSales} reviews</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link to="/seller/listings" className="block w-full p-3 text-center bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                    Manage Listings
                  </Link>
                  <Link to="/seller/analytics" className="block w-full p-3 text-center bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                    View Analytics
                  </Link>
                  <Link to="/settings" className="block w-full p-3 text-center bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                    Store Settings
                  </Link>
                </div>
              </div>

              {stats.pendingOrders > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Action Required</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    You have {stats.pendingOrders} pending orders that need to be shipped.
                  </p>
                  <Link to="/seller/orders?status=pending" className="inline-block mt-3 text-yellow-800 dark:text-yellow-200 font-medium hover:underline">
                    View Pending Orders →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SellerDashboard

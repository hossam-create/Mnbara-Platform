import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface Listing {
  id: string
  title: string
  price: number
  image: string
  status: 'active' | 'draft' | 'sold' | 'expired'
  views: number
  createdAt: string
  stock: number
}

const MyListings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [listings] = useState<Listing[]>([
    { id: '1', title: 'iPhone 15 Pro Max 256GB', price: 4999, image: 'https://picsum.photos/200?1', status: 'active', views: 245, createdAt: '2025-12-20', stock: 5 },
    { id: '2', title: 'MacBook Air M3 15"', price: 5499, image: 'https://picsum.photos/200?2', status: 'active', views: 189, createdAt: '2025-12-18', stock: 3 },
    { id: '3', title: 'AirPods Pro 2nd Gen', price: 899, image: 'https://picsum.photos/200?3', status: 'sold', views: 567, createdAt: '2025-12-15', stock: 0 },
    { id: '4', title: 'iPad Pro 12.9"', price: 4299, image: 'https://picsum.photos/200?4', status: 'draft', views: 0, createdAt: '2025-12-24', stock: 2 },
    { id: '5', title: 'Apple Watch Ultra 2', price: 3199, image: 'https://picsum.photos/200?5', status: 'active', views: 98, createdAt: '2025-12-22', stock: 8 }
  ])

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      sold: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    }
    return styles[status] || styles.draft
  }

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    sold: listings.filter(l => l.status === 'sold').length,
    draft: listings.filter(l => l.status === 'draft').length
  }

  return (
    <>
      <Helmet>
        <title>My Listings - Mnbara</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Listings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your product listings</p>
            </div>
            <Link
              to="/seller/listings/create"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              New Listing
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, color: 'gray' },
              { label: 'Active', value: stats.active, color: 'green' },
              { label: 'Sold', value: stats.sold, color: 'blue' },
              { label: 'Drafts', value: stats.draft, color: 'yellow' }
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Listings Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Views</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredListings.map((listing, index) => (
                    <motion.tr
                      key={listing.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={listing.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{listing.title}</p>
                            <p className="text-sm text-gray-500">Created {listing.createdAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {listing.price.toLocaleString()} SAR
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {listing.stock}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(listing.status)}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {listing.views}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/seller/listings/${listing.id}/edit`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No listings found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default MyListings

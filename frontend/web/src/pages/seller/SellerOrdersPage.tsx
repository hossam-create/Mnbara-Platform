// ============================================
// 📦 Seller Orders Page - Complete Order Management
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { SellerOrdersTable } from '../../components/seller/SellerOrdersTable';
import { OrderDetailModal } from '../../components/seller/OrderDetailModal';
import type { SellerOrder } from '../../services/seller.service';
import type { OrderStatus } from '../../types';

// Filter types
interface OrderFilters {
  status: string;
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  deliveryMethod: string;
  escrowOnly: boolean;
}

// Mock data for development
const mockOrders: SellerOrder[] = [
  { 
    id: '1', 
    orderNumber: '12345', 
    buyerName: 'John D.', 
    buyerEmail: 'john@example.com', 
    productTitle: 'iPhone 15 Pro', 
    productImage: '', 
    total: 1199, 
    currency: 'USD', 
    status: 'pending', 
    paymentStatus: 'paid', 
    escrowStatus: 'held', 
    escrow: true, 
    deliveryMethod: 'courier', 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(), 
    buyer: {} as any, 
    seller: {} as any, 
    items: [{ id: '1', product: {} as any, quantity: 1, price: 1199, total: 1199 }], 
    subtotal: 1199, 
    deliveryFee: 0, 
    platformFee: 60, 
    shippingAddress: { 
      id: '1', 
      label: 'Home', 
      street: '123 Main St', 
      city: 'New York', 
      state: 'NY', 
      country: 'USA', 
      zipCode: '10001', 
      phone: '+1234567890', 
      isDefault: true 
    } 
  },
  { 
    id: '2', 
    orderNumber: '12344', 
    buyerName: 'Sarah M.', 
    buyerEmail: 'sarah@example.com', 
    productTitle: 'MacBook Air M3', 
    productImage: '', 
    total: 1299, 
    currency: 'USD', 
    status: 'shipped', 
    paymentStatus: 'paid', 
    escrowStatus: 'held', 
    escrow: false, 
    deliveryMethod: 'courier', 
    createdAt: new Date(Date.now() - 86400000).toISOString(), 
    updatedAt: new Date().toISOString(), 
    buyer: {} as any, 
    seller: {} as any, 
    items: [{ id: '2', product: {} as any, quantity: 1, price: 1299, total: 1299 }], 
    subtotal: 1299, 
    deliveryFee: 0, 
    platformFee: 65, 
    shippingAddress: { 
      id: '2', 
      label: 'Office', 
      street: '456 Oak Ave', 
      city: 'Los Angeles', 
      state: 'CA', 
      country: 'USA', 
      zipCode: '90001', 
      phone: '+1987654321', 
      isDefault: false 
    }, 
    trackingInfo: { 
      carrier: 'FedEx', 
      trackingNumber: 'FX123456789', 
      estimatedDelivery: '2024-01-20', 
      status: 'In Transit', 
      updates: [
        { timestamp: '2024-01-15 10:00', location: 'Los Angeles, CA', status: 'Shipped', description: 'Package picked up' },
        { timestamp: '2024-01-16 08:00', location: 'Phoenix, AZ', status: 'In Transit', description: 'Package in transit' },
      ] 
    } 
  },
  { 
    id: '3', 
    orderNumber: '12343', 
    buyerName: 'Ahmed K.', 
    buyerEmail: 'ahmed@example.com', 
    productTitle: 'AirPods Pro', 
    productImage: '', 
    total: 249, 
    currency: 'USD', 
    status: 'delivered', 
    paymentStatus: 'paid', 
    escrowStatus: 'released', 
    escrow: false, 
    deliveryMethod: 'courier', 
    createdAt: new Date(Date.now() - 172800000).toISOString(), 
    updatedAt: new Date().toISOString(), 
    buyer: {} as any, 
    seller: {} as any, 
    items: [{ id: '3', product: {} as any, quantity: 1, price: 249, total: 249 }], 
    subtotal: 249, 
    deliveryFee: 0, 
    platformFee: 12, 
    shippingAddress: { 
      id: '3', 
      label: 'Home', 
      street: '789 Pine Rd', 
      city: 'Chicago', 
      state: 'IL', 
      country: 'USA', 
      zipCode: '60601', 
      phone: '+1122334455', 
      isDefault: true 
    } 
  },
  { 
    id: '4', 
    orderNumber: '12342', 
    buyerName: 'Lisa W.', 
    buyerEmail: 'lisa@example.com', 
    productTitle: 'iPad Pro', 
    productImage: '', 
    total: 999, 
    currency: 'USD', 
    status: 'processing', 
    paymentStatus: 'paid', 
    escrowStatus: 'held', 
    escrow: true, 
    deliveryMethod: 'traveler', 
    createdAt: new Date(Date.now() - 259200000).toISOString(), 
    updatedAt: new Date().toISOString(), 
    buyer: {} as any, 
    seller: {} as any, 
    items: [{ id: '4', product: {} as any, quantity: 1, price: 999, total: 999 }], 
    subtotal: 999, 
    deliveryFee: 0, 
    platformFee: 50, 
    shippingAddress: { 
      id: '4', 
      label: 'Home', 
      street: '321 Elm St', 
      city: 'Houston', 
      state: 'TX', 
      country: 'USA', 
      zipCode: '77001', 
      phone: '+1555666777', 
      isDefault: true 
    } 
  },
  { 
    id: '5', 
    orderNumber: '12341', 
    buyerName: 'Mike R.', 
    buyerEmail: 'mike@example.com', 
    productTitle: 'Apple Watch Ultra', 
    productImage: '', 
    total: 799, 
    currency: 'USD', 
    status: 'confirmed', 
    paymentStatus: 'paid', 
    escrowStatus: 'held', 
    escrow: false, 
    deliveryMethod: 'courier', 
    createdAt: new Date(Date.now() - 345600000).toISOString(), 
    updatedAt: new Date().toISOString(), 
    buyer: {} as any, 
    seller: {} as any, 
    items: [{ id: '5', product: {} as any, quantity: 1, price: 799, total: 799 }], 
    subtotal: 799, 
    deliveryFee: 0, 
    platformFee: 40, 
    shippingAddress: { 
      id: '5', 
      label: 'Home', 
      street: '555 Maple Dr', 
      city: 'Seattle', 
      state: 'WA', 
      country: 'USA', 
      zipCode: '98101', 
      phone: '+1888999000', 
      isDefault: true 
    } 
  },
  { 
    id: '6', 
    orderNumber: '12340', 
    buyerName: 'Emma T.', 
    buyerEmail: 'emma@example.com', 
    productTitle: 'Samsung Galaxy S24', 
    productImage: '', 
    total: 899, 
    currency: 'USD', 
    status: 'cancelled', 
    paymentStatus: 'refunded', 
    escrowStatus: 'refunded', 
    escrow: false, 
    deliveryMethod: 'courier', 
    createdAt: new Date(Date.now() - 432000000).toISOString(), 
    updatedAt: new Date().toISOString(), 
    buyer: {} as any, 
    seller: {} as any, 
    items: [{ id: '6', product: {} as any, quantity: 1, price: 899, total: 899 }], 
    subtotal: 899, 
    deliveryFee: 0, 
    platformFee: 45, 
    shippingAddress: { 
      id: '6', 
      label: 'Home', 
      street: '777 Cedar Ln', 
      city: 'Miami', 
      state: 'FL', 
      country: 'USA', 
      zipCode: '33101', 
      phone: '+1999888777', 
      isDefault: true 
    } 
  },
];

export function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const pageSize = 10;

  // Advanced filters
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    search: '',
    dateRange: 'all',
    deliveryMethod: '',
    escrowOnly: false,
  });

  // Filter orders based on all criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (filters.status && order.status !== filters.status) return false;
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.buyerName.toLowerCase().includes(searchLower) ||
          order.buyerEmail.toLowerCase().includes(searchLower) ||
          order.productTitle.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        
        if (filters.dateRange === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (orderDate < today) return false;
        } else if (filters.dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < weekAgo) return false;
        } else if (filters.dateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (orderDate < monthAgo) return false;
        } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
          const start = new Date(filters.startDate);
          const end = new Date(filters.endDate);
          if (orderDate < start || orderDate > end) return false;
        }
      }
      
      // Delivery method filter
      if (filters.deliveryMethod && order.deliveryMethod !== filters.deliveryMethod) return false;
      
      // Escrow filter
      if (filters.escrowOnly && !order.escrow) return false;
      
      return true;
    });
  }, [orders, filters]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string, trackingNumber?: string, carrier?: string) => {
    setIsLoading(true);
    try {
      // In production: await sellerApi.updateOrderStatus(orderId, status, trackingNumber, carrier);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { 
              ...o, 
              status: status as OrderStatus, 
              updatedAt: new Date().toISOString(),
              trackingInfo: trackingNumber 
                ? { 
                    carrier: carrier || '', 
                    trackingNumber, 
                    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
                    status: 'Shipped', 
                    updates: [
                      { 
                        timestamp: new Date().toISOString(), 
                        location: 'Origin', 
                        status: 'Shipped', 
                        description: 'Package shipped' 
                      }
                    ] 
                  } 
                : o.trackingInfo 
            }
          : o
      ));
      
      // Update selected order if it's the one being modified
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { 
          ...prev, 
          status: status as OrderStatus,
          updatedAt: new Date().toISOString(),
          trackingInfo: trackingNumber 
            ? { 
                carrier: carrier || '', 
                trackingNumber, 
                estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
                status: 'Shipped', 
                updates: [
                  { 
                    timestamp: new Date().toISOString(), 
                    location: 'Origin', 
                    status: 'Shipped', 
                    description: 'Package shipped' 
                  }
                ] 
              } 
            : prev.trackingInfo 
        } : null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrder]);

  const handleGenerateLabel = useCallback(async (orderId: string) => {
    setIsLoading(true);
    try {
      // In production: const res = await sellerApi.generateShippingLabel(orderId);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // Create a mock shipping label PDF download
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // In production, this would be a real PDF from the API
        const labelContent = `
SHIPPING LABEL
==============
Order: #${order.orderNumber}
Date: ${new Date().toLocaleDateString()}

FROM:
MNBARA Seller
123 Warehouse St
Los Angeles, CA 90001

TO:
${order.buyerName}
${order.shippingAddress?.street || ''}
${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}
${order.shippingAddress?.country || ''}

TRACKING: ${order.trackingInfo?.trackingNumber || 'TBD'}
        `;
        
        // Create and download the label
        const blob = new Blob([labelContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shipping-label-${order.orderNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Update order with shipping label URL
        setOrders(prev => prev.map(o => 
          o.id === orderId 
            ? { ...o, shippingLabel: url }
            : o
        ));
      }
    } finally {
      setIsLoading(false);
    }
  }, [orders]);

  const handleBulkStatusUpdate = useCallback(async (status: string) => {
    if (selectedOrders.length === 0) return;
    
    setIsLoading(true);
    try {
      // In production: await Promise.all(selectedOrders.map(id => sellerApi.updateOrderStatus(id, status)));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOrders(prev => prev.map(o => 
        selectedOrders.includes(o.id) 
          ? { ...o, status: status as OrderStatus, updatedAt: new Date().toISOString() }
          : o
      ));
      setSelectedOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrders]);

  const handleExportOrders = useCallback(async (_format: 'csv' | 'excel') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate CSV content
      const headers = ['Order #', 'Date', 'Buyer', 'Product', 'Total', 'Status', 'Payment', 'Delivery Method'];
      const rows = filteredOrders.map(o => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString(),
        o.buyerName,
        o.productTitle,
        `$${o.total}`,
        o.status,
        o.paymentStatus,
        o.deliveryMethod,
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } finally {
      setIsLoading(false);
    }
  }, [filteredOrders]);

  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: '',
      search: '',
      dateRange: 'all',
      deliveryMethod: '',
      escrowOnly: false,
    });
    setCurrentPage(1);
  }, []);

  const handleSelectOrder = useCallback((orderId: string, selected: boolean) => {
    setSelectedOrders(prev => 
      selected 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedOrders(selected ? paginatedOrders.map(o => o.id) : []);
  }, [paginatedOrders]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped' || o.status === 'in_transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
  }), [orders]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.search) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.deliveryMethod) count++;
    if (filters.escrowOnly) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-500">Manage and fulfill your customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-pink-500 text-white text-xs font-bold rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{stats.processing}</div>
            <div className="text-sm text-blue-600">Processing</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-100">
            <div className="text-2xl font-bold text-purple-700">{stats.shipped}</div>
            <div className="text-sm text-purple-600">Shipped</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
            <div className="text-2xl font-bold text-green-700">{stats.delivered}</div>
            <div className="text-sm text-green-600">Delivered</div>
          </div>
          <div className="bg-gradient-to-r from-pink-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-pink-100">
            <div className="text-2xl font-bold text-pink-700">${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-pink-600">Revenue</div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
              <button
                onClick={handleClearFilters}
                className="text-sm text-pink-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as OrderFilters['dateRange'] }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                <select
                  value={filters.deliveryMethod}
                  onChange={(e) => setFilters(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">All Methods</option>
                  <option value="courier">Courier</option>
                  <option value="traveler">Traveler</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
              
              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </>
              )}
              
              {/* Escrow Only */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.escrowOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, escrowOnly: e.target.checked }))}
                    className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Escrow orders only</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-pink-700 font-medium">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedOrders([])}
                className="text-sm text-pink-600 hover:underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('confirmed')}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Confirm All
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('processing')}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                Mark Processing
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <SellerOrdersTable
          orders={paginatedOrders}
          totalCount={filteredOrders.length}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={setCurrentPage}
          onViewOrder={(order) => setSelectedOrder(order)}
          onUpdateStatus={handleUpdateOrderStatus}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          selectedOrders={selectedOrders}
          onSelectOrder={handleSelectOrder}
          onSelectAll={handleSelectAll}
        />

        {/* Order Detail Modal */}
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateOrderStatus}
            onGenerateLabel={handleGenerateLabel}
            isLoading={isLoading}
          />
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">Export Orders</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Export {filteredOrders.length} orders to a file
                </p>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={() => handleExportOrders('csv')}
                  disabled={isLoading}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                    📊
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">CSV Format</div>
                    <div className="text-sm text-gray-500">Compatible with Excel, Google Sheets</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExportOrders('excel')}
                  disabled={isLoading}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                    📑
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Excel Format</div>
                    <div className="text-sm text-gray-500">Native Excel spreadsheet</div>
                  </div>
                </button>
              </div>
              <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerOrdersPage;

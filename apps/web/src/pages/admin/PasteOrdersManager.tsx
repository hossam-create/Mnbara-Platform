import { useState, useEffect } from 'react';
import pasteOrdersService, { PasteOrder, PasteOrdersFilters } from '../../services/pasteOrdersService';
import travelersService from '../../services/travelersService';
import OrderCard from '../../components/admin/OrderCard';
import OrderEditor from '../../components/admin/OrderEditor';

export default function PasteOrdersManager() {
  const [orders, setOrders] = useState<PasteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PasteOrdersFilters>({
    status: 'all',
    source: 'all',
    assigned: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PasteOrder | null>(null);
  const [availableTravelers, setAvailableTravelers] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await pasteOrdersService.getOrders(filters);
      setOrders(response.orders);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await pasteOrdersService.getOrderStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleFilterChange = (newFilters: Partial<PasteOrdersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleUpdateStatus = async (orderId: string, status: PasteOrder['status'], notes?: string) => {
    try {
      await pasteOrdersService.updateStatus(orderId, status, notes);
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
        )
      );
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to update order status');
      console.error(err);
    }
  };

  const handleAssignTraveler = async (orderId: string, travelerId: string) => {
    try {
      await pasteOrdersService.assignTraveler(orderId, travelerId);
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'matched' as const, updatedAt: new Date().toISOString() }
            : order
        )
      );
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to assign traveler');
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      await pasteOrdersService.deleteOrder(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  const handleEditOrder = (order: PasteOrder) => {
    setEditingOrder(order);
    setShowEditor(true);
    loadAvailableTravelers(order.id);
  };

  const loadAvailableTravelers = async (orderId: string) => {
    try {
      const travelers = await pasteOrdersService.getAvailableTravelers(orderId);
      setAvailableTravelers(travelers);
    } catch (err) {
      console.error('Failed to load available travelers:', err);
    }
  };

  const handleSaveOrder = async (orderData: any) => {
    try {
      if (editingOrder) {
        const updatedOrder = await pasteOrdersService.updateOrder(editingOrder.id, orderData);
        setOrders(prev => 
          prev.map(order => order.id === editingOrder.id ? updatedOrder : order)
        );
      }
      setShowEditor(false);
      setEditingOrder(null);
      setAvailableTravelers([]);
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to save order');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'amazon':
        return '🛒';
      case 'aliexpress':
        return '🌍';
      case 'ebay':
        return '🏪';
      default:
        return '🔗';
    }
  };

  if (showEditor) {
    return (
      <OrderEditor
        order={editingOrder}
        availableTravelers={availableTravelers}
        onSave={handleSaveOrder}
        onCancel={() => {
          setShowEditor(false);
          setEditingOrder(null);
          setAvailableTravelers([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paste-Link Orders</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Requested</p>
                <p className="text-2xl font-bold text-blue-600">{stats.requested}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
              </div>
              <div className="text-3xl">✈️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="requested">Requested</option>
              <option value="matched">Matched</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange({ source: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="amazon">Amazon</option>
              <option value="aliexpress">AliExpress</option>
              <option value="ebay">eBay</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment
            </label>
            <select
              value={filters.assigned}
              onChange={(e) => handleFilterChange({ assigned: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="all">All Orders</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Search orders..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', source: 'all', assigned: 'all', search: '', page: 1, limit: 20 })}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <p className="text-gray-500">No paste-link orders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleUpdateStatus}
                onTravelerAssign={handleAssignTraveler}
                onEdit={() => handleEditOrder(order)}
                onDelete={() => handleDeleteOrder(order.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

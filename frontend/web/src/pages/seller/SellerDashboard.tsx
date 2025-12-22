// ============================================
// 🏪 Seller Dashboard - Manage Your Business
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { StatsCard } from '../../components/seller/StatsCard';
import { RecentOrdersTable } from '../../components/seller/RecentOrdersTable';
import { TopProductsList } from '../../components/seller/TopProductsList';
import { EarningsChart } from '../../components/seller/EarningsChart';
import { PendingActionsCard } from '../../components/seller/PendingActionsCard';
import { ListingForm } from '../../components/seller/ListingForm';
import { ListingsTable } from '../../components/seller/ListingsTable';
import { SellerOrdersTable } from '../../components/seller/SellerOrdersTable';
import { OrderDetailModal } from '../../components/seller/OrderDetailModal';
import SmartPricingWidget from '../../components/ai/SmartPricing';
import type {
  SellerStats,
  SellerListing,
  SellerOrder,
  SalesDataPoint,
  TopProduct,
  PendingAction,
  ListingFormData,
} from '../../services/seller.service';

type SellerTab = 'overview' | 'products' | 'orders' | 'auctions' | 'analytics' | 'settings';

// Mock data for development
const mockStats: SellerStats = {
  totalProducts: 48,
  activeListings: 42,
  totalOrders: 156,
  pendingOrders: 8,
  totalRevenue: 12580,
  thisMonthRevenue: 3240,
  avgRating: 4.8,
  views: 2840,
  conversionRate: 3.2,
};

const mockSalesData: SalesDataPoint[] = [
  { date: '2024-01-08', revenue: 1800, orders: 12 },
  { date: '2024-01-09', revenue: 2880, orders: 18 },
  { date: '2024-01-10', revenue: 2320, orders: 15 },
  { date: '2024-01-11', revenue: 3400, orders: 22 },
  { date: '2024-01-12', revenue: 2480, orders: 16 },
  { date: '2024-01-13', revenue: 3600, orders: 24 },
  { date: '2024-01-14', revenue: 2720, orders: 17 },
];

const mockTopProducts: TopProduct[] = [
  { id: '1', name: 'iPhone 15 Pro Max', sales: 45, revenue: 53955, image: '' },
  { id: '2', name: 'MacBook Pro M3', sales: 28, revenue: 69972, image: '' },
  { id: '3', name: 'Apple Watch Ultra', sales: 35, revenue: 27965, image: '' },
  { id: '4', name: 'AirPods Max', sales: 22, revenue: 12078, image: '' },
];

const mockPendingActions: PendingAction[] = [
  { id: '1', type: 'order_pending', title: 'New order #12345', description: 'iPhone 15 Pro - Awaiting confirmation', createdAt: new Date(Date.now() - 30 * 60000).toISOString(), priority: 'high' },
  { id: '2', type: 'question_pending', title: 'Customer question', description: 'Question about MacBook shipping', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), priority: 'medium' },
  { id: '3', type: 'review_pending', title: 'New review received', description: '5-star review on AirPods Pro', createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), priority: 'low' },
];

const mockOrders: SellerOrder[] = [
  { id: '1', orderNumber: '12345', buyerName: 'John D.', buyerEmail: 'john@example.com', productTitle: 'iPhone 15 Pro', productImage: '', total: 1199, currency: 'USD', status: 'pending', paymentStatus: 'paid', escrowStatus: 'held', escrow: true, deliveryMethod: 'courier', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), buyer: {} as any, seller: {} as any, items: [], subtotal: 1199, deliveryFee: 0, platformFee: 60, shippingAddress: { id: '1', label: 'Home', street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001', phone: '+1234567890', isDefault: true } },
  { id: '2', orderNumber: '12344', buyerName: 'Sarah M.', buyerEmail: 'sarah@example.com', productTitle: 'MacBook Air M3', productImage: '', total: 1299, currency: 'USD', status: 'shipped', paymentStatus: 'paid', escrowStatus: 'held', escrow: false, deliveryMethod: 'courier', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), buyer: {} as any, seller: {} as any, items: [], subtotal: 1299, deliveryFee: 0, platformFee: 65, shippingAddress: { id: '2', label: 'Office', street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'USA', zipCode: '90001', phone: '+1987654321', isDefault: false }, trackingInfo: { carrier: 'FedEx', trackingNumber: 'FX123456789', estimatedDelivery: '2024-01-20', status: 'In Transit', updates: [] } },
  { id: '3', orderNumber: '12343', buyerName: 'Ahmed K.', buyerEmail: 'ahmed@example.com', productTitle: 'AirPods Pro', productImage: '', total: 249, currency: 'USD', status: 'delivered', paymentStatus: 'paid', escrowStatus: 'released', escrow: false, deliveryMethod: 'courier', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString(), buyer: {} as any, seller: {} as any, items: [], subtotal: 249, deliveryFee: 0, platformFee: 12, shippingAddress: { id: '3', label: 'Home', street: '789 Pine Rd', city: 'Chicago', state: 'IL', country: 'USA', zipCode: '60601', phone: '+1122334455', isDefault: true } },
  { id: '4', orderNumber: '12342', buyerName: 'Lisa W.', buyerEmail: 'lisa@example.com', productTitle: 'iPad Pro', productImage: '', total: 999, currency: 'USD', status: 'processing', paymentStatus: 'paid', escrowStatus: 'held', escrow: true, deliveryMethod: 'traveler', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString(), buyer: {} as any, seller: {} as any, items: [], subtotal: 999, deliveryFee: 0, platformFee: 50, shippingAddress: { id: '4', label: 'Home', street: '321 Elm St', city: 'Houston', state: 'TX', country: 'USA', zipCode: '77001', phone: '+1555666777', isDefault: true } },
];

const mockListings: SellerListing[] = [
  { id: '1', productId: 'p1', title: 'iPhone 15 Pro Max 256GB', images: [], price: 1199, currency: 'USD', listingType: 'buy_now', condition: 'new', stock: 5, status: 'active', views: 1250, watchers: 45, createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', productId: 'p2', title: 'MacBook Pro 14" M3 Pro', images: [], price: 1999, currency: 'USD', listingType: 'buy_now', condition: 'new', stock: 3, status: 'active', views: 890, watchers: 32, createdAt: new Date(Date.now() - 1209600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', productId: 'p3', title: 'Vintage Rolex Submariner', images: [], price: 8500, currency: 'USD', listingType: 'auction', condition: 'used', stock: 1, status: 'active', views: 2100, watchers: 78, createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString(), startPrice: 5000, currentBid: 7200, bidsCount: 23, auctionEndTime: new Date(Date.now() + 172800000).toISOString() },
  { id: '4', productId: 'p4', title: 'Sony WH-1000XM5 Headphones', images: [], price: 349, currency: 'USD', listingType: 'buy_now', condition: 'open_box', stock: 0, status: 'sold', views: 560, watchers: 12, createdAt: new Date(Date.now() - 2592000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', productId: 'p5', title: 'Nintendo Switch OLED', images: [], price: 299, currency: 'USD', listingType: 'make_offer', condition: 'new', stock: 2, status: 'paused', views: 340, watchers: 8, createdAt: new Date(Date.now() - 1814400000).toISOString(), updatedAt: new Date().toISOString() },
];

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<SellerTab>('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [editingListing, setEditingListing] = useState<SellerListing | null>(null);

  // State for data
  const [stats] = useState<SellerStats>(mockStats);
  const [salesData] = useState<SalesDataPoint[]>(mockSalesData);
  const [topProducts] = useState<TopProduct[]>(mockTopProducts);
  const [pendingActions] = useState<PendingAction[]>(mockPendingActions);
  const [orders, setOrders] = useState<SellerOrder[]>(mockOrders);
  const [listings, setListings] = useState<SellerListing[]>(mockListings);

  // Pagination state
  const [ordersPage, setOrdersPage] = useState(1);
  const [listingsPage, setListingsPage] = useState(1);
  const pageSize = 10;

  const tabs = [
    { id: 'overview' as SellerTab, label: 'Overview', icon: '📊' },
    { id: 'products' as SellerTab, label: 'Products', icon: '📦' },
    { id: 'orders' as SellerTab, label: 'Orders', icon: '🛒' },
    { id: 'auctions' as SellerTab, label: 'Auctions', icon: '🔨' },
    { id: 'analytics' as SellerTab, label: 'Analytics', icon: '📈' },
    { id: 'settings' as SellerTab, label: 'Settings', icon: '⚙️' },
  ];

  // Fetch data on mount (using mock data for now)
  useEffect(() => {
    // In production, fetch from API:
    // const fetchData = async () => {
    //   const [statsRes, salesRes, topRes, actionsRes] = await Promise.all([
    //     sellerApi.getStats(),
    //     sellerApi.getSalesData('week'),
    //     sellerApi.getTopProducts(),
    //     sellerApi.getPendingActions(),
    //   ]);
    //   setStats(statsRes.data.data);
    //   setSalesData(salesRes.data.data);
    //   setTopProducts(topRes.data.data);
    //   setPendingActions(actionsRes.data.data);
    // };
    // fetchData();
  }, []);

  const handleSalesPeriodChange = useCallback(async (period: 'week' | 'month' | 'year') => {
    // In production: const res = await sellerApi.getSalesData(period);
    // setSalesData(res.data.data);
    console.log('Fetching sales data for period:', period);
  }, []);

  const handleViewOrder = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) setSelectedOrder(order);
  }, [orders]);

  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string, trackingNumber?: string, carrier?: string) => {
    setIsLoading(true);
    try {
      // In production: await sellerApi.updateOrderStatus(orderId, status, trackingNumber, carrier);
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: status as any, trackingInfo: trackingNumber ? { carrier: carrier || '', trackingNumber, estimatedDelivery: '', status: 'Shipped', updates: [] } : o.trackingInfo }
          : o
      ));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrder]);

  const handleGenerateLabel = useCallback(async (orderId: string) => {
    setIsLoading(true);
    try {
      // In production: const res = await sellerApi.generateShippingLabel(orderId);
      console.log('Generating shipping label for order:', orderId);
      alert('Shipping label generated! (Mock)');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateListing = useCallback(async (data: ListingFormData, isDraft: boolean) => {
    setIsLoading(true);
    try {
      // In production:
      // const imagesFormData = new FormData();
      // data.images.forEach(img => imagesFormData.append('images', img));
      // const imageUrls = await sellerApi.uploadImages(imagesFormData);
      // await sellerApi.createListing({ ...data, images: imageUrls.data.data });
      
      const newListing: SellerListing = {
        id: Date.now().toString(),
        productId: Date.now().toString(),
        title: data.title,
        images: [],
        price: data.price,
        currency: data.currency,
        listingType: data.listingType,
        condition: data.condition,
        stock: data.stock,
        status: isDraft ? 'draft' : 'active',
        views: 0,
        watchers: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startPrice: data.startPrice,
        reservePrice: data.reservePrice,
        buyNowPrice: data.buyNowPrice,
      };
      
      setListings(prev => [newListing, ...prev]);
      setShowAddProduct(false);
      setEditingListing(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditListing = useCallback((listing: SellerListing) => {
    setEditingListing(listing);
    setShowAddProduct(true);
  }, []);

  const handleDeleteListing = useCallback(async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    // In production: await sellerApi.deleteListing(listingId);
    setListings(prev => prev.filter(l => l.id !== listingId));
  }, []);

  const handlePauseListing = useCallback(async (listingId: string) => {
    // In production: await sellerApi.pauseListing(listingId);
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'paused' as const } : l));
  }, []);

  const handleActivateListing = useCallback(async (listingId: string) => {
    // In production: await sellerApi.activateListing(listingId);
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active' as const } : l));
  }, []);

  const handlePendingActionClick = useCallback((action: PendingAction) => {
    if (action.type === 'order_pending') {
      setActiveTab('orders');
    } else if (action.type === 'question_pending') {
      // Navigate to messages
    } else if (action.type === 'review_pending') {
      // Navigate to reviews
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-500">Manage your products and orders</p>
            </div>
            <button
              onClick={() => { setEditingListing(null); setShowAddProduct(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'orders' && stats.pendingOrders > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                    {stats.pendingOrders}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard icon="📦" label="Total Products" value={stats.totalProducts} bgColor="bg-pink-100" />
              <StatsCard icon="🛒" label="Total Orders" value={stats.totalOrders} change={12} changeLabel="vs last month" bgColor="bg-blue-100" />
              <StatsCard icon="💰" label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} change={8} bgColor="bg-green-100" />
              <StatsCard icon="⭐" label="Avg. Rating" value={stats.avgRating} bgColor="bg-yellow-100" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recent Orders */}
              <div className="lg:col-span-2">
                <RecentOrdersTable
                  orders={orders.slice(0, 5)}
                  pendingCount={stats.pendingOrders}
                  onViewOrder={handleViewOrder}
                  onViewAll={() => setActiveTab('orders')}
                />
              </div>

              {/* Pending Actions & Top Products */}
              <div className="space-y-6">
                <PendingActionsCard
                  actions={pendingActions}
                  onActionClick={handlePendingActionClick}
                />
                <TopProductsList
                  products={topProducts}
                  onViewProduct={(id) => console.log('View product:', id)}
                />
              </div>
            </div>

            {/* Revenue Chart */}
            <EarningsChart
              data={salesData}
              onPeriodChange={handleSalesPeriodChange}
            />
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <ListingsTable
            listings={listings}
            totalCount={listings.length}
            currentPage={listingsPage}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setListingsPage}
            onEdit={handleEditListing}
            onDelete={handleDeleteListing}
            onPause={handlePauseListing}
            onActivate={handleActivateListing}
            onSearch={(query) => console.log('Search:', query)}
            onStatusFilter={(status) => console.log('Filter:', status)}
          />
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <SellerOrdersTable
            orders={orders}
            totalCount={orders.length}
            currentPage={ordersPage}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setOrdersPage}
            onViewOrder={(order) => setSelectedOrder(order)}
            onUpdateStatus={handleUpdateOrderStatus}
            onSearch={(query) => console.log('Search orders:', query)}
            onStatusFilter={(status) => console.log('Filter orders:', status)}
          />
        )}

        {/* Auctions Tab */}
        {activeTab === 'auctions' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Auctions</h2>
            <ListingsTable
              listings={listings.filter(l => l.listingType === 'auction')}
              totalCount={listings.filter(l => l.listingType === 'auction').length}
              currentPage={1}
              pageSize={pageSize}
              onPageChange={() => {}}
              onEdit={handleEditListing}
              onDelete={handleDeleteListing}
              onPause={handlePauseListing}
              onActivate={handleActivateListing}
              onSearch={() => {}}
              onStatusFilter={() => {}}
            />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard icon="👁️" label="Total Views" value={stats.views} change={15} bgColor="bg-purple-100" />
              <StatsCard icon="📈" label="Conversion Rate" value={`${stats.conversionRate}%`} change={0.5} bgColor="bg-indigo-100" />
              <StatsCard icon="💵" label="This Month" value={`$${stats.thisMonthRevenue.toLocaleString()}`} change={22} bgColor="bg-green-100" />
              <StatsCard icon="📦" label="Active Listings" value={stats.activeListings} bgColor="bg-blue-100" />
            </div>
            <EarningsChart data={salesData} onPeriodChange={handleSalesPeriodChange} />
            <div className="grid lg:grid-cols-2 gap-6">
              <TopProductsList products={topProducts} />
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Tips</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-xl text-sm text-green-800">
                    ✅ Your response time is excellent (avg. 2 hours)
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-xl text-sm text-yellow-800">
                    💡 Add more photos to increase conversion by 25%
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                    📊 Consider running a promotion to boost sales
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Store Settings</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input type="text" defaultValue="My Awesome Store" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                <textarea rows={3} defaultValue="Premium electronics and accessories" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                <textarea rows={3} defaultValue="30-day returns accepted for unused items" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 resize-none" />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingListing ? 'Edit Listing' : 'Add New Product'}
              </h3>
              <button onClick={() => { setShowAddProduct(false); setEditingListing(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <ListingForm
                initialData={editingListing ? {
                  title: editingListing.title,
                  condition: editingListing.condition,
                  listingType: editingListing.listingType,
                  price: editingListing.price,
                  currency: editingListing.currency,
                  stock: editingListing.stock,
                  startPrice: editingListing.startPrice,
                  reservePrice: editingListing.reservePrice,
                  buyNowPrice: editingListing.buyNowPrice,
                } : undefined}
                onSubmit={handleCreateListing}
                onCancel={() => { setShowAddProduct(false); setEditingListing(null); }}
                isLoading={isLoading}
              />
              
              {/* AI Smart Pricing Widget */}
              <div className="mt-6 pt-6 border-t">
                <SmartPricingWidget currentPrice={999} category="Electronics" />
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default SellerDashboard;

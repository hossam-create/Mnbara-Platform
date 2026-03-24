import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../hooks/useAuth';

interface AvailableOrder {
  id: string;
  itemName: string;
  itemPrice: number;
  originCountry: string;
  deliveryCountry: string;
  buyerName: string;
  deadline: string;
  reward: number;
  urgency: 'low' | 'medium' | 'high';
  category: string;
  image?: string;
}

export default function AvailableOrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

  useEffect(() => {
    // Mock data for MVP
    const mockOrders: AvailableOrder[] = [
      {
        id: 'order-001',
        itemName: 'Colombian Coffee Beans',
        itemPrice: 29.99,
        originCountry: 'Colombia',
        deliveryCountry: 'US',
        buyerName: 'John D.',
        deadline: '2024-02-25',
        reward: 15.00,
        urgency: 'high',
        category: 'Food & Beverages',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4a0b0e?w=200'
      },
      {
        id: 'order-002',
        itemName: 'Swiss Chocolate',
        itemPrice: 45.50,
        originCountry: 'Switzerland',
        deliveryCountry: 'US',
        buyerName: 'Sarah M.',
        deadline: '2024-02-28',
        reward: 20.00,
        urgency: 'medium',
        category: 'Food & Beverages',
        image: 'https://images.unsplash.com/photo-1553452118-621e1f860f43?w=200'
      },
      {
        id: 'order-003',
        itemName: 'Italian Leather Bag',
        itemPrice: 199.99,
        originCountry: 'Italy',
        deliveryCountry: 'US',
        buyerName: 'Mike R.',
        deadline: '2024-03-01',
        reward: 40.00,
        urgency: 'low',
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200'
      },
      {
        id: 'order-004',
        itemName: 'Japanese Green Tea',
        itemPrice: 35.75,
        originCountry: 'Japan',
        deliveryCountry: 'US',
        buyerName: 'Lisa K.',
        deadline: '2024-02-26',
        reward: 18.00,
        urgency: 'high',
        category: 'Food & Beverages',
        image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200'
      },
      {
        id: 'order-005',
        itemName: 'French Perfume',
        itemPrice: 89.99,
        originCountry: 'France',
        deliveryCountry: 'US',
        buyerName: 'Emma L.',
        deadline: '2024-03-05',
        reward: 25.00,
        urgency: 'medium',
        category: 'Beauty & Personal Care',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200'
      }
    ];

    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  const acceptOrder = (orderId: string) => {
    // In a real app, this would call the API
    alert(`Order ${orderId} accepted! You'll receive further instructions.`);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'high-urgency') return order.urgency === 'high';
    if (filter === 'high-reward') return order.reward >= 25;
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === 'reward') {
      return b.reward - a.reward;
    }
    if (sortBy === 'price') {
      return b.itemPrice - a.itemPrice;
    }
    return 0;
  });

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Available Orders</h1>
            <p className="text-gray-600 mb-6">Please sign in to view available orders</p>
            <Link to="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available orders...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Orders</h1>
          <Link to="/traveler">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="all">All Orders</option>
              <option value="high-urgency">High Urgency</option>
              <option value="high-reward">High Reward (≥$25)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="deadline">Deadline (Soonest)</option>
              <option value="reward">Reward (Highest)</option>
              <option value="price">Item Price (Highest)</option>
            </select>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {order.image && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={order.image}
                    alt={order.itemName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{order.itemName}</h3>
                  <Badge className={getUrgencyColor(order.urgency)}>
                    {order.urgency.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{order.originCountry}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{order.deliveryCountry}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Buyer:</span>
                    <span className="font-medium">{order.buyerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">{order.deadline}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{order.category}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-lg font-bold text-brand-blue">${order.itemPrice}</div>
                    <div className="text-sm text-gray-600">Item Price</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">+${order.reward}</div>
                    <div className="text-sm text-gray-600">Your Reward</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {getDaysUntilDeadline(order.deadline)} days left
                  </div>
                  <Badge variant="outline">
                    {order.urgency === 'high' ? '🔥' : order.urgency === 'medium' ? '⚡' : '🕐'} 
                    {order.urgency}
                  </Badge>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => acceptOrder(order.id)}
                >
                  Accept Order
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {sortedOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No orders match your filters</div>
            <p className="text-gray-600 mb-4">Try adjusting your filter criteria or check back later.</p>
            <Button onClick={() => setFilter('all')}>
              Show All Orders
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
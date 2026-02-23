import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface AvailableOrder {
  id: string;
  itemName: string;
  itemPrice: number;
  originCountry: string;
  deliveryCountry: string;
  buyerName: string;
  deadline: string;
  reward: number;
}

interface MyTrip {
  id: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  status: 'planned' | 'active' | 'completed';
  earnings: number;
}

export default function TravelerDashboard() {
  const { isAuthenticated, user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [myTrips, setMyTrips] = useState<MyTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for MVP
    const mockAvailableOrders: AvailableOrder[] = [
      {
        id: 'order-001',
        itemName: 'Colombian Coffee Beans',
        itemPrice: 29.99,
        originCountry: 'Colombia',
        deliveryCountry: 'US',
        buyerName: 'John D.',
        deadline: '2024-02-25',
        reward: 15.00
      },
      {
        id: 'order-002',
        itemName: 'Swiss Chocolate',
        itemPrice: 45.50,
        originCountry: 'Switzerland',
        deliveryCountry: 'US',
        buyerName: 'Sarah M.',
        deadline: '2024-02-28',
        reward: 20.00
      },
      {
        id: 'order-003',
        itemName: 'Italian Leather Bag',
        itemPrice: 199.99,
        originCountry: 'Italy',
        deliveryCountry: 'US',
        buyerName: 'Mike R.',
        deadline: '2024-03-01',
        reward: 40.00
      }
    ];

    const mockMyTrips: MyTrip[] = [
      {
        id: 'trip-001',
        destination: 'Colombia',
        departureDate: '2024-02-20',
        returnDate: '2024-02-27',
        status: 'planned',
        earnings: 0
      },
      {
        id: 'trip-002',
        destination: 'Switzerland',
        departureDate: '2024-02-15',
        returnDate: '2024-02-22',
        status: 'active',
        earnings: 35.00
      }
    ];

    setTimeout(() => {
      setAvailableOrders(mockAvailableOrders);
      setMyTrips(mockMyTrips);
      setLoading(false);
    }, 1000);
  }, []);

  const acceptOrder = (orderId: string) => {
    // In a real app, this would call the API
    alert(`Order ${orderId} accepted! You'll receive further instructions.`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Traveler Dashboard</h1>
            <p className="text-gray-600 mb-6">Please sign in to access your traveler dashboard</p>
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
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Traveler Dashboard</h1>
          <div className="flex gap-3">
            <Link to="/traveler/create-trip">
              <Button>Create New Trip</Button>
            </Link>
            <Link to="/traveler/available-orders">
              <Button variant="outline">Browse All Orders</Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-blue">{availableOrders.length}</div>
              <div className="text-sm text-gray-600">Available Orders</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{myTrips.filter(t => t.status === 'active').length}</div>
              <div className="text-sm text-gray-600">Active Trips</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{myTrips.filter(t => t.status === 'planned').length}</div>
              <div className="text-sm text-gray-600">Planned Trips</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">${myTrips.reduce((sum, trip) => sum + trip.earnings, 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Orders */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Orders</h2>
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.itemName}</h3>
                      <p className="text-sm text-gray-600">From: {order.originCountry} → {order.deliveryCountry}</p>
                      <p className="text-sm text-gray-600">Buyer: {order.buyerName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-brand-blue">${order.itemPrice}</div>
                      <div className="text-sm text-green-600">+${order.reward} reward</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span>Deadline: {order.deadline}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => acceptOrder(order.id)}
                    >
                      Accept Order
                    </Button>
                  </div>
                </Card>
              ))}
              {availableOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No orders available at the moment.</p>
                  <p className="text-sm">Check back later or browse all orders.</p>
                </div>
              )}
            </div>
          </div>

          {/* My Trips */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Trips</h2>
            <div className="space-y-4">
              {myTrips.map((trip) => (
                <Card key={trip.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Trip to {trip.destination}</h3>
                      <p className="text-sm text-gray-600">
                        {trip.departureDate} - {trip.returnDate}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                  </div>
                  
                  {trip.earnings > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      Earnings: ${trip.earnings.toFixed(2)}
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {trip.status === 'planned' && (
                      <Button size="sm">
                        Start Trip
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
              {myTrips.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No trips planned yet.</p>
                  <Link to="/traveler/create-trip">
                    <Button className="mt-2">Create Your First Trip</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">🧳</div>
              <h3 className="font-medium text-gray-900 mb-2">Plan a Trip</h3>
              <p className="text-sm text-gray-600 mb-3">Add your travel plans and start earning</p>
              <Link to="/traveler/create-trip">
                <Button size="sm" className="w-full">Create Trip</Button>
              </Link>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">📦</div>
              <h3 className="font-medium text-gray-900 mb-2">Browse Orders</h3>
              <p className="text-sm text-gray-600 mb-3">Find items to deliver on your route</p>
              <Link to="/traveler/available-orders">
                <Button size="sm" className="w-full" variant="outline">Browse Orders</Button>
              </Link>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-medium text-gray-900 mb-2">Earnings</h3>
              <p className="text-sm text-gray-600 mb-3">Track your delivery earnings</p>
              <Button size="sm" className="w-full" variant="outline">View Earnings</Button>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
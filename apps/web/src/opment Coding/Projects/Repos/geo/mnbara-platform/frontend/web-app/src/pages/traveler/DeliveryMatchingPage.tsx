import React, { useState } from 'react';
import { Search, Filter, MapPin, Calendar, Package, Clock, DollarSign, Check, X } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const DeliveryMatchingPage: React.FC = () => {
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minWeight: '',
    maxWeight: ''
  });

  const deliveryRequests = [
    {
      id: '1',
      productId: 'PROD-123',
      productName: 'Electronics Package',
      weight: 2.5,
      price: 37.50,
      origin: 'Dubai, UAE',
      destination: 'London, UK',
      deadline: '2024-02-24',
      sender: 'John Doe',
      urgency: 'high' as const
    },
    {
      id: '2',
      productId: 'PROD-456',
      productName: 'Clothing Items',
      weight: 1.8,
      price: 27.00,
      origin: 'Dubai, UAE',
      destination: 'Paris, France',
      deadline: '2024-03-02',
      sender: 'Jane Smith',
      urgency: 'medium' as const
    },
    {
      id: '3',
      productId: 'PROD-789',
      productName: 'Books & Documents',
      weight: 0.5,
      price: 7.50,
      origin: 'Dubai, UAE',
      destination: 'Istanbul, Turkey',
      deadline: '2024-02-19',
      sender: 'Mike Johnson',
      urgency: 'low' as const
    }
  ];

  const myRoutes = [
    { id: 'R1', origin: 'Dubai, UAE', destination: 'London, UK', departureDate: '2024-02-25' },
    { id: 'R2', origin: 'Dubai, UAE', destination: 'Paris, France', departureDate: '2024-03-01' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Matching</h1>
          <p className="mt-2 text-gray-600">Find and accept delivery requests that match your routes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                <input
                  type="text"
                  value={filters.origin}
                  onChange={(e) => setFilters({...filters, origin: e.target.value})}
                  placeholder="City or country"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  value={filters.destination}
                  onChange={(e) => setFilters({...filters, destination: e.target.value})}
                  placeholder="City or country"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Weight</label>
                  <input
                    type="number"
                    value={filters.minWeight}
                    onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                    placeholder="kg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Weight</label>
                  <input
                    type="number"
                    value={filters.maxWeight}
                    onChange={(e) => setFilters({...filters, maxWeight: e.target.value})}
                    placeholder="kg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                Apply Filters
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Active Routes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRoutes.map((route) => (
                  <div key={route.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{route.origin}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{route.destination}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Departs: {new Date(route.departureDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Delivery Requests</h3>
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {deliveryRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{request.productName}</h4>
                        <p className="text-sm text-gray-500">Sender: {request.sender}</p>
                      </div>
                      <Badge 
                        variant={request.urgency === 'high' ? 'danger' : request.urgency === 'medium' ? 'warning' : 'secondary'} 
                        size="sm"
                      >
                        {request.urgency} urgency
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500">Weight</div>
                          <div className="font-medium text-gray-900">{request.weight}kg</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500">Offer</div>
                          <div className="font-medium text-green-600">${request.price.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500">Route</div>
                          <div className="font-medium text-gray-900 text-xs">{request.origin} → {request.destination}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500">Deadline</div>
                          <div className="font-medium text-gray-900 text-xs">{new Date(request.deadline).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMatchingPage;

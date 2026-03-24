import React from 'react';
import { Package, MapPin, DollarSign, Clock, CheckCircle, X, Check } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const TravelerOffersPage: React.FC = () => {
  const offers = [
    {
      id: '1',
      productId: 'PROD-123',
      productName: 'Electronics Package',
      weight: 2.5,
      price: 37.50,
      origin: 'Dubai, UAE',
      destination: 'London, UK',
      deadline: '2024-02-24',
      status: 'pending' as const
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
      status: 'accepted' as const
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
      status: 'completed' as const
    }
  ];

  const stats = [
    { label: 'Pending Offers', value: '1', color: 'bg-yellow-500' },
    { label: 'Accepted', value: '1', color: 'bg-green-500' },
    { label: 'Completed', value: '1', color: 'bg-blue-500' },
    { label: 'Total Earnings', value: '$72.00', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Offers</h1>
          <p className="mt-2 text-gray-600">View and manage delivery requests from senders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Pending Offers</h2>
          {offers.filter(o => o.status === 'pending').map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{offer.productName}</h3>
                  <p className="text-sm text-gray-500">Product ID: {offer.productId}</p>
                </div>
                <Badge variant="warning" size="md">Pending</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Weight</div>
                    <div className="font-medium text-gray-900">{offer.weight}kg</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Offer</div>
                    <div className="font-medium text-gray-900">${offer.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Route</div>
                    <div className="font-medium text-gray-900 text-xs">{offer.origin} → {offer.destination}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Deadline</div>
                    <div className="font-medium text-gray-900 text-xs">{new Date(offer.deadline).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Accept Offer
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          ))}

          <h2 className="text-lg font-semibold text-gray-900 mt-8">Accepted Offers</h2>
          {offers.filter(o => o.status === 'accepted').map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{offer.productName}</h3>
                  <p className="text-sm text-gray-500">Product ID: {offer.productId}</p>
                </div>
                <Badge variant="success" size="md">Accepted</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Weight</div>
                    <div className="font-medium text-gray-900">{offer.weight}kg</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Earnings</div>
                    <div className="font-medium text-green-600">${offer.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Route</div>
                    <div className="font-medium text-gray-900 text-xs">{offer.origin} → {offer.destination}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Deadline</div>
                    <div className="font-medium text-gray-900 text-xs">{new Date(offer.deadline).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Mark as Delivered
                </button>
                <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}

          <h2 className="text-lg font-semibold text-gray-900 mt-8">Completed Deliveries</h2>
          {offers.filter(o => o.status === 'completed').map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-75">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{offer.productName}</h3>
                  <p className="text-sm text-gray-500">Product ID: {offer.productId}</p>
                </div>
                <Badge variant="secondary" size="md">Completed</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Weight</div>
                    <div className="font-medium text-gray-900">{offer.weight}kg</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Earned</div>
                    <div className="font-medium text-green-600">${offer.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Route</div>
                    <div className="font-medium text-gray-900 text-xs">{offer.origin} → {offer.destination}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">Delivered</div>
                    <div className="font-medium text-gray-900 text-xs">{new Date(offer.deadline).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TravelerOffersPage;

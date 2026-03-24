import React from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, Package, Clock, ArrowLeft } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const RouteDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const route = {
    id,
    origin: 'Dubai, UAE',
    destination: 'London, UK',
    departureDate: '2024-02-25T10:00:00',
    arrivalDate: '2024-02-26T14:00:00',
    capacity: 20,
    usedCapacity: 15,
    pricePerKg: 15,
    status: 'active' as const,
    packages: [
      { id: '1', sender: 'John Doe', weight: 2, status: 'pending' },
      { id: '2', sender: 'Jane Smith', weight: 3, status: 'confirmed' },
      { id: '3', sender: 'Mike Johnson', weight: 1.5, status: 'delivered' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Routes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Route Details</h1>
                  <p className="text-gray-600 mt-1">Route ID: {route.id}</p>
                </div>
                <Badge variant={route.status === 'active' ? 'success' : 'secondary'} size="md" className="capitalize">
                  {route.status}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-yellow-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Route</div>
                    <div className="font-semibold text-gray-900">{route.origin} → {route.destination}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-500">Departure</div>
                      <div className="font-medium text-gray-900">
                        {new Date(route.departureDate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-500">Arrival</div>
                      <div className="font-medium text-gray-900">
                        {new Date(route.arrivalDate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Package className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-500">Capacity</div>
                      <div className="font-medium text-gray-900">
                        {route.usedCapacity}kg / {route.capacity}kg
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-500">Price per kg</div>
                      <div className="font-medium text-gray-900">${route.pricePerKg.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Packages on This Route</h2>
              <div className="space-y-3">
                {route.packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Package className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Package #{pkg.id}</div>
                        <div className="text-sm text-gray-600">Sender: {pkg.sender}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">{pkg.weight}kg</div>
                      {pkg.status === 'confirmed' && (
                        <Badge variant="success" size="sm">Confirmed</Badge>
                      )}
                      {pkg.status === 'pending' && (
                        <Badge variant="warning" size="sm">Pending</Badge>
                      )}
                      {pkg.status === 'delivered' && (
                        <Badge variant="secondary" size="sm">Delivered</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Packages</span>
                  <span className="font-medium text-gray-900">{route.packages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confirmed</span>
                  <span className="font-medium text-green-600">
                    {route.packages.filter(p => p.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-yellow-600">
                    {route.packages.filter(p => p.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivered</span>
                  <span className="font-medium text-gray-600">
                    {route.packages.filter(p => p.status === 'delivered').length}
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Estimated Earnings</span>
                  <span className="font-bold text-gray-900">
                    ${(route.usedCapacity * route.pricePerKg).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                  Add Package
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                  Edit Route
                </button>
                <button className="w-full px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                  Cancel Route
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailsPage;

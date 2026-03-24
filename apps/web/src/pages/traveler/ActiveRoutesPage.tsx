import React from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { RouteCard } from '../../components/traveler/RouteCard';
import { Badge } from '../../components/ui/badge';

const ActiveRoutesPage: React.FC = () => {
  const routes = [
    {
      id: '1',
      origin: 'Dubai, UAE',
      destination: 'London, UK',
      departureDate: '2024-02-25',
      arrivalDate: '2024-02-26',
      capacity: 20,
      usedCapacity: 15,
      pricePerKg: 15,
      status: 'active' as const
    },
    {
      id: '2',
      origin: 'London, UK',
      destination: 'Paris, France',
      departureDate: '2024-03-01',
      arrivalDate: '2024-03-02',
      capacity: 15,
      usedCapacity: 8,
      pricePerKg: 20,
      status: 'upcoming' as const
    },
    {
      id: '3',
      origin: 'Dubai, UAE',
      destination: 'Istanbul, Turkey',
      departureDate: '2024-02-20',
      arrivalDate: '2024-02-21',
      capacity: 25,
      usedCapacity: 25,
      pricePerKg: 12,
      status: 'completed' as const
    }
  ];

  const stats = [
    { label: 'Active Routes', value: '2', color: 'bg-yellow-500' },
    { label: 'Completed Trips', value: '156', color: 'bg-green-500' },
    { label: 'Total Earnings', value: '$12,450', color: 'bg-blue-500' },
    { label: 'Packages Delivered', value: '342', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Active Routes</h1>
              <p className="mt-2 text-gray-600">Manage your travel routes and deliveries</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
              <Plus className="w-5 h-5" />
              Create New Route
            </button>
          </div>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Routes</h2>
            <Badge variant="success" size="sm">2 Active</Badge>
          </div>

          {routes.filter(r => r.status === 'active').map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}

          <div className="flex items-center gap-2 mb-4 mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Routes</h2>
            <Badge variant="warning" size="sm">1 Upcoming</Badge>
          </div>

          {routes.filter(r => r.status === 'upcoming').map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}

          <div className="flex items-center gap-2 mb-4 mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Completed Routes</h2>
            <Badge variant="secondary" size="sm">1 Completed</Badge>
          </div>

          {routes.filter(r => r.status === 'completed').map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveRoutesPage;

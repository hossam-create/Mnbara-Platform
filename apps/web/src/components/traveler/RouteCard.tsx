import React from 'react';
import { Badge } from '../ui/badge';
import { MapPin, Clock, Package, ArrowRight } from 'lucide-react';

export interface RouteCardProps {
  route: {
    id: string;
    origin: string;
    destination: string;
    departureDate: string;
    arrivalDate: string;
    capacity: number;
    usedCapacity: number;
    pricePerKg: number;
    status: 'active' | 'completed' | 'upcoming';
  };
  onClick?: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, onClick }) => {
  const availableCapacity = route.capacity - route.usedCapacity;
  const capacityPercentage = (route.usedCapacity / route.capacity) * 100;
  
  const statusColors = {
    active: 'success',
    completed: 'secondary',
    upcoming: 'warning'
  } as const;

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={statusColors[route.status]} size="sm" className="capitalize">
              {route.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">{route.origin}</span>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">{route.destination}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Departure</div>
            <div className="font-medium">{new Date(route.departureDate).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Capacity</div>
            <div className="font-medium">
              {availableCapacity}kg / {route.capacity}kg
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Space Used</span>
          <span>{capacityPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full transition-all"
            style={{ width: `${capacityPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-500">Price:</span>
          <span className="font-semibold text-gray-900 ml-1">
            ${route.pricePerKg.toFixed(2)}/kg
          </span>
        </div>
        
        {availableCapacity > 0 && route.status === 'active' && (
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
            Request Delivery
          </button>
        )}
      </div>
    </div>
  );
};

export { RouteCard };

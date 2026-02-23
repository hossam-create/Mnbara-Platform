import React from 'react';
import { Badge } from '../ui/badge';
import { Star } from 'lucide-react';

export interface TravelerCardProps {
  traveler: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    totalTrips: number;
    onTimeDelivery: number;
    verified: boolean;
    activeRoutes?: number;
  };
  onClick?: () => void;
}

const TravelerCard: React.FC<TravelerCardProps> = ({ traveler, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl">
            {traveler.name.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{traveler.name}</h3>
            {traveler.verified && (
              <Badge variant="success" size="sm">Verified</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{traveler.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({traveler.totalTrips} trips)</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-medium">On-Time:</span> {traveler.onTimeDelivery}%
            </div>
            {traveler.activeRoutes !== undefined && (
              <div>
                <span className="font-medium">Active Routes:</span> {traveler.activeRoutes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { TravelerCard };

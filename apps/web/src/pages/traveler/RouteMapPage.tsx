import React from 'react';
import { MapPin, Plus, Layers, Maximize2, Navigation } from 'lucide-react';

const RouteMapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Route Map</h1>
            <p className="text-sm text-gray-600">Visualize your travel routes</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Route
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto text-blue-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Map View</h3>
              <p className="text-gray-500 mb-4">
                This view would integrate with a mapping service like Google Maps or Mapbox
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <Layers className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-sm font-medium text-gray-900">Layer Control</div>
                  <div className="text-xs text-gray-500">Toggle route layers</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <Maximize2 className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-sm font-medium text-gray-900">Fullscreen</div>
                  <div className="text-xs text-gray-500">Expand map view</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <Navigation className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-sm font-medium text-gray-900">Navigation</div>
                  <div className="text-xs text-gray-500">Route directions</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <MapPin className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-sm font-medium text-gray-900">Markers</div>
                  <div className="text-xs text-gray-500">Custom markers</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-64">
            <h3 className="font-semibold text-gray-900 mb-3">Active Routes</h3>
            <div className="space-y-2">
              <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                <div className="text-sm font-medium text-gray-900">Dubai → London</div>
                <div className="text-xs text-gray-600">Feb 25, 2024</div>
              </div>
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">Dubai → Paris</div>
                <div className="text-xs text-gray-600">Mar 1, 2024</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Map Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500" />
                <span className="text-gray-600">Active Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-gray-400" />
                <span className="text-gray-600">Planned Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-600">Origin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-600">Destination</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapPage;

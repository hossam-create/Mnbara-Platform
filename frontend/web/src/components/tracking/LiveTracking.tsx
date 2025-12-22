// ============================================
// 📍 Live Tracking Component - Like Uber
// ============================================

import { useState, useEffect } from 'react';
import type { LiveTracking, TrackingEvent } from '../../types/advanced-features';

interface LiveTrackingProps {
  orderId: string;
}

export function LiveTrackingComponent({ orderId }: LiveTrackingProps) {
  const [tracking, setTracking] = useState<LiveTracking | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Mock data
  useEffect(() => {
    setTracking({
      orderId,
      deliveryId: 'd123',
      status: 'in_transit',
      traveler: {
        id: 't1',
        name: 'Omar Ahmed',
        avatar: '',
        rating: 4.9,
        phone: '+20 100 123 4567',
        isAnonymous: false,
      },
      currentLocation: {
        lat: 30.0444,
        lon: 31.2357,
        address: 'Tahrir Square, Cairo',
        timestamp: new Date().toISOString(),
      },
      route: [
        { type: 'origin', location: { lat: 30.1, lon: 31.3, timestamp: '' }, name: 'Seller Location', icon: '📦' },
        { type: 'current', location: { lat: 30.0444, lon: 31.2357, timestamp: '' }, name: 'Current Position', icon: '🚗' },
        { type: 'destination', location: { lat: 30.05, lon: 31.24, timestamp: '' }, name: 'Your Address', icon: '🏠' },
      ],
      estimatedArrival: '15 minutes',
      distance: { total: 12.5, remaining: 3.2, unit: 'km' },
      timeline: [
        { id: 'e1', status: 'pending_pickup', message: 'Order confirmed', timestamp: '2025-12-07T08:00:00Z' },
        { id: 'e2', status: 'picked_up', message: 'Package picked up from seller', location: 'Cairo, Egypt', timestamp: '2025-12-07T10:30:00Z' },
        { id: 'e3', status: 'in_transit', message: 'On the way to you', location: 'Tahrir Square', timestamp: '2025-12-07T11:15:00Z' },
      ],
    });
  }, [orderId]);

  if (!tracking) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_pickup: 'bg-yellow-500',
      picked_up: 'bg-blue-500',
      in_transit: 'bg-purple-500',
      nearby: 'bg-orange-500',
      arrived: 'bg-green-500',
      delivered: 'bg-green-600',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending_pickup: 'Waiting for pickup',
      picked_up: 'Picked up',
      in_transit: 'On the way',
      nearby: 'Almost there!',
      arrived: 'Arrived',
      delivered: 'Delivered',
    };
    return texts[status] || status;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Map Section */}
      <div className="relative h-72 bg-gradient-to-br from-blue-100 to-indigo-100">
        {/* Simulated Map */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Route Line */}
            <svg className="absolute inset-0 w-full h-full">
              <path
                d="M 80 200 Q 150 150 200 140 Q 250 130 300 160"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                strokeDasharray="8 4"
                fill="none"
              />
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>

            {/* Origin Marker */}
            <div className="absolute bottom-16 left-16 transform -translate-x-1/2">
              <div className="text-3xl animate-bounce">📦</div>
              <div className="text-xs bg-white px-2 py-1 rounded shadow mt-1">Origin</div>
            </div>

            {/* Current Location (Animated) */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-pink-500/30 rounded-full animate-ping" />
                <div className="relative text-4xl">🚗</div>
              </div>
              <div className="text-xs bg-pink-500 text-white px-2 py-1 rounded shadow mt-1 text-center">
                Traveler
              </div>
            </div>

            {/* Destination Marker */}
            <div className="absolute bottom-12 right-16 transform -translate-x-1/2">
              <div className="text-3xl">🏠</div>
              <div className="text-xs bg-white px-2 py-1 rounded shadow mt-1">You</div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className={`${getStatusColor(tracking.status)} text-white px-4 py-2 rounded-full font-bold flex items-center gap-2`}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {getStatusText(tracking.status)}
          </div>
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full font-bold text-gray-900">
            🕐 {tracking.estimatedArrival}
          </div>
        </div>
      </div>

      {/* Traveler Info */}
      {tracking.traveler && !tracking.traveler.isAnonymous && (
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
              {tracking.traveler.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">{tracking.traveler.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>⭐ {tracking.traveler.rating}</span>
                <span>•</span>
                <span>Verified Traveler ✓</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                📞
              </button>
              <button className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors">
                💬
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anonymous Delivery Info */}
      {tracking.traveler?.isAnonymous && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-2xl">
              🛡️
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Fulfillment by Mnbara</h3>
              <p className="text-sm text-gray-600">Anonymous delivery • Protected by Mnbara</p>
            </div>
          </div>
        </div>
      )}

      {/* Distance Progress */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Distance</span>
          <span className="font-bold">{tracking.distance.remaining} {tracking.distance.unit} remaining</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((tracking.distance.total - tracking.distance.remaining) / tracking.distance.total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>📦 Origin</span>
          <span>🏠 Destination</span>
        </div>
      </div>

      {/* Timeline Toggle */}
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">📋 Delivery Timeline</span>
        <span className={`transform transition-transform ${showTimeline ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Timeline */}
      {showTimeline && (
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {tracking.timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    index === tracking.timeline.length - 1
                      ? 'bg-pink-500'
                      : 'bg-green-500'
                  }`} />
                  {index < tracking.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="font-medium text-gray-900">{event.message}</div>
                  {event.location && (
                    <div className="text-sm text-gray-500">📍 {event.location}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveTrackingComponent;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  DollarSign,
  Shield,
  Truck,
  Star
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  type: 'payment_initiated' | 'payment_confirmed' | 'escrow_funded' | 'delivery_confirmed' | 'quality_verified' | 'escrow_released' | 'payout_processed' | 'dispute_opened' | 'dispute_resolved' | 'error';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  currency?: string;
  metadata?: any;
  details?: {
    label: string;
    value: string;
  }[];
  actions?: {
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }[];
}

export interface PaymentTimelineProps {
  events: TimelineEvent[];
  currentStep?: number;
  showDetails?: boolean;
  interactive?: boolean;
  className?: string;
}

const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ 
  events, 
  currentStep = 0, 
  showDetails = true,
  interactive = true,
  className = '' 
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const getEventIcon = (type: TimelineEvent['type'], status: TimelineEvent['status']) => {
    const baseClasses = "w-5 h-5";
    
    switch (status) {
      case 'completed':
        return <CheckCircle className={`${baseClasses} text-green-600`} />;
      case 'processing':
        return <Loader2 className={`${baseClasses} text-blue-600 animate-spin`} />;
      case 'failed':
        return <XCircle className={`${baseClasses} text-red-600`} />;
      case 'cancelled':
        return <XCircle className={`${baseClasses} text-gray-600`} />;
      default:
        return <Clock className={`${baseClasses} text-yellow-600`} />;
    }
  };

  const getEventColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'cancelled':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const getStatusBadge = (status: TimelineEvent['status']) => {
    const variants = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' }
    };

    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const isEventExpanded = (eventId: string) => expandedEvents.has(eventId);

  return (
    <div className={`space-y-4 ${className}`}>
      {events.map((event, index) => {
        const isActive = index === currentStep;
        const isPast = index < currentStep;
        const isFuture = index > currentStep;
        const expanded = isEventExpanded(event.id);

        return (
          <div key={event.id} className="relative">
            {/* Timeline Line */}
            {index < events.length - 1 && (
              <div 
                className={`absolute left-6 top-12 w-0.5 h-full transition-colors duration-300 ${
                  isPast ? 'bg-green-300' : isFuture ? 'bg-gray-200' : 'bg-blue-300'
                }`}
              />
            )}

            {/* Event Card */}
            <div className={`relative flex gap-4 p-4 rounded-lg border-2 transition-all duration-300 ${
              getEventColor(event.status)
            } ${isActive ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}>
              
              {/* Event Icon */}
              <div className="flex-shrink-0 mt-1">
                {getEventIcon(event.type, event.status)}
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {getStatusBadge(event.status)}
                    
                    {event.amount && (
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <DollarSign className="w-4 h-4" />
                        <span>{event.amount} {event.currency}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>{formatTimestamp(event.timestamp).date}</span>
                  <span>•</span>
                  <span>{formatTimestamp(event.timestamp).time}</span>
                </div>

                {/* Expandable Details */}
                {showDetails && (event.details || event.metadata) && (
                  <div className="border-t border-gray-200 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEventExpansion(event.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {expanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span>{expanded ? 'Hide Details' : 'Show Details'}</span>
                    </Button>

                    {expanded && (
                      <div className="mt-3 space-y-3">
                        {event.details && event.details.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700">Details</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {event.details.map((detail, detailIndex) => (
                                <div key={detailIndex} className="flex justify-between">
                                  <span className="text-xs text-gray-500">{detail.label}:</span>
                                  <span className="text-xs font-medium text-gray-900">{detail.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.metadata && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700">Additional Information</h5>
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                              <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {interactive && event.actions && event.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {event.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.action}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export interface CompactTimelineProps {
  events: TimelineEvent[];
  maxEvents?: number;
  className?: string;
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({ 
  events, 
  maxEvents = 5,
  className = '' 
}) => {
  const displayEvents = events.slice(0, maxEvents);
  const hasMore = events.length > maxEvents;

  return (
    <div className={`space-y-3 ${className}`}>
      {displayEvents.map((event, index) => (
        <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            {event.status === 'completed' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : event.status === 'processing' ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : event.status === 'failed' ? (
              <XCircle className="w-4 h-4 text-red-600" />
            ) : (
              <Clock className="w-4 h-4 text-yellow-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h5 className="text-sm font-medium text-gray-900 truncate">{event.title}</h5>
              <Badge variant="outline" className="text-xs">
                {event.status}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 truncate">{event.description}</p>
          </div>
        </div>
      ))}
      
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View {events.length - maxEvents} more events
          </Button>
        </div>
      )}
    </div>
  );
};

export interface TimelineStatsProps {
  events: TimelineEvent[];
  className?: string;
}

export const TimelineStats: React.FC<TimelineStatsProps> = ({ events, className = '' }) => {
  const stats = {
    total: events.length,
    completed: events.filter(e => e.status === 'completed').length,
    processing: events.filter(e => e.status === 'processing').length,
    failed: events.filter(e => e.status === 'failed').length,
    pending: events.filter(e => e.status === 'pending').length,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Events</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        <div className="text-sm text-gray-600">Completed</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
        <div className="text-sm text-gray-600">Processing</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        <div className="text-sm text-gray-600">Failed</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{completionRate.toFixed(1)}%</div>
        <div className="text-sm text-gray-600">Success Rate</div>
      </div>
    </div>
  );
};

export default PaymentTimeline;

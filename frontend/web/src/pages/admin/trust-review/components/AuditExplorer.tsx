// ============================================
// 📊 Audit Explorer Module
// Advanced filtering and immutable audit log view
// ============================================

import { useState, useEffect } from 'react';
import axios from 'axios';

interface AuditEvent {
  id: string;
  type: 'kyc_decision' | 'dispute_decision' | 'login' | 'logout' | 'access_denied' | 'system_event' | 'admin_action';
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  
  // Actor information
  actor: {
    id: string;
    name: string;
    role: string;
    ipAddress: string;
    userAgent: string;
  };
  
  // Event details
  action: string;
  description: string;
  
  // Target information
  target?: {
    type: 'user' | 'transaction' | 'dispute' | 'kyc_application' | 'system';
    id: string;
    name: string;
  };
  
  // Additional metadata
  metadata: {
    decision?: string;
    reason?: string;
    amount?: number;
    currency?: string;
    oldStatus?: string;
    newStatus?: string;
    durationMs?: number;
    errorCode?: string;
  };
  
  // System information
  service: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  
  // Immutable verification
  hash: string;
  previousHash?: string;
  signature: string;
}

interface AuditFilters {
  type?: string;
  severity?: string;
  actor?: string;
  target?: string;
  service?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  environment?: string;
}

export function AuditExplorer() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  const fetchAuditEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/admin/audit/events');
      setAuditEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
      setError('Failed to load audit events. Using demo data.');
      // Fallback to mock data if API fails
      setAuditEvents(getMockAuditEvents());
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data fallback - immutable audit events
  const getMockAuditEvents = (): AuditEvent[] => [
    {
      id: 'audit-001',
      type: 'kyc_decision',
      severity: 'info',
      timestamp: '2025-12-21T10:30:00Z',
      actor: {
        id: 'admin-001',
        name: 'Admin User',
        role: 'lead_reviewer',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      action: 'KYC_APPROVED',
      description: 'Approved KYC application for Ahmed Mohamed',
      target: {
        type: 'kyc_application',
        id: 'kyc-001',
        name: 'Ahmed Mohamed KYC'
      },
      metadata: {
        decision: 'approve',
        reason: 'Documents verified successfully',
        riskLevel: 'low'
      },
      service: 'admin-service',
      version: '1.2.3',
      environment: 'production',
      hash: 'abc123def456',
      signature: 'sig-001'
    },
    {
      id: 'audit-002',
      type: 'dispute_decision',
      severity: 'info',
      timestamp: '2025-12-21T11:15:00Z',
      actor: {
        id: 'admin-002',
        name: 'Review Manager',
        role: 'emergency_admin',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      action: 'DISPUTE_RESOLVED',
      description: 'Resolved dispute CASE-2025-001 with partial refund',
      target: {
        type: 'dispute',
        id: 'disp-001',
        name: 'CASE-2025-001'
      },
      metadata: {
        decision: 'split',
        refundAmount: 150.00,
        currency: 'USD',
        reason: 'Evidence supports partial refund'
      },
      service: 'dispute-service',
      version: '1.1.0',
      environment: 'production',
      hash: 'def456ghi789',
      previousHash: 'abc123def456',
      signature: 'sig-002'
    },
    {
      id: 'audit-003',
      type: 'login',
      severity: 'info',
      timestamp: '2025-12-21T09:00:00Z',
      actor: {
        id: 'admin-001',
        name: 'Admin User',
        role: 'lead_reviewer',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      action: 'USER_LOGIN',
      description: 'Successful admin login with MFA',
      metadata: {
        durationMs: 1200
      },
      service: 'auth-service',
      version: '2.0.1',
      environment: 'production',
      hash: 'ghi789jkl012',
      previousHash: 'def456ghi789',
      signature: 'sig-003'
    },
    {
      id: 'audit-004',
      type: 'access_denied',
      severity: 'warning',
      timestamp: '2025-12-21T14:20:00Z',
      actor: {
        id: 'admin-003',
        name: 'Junior Reviewer',
        role: 'reviewer',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
      },
      action: 'ACCESS_DENIED',
      description: 'Attempted to access emergency admin functions',
      target: {
        type: 'system',
        id: 'admin-panel',
        name: 'Emergency Admin Functions'
      },
      metadata: {
        errorCode: 'ACCESS_DENIED_INSUFFICIENT_ROLE'
      },
      service: 'admin-service',
      version: '1.2.3',
      environment: 'production',
      hash: 'jkl012mno345',
      previousHash: 'ghi789jkl012',
      signature: 'sig-004'
    },
    {
      id: 'audit-005',
      type: 'system_event',
      severity: 'error',
      timestamp: '2025-12-21T16:45:00Z',
      actor: {
        id: 'system',
        name: 'System',
        role: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'System/1.0'
      },
      action: 'DATABASE_CONNECTION_ERROR',
      description: 'Temporary database connection failure',
      metadata: {
        errorCode: 'DB_CONN_001',
        durationMs: 5000
      },
      service: 'database-service',
      version: '3.0.0',
      environment: 'production',
      hash: 'mno345pqr678',
      previousHash: 'jkl012mno345',
      signature: 'sig-005'
    }
  ];

  const refreshAuditEvents = () => {
    fetchAuditEvents();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'error': return 'bg-orange-100 text-orange-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'kyc_decision': return '🔐';
      case 'dispute_decision': return '⚖️';
      case 'login': return '🔑';
      case 'logout': return '🚪';
      case 'access_denied': return '🚫';
      case 'system_event': return '⚙️';
      case 'admin_action': return '👤';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredEvents = auditEvents.filter(event => {
    if (filters.type && event.type !== filters.type) return false;
    if (filters.severity && event.severity !== filters.severity) return false;
    if (filters.service && event.service !== filters.service) return false;
    if (filters.environment && event.environment !== filters.environment) return false;
    if (filters.actor) {
      const searchTerm = filters.actor.toLowerCase();
      if (!event.actor.name.toLowerCase().includes(searchTerm) && 
          !event.actor.id.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    if (filters.target && event.target) {
      const searchTerm = filters.target.toLowerCase();
      if (!event.target.name.toLowerCase().includes(searchTerm) && 
          !event.target.id.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!event.action.toLowerCase().includes(searchTerm) &&
          !event.description.toLowerCase().includes(searchTerm) &&
          !event.actor.name.toLowerCase().includes(searchTerm) &&
          !(event.target?.name.toLowerCase().includes(searchTerm))) {
        return false;
      }
    }
    if (filters.dateRange) {
      const eventDate = new Date(event.timestamp);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (eventDate < startDate || eventDate > endDate) return false;
    }
    return true;
  });

  const exportAuditLog = () => {
    const data = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Audit Log Explorer</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={exportAuditLog}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Export JSON
            </button>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'table' | 'timeline')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="table">Table View</option>
              <option value="timeline">Timeline View</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({...filters, type: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="kyc_decision">KYC Decisions</option>
              <option value="dispute_decision">Dispute Decisions</option>
              <option value="login">Logins</option>
              <option value="logout">Logouts</option>
              <option value="access_denied">Access Denied</option>
              <option value="system_event">System Events</option>
              <option value="admin_action">Admin Actions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={filters.severity || ''}
              onChange={(e) => setFilters({...filters, severity: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <select
              value={filters.service || ''}
              onChange={(e) => setFilters({...filters, service: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Services</option>
              <option value="admin-service">Admin Service</option>
              <option value="dispute-service">Dispute Service</option>
              <option value="auth-service">Auth Service</option>
              <option value="database-service">Database Service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search events..."
              value={filters.search || ''}
              onChange={(e) => setFilters({...filters, search: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-blue-600">
                {isLoading ? '...' : filteredEvents.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredEvents.filter(e => e.severity === 'critical').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🔥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredEvents.filter(e => e.severity === 'warning').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredEvents.filter(e => {
                  const eventDate = new Date(e.timestamp);
                  const today = new Date();
                  return eventDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit events...</p>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-yellow-600 text-lg mr-2">⚠️</span>
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Audit Events</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {filteredEvents.length} events found
              </span>
              <button
                onClick={refreshAuditEvents}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(event.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.action}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{event.actor.name}</div>
                      <div className="text-gray-500">{event.actor.role}</div>
                      <div className="text-xs text-gray-400">{event.actor.ipAddress}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.target ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{event.target.name}</div>
                        <div className="text-gray-500 capitalize">{event.target.type}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(event.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit events found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Audit Event Details</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event ID</label>
                    <p className="mt-1 text-sm font-mono text-gray-900">{selectedEvent.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type & Action</label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(selectedEvent.type)}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedEvent.action}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedEvent.timestamp)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <span className={`mt-1 inline-block text-xs px-2 py-1 rounded-full ${getSeverityColor(selectedEvent.severity)}`}>
                      {selectedEvent.severity}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actor</label>
                    <div className="mt-1 text-sm">
                      <div className="font-medium text-gray-900">{selectedEvent.actor.name}</div>
                      <div className="text-gray-500">{selectedEvent.actor.role}</div>
                      <div className="text-xs text-gray-400">IP: {selectedEvent.actor.ipAddress}</div>
                      <div className="text-xs text-gray-400">ID: {selectedEvent.actor.id}</div>
                    </div>
                  </div>

                  {selectedEvent.target && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Target</label>
                      <div className="mt-1 text-sm">
                        <div className="font-medium text-gray-900">{selectedEvent.target.name}</div>
                        <div className="text-gray-500 capitalize">{selectedEvent.target.type}</div>
                        <div className="text-xs text-gray-400">ID: {selectedEvent.target.id}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedEvent.service} v{selectedEvent.version} ({selectedEvent.environment})
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verification</label>
                    <div className="mt-1 text-xs font-mono text-gray-600 space-y-1">
                      <div>Hash: {selectedEvent.hash}</div>
                      {selectedEvent.previousHash && (
                        <div>Prev: {selectedEvent.previousHash}</div>
                      )}
                      <div>Sig: {selectedEvent.signature}</div>
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(selectedEvent.metadata).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Metadata</h4>
                  <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
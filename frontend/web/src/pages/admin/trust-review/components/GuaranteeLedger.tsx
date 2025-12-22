// ============================================
// 💰 Guarantee Ledger Module
// Read-only view of deposits, forfeitures, and resolutions
// ============================================

import { useState } from 'react';

interface GuaranteeTransaction {
  id: string;
  type: 'deposit' | 'forfeiture' | 'resolution' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  amount: number;
  currency: string;
  createdAt: string;
  completedAt?: string;
  
  // Transaction details
  referenceId: string;
  description: string;
  
  // Parties involved
  payer: {
    id: string;
    name: string;
    type: 'buyer' | 'seller' | 'traveler' | 'system';
  };
  
  payee: {
    id: string;
    name: string;
    type: 'buyer' | 'seller' | 'traveler' | 'system';
  };
  
  // Related entities
  relatedDispute?: {
    id: string;
    caseNumber: string;
    type: string;
  };
  
  relatedTransaction?: {
    id: string;
    amount: number;
    description: string;
  };
  
  // Audit info
  processedBy: string;
  auditId: string;
}

interface LedgerFilters {
  type?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minAmount?: number;
  maxAmount?: number;
  party?: string;
}

export function GuaranteeLedger() {
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [selectedTransaction, setSelectedTransaction] = useState<GuaranteeTransaction | null>(null);

  // Mock data - read-only ledger entries
  const ledgerEntries: GuaranteeTransaction[] = [
    {
      id: 'gtx-001',
      type: 'deposit',
      status: 'completed',
      amount: 299.99,
      currency: 'USD',
      createdAt: '2025-12-15T10:00:00Z',
      completedAt: '2025-12-15T10:02:30Z',
      referenceId: 'DEP-2025-001',
      description: 'Purchase guarantee deposit for Wireless Headphones',
      payer: {
        id: 'user-123',
        name: 'Ahmed Mohamed',
        type: 'buyer'
      },
      payee: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      processedBy: 'system-auto',
      auditId: 'audit-001'
    },
    {
      id: 'gtx-002',
      type: 'forfeiture',
      status: 'completed',
      amount: 299.99,
      currency: 'USD',
      createdAt: '2025-12-18T14:30:00Z',
      completedAt: '2025-12-18T14:35:00Z',
      referenceId: 'FORF-2025-001',
      description: 'Guarantee forfeiture - Item not received dispute',
      payer: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      payee: {
        id: 'user-456',
        name: 'Electronics Store',
        type: 'seller'
      },
      relatedDispute: {
        id: 'disp-001',
        caseNumber: 'CASE-2025-001',
        type: 'item_not_received'
      },
      processedBy: 'admin-001',
      auditId: 'audit-002'
    },
    {
      id: 'gtx-003',
      type: 'resolution',
      status: 'completed',
      amount: 150.00,
      currency: 'USD',
      createdAt: '2025-12-19T11:20:00Z',
      completedAt: '2025-12-19T11:25:00Z',
      referenceId: 'RES-2025-001',
      description: 'Partial refund - Split decision dispute resolution',
      payer: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      payee: {
        id: 'user-123',
        name: 'Ahmed Mohamed',
        type: 'buyer'
      },
      relatedDispute: {
        id: 'disp-002',
        caseNumber: 'CASE-2025-002',
        type: 'item_not_as_described'
      },
      processedBy: 'admin-002',
      auditId: 'audit-003'
    },
    {
      id: 'gtx-004',
      type: 'refund',
      status: 'completed',
      amount: 299.99,
      currency: 'USD',
      createdAt: '2025-12-20T09:15:00Z',
      completedAt: '2025-12-20T09:18:00Z',
      referenceId: 'REF-2025-001',
      description: 'Full refund - Seller cancellation',
      payer: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      payee: {
        id: 'user-123',
        name: 'Ahmed Mohamed',
        type: 'buyer'
      },
      processedBy: 'system-auto',
      auditId: 'audit-004'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-blue-100 text-blue-700';
      case 'forfeiture': return 'bg-red-100 text-red-700';
      case 'resolution': return 'bg-green-100 text-green-700';
      case 'refund': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'reversed': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEntries = ledgerEntries.filter(entry => {
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.minAmount && entry.amount < filters.minAmount) return false;
    if (filters.maxAmount && entry.amount > filters.maxAmount) return false;
    if (filters.party) {
      const searchTerm = filters.party.toLowerCase();
      if (!entry.payer.name.toLowerCase().includes(searchTerm) && 
          !entry.payee.name.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    if (filters.dateRange) {
      const entryDate = new Date(entry.createdAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (entryDate < startDate || entryDate > endDate) return false;
    }
    return true;
  });

  const totals = filteredEntries.reduce((acc, entry) => {
    if (entry.status === 'completed') {
      if (entry.type === 'deposit') acc.deposits += entry.amount;
      if (entry.type === 'forfeiture') acc.forfeitures += entry.amount;
      if (entry.type === 'resolution') acc.resolutions += entry.amount;
      if (entry.type === 'refund') acc.refunds += entry.amount;
    }
    return acc;
  }, { deposits: 0, forfeitures: 0, resolutions: 0, refunds: 0 });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deposits</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totals.deposits)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Forfeitures</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.forfeitures)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚖️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resolutions Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.resolutions)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Refunds Issued</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totals.refunds)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">↩️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ledger Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({...filters, type: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="forfeiture">Forfeitures</option>
              <option value="resolution">Resolutions</option>
              <option value="refund">Refunds</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={filters.minAmount || ''}
              onChange={(e) => setFilters({...filters, minAmount: e.target.value ? parseFloat(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Party</label>
            <input
              type="text"
              placeholder="Search by name"
              value={filters.party || ''}
              onChange={(e) => setFilters({...filters, party: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Guarantee Ledger</h3>
            <span className="text-sm text-gray-500">
              {filteredEntries.length} entries
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {entry.referenceId}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {entry.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {entry.payer.name} → {entry.payee.name}
                      </div>
                      <div className="text-gray-500">
                        {entry.payer.type} → {entry.payee.type}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(entry.amount, entry.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedTransaction(entry)}
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

        {filteredEntries.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching entries</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.referenceId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.type}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                  {selectedTransaction.completedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Completed</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTransaction.completedAt)}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payer</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.payer.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{selectedTransaction.payer.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payee</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.payee.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{selectedTransaction.payee.type}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Processed By</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.processedBy}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Audit ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedTransaction.auditId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
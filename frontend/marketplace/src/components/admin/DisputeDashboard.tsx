// ============================================
// Admin Dispute Dashboard Component
// ============================================

'use client';

import { useState } from 'react';
import { useAllDisputes, useDisputeStats, useMarkUnderReview, useResolveDispute, useCloseDispute, getStatusColor, getReasonLabel, getResolutionLabel } from '../../hooks/useDisputes';
import { Dispute, DisputeStatus, DisputeResolution, AdminDisputeStats } from '../../types/dispute.types';

interface DisputeDashboardProps {
  initialFilters?: {
    status?: DisputeStatus;
    reason?: string;
    offset?: number;
    limit?: number;
  };
}

export default function DisputeDashboard({ initialFilters }: DisputeDashboardProps) {
  const [filters, setFilters] = useState(initialFilters || {});
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const { data: disputesData, isLoading: disputesLoading } = useAllDisputes(filters as any);
  const { data: statsData, isLoading: statsLoading } = useDisputeStats();
  const markUnderReview = useMarkUnderReview();
  const resolveDispute = useResolveDispute();
  const closeDispute = useCloseDispute();

  const stats = statsData?.disputes;
  const resolutions = statsData?.resolutions;

  const handleMarkReview = async (disputeId: string) => {
    try {
      await markUnderReview.mutateAsync(disputeId);
    } catch (error) {
      console.error('Failed to mark under review:', error);
    }
  };

  const handleResolve = async (resolution: string, percentage?: number, notes?: string) => {
    if (!selectedDispute) return;
    try {
      await resolveDispute.mutateAsync({
        disputeId: selectedDispute.id,
        resolution,
        resolutionPercentage: percentage,
        adminNotes: notes
      });
      setShowResolveModal(false);
      setSelectedDispute(null);
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    }
  };

  const handleClose = async (disputeId: string) => {
    try {
      await closeDispute.mutateAsync(disputeId);
    } catch (error) {
      console.error('Failed to close dispute:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dispute Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Disputes"
          value={stats?.total || 0}
          color="blue"
        />
        <StatCard
          title="Open"
          value={stats?.open || 0}
          color="yellow"
        />
        <StatCard
          title="Under Review"
          value={stats?.underReview || 0}
          color="blue"
        />
        <StatCard
          title="Resolved"
          value={stats?.resolved || 0}
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="border rounded px-3 py-2"
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as DisputeStatus || undefined })}
        >
          <option value="">All Status</option>
          <option value={DisputeStatus.OPEN}>Open</option>
          <option value={DisputeStatus.UNDER_REVIEW}>Under Review</option>
          <option value={DisputeStatus.RESOLVED}>Resolved</option>
          <option value={DisputeStatus.CLOSED}>Closed</option>
        </select>
      </div>

      {/* Disputes Table */}
      {disputesLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Request</th>
                <th className="px-4 py-2 text-left">Opened By</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Opened</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputesData?.disputes.map((dispute) => (
                <tr
                  key={dispute.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <td className="px-4 py-2">{dispute.id.slice(0, 8)}...</td>
                  <td className="px-4 py-2">#{dispute.requestId}</td>
                  <td className="px-4 py-2">{dispute.openedBy}</td>
                  <td className="px-4 py-2">{getReasonLabel(dispute.reason)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm bg-${getStatusColor(dispute.status)}-100`}>
                      {dispute.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(dispute.openedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {dispute.status === DisputeStatus.OPEN && (
                      <button
                        className="text-blue-600 hover:underline mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkReview(dispute.id);
                        }}
                      >
                        Review
                      </button>
                    )}
                    {dispute.status === DisputeStatus.UNDER_REVIEW && (
                      <button
                        className="text-green-600 hover:underline mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDispute(dispute);
                          setShowResolveModal(true);
                        }}
                      >
                        Resolve
                      </button>
                    )}
                    {dispute.status === DisputeStatus.RESOLVED && (
                      <button
                        className="text-gray-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose(dispute.id);
                        }}
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {disputesData && disputesData.total > disputesData.limit && (
        <div className="flex justify-between items-center mt-4">
          <span>
            Showing {disputesData.offset + 1} - {Math.min(disputesData.offset + disputesData.limit, disputesData.total)} of {disputesData.total}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={disputesData.offset === 0}
              onClick={() => setFilters({ ...filters, offset: disputesData.offset - disputesData.limit })}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={disputesData.offset + disputesData.limit >= disputesData.total}
              onClick={() => setFilters({ ...filters, offset: disputesData.offset + disputesData.limit })}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Dispute Details Modal */}
      {selectedDispute && !showResolveModal && (
        <DisputeDetailsModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onMarkReview={() => handleMarkReview(selectedDispute.id)}
          onResolve={() => setShowResolveModal(true)}
          onCloseDispute={() => handleClose(selectedDispute.id)}
        />
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <ResolveDisputeModal
          dispute={selectedDispute}
          onResolve={handleResolve}
          onClose={() => {
            setShowResolveModal(false);
            setSelectedDispute(null);
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className={`bg-${color}-50 border rounded-lg p-4`}>
      <h3 className="text-gray-600 text-sm">{title}</h3>
      <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
    </div>
  );
}

// Dispute Details Modal
function DisputeDetailsModal({
  dispute,
  onClose,
  onMarkReview,
  onResolve,
  onCloseDispute
}: {
  dispute: Dispute;
  onClose: () => void;
  onMarkReview: () => void;
  onResolve: () => void;
  onCloseDispute: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Dispute Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Dispute ID</label>
              <p className="font-mono">{dispute.id}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Request ID</label>
              <p>#{dispute.requestId}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Opened By</label>
              <p>{dispute.openedBy}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Reason</label>
              <p>{getReasonLabel(dispute.reason)}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Status</label>
              <span className={`px-2 py-1 rounded text-sm bg-${getStatusColor(dispute.status)}-100`}>
                {dispute.status}
              </span>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Opened At</label>
              <p>{new Date(dispute.openedAt).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Description</label>
            <p className="border rounded p-2 mt-1">{dispute.description}</p>
          </div>

          {dispute.resolution && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Resolution</h3>
              <p>Type: {getResolutionLabel(dispute.resolution)}</p>
              {dispute.resolutionPercentage && (
                <p>Percentage: {dispute.resolutionPercentage}%</p>
              )}
              {dispute.adminNotes && (
                <p className="mt-2">Notes: {dispute.adminNotes}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            {dispute.status === DisputeStatus.OPEN && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={onMarkReview}
              >
                Mark Under Review
              </button>
            )}
            {dispute.status === DisputeStatus.UNDER_REVIEW && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={onResolve}
              >
                Resolve
              </button>
            )}
            {dispute.status === DisputeStatus.RESOLVED && (
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                onClick={onCloseDispute}
              >
                Close Dispute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Resolve Dispute Modal
function ResolveDisputeModal({
  dispute,
  onResolve,
  onClose
}: {
  dispute: Dispute;
  onResolve: (resolution: string, percentage?: number, notes?: string) => void;
  onClose: () => void;
}) {
  const [resolution, setResolution] = useState('');
  const [percentage, setPercentage] = useState(50);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Resolve Dispute</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resolution</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            >
              <option value="">Select resolution...</option>
              <option value={DisputeResolution.REFUND_BUYER}>Refund to Buyer</option>
              <option value={DisputeResolution.RELEASE_TO_SELLER}>Release to Seller</option>
              <option value={DisputeResolution.PARTIAL_REFUND}>Partial Refund</option>
            </select>
          </div>

          {resolution === DisputeResolution.PARTIAL_REFUND && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Refund Percentage: {percentage}%
              </label>
              <input
                type="range"
                min="1"
                max="99"
                value={percentage}
                onChange={(e) => setPercentage(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Admin Notes</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about the resolution..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 border rounded hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => onResolve(resolution, resolution === DisputeResolution.PARTIAL_REFUND ? percentage : undefined, notes)}
              disabled={!resolution}
            >
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

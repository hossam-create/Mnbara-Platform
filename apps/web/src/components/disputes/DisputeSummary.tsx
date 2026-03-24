import { Dispute } from '../../services/disputeService';
import disputeService from '../../services/disputeService';
import GuaranteeBadge from '../guarantee/GuaranteeBadge';

interface DisputeSummaryProps {
  dispute: Dispute;
}

export default function DisputeSummary({ dispute }: DisputeSummaryProps) {
  const getFundsStatus = () => {
    if (dispute.status === 'RESOLVED' && dispute.resolution) {
      switch (dispute.resolution.outcome) {
        case 'REFUND_BUYER':
          return { status: 'Refunded', color: 'text-blue-600', bgColor: 'bg-blue-50' };
        case 'RELEASE_SELLER':
          return { status: 'Released', color: 'text-green-600', bgColor: 'bg-green-50' };
        case 'HOLD':
          return { status: 'On Hold', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
        default:
          return { status: 'Pending', color: 'text-gray-600', bgColor: 'bg-gray-50' };
      }
    } else {
      return { status: 'On Hold', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
  };

  const fundsStatus = getFundsStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Dispute Summary</h3>
        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${disputeService.getStatusColor(dispute.status)}`}>
          {disputeService.getStatusLabel(dispute.status)}
        </div>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Dispute Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Dispute Details</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Dispute ID</p>
              <p className="text-sm font-medium text-gray-900">{dispute.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="text-sm font-medium text-gray-900">{dispute.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Opened By</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${disputeService.getSenderBadgeColor(dispute.openedBy)}`}>
                  {dispute.openedBy}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reason</p>
              <p className="text-sm font-medium text-gray-900">{dispute.reason}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Opened Date</p>
              <p className="text-sm font-medium text-gray-900">
                {disputeService.formatDate(dispute.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Funds */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Status & Funds</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Current Status</p>
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${disputeService.getStatusColor(dispute.status)} mt-1`}>
                {disputeService.getStatusLabel(dispute.status)}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Funds Status</p>
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${fundsStatus.bgColor} ${fundsStatus.color} mt-1`}>
                {fundsStatus.status}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-sm font-medium text-gray-900">
                {disputeService.getDisputeDuration(dispute)} days
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Messages</p>
              <p className="text-sm font-medium text-gray-900">
                {dispute.messages.length} messages exchanged
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Section */}
      {dispute.resolution && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Resolution</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Outcome</p>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${disputeService.getResolutionOutcomeColor(dispute.resolution.outcome)} mt-1`}>
                  {disputeService.getResolutionOutcomeLabel(dispute.resolution.outcome)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Decided By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {dispute.resolution.decidedBy}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">Admin Note</p>
              <p className="text-sm text-gray-900 mt-1 bg-white p-3 rounded border border-gray-200">
                {dispute.resolution.note}
              </p>
            </div>
            
            {dispute.resolution.decidedAt && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Decision Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {disputeService.formatDate(dispute.resolution.decidedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Important Notices */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-medium text-gray-900 mb-3">Important Information</h4>
        
        {/* MNbarh Guarantee Badge */}
        <div className="mb-4">
          <GuaranteeBadge 
            level="full" 
            escrowStatus="DISPUTED"
            size="medium"
            className="w-full"
          />
        </div>
        
        <div className="space-y-3">
          {dispute.status !== 'RESOLVED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⏳</span>
                <div>
                  <h5 className="font-medium text-yellow-900 mb-1">Dispute Under Review</h5>
                  <p className="text-sm text-yellow-800">
                    Your dispute is currently being reviewed by our admin team. Funds remain on hold 
                    until a resolution is reached. You'll be notified of any updates.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-xl">🔒</span>
              <div>
                <h5 className="font-medium text-blue-900 mb-1">Escrow Protection</h5>
                <p className="text-sm text-blue-800">
                  All funds are held securely in escrow during the dispute process to protect both 
                  buyer and seller interests. No funds are released until the dispute is resolved.
                </p>
              </div>
            </div>
          </div>

          {dispute.status === 'RESOLVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✅</span>
                <div>
                  <h5 className="font-medium text-green-900 mb-1">Dispute Resolved</h5>
                  <p className="text-sm text-green-800">
                    This dispute has been resolved and the decision is final. If you have questions 
                    about the resolution, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

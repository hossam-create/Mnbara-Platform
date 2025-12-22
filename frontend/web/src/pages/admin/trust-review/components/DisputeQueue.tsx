// ============================================
// ⚖️ Dispute Queue Module
// Timeline view and evidence viewer for dispute resolution
// ============================================

import { useState } from 'react';

interface Dispute {
  id: string;
  caseNumber: string;
  type: 'item_not_received' | 'item_not_as_described' | 'unauthorized_transaction' | 'other';
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  
  // Parties involved
  complainant: {
    id: string;
    name: string;
    email: string;
    role: 'buyer' | 'seller' | 'traveler';
  };
  
  respondent: {
    id: string;
    name: string;
    email: string;
    role: 'buyer' | 'seller' | 'traveler';
  };
  
  // Transaction details
  transaction: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    date: string;
  };
  
  // Evidence
  evidence: DisputeEvidence[];
  timeline: DisputeEvent[];
  
  // Resolution
  proposedResolution?: {
    type: 'full_refund' | 'partial_refund' | 'replacement' | 'no_action';
    amount?: number;
    reason: string;
  };
  
  finalDecision?: {
    decision: 'complainant' | 'respondent' | 'split' | 'dismissed';
    amount: number;
    reason: string;
    decidedBy: string;
    decidedAt: string;
  };
}

interface DisputeEvidence {
  id: string;
  type: 'message' | 'image' | 'document' | 'screenshot' | 'receipt' | 'tracking';
  submittedBy: 'complainant' | 'respondent' | 'system';
  content: string;
  url?: string;
  submittedAt: string;
  metadata: {
    fileSize?: number;
    mimeType?: string;
    sha256?: string;
  };
}

interface DisputeEvent {
  id: string;
  type: 'dispute_created' | 'evidence_submitted' | 'status_changed' | 'note_added' | 'decision_made';
  actor: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface DisputeDecision {
  disputeId: string;
  decision: 'complainant' | 'respondent' | 'split' | 'dismissed';
  refundAmount: number;
  reason: string;
  internalNotes: string;
}

export function DisputeQueue() {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [decision, setDecision] = useState<Partial<DisputeDecision>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data - replace with API call to GET /api/admin/disputes
  const disputes: Dispute[] = [
    {
      id: 'disp-001',
      caseNumber: 'CASE-2025-001',
      type: 'item_not_received',
      status: 'open',
      priority: 'high',
      createdAt: '2025-12-20T14:30:00Z',
      updatedAt: '2025-12-21T09:45:00Z',
      
      complainant: {
        id: 'user-123',
        name: 'Ahmed Mohamed',
        email: 'ahmed@example.com',
        role: 'buyer'
      },
      
      respondent: {
        id: 'user-456',
        name: 'Electronics Store',
        email: 'store@example.com',
        role: 'seller'
      },
      
      transaction: {
        id: 'txn-789',
        amount: 299.99,
        currency: 'USD',
        description: 'Wireless Headphones - Premium Edition',
        date: '2025-12-15T10:00:00Z'
      },
      
      evidence: [
        {
          id: 'evid-001',
          type: 'message',
          submittedBy: 'complainant',
          content: 'I never received the headphones. Tracking shows delivered but I was home all day.',
          submittedAt: '2025-12-20T14:35:00Z',
          metadata: {}
        },
        {
          id: 'evid-002',
          type: 'tracking',
          submittedBy: 'system',
          content: 'UPS Tracking #: 1Z999AA10123456789 - Delivered Dec 18, 2:30 PM',
          submittedAt: '2025-12-20T14:40:00Z',
          metadata: {}
        },
        {
          id: 'evid-003',
          type: 'message',
          submittedBy: 'respondent',
          content: 'We shipped via UPS with signature confirmation. The tracking shows it was delivered and signed for.',
          submittedAt: '2025-12-20T15:20:00Z',
          metadata: {}
        }
      ],
      
      timeline: [
        {
          id: 'event-001',
          type: 'dispute_created',
          actor: 'system',
          description: 'Dispute created by Ahmed Mohamed',
          timestamp: '2025-12-20T14:30:00Z'
        },
        {
          id: 'event-002',
          type: 'evidence_submitted',
          actor: 'complainant',
          description: 'Complainant submitted initial evidence',
          timestamp: '2025-12-20T14:35:00Z'
        },
        {
          id: 'event-003',
          type: 'evidence_submitted',
          actor: 'system',
          description: 'System added tracking information',
          timestamp: '2025-12-20T14:40:00Z'
        },
        {
          id: 'event-004',
          type: 'evidence_submitted',
          actor: 'respondent',
          description: 'Respondent submitted response',
          timestamp: '2025-12-20T15:20:00Z'
        }
      ]
    }
  ];

  const handleSelectDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDecision({
      disputeId: dispute.id,
      refundAmount: dispute.transaction.amount * 0.5 // Default 50% split
    });
  };

  const handleDecisionSubmit = async () => {
    if (!decision.disputeId || !decision.decision || !decision.reason) {
      alert('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // API call to POST /api/admin/disputes/decision
      console.log('Submitting dispute decision:', decision);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Decision submitted successfully');
      setSelectedDispute(null);
      setDecision({});
    } catch (error) {
      alert('Error submitting decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'under_review': return 'bg-purple-100 text-purple-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'escalated': return 'bg-red-100 text-red-700';
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Disputes List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Disputes</h3>
          <p className="text-sm text-gray-500 mt-1">{disputes.length} disputes requiring attention</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedDispute?.id === dispute.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSelectDispute(dispute)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(dispute.priority)}`}>
                    {dispute.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(dispute.status)}`}>
                    {dispute.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {dispute.caseNumber}
                </div>
              </div>
              
              <div className="mb-2">
                <h4 className="font-medium text-gray-900">
                  {dispute.complainant.name} vs {dispute.respondent.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {formatCurrency(dispute.transaction.amount, dispute.transaction.currency)}
                </p>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {dispute.evidence.length} evidence items
                </span>
                <span className="text-gray-400">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispute Detail & Decision */}
      <div className="bg-white rounded-lg shadow">
        {selectedDispute ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Dispute Resolution</h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Case Overview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Case:</span>
                  <span className="ml-2 font-medium">{selectedDispute.caseNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 capitalize">{selectedDispute.type.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(selectedDispute.transaction.amount, selectedDispute.transaction.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2">
                    {new Date(selectedDispute.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Parties Involved */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Parties</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="font-medium text-blue-900">Complainant</div>
                  <div>{selectedDispute.complainant.name}</div>
                  <div className="text-blue-600">{selectedDispute.complainant.email}</div>
                  <div className="text-xs text-blue-500 capitalize">{selectedDispute.complainant.role}</div>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <div className="font-medium text-orange-900">Respondent</div>
                  <div>{selectedDispute.respondent.name}</div>
                  <div className="text-orange-600">{selectedDispute.respondent.email}</div>
                  <div className="text-xs text-orange-500 capitalize">{selectedDispute.respondent.role}</div>
                </div>
              </div>
            </div>

            {/* Evidence Timeline */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Evidence Timeline</h4>
              <div className="space-y-3">
                {selectedDispute.timeline.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        index === selectedDispute.timeline.length - 1 ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      {index < selectedDispute.timeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {event.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()} • {event.actor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Items */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Evidence ({selectedDispute.evidence.length})</h4>
              <div className="space-y-2">
                {selectedDispute.evidence.map((evidence) => (
                  <div key={evidence.id} className="p-3 bg-gray-50 rounded text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">
                        {evidence.submittedBy}: {evidence.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(evidence.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{evidence.content}</p>
                    {evidence.url && (
                      <button
                        onClick={() => window.open(evidence.url, '_blank')}
                        className="mt-2 text-blue-600 text-xs hover:underline"
                      >
                        View evidence
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Form */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Make Final Decision</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision
                  </label>
                  <select
                    value={decision.decision || ''}
                    onChange={(e) => setDecision({...decision, decision: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select decision</option>
                    <option value="complainant">Favor Complainant (Full Refund)</option>
                    <option value="respondent">Favor Respondent (No Refund)</option>
                    <option value="split">Split Decision (Partial Refund)</option>
                    <option value="dismissed">Dismiss Dispute</option>
                  </select>
                </div>

                {decision.decision === 'split' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedDispute.transaction.amount}
                      step="0.01"
                      value={decision.refundAmount || ''}
                      onChange={(e) => setDecision({...decision, refundAmount: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter refund amount"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Decision (Required)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide detailed reasoning for your decision. This will be visible to both parties."
                    value={decision.reason || ''}
                    onChange={(e) => setDecision({...decision, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal notes for audit purposes only"
                    value={decision.internalNotes || ''}
                    onChange={(e) => setDecision({...decision, internalNotes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleDecisionSubmit}
                  disabled={isSubmitting || !decision.decision || !decision.reason}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Final Decision'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-6xl mb-4">⚖️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Dispute</h3>
            <p className="text-gray-500">Choose a dispute case from the list to review evidence and make a decision</p>
          </div>
        )}
      </div>
    </div>
  );
}
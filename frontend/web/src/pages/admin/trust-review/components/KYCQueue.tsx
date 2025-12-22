// ============================================
// 🔐 KYC Queue Module
// Document viewer and approval system for traveler KYC
// ============================================

import { useState } from 'react';

interface KYCApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  level: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  documents: KYCDocument[];
  riskScore: number;
  flags: string[];
}

interface KYCDocument {
  id: string;
  type: 'passport' | 'id_card' | 'selfie' | 'proof_of_address' | 'flight_ticket' | 'boarding_pass';
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
  metadata: {
    fileSize: number;
    mimeType: string;
    sha256: string;
  };
}

interface KYCReview {
  applicationId: string;
  decision: 'approve' | 'reject';
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

export function KYCQueue() {
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<Partial<KYCReview>>({});
  const [isReviewing, setIsReviewing] = useState(false);

  // Mock data - replace with API call to GET /api/admin/kyc/pending
  const pendingApplications: KYCApplication[] = [
    {
      id: 'kyc-001',
      userId: 'user-123',
      userName: 'Ahmed Mohamed',
      userEmail: 'ahmed@example.com',
      level: 3,
      status: 'pending',
      submittedAt: '2025-12-21T10:30:00Z',
      riskScore: 25,
      flags: ['new_user', 'international'],
      documents: [
        {
          id: 'doc-001',
          type: 'passport',
          name: 'passport_ahmed.pdf',
          url: '/api/documents/passport_ahmed.pdf',
          uploadedAt: '2025-12-21T10:25:00Z',
          verified: true,
          metadata: {
            fileSize: 2500000,
            mimeType: 'application/pdf',
            sha256: 'abc123...'
          }
        },
        {
          id: 'doc-002',
          type: 'selfie',
          name: 'selfie_ahmed.jpg',
          url: '/api/documents/selfie_ahmed.jpg',
          uploadedAt: '2025-12-21T10:26:00Z',
          verified: true,
          metadata: {
            fileSize: 1200000,
            mimeType: 'image/jpeg',
            sha256: 'def456...'
          }
        }
      ]
    },
    {
      id: 'kyc-002',
      userId: 'user-456',
      userName: 'Maria Garcia',
      userEmail: 'maria@example.com',
      level: 2,
      status: 'pending',
      submittedAt: '2025-12-21T09:15:00Z',
      riskScore: 65,
      flags: ['high_risk_country', 'multiple_rejections'],
      documents: [
        {
          id: 'doc-003',
          type: 'id_card',
          name: 'id_maria.pdf',
          url: '/api/documents/id_maria.pdf',
          uploadedAt: '2025-12-21T09:10:00Z',
          verified: true,
          metadata: {
            fileSize: 1800000,
            mimeType: 'application/pdf',
            sha256: 'ghi789...'
          }
        }
      ]
    }
  ];

  const handleSelectApplication = (application: KYCApplication) => {
    setSelectedApplication(application);
    setReviewDecision({
      applicationId: application.id,
      riskLevel: application.riskScore < 30 ? 'low' : application.riskScore < 70 ? 'medium' : 'high'
    });
  };

  const handleReviewSubmit = async () => {
    if (!reviewDecision.applicationId || !reviewDecision.decision) {
      alert('Please make a decision and provide a reason');
      return;
    }

    setIsReviewing(true);
    try {
      // API call to POST /api/admin/kyc/decision
      console.log('Submitting review:', reviewDecision);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Decision submitted successfully');
      setSelectedApplication(null);
      setReviewDecision({});
    } catch (error) {
      alert('Error submitting decision');
    } finally {
      setIsReviewing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Applications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending KYC Applications</h3>
          <p className="text-sm text-gray-500 mt-1">{pendingApplications.length} applications awaiting review</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {pendingApplications.map((application) => (
            <div
              key={application.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedApplication?.id === application.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSelectApplication(application)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{application.userName}</h4>
                  <p className="text-sm text-gray-500">{application.userEmail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Level {application.level}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(application.riskScore)}`}>
                      Risk: {application.riskScore}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {application.documents.length} documents
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Detail & Review */}
      <div className="bg-white rounded-lg shadow">
        {selectedApplication ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Review Application</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Applicant Info */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Applicant Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 text-gray-900">{selectedApplication.userName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">{selectedApplication.userEmail}</span>
                </div>
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(selectedApplication.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Risk Score:</span>
                  <span className={`ml-2 ${getRiskColor(selectedApplication.riskScore)} px-2 py-1 rounded-full text-xs`}>
                    {selectedApplication.riskScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
              <div className="space-y-3">
                {selectedApplication.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                        {doc.type === 'passport' && '📘'}
                        {doc.type === 'id_card' && '🪪'}
                        {doc.type === 'selfie' && '📸'}
                        {doc.type === 'proof_of_address' && '🏠'}
                        {doc.type === 'flight_ticket' && '✈️'}
                        {doc.type === 'boarding_pass' && '🎫'}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{doc.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(doc.metadata.fileSize)} • {doc.metadata.mimeType}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(doc.url, '_blank')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Form */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Make Decision</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="decision"
                        value="approve"
                        onChange={(e) => setReviewDecision({...reviewDecision, decision: e.target.value as 'approve'})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="decision"
                        value="reject"
                        onChange={(e) => setReviewDecision({...reviewDecision, decision: e.target.value as 'reject'})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Reject</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={reviewDecision.riskLevel || ''}
                    onChange={(e) => setReviewDecision({...reviewDecision, riskLevel: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason {reviewDecision.decision === 'reject' && '(Required)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide detailed reason for your decision"
                    value={reviewDecision.reason || ''}
                    onChange={(e) => setReviewDecision({...reviewDecision, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={reviewDecision.decision === 'reject'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal notes (not visible to user)"
                    value={reviewDecision.notes || ''}
                    onChange={(e) => setReviewDecision({...reviewDecision, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleReviewSubmit}
                  disabled={isReviewing || !reviewDecision.decision || (reviewDecision.decision === 'reject' && !reviewDecision.reason)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isReviewing ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Application</h3>
            <p className="text-gray-500">Choose a KYC application from the list to begin review</p>
          </div>
        )}
      </div>
    </div>
  );
}
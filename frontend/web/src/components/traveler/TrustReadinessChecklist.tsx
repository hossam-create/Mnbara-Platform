// ============================================
// 🛡️ Trust Readiness Checklist - Traveler Verification
// ============================================

import React, { useState } from 'react';
import type { TrustReadinessChecklist as ChecklistType } from '../../services/traveler.service';

interface TrustReadinessChecklistProps {
  onClose: () => void;
  onComplete: () => void;
  className?: string;
}

const TrustReadinessChecklist: React.FC<TrustReadinessChecklistProps> = ({
  onClose,
  onComplete,
  className = '',
}) => {
  const [checklist, setChecklist] = useState<ChecklistType[]>([
    {
      id: '1',
      item: 'Identity Verification',
      description: 'Complete KYC verification with government ID',
      required: true,
      completed: true,
      verifiedAt: '2024-12-15T10:30:00Z',
    },
    {
      id: '2',
      item: 'Phone Verification',
      description: 'Verify your mobile number for secure communication',
      required: true,
      completed: true,
      verifiedAt: '2024-12-15T10:35:00Z',
    },
    {
      id: '3',
      item: 'Bank Account Linking',
      description: 'Link bank account for secure payments',
      required: true,
      completed: true,
      verifiedAt: '2024-12-15T11:00:00Z',
    },
    {
      id: '4',
      item: 'Travel History',
      description: 'Add at least 3 completed trips to your profile',
      required: false,
      completed: false,
    },
    {
      id: '5',
      item: 'Delivery Insurance',
      description: 'Enable delivery protection for high-value items',
      required: false,
      completed: false,
    },
    {
      id: '6',
      item: 'Emergency Contact',
      description: 'Add emergency contact information',
      required: false,
      completed: true,
      verifiedAt: '2024-12-18T14:20:00Z',
    },
    {
      id: '7',
      item: 'Photo Verification',
      description: 'Upload clear profile photo showing your face',
      required: true,
      completed: true,
      verifiedAt: '2024-12-15T10:40:00Z',
    },
    {
      id: '8',
      item: 'Terms Acceptance',
      description: 'Accept latest terms of service and privacy policy',
      required: true,
      completed: true,
      verifiedAt: '2024-12-15T10:25:00Z',
    },
  ]);

  const [currentStep, setCurrentStep] = useState(0);

  const handleChecklistChange = (id: string, completed: boolean) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, completed, verifiedAt: completed ? new Date().toISOString() : undefined }
          : item
      )
    );
  };

  const completedItems = checklist.filter(item => item.completed).length;
  const totalRequired = checklist.filter(item => item.required).length;
  const completedRequired = checklist.filter(item => item.required && item.completed).length;
  const readinessScore = Math.round((completedItems / checklist.length) * 100);

  const isFullyVerified = checklist.every(item => !item.required || item.completed);

  const steps = [
    {
      title: 'Trust Readiness Checklist',
      description: 'Complete these steps to increase your trust score and access more delivery opportunities.',
    },
    {
      title: 'Verification Complete',
      description: 'You\'re now ready to accept high-value delivery requests!',
    },
  ];

  const handleComplete = () => {
    if (isFullyVerified) {
      setCurrentStep(1);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Readiness: {readinessScore}%
            </span>
            <span className="text-sm text-gray-500">
              {completedItems}/{checklist.length} completed
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            {completedRequired}/{totalRequired} required items completed
          </div>
        </div>

        {/* Checklist Items */}
        <div className="p-6 space-y-4">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border ${
                item.completed
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                  disabled={item.required && item.completed}
                  className={`mt-1 rounded ${
                    item.required
                      ? 'border-blue-500 text-blue-600'
                      : 'border-gray-300 text-gray-600'
                  } ${item.completed && item.required ? 'opacity-50' : ''}`}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {item.item}
                    </span>
                    {item.required && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {item.description}
                  </p>
                  
                  {item.verifiedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      Verified on {new Date(item.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {item.completed ? (
                  <span className="text-green-500 text-lg">✅</span>
                ) : (
                  <span className="text-gray-400 text-lg">⭕</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleComplete}
              disabled={!isFullyVerified}
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isFullyVerified ? 'Complete Verification' : 'Complete Required Items'}
            </button>
          </div>
          
          {!isFullyVerified && (
            <p className="text-sm text-red-600 mt-3 text-center">
              Please complete all required items to continue.
            </p>
          )}
        </div>

        {/* Success State */}
        {currentStep === 1 && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Verification Complete!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Your trust score has been updated. You can now access premium delivery opportunities.
              </p>
              
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">92%</span>
              </div>
              
              <p className="text-sm text-gray-500">
                New trust score
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustReadinessChecklist;
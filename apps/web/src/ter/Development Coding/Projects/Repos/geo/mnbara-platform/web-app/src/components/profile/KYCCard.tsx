/**
 * KYCCard Component
 * Displays KYC verification status and progress
 */

import React from 'react';
import type { KYCStatus } from '../../types/profile';
import './KYCCard.css';

interface KYCCardProps {
  kycStatus: KYCStatus;
  onStartVerification?: () => void;
  onViewDocuments?: () => void;
}

export const KYCCard: React.FC<KYCCardProps> = ({ 
  kycStatus, 
  onStartVerification,
  onViewDocuments 
}) => {
  const getStatusConfig = (status: KYCStatus) => {
    const configMap: Record<KYCStatus, { label: string; icon: string; color: string; bgColor: string }> = {
      not_started: { 
        label: 'Not Started', 
        icon: '⚪', 
        color: '#6c757d',
        bgColor: '#f8f9fa'
      },
      pending: { 
        label: 'Pending Review', 
        icon: '⏳', 
        color: '#ffc107',
        bgColor: '#fff3cd'
      },
      in_review: { 
        label: 'In Review', 
        icon: '🔍', 
        color: '#0dcaf0',
        bgColor: '#cfe2ff'
      },
      verified: { 
        label: 'Verified', 
        icon: '✅', 
        color: '#198754',
        bgColor: '#d1e7dd'
      },
      rejected: { 
        label: 'Rejected', 
        icon: '❌', 
        color: '#dc3545',
        bgColor: '#f8d7da'
      },
      expired: { 
        label: 'Expired', 
        icon: '⚠️', 
        color: '#fd7e14',
        bgColor: '#ffe5d0'
      },
    };
    return configMap[status];
  };

  const statusConfig = getStatusConfig(kycStatus);

  const getProgressSteps = () => {
    const steps = [
      { id: 'identity', label: 'Identity Document', status: 'completed' },
      { id: 'address', label: 'Address Proof', status: 'completed' },
      { id: 'selfie', label: 'Selfie Verification', status: 'completed' },
      { id: 'liveness', label: 'Liveness Check', status: 'pending' },
    ];
    
    if (kycStatus === 'not_started') {
      return steps.map(s => ({ ...s, status: 'pending' }));
    }
    if (kycStatus === 'pending' || kycStatus === 'in_review') {
      return steps.map(s => ({ ...s, status: 'completed' }));
    }
    return steps.map(s => ({ ...s, status: 'completed' }));
  };

  const progressSteps = getProgressSteps();
  const completedSteps = progressSteps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / progressSteps.length) * 100;

  return (
    <div className="mnbara-kyc-card">
      <div className="mnbara-kyc-card__header">
        <h3 className="mnbara-kyc-card__title">Identity Verification</h3>
        <span 
          className="mnbara-kyc-card__status"
          style={{ 
            color: statusConfig.color,
            backgroundColor: statusConfig.bgColor 
          }}
        >
          {statusConfig.icon} {statusConfig.label}
        </span>
      </div>

      <div className="mnbara-kyc-card__progress">
        <div className="mnbara-kyc-card__progress-bar">
          <div 
            className="mnbara-kyc-card__progress-fill"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: kycStatus === 'verified' ? '#198754' : '#0d6efd'
            }}
          />
        </div>
        <span className="mnbara-kyc-card__progress-text">
          {completedSteps} of {progressSteps.length} steps completed
        </span>
      </div>

      <div className="mnbara-kyc-card__steps">
        {progressSteps.map((step, index) => (
          <div key={step.id} className="mnbara-kyc-card__step">
            <div className={`mnbara-kyc-card__step-icon ${step.status}`}>
              {step.status === 'completed' ? '✓' : step.status === 'in_progress' ? '⟳' : '○'}
            </div>
            <span className={`mnbara-kyc-card__step-label ${step.status}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mnbara-kyc-card__benefits">
        <h4 className="mnbara-kyc-card__benefits-title">Verified members get:</h4>
        <ul className="mnbara-kyc-card__benefits-list">
          <li>✅ Higher transaction limits</li>
          <li>✅ Increased buyer trust</li>
          <li>✅ Priority support</li>
          <li>✅ Badge on profile</li>
        </ul>
      </div>

      <div className="mnbara-kyc-card__actions">
        {kycStatus === 'not_started' && (
          <button 
            className="mnbara-kyc-card__btn mnbara-kyc-card__btn--primary"
            onClick={onStartVerification}
          >
            Start Verification
          </button>
        )}
        {(kycStatus === 'verified' || kycStatus === 'pending' || kycStatus === 'in_review') && (
          <button 
            className="mnbara-kyc-card__btn mnbara-kyc-card__btn--secondary"
            onClick={onViewDocuments}
          >
            View Documents
          </button>
        )}
        {(kycStatus === 'rejected' || kycStatus === 'expired') && (
          <button 
            className="mnbara-kyc-card__btn mnbara-kyc-card__btn--primary"
            onClick={onStartVerification}
          >
            Restart Verification
          </button>
        )}
      </div>
    </div>
  );
};

export default KYCCard;

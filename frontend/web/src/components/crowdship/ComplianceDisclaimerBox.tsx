/**
 * Compliance Disclaimer Box
 * READ-ONLY - Advisory Only - NON-DISMISSIBLE
 *
 * Displays compliance boundaries and requirements.
 * This component CANNOT be hidden or dismissed.
 */

import React from 'react';

interface ComplianceBoundary {
  id: string;
  type: string;
  jurisdiction: string;
  requirement: string;
  status: 'COMPLIANT' | 'PENDING' | 'NOT_APPLICABLE' | 'BLOCKED';
  explanation: string;
  documentationUrl?: string;
}

interface ComplianceDisclaimerBoxProps {
  corridor: string;
  amountUSD: number;
  boundaries: ComplianceBoundary[];
  overallStatus: 'CLEAR' | 'REVIEW_REQUIRED' | 'BLOCKED';
  blockers: string[];
  recommendations: string[];
}

export const ComplianceDisclaimerBox: React.FC<ComplianceDisclaimerBoxProps> = ({
  corridor,
  amountUSD,
  boundaries,
  overallStatus,
  blockers,
  recommendations,
}) => {
  const getStatusStyles = () => {
    switch (overallStatus) {
      case 'CLEAR':
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          headerBg: 'bg-green-100',
          text: 'text-green-800',
          icon: '✓',
        };
      case 'REVIEW_REQUIRED':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          headerBg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: '⚠',
        };
      case 'BLOCKED':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          headerBg: 'bg-red-100',
          text: 'text-red-800',
          icon: '🚫',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          headerBg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'ℹ',
        };
    }
  };

  const getBoundaryStatusStyles = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOT_APPLICABLE':
        return 'bg-gray-100 text-gray-600';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`rounded-lg border-2 ${styles.border} ${styles.bg}`}>
      {/* Non-Dismissible Header */}
      <div className={`px-6 py-4 ${styles.headerBg} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{styles.icon}</span>
            <div>
              <h3 className={`font-bold ${styles.text}`}>
                Compliance Status: {overallStatus.replace('_', ' ')}
              </h3>
              <p className="text-sm text-gray-600">
                {corridor} • ${amountUSD.toLocaleString()} USD
              </p>
            </div>
          </div>
          {/* No close button - this cannot be dismissed */}
          <div className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded">
            NON-DISMISSIBLE
          </div>
        </div>
      </div>

      {/* Advisory Notice - Always Visible */}
      <div className="px-6 py-3 bg-blue-100 border-b border-blue-200">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800">
              This is Advisory Information Only
            </p>
            <p className="text-xs text-blue-700 mt-1">
              No compliance checks are executed. No KYC/AML processes are initiated.
              This information is for planning purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="px-6 py-4 bg-red-100 border-b border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">🚫 Blockers</h4>
          <ul className="space-y-1">
            {blockers.map((blocker, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start">
                <span className="mr-2">•</span>
                {blocker}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Compliance Boundaries */}
      <div className="px-6 py-4">
        <h4 className="font-medium text-gray-700 mb-3">Compliance Requirements</h4>
        <div className="space-y-3">
          {boundaries.map((boundary) => (
            <div
              key={boundary.id}
              className="p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900">{boundary.requirement}</p>
                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${getBoundaryStatusStyles(boundary.status)}`}>
                      {boundary.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {boundary.type.replace(/_/g, ' ')} • {boundary.jurisdiction}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{boundary.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <h4 className="font-medium text-blue-800 mb-2">💡 Recommendations</h4>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-blue-700 flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What We Do NOT Do - Always Visible */}
      <div className="px-6 py-4 bg-gray-800 text-white">
        <h4 className="font-semibold mb-2">❌ What This Service Does NOT Do</h4>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Execute payments
          </li>
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Deduct funds
          </li>
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Convert currencies
          </li>
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Create wallets
          </li>
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Connect to banks
          </li>
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Process KYC/AML
          </li>
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Auto-approve anything
          </li>
          <li className="flex items-center">
            <span className="text-red-400 mr-2">✗</span>
            Store payment data
          </li>
        </ul>
      </div>

      {/* Why Advisory Only */}
      <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 rounded-b-lg">
        <h4 className="font-medium text-gray-700 mb-2">ℹ️ Why Advisory Only?</h4>
        <p className="text-sm text-gray-600">
          This service provides intelligence and recommendations to help you make informed decisions.
          All actual payment execution, compliance verification, and fund transfers require explicit
          human confirmation and are handled by separate, audited, and regulated payment services.
          This separation ensures safety, compliance, and full auditability.
        </p>
      </div>
    </div>
  );
};

export default ComplianceDisclaimerBox;

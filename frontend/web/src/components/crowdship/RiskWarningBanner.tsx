/**
 * Risk Warning Banner
 * READ-ONLY - Advisory Only
 *
 * Displays payment risk warnings with clear advisory disclaimers.
 * NO risk mitigation execution - information only.
 */

import React from 'react';

interface PaymentRiskWarning {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  affectedMethods: string[];
}

interface RiskWarningBannerProps {
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  warnings: PaymentRiskWarning[];
  mitigations: string[];
  explanation: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const RiskWarningBanner: React.FC<RiskWarningBannerProps> = ({
  overallRiskLevel,
  riskScore,
  warnings,
  mitigations,
  explanation,
  collapsed = false,
  onToggle,
}) => {
  const getRiskStyles = () => {
    switch (overallRiskLevel) {
      case 'LOW':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '✓',
          iconBg: 'bg-green-100',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: '⚠',
          iconBg: 'bg-yellow-100',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: '⚠',
          iconBg: 'bg-orange-100',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: '🚨',
          iconBg: 'bg-red-100',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'ℹ',
          iconBg: 'bg-gray-100',
        };
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const styles = getRiskStyles();

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg}`}>
      {/* Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between ${onToggle ? 'cursor-pointer' : ''}`}
        onClick={onToggle}
      >
        <div className="flex items-center">
          <span className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center text-xl mr-4`}>
            {styles.icon}
          </span>
          <div>
            <h3 className={`font-semibold ${styles.text}`}>
              Risk Level: {overallRiskLevel}
            </h3>
            <p className="text-sm text-gray-600">
              Risk Score: {riskScore}/100 • {warnings.length} warning(s)
            </p>
          </div>
        </div>
        {onToggle && (
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Advisory Notice */}
      <div className="px-6 py-2 bg-blue-50 border-t border-b border-blue-100">
        <p className="text-xs text-blue-700">
          ℹ️ This is advisory information only. No risk mitigation actions will be executed automatically.
        </p>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="px-6 py-4">
          {/* Explanation */}
          <p className={`text-sm ${styles.text} mb-4`}>{explanation}</p>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium text-gray-700">Risk Factors</h4>
              {warnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`p-3 rounded-lg border ${getSeverityStyles(warning.severity)}`}
                >
                  <div className="flex items-start">
                    <span className="text-lg mr-2">
                      {warning.severity === 'CRITICAL' ? '🚨' : warning.severity === 'WARNING' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{warning.title}</p>
                      <p className="text-sm mt-1 opacity-90">{warning.description}</p>
                      <p className="text-sm mt-2 font-medium">
                        💡 {warning.recommendation}
                      </p>
                      {warning.affectedMethods.length > 0 && (
                        <p className="text-xs mt-2 opacity-75">
                          Affects: {warning.affectedMethods.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mitigations */}
          {mitigations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Mitigations</h4>
              <ul className="space-y-1">
                {mitigations.map((mitigation, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {mitigation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500">
          ⚠️ Risk assessment is advisory only. This service does not modify trust scores,
          block transactions, or take any automated actions. Human review required.
        </p>
      </div>
    </div>
  );
};

export default RiskWarningBanner;

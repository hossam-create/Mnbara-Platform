/**
 * Payment Comparison Panel
 * READ-ONLY - Advisory Only
 *
 * Displays payment method comparison with clear advisory disclaimers.
 * NO payment execution - information only.
 */

import React from 'react';

interface PaymentMethodOption {
  methodId: string;
  methodName: string;
  available: boolean;
  unavailableReason?: string;
  estimatedFeeUSD: number;
  estimatedTotal: number;
  processingTime: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  pros: string[];
  cons: string[];
  score: number;
}

interface PaymentComparisonPanelProps {
  corridor: string;
  amountUSD: number;
  methods: PaymentMethodOption[];
  recommended: string | null;
  recommendationReason: string;
  loading?: boolean;
  error?: string;
}

export const PaymentComparisonPanel: React.FC<PaymentComparisonPanelProps> = ({
  corridor,
  amountUSD,
  methods,
  recommended,
  recommendationReason,
  loading,
  error,
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Payment Method Comparison
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {corridor} • ${amountUSD.toLocaleString()} USD
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Advisory Only</p>
            <p className="text-xs text-blue-600 mt-0.5">
              This is informational only. No payment will be executed. Human confirmation required.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {recommended && (
        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
          <p className="text-sm font-medium text-green-800">
            💡 Recommended: {methods.find(m => m.methodId === recommended)?.methodName}
          </p>
          <p className="text-xs text-green-600 mt-1">{recommendationReason}</p>
        </div>
      )}

      {/* Methods List */}
      <div className="divide-y divide-gray-200">
        {methods.map((method) => (
          <div
            key={method.methodId}
            className={`px-6 py-4 ${!method.available ? 'opacity-50' : ''} ${
              method.methodId === recommended ? 'bg-green-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">{method.methodName}</h4>
                  {method.methodId === recommended && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                      Recommended
                    </span>
                  )}
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${getRiskColor(method.riskLevel)}`}>
                    {method.riskLevel} Risk
                  </span>
                </div>

                {!method.available && method.unavailableReason && (
                  <p className="text-sm text-red-600 mt-1">{method.unavailableReason}</p>
                )}

                <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                  <span>⏱️ {method.processingTime}</span>
                  <span>💰 Fee: ${method.estimatedFeeUSD.toFixed(2)}</span>
                  <span>📊 Score: {method.score}/100</span>
                </div>

                {method.pros.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {method.pros.map((pro, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        ✓ {pro}
                      </span>
                    ))}
                  </div>
                )}

                {method.cons.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {method.cons.map((con, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                        ✗ {con}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right ml-4">
                <p className="text-lg font-semibold text-gray-900">
                  ${method.estimatedTotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Total (advisory)</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ⚠️ Fees and processing times are estimates only. Actual values may vary.
          This service does not execute payments or connect to payment providers.
        </p>
      </div>
    </div>
  );
};

export default PaymentComparisonPanel;

/**
 * FX Advisory Card
 * READ-ONLY - Advisory Only
 *
 * Displays FX rate comparison with clear advisory disclaimers.
 * NO currency conversion execution - information only.
 */

import React from 'react';

interface FXRateComparison {
  provider: string;
  rate: number;
  inverseRate: number;
  convertedAmount: number;
  fee: number;
  totalCost: number;
  spreadFromMarket: number;
  spreadPercent: number;
  isRecommended: boolean;
}

interface FXAdvisoryCardProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rates: FXRateComparison[];
  bestRate: FXRateComparison | null;
  marketRate: number;
  warnings: string[];
  explanation: string;
  loading?: boolean;
  error?: string;
}

export const FXAdvisoryCard: React.FC<FXAdvisoryCardProps> = ({
  fromCurrency,
  toCurrency,
  amount,
  rates,
  bestRate,
  marketRate,
  warnings,
  explanation,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
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
          FX Rate Advisory
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {amount.toLocaleString()} {fromCurrency} → {toCurrency}
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="bg-amber-50 border-b border-amber-100 px-6 py-3">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Indicative Rates Only</p>
            <p className="text-xs text-amber-600 mt-0.5">
              These are NOT live rates. No currency conversion will be executed.
            </p>
          </div>
        </div>
      </div>

      {/* Market Rate */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Market Rate (Indicative)</p>
            <p className="text-2xl font-bold text-gray-900">
              1 {fromCurrency} = {marketRate.toFixed(4)} {toCurrency}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">You would receive</p>
            <p className="text-xl font-semibold text-gray-900">
              ~{(amount * marketRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
            </p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
          {warnings.map((warning, i) => (
            <p key={i} className="text-sm text-yellow-700 flex items-center">
              <span className="mr-2">⚠️</span> {warning}
            </p>
          ))}
        </div>
      )}

      {/* Provider Rates */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Provider Comparison (Advisory)</h4>
        <div className="space-y-3">
          {rates.map((rate) => (
            <div
              key={rate.provider}
              className={`p-4 rounded-lg border ${
                rate.isRecommended
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900">{rate.provider}</p>
                    {rate.isRecommended && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Best Rate
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Rate: {rate.rate.toFixed(4)} • Spread: {rate.spreadPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {rate.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
                  </p>
                  {rate.fee > 0 && (
                    <p className="text-xs text-gray-500">+ ${rate.fee} fee</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
        <p className="text-sm text-blue-800">{explanation}</p>
      </div>

      {/* Footer Disclaimer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ⚠️ Rates shown are indicative only and based on static snapshots.
          This service does not execute currency conversions or connect to FX providers.
          Actual rates at time of transaction may differ significantly.
        </p>
      </div>
    </div>
  );
};

export default FXAdvisoryCard;

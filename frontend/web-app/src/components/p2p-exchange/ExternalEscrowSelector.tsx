// ============================================================
// P2P Exchange - ExternalEscrowSelector Component
// Select external escrow provider for exchange
// ============================================================

import React, { useState } from 'react';
import { useExternalEscrowProviders } from '../../hooks/useSecurity';
import type { ExternalEscrowProvider, ProviderType } from '../../types/p2p-exchange.types';

// ============================================================
// TYPES
// ============================================================

interface ExternalEscrowSelectorProps {
  selectedProviderId?: number;
  onSelect: (provider: ExternalEscrowProvider | null) => void;
  currency?: string;
  amount?: number;
}

// ============================================================
// COMPONENT
// ============================================================

export const ExternalEscrowSelector: React.FC<ExternalEscrowSelectorProps> = ({
  selectedProviderId,
  onSelect,
  currency,
  amount,
}) => {
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const { data: providersData, isLoading, isError, error } = useExternalEscrowProviders();

  // ============================================================
  // HELPERS
  // ============================================================

  const getProviderTypeIcon = (type: ProviderType) => {
    switch (type) {
      case 'BLOCKCHAIN':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        );
      case 'MOBILE_WALLET':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case 'BANK':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
            />
          </svg>
        );
      case 'PAYMENT_PROCESSOR':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const isProviderCompatible = (provider: ExternalEscrowProvider) => {
    // Check currency support
    if (currency && !provider.supportedCurrencies.includes(currency)) {
      return false;
    }

    // Check amount limits
    if (amount) {
      if (provider.minAmount && parseFloat(provider.minAmount) > amount) {
        return false;
      }
      if (provider.maxAmount && parseFloat(provider.maxAmount) < amount) {
        return false;
      }
    }

    return true;
  };

  const calculateFee = (provider: ExternalEscrowProvider, amt?: number) => {
    if (!amt) return null;

    const percentageFee = (amt * parseFloat(provider.feePercentage)) / 100;
    const fixedFee = provider.feeFixed ? parseFloat(provider.feeFixed) : 0;
    return (percentageFee + fixedFee).toFixed(2);
  };

  // ============================================================
  // LOADING & ERROR STATES
  // ============================================================

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Error loading providers: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const providers = providersData?.data || [];
  const compatibleProviders = providers.filter(isProviderCompatible);
  const incompatibleProviders = providers.filter(p => !isProviderCompatible(p));

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">External Escrow Provider</h3>

      {/* No Escrow Option */}
      <div
        onClick={() => onSelect(null)}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors mb-4 ${
          !selectedProviderId
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">No External Escrow</p>
              <p className="text-sm text-gray-500">Use internal platform escrow</p>
            </div>
          </div>
          {!selectedProviderId && (
            <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Compatible Providers */}
      {compatibleProviders.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-gray-700">Available Providers</p>
          {compatibleProviders.map((provider) => (
            <div key={provider.id}>
              <div
                onClick={() => onSelect(provider)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedProviderId === provider.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getProviderTypeIcon(provider.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{provider.name}</p>
                      <p className="text-sm text-gray-500">{provider.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetails(showDetails === provider.id ? null : provider.id);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showDetails === provider.id ? 'Hide' : 'Details'}
                    </button>
                    {selectedProviderId === provider.id && (
                      <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {showDetails === provider.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supported Currencies:</span>
                      <span className="font-medium">{provider.supportedCurrencies.join(', ')}</span>
                    </div>
                    {provider.minAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Amount:</span>
                        <span className="font-medium">{provider.minAmount}</span>
                      </div>
                    )}
                    {provider.maxAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Amount:</span>
                        <span className="font-medium">{provider.maxAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fee:</span>
                      <span className="font-medium">
                        {provider.feePercentage}%
                        {provider.feeFixed && ` + ${provider.feeFixed}`}
                        {amount && ` (≈ ${calculateFee(provider, amount)})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Settlement Time:</span>
                      <span className="font-medium">{provider.settlementTime} hours</span>
                    </div>
                    {provider.country && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Country:</span>
                        <span className="font-medium">{provider.country}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incompatible Providers */}
      {incompatibleProviders.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">Unavailable Providers</p>
          {incompatibleProviders.map((provider) => (
            <div
              key={provider.id}
              className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-200 rounded-lg text-gray-500">
                    {getProviderTypeIcon(provider.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{provider.name}</p>
                    <p className="text-sm text-gray-500">
                      {!currency || !provider.supportedCurrencies.includes(currency)
                        ? 'Currency not supported'
                        : 'Amount out of range'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {providers.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">No external escrow providers available</p>
        </div>
      )}
    </div>
  );
};

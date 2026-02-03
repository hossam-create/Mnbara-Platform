// ============================================================
// P2P Exchange - SecurityDepositCard Component
// Display and manage security deposit
// ============================================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSecurityDeposit, useAddToSecurityDeposit } from '../../hooks/useSecurity';
import { DepositStatus, DepositSource } from '../../types/p2p-exchange.types';

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const addDepositSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  currency: z.string().min(1, 'Currency is required'),
  source: z.nativeEnum(DepositSource),
});

type AddDepositFormData = z.infer<typeof addDepositSchema>;

// ============================================================
// TYPES
// ============================================================

interface SecurityDepositCardProps {
  onAddSuccess?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const SecurityDepositCard: React.FC<SecurityDepositCardProps> = ({
  onAddSuccess,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: depositData, isLoading, isError, error } = useSecurityDeposit();
  const addToDeposit = useAddToSecurityDeposit();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddDepositFormData>({
    resolver: zodResolver(addDepositSchema),
    defaultValues: {
      currency: 'USD',
      source: DepositSource.CASH_DEPOSIT,
    },
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const onSubmit = async (data: AddDepositFormData) => {
    try {
      await addToDeposit.mutateAsync(data);
      reset();
      setShowAddForm(false);
      onAddSuccess?.();
    } catch (error) {
      console.error('Failed to add to deposit:', error);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getStatusColor = (status: DepositStatus) => {
    switch (status) {
      case DepositStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case DepositStatus.FROZEN:
        return 'bg-red-100 text-red-800';
      case DepositStatus.DEDUCTED:
        return 'bg-yellow-100 text-yellow-800';
      case DepositStatus.REFUNDED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          Error loading deposit: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const deposit = depositData?.data;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="security-deposit-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Security Deposit</h3>
        {deposit && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deposit.status)}`} data-testid="deposit-status-badge">
            {deposit.status}
          </span>
        )}
      </div>

      {deposit ? (
        <>
          {/* Deposit Information */}
          <div className="space-y-4 mb-6" data-testid="deposit-information">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg" data-testid="total-deposit-section">
              <div>
                <p className="text-sm text-blue-700">Total Deposit</p>
                <p className="text-2xl font-bold text-blue-900" data-testid="total-deposit-amount">
                  {deposit.amount} {deposit.currency}
                </p>
              </div>
              <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            {parseFloat(deposit.frozenAmount) > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg" data-testid="frozen-amount-section">
                <div>
                  <p className="text-sm text-red-700">Frozen Amount</p>
                  <p className="text-xl font-bold text-red-900" data-testid="frozen-amount">
                    {deposit.frozenAmount} {deposit.currency}
                  </p>
                  {deposit.frozenReason && (
                    <p className="text-xs text-red-600 mt-1" data-testid="frozen-reason">{deposit.frozenReason}</p>
                  )}
                </div>
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg" data-testid="available-amount-section">
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-lg font-semibold text-gray-900" data-testid="available-amount">
                  {(parseFloat(deposit.amount) - parseFloat(deposit.frozenAmount)).toFixed(2)} {deposit.currency}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg" data-testid="source-section">
                <p className="text-xs text-gray-500">Source</p>
                <p className="text-lg font-semibold text-gray-900" data-testid="deposit-source">{deposit.source}</p>
              </div>
            </div>
          </div>

          {/* Add to Deposit Button */}
          {!showAddForm && deposit.status === DepositStatus.ACTIVE && (
            <button
              onClick={() => setShowAddForm(true)}
              data-testid="add-to-deposit-button"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add to Deposit
            </button>
          )}

          {/* Add to Deposit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg" data-testid="add-deposit-form">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  id="amount"
                  data-testid="deposit-amount-input"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600" data-testid="amount-error">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  {...register('currency')}
                  id="currency"
                  data-testid="deposit-currency-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                  <option value="EGP">EGP</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600" data-testid="currency-error">{errors.currency.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  {...register('source')}
                  id="source"
                  data-testid="deposit-source-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={DepositSource.CASH_DEPOSIT}>Cash Deposit</option>
                  <option value={DepositSource.TRANSACTION_HISTORY}>Transaction History</option>
                  <option value={DepositSource.PLATFORM_FEES}>Platform Fees</option>
                  <option value={DepositSource.INITIAL_DEPOSIT}>Initial Deposit</option>
                </select>
                {errors.source && (
                  <p className="mt-1 text-sm text-red-600" data-testid="source-error">{errors.source.message}</p>
                )}
              </div>

              {addToDeposit.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-testid="add-deposit-error">
                  <p className="text-sm text-red-800">
                    Error: {addToDeposit.error instanceof Error ? addToDeposit.error.message : 'Failed to add deposit'}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={addToDeposit.isPending}
                  data-testid="submit-deposit-button"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addToDeposit.isPending ? 'Adding...' : 'Add Deposit'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    reset();
                  }}
                  disabled={addToDeposit.isPending}
                  data-testid="cancel-deposit-button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="text-center py-8" data-testid="no-deposit-section">
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">No security deposit found</p>
          <button
            onClick={() => setShowAddForm(true)}
            data-testid="create-deposit-button"
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Deposit
          </button>
        </div>
      )}
    </div>
  );
};

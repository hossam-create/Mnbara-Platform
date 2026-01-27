// ============================================================
// P2P Exchange - Exchange Request Form Component
// Form for creating new exchange requests
// ============================================================

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateExchangeRequest } from '../../hooks/useExchangeRequest';
import type { CreateExchangeRequestInput } from '../../types/p2p-exchange.types';

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const exchangeRequestSchema = z.object({
  fromCurrency: z.string().min(3, 'Currency code required').max(3),
  toCurrency: z.string().min(3, 'Currency code required').max(3),
  fromAmount: z.number().positive('Amount must be positive'),
  toAmount: z.number().positive('Amount must be positive'),
  desiredRate: z.number().positive('Rate must be positive'),
  useExternalEscrow: z.boolean().optional(),
}).refine((data) => data.fromCurrency !== data.toCurrency, {
  message: 'Currencies must be different',
  path: ['toCurrency'],
});

type ExchangeRequestFormData = z.infer<typeof exchangeRequestSchema>;

// ============================================================
// COMPONENT PROPS
// ============================================================

interface ExchangeRequestFormProps {
  onSuccess?: (request: any) => void;
  onCancel?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const ExchangeRequestForm: React.FC<ExchangeRequestFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const createRequest = useCreateExchangeRequest();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExchangeRequestFormData>({
    resolver: zodResolver(exchangeRequestSchema),
    defaultValues: {
      useExternalEscrow: false,
    },
  });

  // Watch amounts to calculate rate
  const fromAmount = watch('fromAmount');
  const toAmount = watch('toAmount');

  // Auto-calculate rate when amounts change
  React.useEffect(() => {
    if (fromAmount && toAmount) {
      const rate = toAmount / fromAmount;
      setValue('desiredRate', rate);
    }
  }, [fromAmount, toAmount, setValue]);

  const onSubmit = async (data: ExchangeRequestFormData) => {
    try {
      const result = await createRequest.mutateAsync(data);
      onSuccess?.(result.data);
    } catch (error) {
      console.error('Failed to create exchange request:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* From Currency & Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Currency
          </label>
          <select
            {...register('fromCurrency')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select currency</option>
            <option value="USD">USD</option>
            <option value="SAR">SAR</option>
            <option value="AED">AED</option>
            <option value="EGP">EGP</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          {errors.fromCurrency && (
            <p className="mt-1 text-sm text-red-600">{errors.fromCurrency.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Amount
          </label>
          <input
            type="number"
            step="0.01"
            {...register('fromAmount', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
          {errors.fromAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.fromAmount.message}</p>
          )}
        </div>
      </div>

      {/* To Currency & Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Currency
          </label>
          <select
            {...register('toCurrency')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select currency</option>
            <option value="USD">USD</option>
            <option value="SAR">SAR</option>
            <option value="AED">AED</option>
            <option value="EGP">EGP</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          {errors.toCurrency && (
            <p className="mt-1 text-sm text-red-600">{errors.toCurrency.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Amount
          </label>
          <input
            type="number"
            step="0.01"
            {...register('toAmount', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
          {errors.toAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.toAmount.message}</p>
          )}
        </div>
      </div>

      {/* Desired Rate (Auto-calculated) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exchange Rate
        </label>
        <input
          type="number"
          step="0.0001"
          {...register('desiredRate', { valueAsNumber: true })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Auto-calculated"
          readOnly
        />
        {errors.desiredRate && (
          <p className="mt-1 text-sm text-red-600">{errors.desiredRate.message}</p>
        )}
      </div>

      {/* External Escrow Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          {...register('useExternalEscrow')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Use external escrow (additional fees may apply)
        </label>
      </div>

      {/* Error Message */}
      {createRequest.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Failed to create exchange request. Please try again.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || createRequest.isPending}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || createRequest.isPending ? 'Creating...' : 'Create Request'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ExchangeRequestForm;

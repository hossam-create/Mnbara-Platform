// Payout Filters Bar Component
'use client';

import React, { useState } from 'react';
import { PayoutStatus, PayoutMethod, PayoutFilters } from '@/types/payout.types';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  filters: PayoutFilters;
  onFilterChange: (filters: Partial<PayoutFilters>) => void;
}

export default function PayoutFiltersBar({ filters, onFilterChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<PayoutFilters>(filters);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: PayoutFilters = {
      status: undefined,
      method: undefined,
      fromDate: undefined,
      toDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      search: undefined,
      limit: 50,
      offset: 0,
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: PayoutStatus.PENDING, label: 'معلق' },
    { value: PayoutStatus.APPROVED, label: 'موافق عليه' },
    { value: PayoutStatus.PROCESSING, label: 'قيد المعالجة' },
    { value: PayoutStatus.COMPLETED, label: 'مكتمل' },
    { value: PayoutStatus.REJECTED, label: 'مرفوض' },
  ];

  const methodOptions = [
    { value: '', label: 'جميع الطرق' },
    { value: PayoutMethod.BANK_TRANSFER, label: 'تحويل بنكي' },
    { value: PayoutMethod.PAYPAL, label: 'PayPal' },
    { value: PayoutMethod.STRIPE_TRANSFER, label: 'Stripe' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Main Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={localFilters.search || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, search: e.target.value })
              }
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={localFilters.status || ''}
          onChange={(e) =>
            setLocalFilters({
              ...localFilters,
              status: e.target.value as PayoutStatus | undefined,
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Method Filter */}
        <select
          value={localFilters.method || ''}
          onChange={(e) =>
            setLocalFilters({
              ...localFilters,
              method: e.target.value as PayoutMethod | undefined,
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <FunnelIcon className="h-5 w-5" />
          <span>فلاتر متقدمة</span>
        </button>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          تطبيق
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <XMarkIcon className="h-5 w-5" />
          <span>مسح</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                من تاريخ
              </label>
              <input
                type="date"
                value={
                  localFilters.fromDate
                    ? localFilters.fromDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    fromDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={
                  localFilters.toDate
                    ? localFilters.toDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    toDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحد الأدنى للمبلغ
              </label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.minAmount || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحد الأقصى للمبلغ
              </label>
              <input
                type="number"
                placeholder="∞"
                value={localFilters.maxAmount || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

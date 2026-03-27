// Admin Payout Dashboard - Main Component
'use client';

import React, { useState } from 'react';
import { PayoutStatus, PayoutMethod, PayoutFilters } from '@/types/payout.types';
import { usePayouts, usePayoutStats } from '@/hooks/usePayouts';
import PayoutStatsCards from './PayoutStatsCards';
import PayoutFiltersBar from './PayoutFiltersBar';
import PayoutTable from './PayoutTable';
import PayoutDetailsModal from './PayoutDetailsModal';

export default function PayoutDashboard() {
  const [filters, setFilters] = useState<PayoutFilters>({
    status: undefined,
    limit: 50,
    offset: 0,
  });

  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: payouts, isLoading, error } = usePayouts(filters);
  const { data: stats } = usePayoutStats();

  const handleFilterChange = (newFilters: Partial<PayoutFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handleViewDetails = (payoutId: string) => {
    setSelectedPayoutId(payoutId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayoutId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          إدارة طلبات السحب
        </h1>
        <p className="mt-2 text-gray-600">
          مراجعة والموافقة على طلبات سحب الأموال من المستخدمين
        </p>
      </div>

      {/* Stats Cards */}
      {stats && <PayoutStatsCards stats={stats} />}

      {/* Filters */}
      <PayoutFiltersBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.
          </div>
        ) : (
          <PayoutTable
            payouts={payouts || []}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>

      {/* Details Modal */}
      <PayoutDetailsModal
        payoutId={selectedPayoutId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

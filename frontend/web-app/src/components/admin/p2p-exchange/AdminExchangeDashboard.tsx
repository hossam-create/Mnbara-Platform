import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminExchangeApi } from '../../../api/p2p-exchange/admin-exchange.api';
import type { ExchangeRequest, ExchangeMatch, ProofOfPayment } from '../../../types/p2p-exchange.types';

interface DashboardStats {
  totalRequests: number;
  activeMatches: number;
  pendingProofs: number;
  completedToday: number;
  totalVolume: number;
  averageMatchTime: number;
}

export function AdminExchangeDashboard() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-exchange-stats', timeRange],
    queryFn: () => adminExchangeApi.getStatistics(timeRange),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent requests
  const { data: recentRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-recent-requests'],
    queryFn: () => adminExchangeApi.getRecentRequests(10),
    refetchInterval: 10000,
  });

  // Fetch active matches
  const { data: activeMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['admin-active-matches'],
    queryFn: () => adminExchangeApi.getActiveMatches(),
    refetchInterval: 10000,
  });

  // Fetch pending proofs
  const { data: pendingProofs = [], isLoading: proofsLoading } = useQuery({
    queryKey: ['admin-pending-proofs'],
    queryFn: () => adminExchangeApi.getPendingProofs(),
    refetchInterval: 10000,
  });

  const isLoading = statsLoading || requestsLoading || matchesLoading || proofsLoading;

  return (
    <div className="space-y-6" data-testid="admin-exchange-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم التبادل P2P</h1>
          <p className="text-sm text-gray-500 mt-1">
            مراقبة وإدارة عمليات التبادل في الوقت الفعلي
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range === 'today' && 'اليوم'}
              {range === 'week' && 'هذا الأسبوع'}
              {range === 'month' && 'هذا الشهر'}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="إجمالي الطلبات"
          value={stats?.totalRequests || 0}
          icon="📋"
          color="blue"
          isLoading={statsLoading}
        />
        <StatCard
          title="المطابقات النشطة"
          value={stats?.activeMatches || 0}
          icon="🔄"
          color="green"
          isLoading={statsLoading}
        />
        <StatCard
          title="إثباتات معلقة"
          value={stats?.pendingProofs || 0}
          icon="⏳"
          color="yellow"
          isLoading={statsLoading}
        />
        <StatCard
          title="مكتمل اليوم"
          value={stats?.completedToday || 0}
          icon="✅"
          color="green"
          isLoading={statsLoading}
        />
        <StatCard
          title="الحجم الإجمالي"
          value={`$${(stats?.totalVolume || 0).toLocaleString()}`}
          icon="💰"
          color="purple"
          isLoading={statsLoading}
        />
        <StatCard
          title="متوسط وقت المطابقة"
          value={`${stats?.averageMatchTime || 0} دقيقة`}
          icon="⏱️"
          color="indigo"
          isLoading={statsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              الطلبات الأخيرة
            </h2>
          </div>
          <div className="p-6">
            {requestsLoading ? (
              <LoadingSpinner />
            ) : recentRequests.length === 0 ? (
              <EmptyState message="لا توجد طلبات حديثة" />
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request: ExchangeRequest) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Matches */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              المطابقات النشطة
            </h2>
          </div>
          <div className="p-6">
            {matchesLoading ? (
              <LoadingSpinner />
            ) : activeMatches.length === 0 ? (
              <EmptyState message="لا توجد مطابقات نشطة" />
            ) : (
              <div className="space-y-3">
                {activeMatches.map((match: ExchangeMatch) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Proofs Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            إثباتات الدفع المعلقة
          </h2>
          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
            {pendingProofs.length} معلق
          </span>
        </div>
        <div className="p-6">
          {proofsLoading ? (
            <LoadingSpinner />
          ) : pendingProofs.length === 0 ? (
            <EmptyState message="لا توجد إثباتات معلقة" icon="✅" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProofs.map((proof: ProofOfPayment) => (
                <ProofCard key={proof.id} proof={proof} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Statistics Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo';
  isLoading?: boolean;
}

function StatCard({ title, value, icon, color, isLoading }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`text-3xl ${colorClasses[color]} rounded-lg p-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Request Card Component
function RequestCard({ request }: { request: ExchangeRequest }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {request.fromAmount} {request.fromCurrency}
          </span>
          <span className="text-gray-400">→</span>
          <span className="font-medium text-gray-900">
            {request.toAmount} {request.toCurrency}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          المستخدم: {request.userId}
        </p>
      </div>
      <StatusBadge status={request.status} />
    </div>
  );
}

// Match Card Component
function MatchCard({ match }: { match: ExchangeMatch }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            مطابقة #{match.id.slice(0, 8)}
          </span>
          <StatusBadge status={match.status} />
        </div>
        <p className="text-sm text-gray-500">
          {match.buyerUserId} ↔ {match.sellerUserId}
        </p>
      </div>
      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
        عرض التفاصيل
      </button>
    </div>
  );
}

// Proof Card Component
function ProofCard({ proof }: { proof: ProofOfPayment }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">
          إثبات #{proof.id.slice(0, 8)}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(proof.createdAt).toLocaleDateString('ar-SA')}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          المطابقة: {proof.matchId.slice(0, 8)}
        </p>
        <p className="text-sm text-gray-600">
          المرسل: {proof.senderId}
        </p>
      </div>
      <button className="mt-4 w-full bg-primary-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-primary-700 transition-colors">
        مراجعة الإثبات
      </button>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    OPEN: { label: 'مفتوح', color: 'bg-blue-100 text-blue-800' },
    MATCHED: { label: 'متطابق', color: 'bg-green-100 text-green-800' },
    PAYMENT_INITIATED: { label: 'جاري الدفع', color: 'bg-yellow-100 text-yellow-800' },
    PROOF_UPLOADED: { label: 'تم رفع الإثبات', color: 'bg-purple-100 text-purple-800' },
    COMPLETED: { label: 'مكتمل', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'ملغي', color: 'bg-red-100 text-red-800' },
    EXPIRED: { label: 'منتهي', color: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message, icon = '📭' }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <span className="text-4xl mb-2">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

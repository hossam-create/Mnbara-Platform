import React from 'react';

export type EscrowStatus =
  | 'pending_payment'
  | 'funded'
  | 'in_transit'
  | 'delivered'
  | 'released'
  | 'disputed'
  | 'refunded';

interface EscrowStep {
  key: EscrowStatus;
  label: string;
  icon: string;
}

const ESCROW_STEPS: EscrowStep[] = [
  { key: 'pending_payment', label: 'Awaiting Payment', icon: '💳' },
  { key: 'funded',          label: 'Funds Locked',    icon: '🔒' },
  { key: 'in_transit',      label: 'In Transit',      icon: '✈️'  },
  { key: 'delivered',       label: 'Delivered',       icon: '📦' },
  { key: 'released',        label: 'Funds Released',  icon: '✅' },
];

const STATUS_ORDER: EscrowStatus[] = [
  'pending_payment',
  'funded',
  'in_transit',
  'delivered',
  'released',
];

interface EscrowProgressBarProps {
  status: EscrowStatus;
  orderId?: string;
  amount?: number;
  currency?: string;
  compact?: boolean;
}

export default function EscrowProgressBar({
  status,
  orderId,
  amount,
  currency = 'USD',
  compact = false,
}: EscrowProgressBarProps) {
  const isDisputed = status === 'disputed';
  const isRefunded = status === 'refunded';
  const displaySteps = [...ESCROW_STEPS];

  const currentIndex = isDisputed || isRefunded
    ? -1
    : STATUS_ORDER.indexOf(status);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-amber-600 text-base">🔒</span>
        <div>
          <p className="text-xs font-semibold text-amber-800">Escrow Protected</p>
          {amount && (
            <p className="text-xs text-amber-600">
              {currency} {amount.toFixed(2)} held safely
            </p>
          )}
        </div>
        <span className="ml-auto text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          {status.replace('_', ' ')}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔐</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Escrow Protection</h3>
            {orderId && (
              <p className="text-xs text-gray-500">Order #{orderId}</p>
            )}
          </div>
        </div>
        {amount && (
          <div className="text-right">
            <p className="text-base font-bold text-gray-900">
              {currency} {amount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Protected</p>
          </div>
        )}
      </div>

      {/* Status Badges for special states */}
      {isDisputed && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span>⚠️</span>
          <span className="text-sm font-semibold text-red-700">Dispute In Progress</span>
        </div>
      )}
      {isRefunded && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span>↩️</span>
          <span className="text-sm font-semibold text-blue-700">Funds Refunded</span>
        </div>
      )}

      {/* Progress Steps */}
      {!isDisputed && !isRefunded && (
        <div className="relative">
          {/* Progress Track */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0">
            <div
              className="h-full bg-gradient-to-r from-[#0071DC] to-[#22c55e] transition-all duration-700"
              style={{
                width: currentIndex < 0
                  ? '0%'
                  : `${(currentIndex / (displaySteps.length - 1)) * 100}%`
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative z-10 flex justify-between">
            {displaySteps.map((step, idx) => {
              const isDone = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1" style={{ minWidth: 60 }}>
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all
                      ${isDone    ? 'bg-[#22c55e] border-[#22c55e] shadow-md' : ''}
                      ${isCurrent ? 'bg-[#0071DC] border-[#0071DC] shadow-lg scale-110' : ''}
                      ${!isDone && !isCurrent ? 'bg-white border-gray-300' : ''}
                    `}
                  >
                    {isDone ? '✓' : step.icon}
                  </div>
                  <span
                    className={`text-[10px] text-center leading-tight font-medium
                      ${isCurrent ? 'text-[#0071DC]' : isDone ? 'text-[#22c55e]' : 'text-gray-400'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

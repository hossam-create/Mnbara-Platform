// Payout Stats Cards Component
'use client';

import React from 'react';
import { PayoutStats } from '@/types/payout.types';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

interface Props {
  stats: PayoutStats;
}

export default function PayoutStatsCards({ stats }: Props) {
  const cards = [
    {
      title: 'المبلغ المعلق',
      value: `$${stats.pendingAmount.toLocaleString()}`,
      subtitle: `${stats.pendingCount} طلب`,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      title: 'تمت الموافقة اليوم',
      value: stats.approvedToday.toString(),
      subtitle: 'طلب',
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'مكتمل هذا الأسبوع',
      value: stats.completedThisWeek.toString(),
      subtitle: 'طلب',
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'إجمالي المعالج',
      value: stats.totalProcessed.toString(),
      subtitle: 'طلب',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className={`text-2xl font-bold ${card.textColor}`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

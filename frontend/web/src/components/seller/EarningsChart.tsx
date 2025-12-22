// ============================================
// 📈 Earnings Chart for Seller Dashboard
// ============================================

import { useState } from 'react';
import type { SalesDataPoint } from '../../services/seller.service';

interface EarningsChartProps {
  data: SalesDataPoint[];
  onPeriodChange?: (period: 'week' | 'month' | 'year') => void;
}

export function EarningsChart({ data, onPeriodChange }: EarningsChartProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // Calculate max value for scaling
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  // Format date label based on period
  const formatLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'month') {
      return date.toLocaleDateString('en-US', { day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</span>
            <span className="text-sm text-gray-500">{totalOrders} orders</span>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value as 'week' | 'month' | 'year')}
          className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="year">Last 12 months</option>
        </select>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <span className="text-4xl block mb-2">📊</span>
            No revenue data yet
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-end justify-between gap-2">
          {data.map((point, i) => {
            const height = (point.revenue / maxRevenue) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ${point.revenue.toLocaleString()}
                    <br />
                    {point.orders} orders
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full bg-gradient-to-t from-pink-500 to-indigo-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer min-h-[4px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{formatLabel(point.date)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EarningsChart;

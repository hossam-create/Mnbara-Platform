// ============================================
// 📊 Analytics Dashboard - Business Intelligence Center
// ============================================

import { useState } from 'react';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
}

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'user' | 'operations' | 'custom'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd' | 'all'>('30d');

  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: '$1.2M',
      change: 12.5,
      trend: 'up',
      icon: '💰',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Active Users',
      value: '45.8K',
      change: 8.3,
      trend: 'up',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Orders',
      value: '12.4K',
      change: -3.2,
      trend: 'down',
      icon: '📦',
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Conversion Rate',
      value: '4.2%',
      change: 1.8,
      trend: 'up',
      icon: '📈',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const revenueData: ChartData[] = [
    { label: 'Jan', value: 120000 },
    { label: 'Feb', value: 145000 },
    { label: 'Mar', value: 98000 },
    { label: 'Apr', value: 165000 },
    { label: 'May', value: 210000 },
    { label: 'Jun', value: 185000 },
  ];

  const userData: ChartData[] = [
    { label: 'New', value: 45 },
    { label: 'Returning', value: 35 },
    { label: 'Churned', value: 20 },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'financial' as const, label: 'Financial', icon: '💰' },
    { id: 'user' as const, label: 'User', icon: '👥' },
    { id: 'operations' as const, label: 'Operations', icon: '⚙️' },
    { id: 'custom' as const, label: 'Custom', icon: '🔧' },
  ];

  const timeRanges = [
    { id: '7d' as const, label: '7D' },
    { id: '30d' as const, label: '30D' },
    { id: '90d' as const, label: '90D' },
    { id: 'ytd' as const, label: 'YTD' },
    { id: 'all' as const, label: 'All' },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Business intelligence and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {timeRanges.map((range) => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </select>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                Export Report
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg">
                New Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center">
                  <span className="text-lg">{metric.icon}</span>
                </div>
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} {Math.abs(metric.change)}%
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>vs previous period</span>
                  <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                    {metric.trend === 'up' ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {activeTab === 'overview' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
                <div className="flex items-center gap-3">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    Daily
                  </button>
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                    Weekly
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    Monthly
                  </button>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Revenue Trend</h3>
                <div className="h-64 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📈</div>
                      <p className="text-gray-500">Revenue chart will be displayed here</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Data for {timeRange}: {revenueData.length} data points
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-3 text-xs text-gray-500">
                  {revenueData.map((item, index) => (
                    <div key={index} className="text-center">
                      <div>{item.label}</div>
                      <div className="font-medium text-gray-700">{formatNumber(item.value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">User Distribution</h3>
                  <div className="h-48 bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">👥</div>
                      <p className="text-gray-500">User distribution chart</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Conversion Funnel</h3>
                  <div className="h-48 bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔄</div>
                      <p className="text-gray-500">Conversion funnel visualization</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Revenue by Category</h3>
                  <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Revenue breakdown chart</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Expense Analysis</h3>
                  <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Expense distribution</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">User Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">User Growth</h3>
                  <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">User growth timeline</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Demographics</h3>
                  <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Demographic distribution</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Operations Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Order Processing</h3>
                  <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Order processing metrics</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Delivery Performance</h3>
                  <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Delivery timeline analysis</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Custom Reports</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Report Builder</h3>
                  <p className="text-gray-600 mb-6">Create custom analytics reports with drag-and-drop interface</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md">
                      <div className="text-2xl mb-2">📊</div>
                      <p className="font-medium">Add Metric</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md">
                      <div className="text-2xl mb-2">📈</div>
                      <p className="font-medium">Add Chart</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md">
                      <div className="text-2xl mb-2">🔍</div>
                      <p className="font-medium">Add Filter</p>
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg">
                    Create New Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all">
              <div className="text-2xl mb-2">📥</div>
              <p className="font-medium">Export Data</p>
            </button>
            <button className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all">
              <div className="text-2xl mb-2">🔄</div>
              <p className="font-medium">Refresh Data</p>
            </button>
            <button className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all">
              <div className="text-2xl mb-2">🔔</div>
              <p className="font-medium">Set Alerts</p>
            </button>
            <button className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-all">
              <div className="text-2xl mb-2">📋</div>
              <p className="font-medium">Schedule Report</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
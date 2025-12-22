// ============================================
// 🚩 Feature Flags Dashboard - Feature Management Center
// ============================================

import { useState } from 'react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production' | 'all';
  targetUsers: 'all' | 'percentage' | 'specific';
  rolloutPercentage?: number;
  targetUserIds?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  category: string;
  tags: string[];
}

interface FlagStats {
  total: number;
  enabled: number;
  disabled: number;
  byEnvironment: {
    development: number;
    staging: number;
    production: number;
  };
  recentChanges: number;
}

export function FeatureFlagsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'audit' | 'templates'>('overview');
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats: FlagStats = {
    total: 42,
    enabled: 28,
    disabled: 14,
    byEnvironment: {
      development: 18,
      staging: 12,
      production: 12,
    },
    recentChanges: 5,
  };

  const featureFlags: FeatureFlag[] = [
    {
      id: 'ff1',
      name: 'dark_mode',
      description: 'Enable dark mode theme across the application',
      enabled: true,
      environment: 'all',
      targetUsers: 'all',
      createdAt: '2025-11-15',
      updatedAt: '2025-12-20',
      createdBy: 'admin@mnbara.com',
      lastModifiedBy: 'admin@mnbara.com',
      category: 'UI/UX',
      tags: ['theme', 'ui', 'accessibility'],
    },
    {
      id: 'ff2',
      name: 'ai_recommendations',
      description: 'Show AI-powered product recommendations',
      enabled: false,
      environment: 'staging',
      targetUsers: 'percentage',
      rolloutPercentage: 25,
      createdAt: '2025-12-01',
      updatedAt: '2025-12-18',
      createdBy: 'dev@mnbara.com',
      lastModifiedBy: 'admin@mnbara.com',
      category: 'AI/ML',
      tags: ['ai', 'recommendations', 'personalization'],
    },
    {
      id: 'ff3',
      name: 'new_checkout_flow',
      description: 'New streamlined checkout experience',
      enabled: true,
      environment: 'production',
      targetUsers: 'percentage',
      rolloutPercentage: 50,
      createdAt: '2025-12-10',
      updatedAt: '2025-12-22',
      createdBy: 'product@mnbara.com',
      lastModifiedBy: 'product@mnbara.com',
      category: 'E-commerce',
      tags: ['checkout', 'conversion', 'ab-testing'],
    },
    {
      id: 'ff4',
      name: 'social_login',
      description: 'Enable social media login options',
      enabled: false,
      environment: 'development',
      targetUsers: 'specific',
      targetUserIds: ['user1', 'user2', 'user3'],
      createdAt: '2025-11-20',
      updatedAt: '2025-12-15',
      createdBy: 'dev@mnbara.com',
      lastModifiedBy: 'dev@mnbara.com',
      category: 'Authentication',
      tags: ['auth', 'social', 'login'],
    },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'manage' as const, label: 'Manage Flags', icon: '🚩', count: stats.total },
    { id: 'audit' as const, label: 'Audit Log', icon: '📋', count: stats.recentChanges },
    { id: 'templates' as const, label: 'Templates', icon: '📋' },
  ];

  const categories = [
    'UI/UX', 'AI/ML', 'E-commerce', 'Authentication', 'Performance', 'Security', 'Marketing'
  ];

  const getEnvironmentBadge = (env: FeatureFlag['environment']) => {
    const badges = {
      development: 'bg-blue-100 text-blue-700',
      staging: 'bg-yellow-100 text-yellow-700',
      production: 'bg-green-100 text-green-700',
      all: 'bg-purple-100 text-purple-700',
    };
    return badges[env];
  };

  const getStatusBadge = (enabled: boolean) => {
    return enabled 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700';
  };

  const toggleFeatureFlag = (flagId: string, enabled: boolean) => {
    // This would call an API to toggle the feature flag
    console.log(`Toggling flag ${flagId} to ${enabled}`);
    // In a real implementation, this would call: logManualDecision('FEATURE_FLAG_TOGGLE', { flagId, enabled })
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <span className="text-2xl">🚩</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
                <p className="text-gray-600">Manage feature releases and experimentation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                Export Config
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg"
              >
                New Flag
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Flags</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">🚩</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enabled</p>
                  <p className="text-2xl font-bold text-green-600">{stats.enabled}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disabled</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.disabled}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xl">❌</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Changes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.recentChanges}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
              </div>
            </div>

            {/* Environment Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-sm md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-4">By Environment</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm">🛠️</span>
                  </div>
                  <p className="text-sm text-gray-600">Development</p>
                  <p className="text-lg font-bold text-blue-600">{stats.byEnvironment.development}</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm">🧪</span>
                  </div>
                  <p className="text-sm text-gray-600">Staging</p>
                  <p className="text-lg font-bold text-yellow-600">{stats.byEnvironment.staging}</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm">🚀</span>
                  </div>
                  <p className="text-sm text-gray-600">Production</p>
                  <p className="text-lg font-bold text-green-600">{stats.byEnvironment.production}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm">
                  🎯 Target Users
                </button>
                <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm">
                  📊 View Analytics
                </button>
                <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm">
                  ⚙️ Settings
                </button>
                <button className="p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm">
                  📋 Audit Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {activeTab === 'manage' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Manage Feature Flags</h2>
                <div className="flex items-center gap-3">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>All Environments</option>
                    <option>Development</option>
                    <option>Staging</option>
                    <option>Production</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>All Categories</option>
                    {categories.map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search flags..."
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 font-medium text-gray-600">Environment</th>
                      <th className="text-left py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureFlags.map((flag) => (
                      <tr key={flag.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4">
                          <div className="font-mono text-sm font-medium text-gray-900">{flag.name}</div>
                          <div className="text-xs text-gray-500">Created: {flag.createdAt}</div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm text-gray-700 max-w-xs">{flag.description}</div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentBadge(flag.environment)}`}>
                            {flag.environment}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(flag.enabled)}`}>
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-gray-700">{flag.category}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={flag.enabled}
                                onChange={(e) => toggleFeatureFlag(flag.id, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                            <button 
                              onClick={() => setSelectedFlag(flag)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Audit Log</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Flag Audit Trail</h3>
                  <p className="text-gray-600 mb-6">Track all changes to feature flags with detailed audit logs</p>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="text-sm">
                        <span className="font-medium">admin@mnbara.com</span> enabled <code>new_checkout_flow</code>
                      </div>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="text-sm">
                        <span className="font-medium">dev@mnbara.com</span> created <code>ai_recommendations</code>
                      </div>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="text-sm">
                        <span className="font-medium">product@mnbara.com</span> changed rollout to 50%
                      </div>
                      <span className="text-xs text-gray-500">3 days ago</span>
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg">
                    View Full Audit Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Flag Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-md">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-medium text-gray-900 mb-2">Percentage Rollout</h3>
                  <p className="text-sm text-gray-600 mb-4">Gradually release features to percentage of users</p>
                  <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                    Use Template
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-md">
                  <div className="text-3xl mb-3">👥</div>
                  <h3 className="font-medium text-gray-900 mb-2">User Targeting</h3>
                  <p className="text-sm text-gray-600 mb-4">Enable features for specific users or segments</p>
                  <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                    Use Template
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-md">
                  <div className="text-3xl mb-3">🌍</div>
                  <h3 className="font-medium text-gray-900 mb-2">Geographic Rollout</h3>
                  <p className="text-sm text-gray-600 mb-4">Release features based on user location</p>
                  <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600">
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Feature Flag</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flag Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., new_checkout_flow"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  placeholder="Describe what this feature flag controls..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Development</option>
                    <option>Staging</option>
                    <option>Production</option>
                    <option>All Environments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {categories.map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Enable Flag</h3>
                  <p className="text-sm text-gray-600">Turn this feature flag on immediately</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg">
                  Create Flag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag Detail Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Flag Details</h2>
              <button 
                onClick={() => setSelectedFlag(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Name:</span> <code>{selectedFlag.name}</code></p>
                  <p><span className="text-gray-600">Environment:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getEnvironmentBadge(selectedFlag.environment)}`}>
                      {selectedFlag.environment}
                    </span>
                  </p>
                  <p><span className="text-gray-600">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedFlag.enabled)}`}>
                      {selectedFlag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </p>
                  <p><span className="text-gray-600">Category:</span> {selectedFlag.category}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Metadata</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Created:</span> {selectedFlag.createdAt} by {selectedFlag.createdBy}</p>
                  <p><span className="text-gray-600">Updated:</span> {selectedFlag.updatedAt} by {selectedFlag.lastModifiedBy}</p>
                  <p><span className="text-gray-600">Tags:</span> 
                    {selectedFlag.tags.map(tag => (
                      <span key={tag} className="ml-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedFlag.description}</p>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Edit Details
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                View Analytics
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
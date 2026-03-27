import { useState, useEffect } from 'react';
import financialGuaranteesService, { EscrowRule, DisputeRule, GuaranteePolicy } from '../../services/financialGuaranteesService';
import EscrowRulesManager from '../../components/admin/EscrowRulesManager';
import DisputeRulesManager from '../../components/admin/DisputeRulesManager';
import PoliciesManager from '../../components/admin/PoliciesManager';
import GuaranteeRulesManager from '../../components/admin/GuaranteeRulesManager';

type TabType = 'escrow' | 'disputes' | 'policies' | 'guarantees';

export default function FinancialGuarantees() {
  const [activeTab, setActiveTab] = useState<TabType>('escrow');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await financialGuaranteesService.getGuaranteesStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'escrow' as TabType, label: 'Escrow Rules', icon: '🔒' },
    { id: 'disputes' as TabType, label: 'Dispute Rules', icon: '⚖️' },
    { id: 'policies' as TabType, label: 'Buyer Protection', icon: '🛡️' },
    { id: 'guarantees' as TabType, label: 'Guarantee Rules', icon: '💰' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Financial Guarantees</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Escrow Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEscrowRules}/{stats.totalEscrowRules}</p>
                <p className="text-xs text-gray-500">Active / Total</p>
              </div>
              <div className="text-3xl">🔒</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispute Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDisputeRules}/{stats.totalDisputeRules}</p>
                <p className="text-xs text-gray-500">Active / Total</p>
              </div>
              <div className="text-3xl">⚖️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Protection Policies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePolicies}/{stats.totalPolicies}</p>
                <p className="text-xs text-gray-500">Active / Total</p>
              </div>
              <div className="text-3xl">🛡️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rules by Type</p>
                <div className="text-sm space-y-1 mt-1">
                  {Object.entries(stats.rulesByType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-gray-600">{type}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'escrow' && <EscrowRulesManager />}
          {activeTab === 'disputes' && <DisputeRulesManager />}
          {activeTab === 'policies' && <PoliciesManager />}
          {activeTab === 'guarantees' && <GuaranteeRulesManager />}
        </div>
      </div>
    </div>
  );
}

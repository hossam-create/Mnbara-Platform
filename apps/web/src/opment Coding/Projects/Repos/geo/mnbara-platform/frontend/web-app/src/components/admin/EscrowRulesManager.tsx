import { useState, useEffect } from 'react';
import financialGuaranteesService, { EscrowRule, CreateEscrowRuleData } from '../../services/financialGuaranteesService';
import EscrowRuleEditor from './EscrowRuleEditor';

export default function EscrowRulesManager() {
  const [rules, setRules] = useState<EscrowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<EscrowRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const rulesData = await financialGuaranteesService.getEscrowRules();
      setRules(rulesData);
    } catch (err) {
      setError('Failed to load escrow rules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await financialGuaranteesService.toggleEscrowRule(ruleId, enabled);
      setRules(prev => 
        prev.map(rule => 
          rule.id === ruleId ? { ...rule, enabled } : rule
        )
      );
    } catch (err) {
      setError('Failed to update escrow rule');
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this escrow rule?')) return;
    
    try {
      await financialGuaranteesService.deleteEscrowRule(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (err) {
      setError('Failed to delete escrow rule');
      console.error(err);
    }
  };

  const handleEditRule = (rule: EscrowRule) => {
    setEditingRule(rule);
    setShowEditor(true);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowEditor(true);
  };

  const handleSaveRule = async (ruleData: CreateEscrowRuleData) => {
    try {
      if (editingRule) {
        const updatedRule = await financialGuaranteesService.updateEscrowRule(editingRule.id, ruleData);
        setRules(prev => 
          prev.map(rule => rule.id === editingRule.id ? updatedRule : rule)
        );
      } else {
        const newRule = await financialGuaranteesService.createEscrowRule(ruleData);
        setRules(prev => [newRule, ...prev]);
      }
      setShowEditor(false);
      setEditingRule(null);
    } catch (err) {
      setError('Failed to save escrow rule');
      console.error(err);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TRAVEL':
        return 'Travel';
      case 'PASTE_LINK':
        return 'Paste Link';
      case 'AUCTION':
        return 'Auction';
      default:
        return type;
    }
  };

  const getReleaseConditionLabel = (condition: string) => {
    switch (condition) {
      case 'DELIVERED':
        return 'Delivered';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'TIMEOUT':
        return 'Timeout';
      default:
        return condition;
    }
  };

  if (showEditor) {
    return (
      <EscrowRuleEditor
        rule={editingRule}
        onSave={handleSaveRule}
        onCancel={() => {
          setShowEditor(false);
          setEditingRule(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Escrow Rules</h2>
        <button
          onClick={handleCreateRule}
          className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Rule
        </button>
      </div>

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

      {/* Rules Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🔒</div>
            <p className="text-gray-500">No escrow rules found</p>
            <button
              onClick={handleCreateRule}
              className="mt-4 text-brand-blue hover:underline"
            >
              Create your first escrow rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hold %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Release Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auto Release
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispute Window
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(rule.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.holdPercentage}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getReleaseConditionLabel(rule.releaseCondition)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.autoReleaseAfterDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.disputeWindowDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          rule.enabled ? 'bg-brand-blue' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            rule.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="text-brand-blue hover:text-blue-600"
                          title="Edit rule"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete rule"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

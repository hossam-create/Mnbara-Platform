import { useState, useEffect } from 'react';
import financialGuaranteesService, { DisputeRule, CreateDisputeRuleData } from '../../services/financialGuaranteesService';
import DisputeRuleEditor from './DisputeRuleEditor';

export default function DisputeRulesManager() {
  const [rules, setRules] = useState<DisputeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<DisputeRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const rulesData = await financialGuaranteesService.getDisputeRules();
      setRules(rulesData);
    } catch (err) {
      setError('Failed to load dispute rules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await financialGuaranteesService.toggleDisputeRule(ruleId, enabled);
      setRules(prev => 
        prev.map(rule => 
          rule.id === ruleId ? { ...rule, enabled } : rule
        )
      );
    } catch (err) {
      setError('Failed to update dispute rule');
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this dispute rule?')) return;
    
    try {
      await financialGuaranteesService.deleteDisputeRule(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (err) {
      setError('Failed to delete dispute rule');
      console.error(err);
    }
  };

  const handleEditRule = (rule: DisputeRule) => {
    setEditingRule(rule);
    setShowEditor(true);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowEditor(true);
  };

  const handleSaveRule = async (ruleData: CreateDisputeRuleData) => {
    try {
      if (editingRule) {
        const updatedRule = await financialGuaranteesService.updateDisputeRule(editingRule.id, ruleData);
        setRules(prev => 
          prev.map(rule => rule.id === editingRule.id ? updatedRule : rule)
        );
      } else {
        const newRule = await financialGuaranteesService.createDisputeRule(ruleData);
        setRules(prev => [newRule, ...prev]);
      }
      setShowEditor(false);
      setEditingRule(null);
    } catch (err) {
      setError('Failed to save dispute rule');
      console.error(err);
    }
  };

  const getResolutionTypeLabel = (type: string) => {
    switch (type) {
      case 'REFUND':
        return 'Full Refund';
      case 'PARTIAL':
        return 'Partial Refund';
      case 'MANUAL':
        return 'Manual Review';
      default:
        return type;
    }
  };

  const getResolutionTypeColor = (type: string) => {
    switch (type) {
      case 'REFUND':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'MANUAL':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showEditor) {
    return (
      <DisputeRuleEditor
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
        <h2 className="text-lg font-semibold text-gray-900">Dispute Rules</h2>
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
            <div className="text-gray-400 text-4xl mb-4">⚖️</div>
            <p className="text-gray-500">No dispute rules found</p>
            <button
              onClick={handleCreateRule}
              className="mt-4 text-brand-blue hover:underline"
            >
              Create your first dispute rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispute Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowed After Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolution Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
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
                      <div className="text-sm font-medium text-gray-900">{rule.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.allowedAfterStatus}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getResolutionTypeColor(rule.resolutionType)}`}>
                        {getResolutionTypeLabel(rule.resolutionType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </div>
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

      {/* Common Dispute Reasons */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">Common Dispute Reasons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'Item not delivered',
            'Wrong item received',
            'Item damaged',
            'Item not as described',
            'Delivery delay',
            'Counterfeit item'
          ].map((reason) => (
            <div key={reason} className="bg-white p-3 rounded border border-blue-200">
              <div className="text-sm font-medium text-gray-900">{reason}</div>
              <div className="text-xs text-gray-500 mt-1">Click to create rule</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

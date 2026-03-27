import { useState, useEffect } from 'react';
import financialGuaranteesService, { GuaranteePolicy, CreateGuaranteePolicyData } from '../../services/financialGuaranteesService';
import PolicyEditor from './PolicyEditor';

export default function PoliciesManager() {
  const [policies, setPolicies] = useState<GuaranteePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<GuaranteePolicy | null>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const policiesData = await financialGuaranteesService.getGuaranteePolicies();
      setPolicies(policiesData);
    } catch (err) {
      setError('Failed to load guarantee policies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePolicy = async (policyId: string, enabled: boolean) => {
    try {
      await financialGuaranteesService.toggleGuaranteePolicy(policyId, enabled);
      setPolicies(prev => 
        prev.map(policy => 
          policy.id === policyId ? { ...policy, enabled } : policy
        )
      );
    } catch (err) {
      setError('Failed to update guarantee policy');
      console.error(err);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this guarantee policy?')) return;
    
    try {
      await financialGuaranteesService.deleteGuaranteePolicy(policyId);
      setPolicies(prev => prev.filter(policy => policy.id !== policyId));
    } catch (err) {
      setError('Failed to delete guarantee policy');
      console.error(err);
    }
  };

  const handleEditPolicy = (policy: GuaranteePolicy) => {
    setEditingPolicy(policy);
    setShowEditor(true);
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setShowEditor(true);
  };

  const handleSavePolicy = async (policyData: CreateGuaranteePolicyData) => {
    try {
      if (editingPolicy) {
        const updatedPolicy = await financialGuaranteesService.updateGuaranteePolicy(editingPolicy.id, policyData);
        setPolicies(prev => 
          prev.map(policy => policy.id === editingPolicy.id ? updatedPolicy : policy)
        );
      } else {
        const newPolicy = await financialGuaranteesService.createGuaranteePolicy(policyData);
        setPolicies(prev => [newPolicy, ...prev]);
      }
      setShowEditor(false);
      setEditingPolicy(null);
    } catch (err) {
      setError('Failed to save guarantee policy');
      console.error(err);
    }
  };

  const getAppliesToLabel = (appliesTo: string) => {
    switch (appliesTo) {
      case 'BUYER':
        return 'Buyer';
      case 'SELLER':
        return 'Seller';
      default:
        return appliesTo;
    }
  };

  const getAppliesToColor = (appliesTo: string) => {
    switch (appliesTo) {
      case 'BUYER':
        return 'bg-blue-100 text-blue-800';
      case 'SELLER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showEditor) {
    return (
      <PolicyEditor
        policy={editingPolicy}
        onSave={handleSavePolicy}
        onCancel={() => {
          setShowEditor(false);
          setEditingPolicy(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Buyer Protection Policies</h2>
        <button
          onClick={handleCreatePolicy}
          className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Policy
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

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
          </div>
        ) : policies.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🛡️</div>
            <p className="text-gray-500">No guarantee policies found</p>
            <button
              onClick={handleCreatePolicy}
              className="mt-4 text-brand-blue hover:underline"
            >
              Create your first guarantee policy
            </button>
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className={`bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                policy.enabled ? 'border-gray-200' : 'border-gray-300 opacity-75'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{policy.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAppliesToColor(policy.appliesTo)}`}>
                        {getAppliesToLabel(policy.appliesTo)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditPolicy(policy)}
                      className="p-2 text-gray-600 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit policy"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(policy.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete policy"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-4">
                  {policy.description}
                </div>

                {/* Trust Badge Preview */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Trust Badge Preview</h4>
                  <div className="bg-white border border-gray-200 rounded p-3 text-center">
                    <div className="text-2xl mb-2">🛡️</div>
                    <div className="font-medium text-sm text-gray-900">{policy.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Protected by MNbarh
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(policy.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleTogglePolicy(policy.id, !policy.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      policy.enabled ? 'bg-brand-blue' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        policy.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sample Policies */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">Sample Protection Policies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Buyer Protection',
              description: 'Get a full refund if your item doesn\'t arrive, is damaged, or not as described.',
              appliesTo: 'BUYER'
            },
            {
              title: 'Seller Protection',
              description: 'Protection against fraudulent chargebacks and false claims.',
              appliesTo: 'SELLER'
            },
            {
              title: 'Authenticity Guarantee',
              description: 'All items are verified for authenticity. Counterfeit items get full refunds.',
              appliesTo: 'BUYER'
            },
            {
              title: 'Delivery Guarantee',
              description: 'On-time delivery or your money back. Late deliveries qualify for compensation.',
              appliesTo: 'BUYER'
            }
          ].map((sample, index) => (
            <div key={index} className="bg-white p-4 rounded border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">{sample.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{sample.description}</p>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAppliesToColor(sample.appliesTo)}`}>
                  {getAppliesToLabel(sample.appliesTo)}
                </span>
                <button
                  onClick={() => {
                    setEditingPolicy(null);
                    setShowEditor(true);
                    // Pre-fill with sample data (would need to pass this to editor)
                  }}
                  className="text-xs text-brand-blue hover:underline"
                >
                  Use as template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

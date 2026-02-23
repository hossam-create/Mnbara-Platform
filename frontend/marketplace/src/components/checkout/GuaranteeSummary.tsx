import { useState, useEffect } from 'react';
import guaranteesService from '../../services/guaranteesService';

interface GuaranteeSummaryProps {
  className?: string;
}

export default function GuaranteeSummary({ className = '' }: GuaranteeSummaryProps) {
  const [guarantees, setGuarantees] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuarantees = async () => {
      try {
        setLoading(true);
        const data = await guaranteesService.getGuaranteesSummary();
        setGuarantees(data);
      } catch (error) {
        console.error('Failed to fetch guarantees:', error);
        // Don't show error, just hide the summary
      } finally {
        setLoading(false);
      }
    };

    fetchGuarantees();
  }, []);

  // Don't show if loading or no guarantees
  if (loading || !guarantees?.escrow?.enabled) {
    return null;
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔒</div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 mb-2">Payment Protection Summary</h3>
          
          {/* Escrow Information */}
          <div className="space-y-2 text-sm text-green-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>
                {guarantees.escrow.holdPercentage === 100 
                  ? 'Full amount held in secure escrow' 
                  : `${guarantees.escrow.holdPercentage}% held in secure escrow`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Funds released only after {guarantees.escrow.releaseCondition.toLowerCase()}
              </span>
            </div>
            {guarantees.escrow.disputeWindowDays > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  {guarantees.escrow.disputeWindowDays}-day dispute protection window
                </span>
              </div>
            )}
            {guarantees.escrow.autoReleaseAfterDays > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  Auto-release after {guarantees.escrow.autoReleaseAfterDays} days if confirmed
                </span>
              </div>
            )}
          </div>

          {/* Protection Policies */}
          {guarantees.policies.length > 0 && (
            <div className="border-t border-green-200 pt-3">
              <p className="text-xs text-green-700 font-medium mb-2">Additional protections:</p>
              <div className="space-y-1">
                {guarantees.policies.map((policy: any, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-600 text-xs mt-0.5">•</span>
                    <div>
                      <p className="text-xs text-green-800 font-medium">{policy.title}</p>
                      <p className="text-xs text-green-600">{policy.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learn More Link */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <button className="text-xs text-green-600 hover:text-green-700 underline font-medium">
              How buyer protection works →
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-4 mt-3 text-xs text-green-600">
            <span className="font-medium">MNbarh Protected</span>
            <span>•</span>
            <span>Secure transaction</span>
            <span>•</span>
            <span>Full protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}

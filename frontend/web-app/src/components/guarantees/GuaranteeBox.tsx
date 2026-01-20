import { EscrowConfig, GuaranteePolicy } from '../../services/guaranteesService';

type GuaranteeBoxVariant = 'product' | 'checkout' | 'compact';

interface GuaranteeBoxProps {
  escrow: EscrowConfig;
  policies: GuaranteePolicy[];
  variant?: GuaranteeBoxVariant;
  loading?: boolean;
}

export default function GuaranteeBox({ 
  escrow, 
  policies, 
  variant = 'product',
  loading = false 
}: GuaranteeBoxProps) {
  // Don't show if guarantees are disabled
  if (!escrow.enabled || policies.length === 0) {
    return null;
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  const renderProductVariant = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🛡️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">Your Money is Protected</h3>
          
          {/* Main protection points */}
          <ul className="space-y-1 text-sm text-blue-800 mb-3">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                {escrow.holdPercentage === 100 
                  ? '100% payment held in escrow' 
                  : `${escrow.holdPercentage}% payment held in escrow`}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Released only after delivery confirmation</span>
            </li>
            {escrow.disputeWindowDays > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{escrow.disputeWindowDays}-day dispute window</span>
              </li>
            )}
          </ul>

          {/* Additional policies */}
          {policies.length > 0 && (
            <div className="border-t border-blue-200 pt-3 mt-3">
              <p className="text-xs text-blue-700 font-medium mb-1">Additional protections:</p>
              <div className="space-y-1">
                {policies.slice(0, 2).map((policy, index) => (
                  <p key={index} className="text-xs text-blue-600">
                    • {policy.title}
                  </p>
                ))}
                {policies.length > 2 && (
                  <p className="text-xs text-blue-600">
                    • +{policies.length - 2} more protections
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Trust indicator */}
          <div className="flex items-center gap-2 mt-3 text-xs text-blue-600">
            <span className="font-medium">MNbarh Protected</span>
            <span>•</span>
            <span>Secure transaction</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCheckoutVariant = () => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔒</div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 mb-2">Payment Protection</h3>
          
          <div className="space-y-2 text-sm text-green-800">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>
                {escrow.holdPercentage === 100 
                  ? 'Full amount held in secure escrow' 
                  : `${escrow.holdPercentage}% held in secure escrow`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Funds released only after delivery confirmation</span>
            </div>
            {escrow.disputeWindowDays > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>{escrow.disputeWindowDays}-day dispute protection</span>
              </div>
            )}
          </div>

          {/* Policy highlights */}
          {policies.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-green-700">
                Protected by: {policies.map(p => p.title).join(', ')}
              </p>
            </div>
          )}

          {/* Learn more link */}
          <button className="mt-3 text-xs text-green-600 hover:text-green-700 underline">
            How buyer protection works →
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompactVariant = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🛡️</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Protected Purchase</p>
          <p className="text-xs text-gray-600">
            {escrow.holdPercentage === 100 
              ? 'Full escrow protection' 
              : `${escrow.holdPercentage}% escrow protection`}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          {escrow.disputeWindowDays > 0 && `${escrow.disputeWindowDays}d dispute`}
        </div>
      </div>
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'checkout':
      return renderCheckoutVariant();
    case 'compact':
      return renderCompactVariant();
    case 'product':
    default:
      return renderProductVariant();
  }
}

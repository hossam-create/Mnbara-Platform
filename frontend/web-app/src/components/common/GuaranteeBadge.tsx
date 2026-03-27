import { useState, useEffect } from 'react';
import guaranteesService from '../../services/guaranteesService';

interface GuaranteeBadgeProps {
  className?: string;
  showTooltip?: boolean;
}

export default function GuaranteeBadge({ className = '', showTooltip = true }: GuaranteeBadgeProps) {
  const [guaranteesEnabled, setGuaranteesEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGuarantees = async () => {
      try {
        setLoading(true);
        const enabled = await guaranteesService.isGuaranteesEnabled();
        setGuaranteesEnabled(enabled);
      } catch (error) {
        console.error('Failed to check guarantees:', error);
        setGuaranteesEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkGuarantees();
  }, []);

  // Don't show if loading or guarantees disabled
  if (loading || !guaranteesEnabled) {
    return null;
  }

  const Badge = () => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full ${className}`}>
      <span className="text-green-600">🛡️</span>
      Protected Purchase
    </span>
  );

  if (!showTooltip) {
    return <Badge />;
  }

  return (
    <div className="group relative inline-block">
      <Badge />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium mb-1">Purchase Protection</div>
        <div className="text-gray-300">Your payment is held safely until delivery</div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

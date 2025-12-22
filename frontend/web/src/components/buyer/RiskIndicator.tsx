import React from 'react';

interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'very_high';
  score: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  level,
  score,
  className = '',
  showLabel = true,
  size = 'md',
}) => {
  const getColorConfig = (level: string) => {
    switch (level) {
      case 'low':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: '✅',
          label: 'Low Risk'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: '⚠️',
          label: 'Medium Risk'
        };
      case 'high':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200',
          icon: '🚨',
          label: 'High Risk'
        };
      case 'very_high':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: '⛔',
          label: 'Very High Risk'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: '❓',
          label: 'Unknown Risk'
        };
    }
  };

  const getSizeConfig = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'text-xs',
          score: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-3 py-2 text-base',
          icon: 'text-lg',
          score: 'text-base'
        };
      default: // md
        return {
          container: 'px-2 py-1 text-sm',
          icon: 'text-sm',
          score: 'text-sm'
        };
    }
  };

  const config = getColorConfig(level);
  const sizeConfig = getSizeConfig(size);

  return (
    <div
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeConfig.container} ${className}`}
      title={`Risk Score: ${score}/100 - ${config.label}`}
    >
      <span className={`mr-1 ${sizeConfig.icon}`}>{config.icon}</span>
      {showLabel && (
        <span className="font-medium">
          {size === 'sm' ? level.charAt(0).toUpperCase() : config.label}
        </span>
      )}
      <span className={`ml-1 font-bold ${sizeConfig.score}`}>
        {score}
      </span>
    </div>
  );
};

export default RiskIndicator;
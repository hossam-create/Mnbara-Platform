import React from 'react';

interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level, message }) => {
  const getConfig = () => {
    switch (level) {
      case 'low':
        return {
          color: 'text-green-800 bg-green-100 border-green-200',
          icon: '✅',
          label: 'Low Risk'
        };
      case 'medium':
        return {
          color: 'text-yellow-800 bg-yellow-100 border-yellow-200',
          icon: '⚠️',
          label: 'Medium Risk'
        };
      case 'high':
        return {
          color: 'text-orange-800 bg-orange-100 border-orange-200',
          icon: '🔶',
          label: 'High Risk'
        };
      case 'critical':
        return {
          color: 'text-red-800 bg-red-100 border-red-200',
          icon: '🚨',
          label: 'Critical Risk'
        };
      default:
        return {
          color: 'text-gray-800 bg-gray-100 border-gray-200',
          icon: 'ℹ️',
          label: 'Unknown Risk'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`border rounded-lg p-3 ${config.color}`}>
      <div className="flex items-start space-x-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1">
          <div className="font-medium mb-1">{config.label}</div>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default RiskIndicator;
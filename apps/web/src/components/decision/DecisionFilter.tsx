/**
 * Decision Filter Component
 * Filter listings/auctions by decision status
 */

import React from 'react';
import { DecisionStatus } from '../../types/decision.types';

export interface DecisionFilterProps {
  selectedStatus?: DecisionStatus | 'ALL';
  onStatusChange: (status: DecisionStatus | 'ALL') => void;
  showLabel?: boolean;
  compact?: boolean;
}

export const DecisionFilter: React.FC<DecisionFilterProps> = ({
  selectedStatus = 'ALL',
  onStatusChange,
  showLabel = true,
  compact = false
}) => {
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses', color: 'gray' },
    { value: DecisionStatus.APPROVED, label: 'Approved', color: 'green' },
    { value: DecisionStatus.PENDING, label: 'Pending Review', color: 'blue' },
    { value: DecisionStatus.REJECTED, label: 'Rejected', color: 'red' },
    { value: DecisionStatus.EXPIRED, label: 'Expired', color: 'yellow' }
  ];

  const getColorClasses = (color: string, isSelected: boolean): string => {
    const baseClasses = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors';
    
    if (isSelected) {
      const selectedMap: Record<string, string> = {
        gray: 'bg-gray-200 text-gray-900',
        green: 'bg-green-200 text-green-900',
        blue: 'bg-blue-200 text-blue-900',
        red: 'bg-red-200 text-red-900',
        yellow: 'bg-yellow-200 text-yellow-900'
      };
      return `${baseClasses} ${selectedMap[color] || selectedMap.gray}`;
    }
    
    const unselectedMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700 hover:bg-gray-150',
      green: 'bg-green-100 text-green-700 hover:bg-green-150',
      blue: 'bg-blue-100 text-blue-700 hover:bg-blue-150',
      red: 'bg-red-100 text-red-700 hover:bg-red-150',
      yellow: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-150'
    };
    return `${baseClasses} ${unselectedMap[color] || unselectedMap.gray}`;
  };

  if (compact) {
    return (
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as DecisionStatus | 'ALL')}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showLabel && <label className="text-sm font-medium text-gray-700">Decision Status</label>}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value as DecisionStatus | 'ALL')}
            className={getColorClasses(option.color, selectedStatus === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DecisionFilter;

/**
 * Decision Status Badge Component
 * Displays decision status with color-coded badge
 */

import React from 'react';
import { DecisionStatus, getDecisionStatusDisplay } from '../../types/decision.types';

export interface DecisionStatusBadgeProps {
  status: DecisionStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const DecisionStatusBadge: React.FC<DecisionStatusBadgeProps> = ({
  status,
  size = 'medium',
  showLabel = true
}) => {
  const display = getDecisionStatusDisplay(status);

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const colorClasses: Record<string, string> = {
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    error: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${colorClasses[display.color]}`}
      title={display.message}
    >
      <span className="text-lg">{display.icon}</span>
      {showLabel && <span>{display.label}</span>}
    </span>
  );
};

export default DecisionStatusBadge;

import React from 'react';

interface TrustBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ score, size = 'md' }) => {
  const getColorClass = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'lg': return 'text-lg px-4 py-2';
      default: return 'text-sm px-3 py-1.5';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${getColorClass(score)} ${getSizeClass()}`}>
      <span className="mr-1">🛡️</span>
      {score}%
    </span>
  );
};

export default TrustBadge;
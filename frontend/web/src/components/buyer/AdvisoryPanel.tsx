import React from 'react';

interface AdvisoryRecommendation {
  type: 'safety' | 'cost' | 'convenience' | 'trust';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  icon: string;
}

interface AdvisoryPanelProps {
  recommendations: AdvisoryRecommendation[];
  className?: string;
  onActionClick?: (action: string) => void;
}

const AdvisoryPanel: React.FC<AdvisoryPanelProps> = ({
  recommendations,
  className = '',
  onActionClick,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return '🛡️';
      case 'cost':
        return '💰';
      case 'convenience':
        return '⚡';
      case 'trust':
        return '✅';
      default:
        return '💡';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safety':
        return 'border-red-200 bg-red-50';
      case 'cost':
        return 'border-yellow-200 bg-yellow-50';
      case 'convenience':
        return 'border-green-200 bg-green-50';
      case 'trust':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">💡</span>
        Advisory Recommendations
      </h3>

      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getTypeColor(recommendation.type)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <span className="text-lg mr-2">{getTypeIcon(recommendation.type)}</span>
                <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  recommendation.priority
                )}`}
              >
                {recommendation.priority}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>

            {recommendation.action && (
              <button
                onClick={() => onActionClick?.(recommendation.action!)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {recommendation.action}
              </button>
            )}
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm">No specific recommendations needed.</p>
          <p className="text-xs">This purchase appears to be low risk.</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <span className="mr-2">ℹ️</span>
          <span>These are advisory recommendations based on our trust analysis</span>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPanel;
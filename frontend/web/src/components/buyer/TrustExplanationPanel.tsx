import React from 'react';

interface TrustScoreBreakdown {
  sellerRating: number;
  responseTime: number;
  disputeRate: number;
  verificationLevel: number;
}

interface TrustExplanationPanelProps {
  overallScore: number;
  breakdown: TrustScoreBreakdown;
  comparison?: {
    categoryAverage: number;
    platformAverage: number;
  };
  className?: string;
}

const TrustExplanationPanel: React.FC<TrustExplanationPanelProps> = ({
  overallScore,
  breakdown,
  comparison,
  className = '',
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-24 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getScoreBgColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-sm font-medium w-8 ${getScoreColor(score)}`}>
          {score}%
        </span>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">Trust Score Explanation</h3>
      
      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-2">
          <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}%
          </span>
        </div>
        <p className="text-sm text-gray-600">Overall Trust Score</p>
        
        {comparison && (
          <div className="mt-2 text-xs text-gray-500">
            Category avg: {comparison.categoryAverage}% • Platform avg: {comparison.platformAverage}%
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <ScoreBar label="Seller Rating" score={breakdown.sellerRating} />
        <ScoreBar label="Response Time" score={breakdown.responseTime} />
        <ScoreBar label="Dispute Rate" score={breakdown.disputeRate} />
        <ScoreBar label="Verification" score={breakdown.verificationLevel} />
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-1" />
            <span>90-100%: Excellent</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 rounded mr-1" />
            <span>70-89%: Good</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-100 rounded mr-1" />
            <span>50-69%: Fair</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded mr-1" />
            <span>0-49%: Poor</span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          This score is calculated based on seller history, response times, dispute rates, 
          and verification levels to help you make informed decisions.
        </p>
      </div>
    </div>
  );
};

export default TrustExplanationPanel;
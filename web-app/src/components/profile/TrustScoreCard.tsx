/**
 * TrustScoreCard Component
 * Displays user's trust score with breakdown and improvement suggestions
 */

import React, { useState } from 'react';
import type { TrustScore, TrustScoreImprovement } from '../../types/profile';
import './TrustScoreCard.css';

interface TrustScoreCardProps {
  trustScore: TrustScore;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ trustScore }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getGradeColor = (grade: string) => {
    const gradeColors: Record<string, string> = {
      'A+': '#198754',
      'A': '#20c997',
      'B+': '#0dcaf0',
      'B': '#6c757d',
      'C+': '#ffc107',
      'C': '#fd7e14',
      'D': '#dc3545',
      'F': '#dc3545',
    };
    return gradeColors[grade] || '#6c757d';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#198754';
    if (score >= 80) return '#20c997';
    if (score >= 70) return '#0dcaf0';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  const improvements: TrustScoreImprovement[] = [
    {
      area: 'Delivery Performance',
      currentScore: trustScore.breakdown.deliveryPerformance.value,
      targetScore: 95,
      actions: ['Ship items within 24 hours', 'Use tracked shipping'],
      estimatedImpact: 5,
      priority: 'high',
    },
    {
      area: 'Communication',
      currentScore: trustScore.breakdown.communication.value,
      targetScore: 95,
      actions: ['Respond to messages within 12 hours', 'Use automated responses for FAQs'],
      estimatedImpact: 3,
      priority: 'medium',
    },
    {
      area: 'Account Age',
      currentScore: trustScore.breakdown.accountAge.value,
      targetScore: 100,
      actions: ['Continue building your reputation over time'],
      estimatedImpact: 2,
      priority: 'low',
    },
  ];

  const breakdownItems = [
    { label: 'Transaction Completion', ...trustScore.breakdown.transactionCompletion },
    { label: 'Communication', ...trustScore.breakdown.communication },
    { label: 'Delivery Performance', ...trustScore.breakdown.deliveryPerformance },
    { label: 'Dispute Resolution', ...trustScore.breakdown.disputeResolution },
    { label: 'Reviews Rating', ...trustScore.breakdown.reviewsRating },
    { label: 'Account Age', ...trustScore.breakdown.accountAge },
  ];

  return (
    <div className="mnbara-trust-score-card">
      <div className="mnbara-trust-score-card__header">
        <h3 className="mnbara-trust-score-card__title">Trust Score</h3>
        <button 
          className="mnbara-trust-score-card__details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      <div className="mnbara-trust-score-card__main">
        <div 
          className="mnbara-trust-score-card__grade"
          style={{ color: getGradeColor(trustScore.grade) }}
        >
          <span className="mnbara-trust-score-card__grade-value">{trustScore.grade}</span>
          <span className="mnbara-trust-score-card__grade-label">Grade</span>
        </div>
        
        <div className="mnbara-trust-score-card__score-container">
          <svg className="mnbara-trust-score-card__circular-progress" viewBox="0 0 100 100">
            <circle 
              className="mnbara-trust-score-card__circular-bg"
              cx="50" 
              cy="50" 
              r="45"
            />
            <circle 
              className="mnbara-trust-score-card__circular-progress-bar"
              cx="50" 
              cy="50" 
              r="45"
              stroke={getScoreColor(trustScore.overall)}
              strokeDasharray={`${trustScore.overall * 2.83} 283`}
            />
          </svg>
          <div className="mnbara-trust-score-card__score-text">
            <span className="mnbara-trust-score-card__score-value">{trustScore.overall}</span>
            <span className="mnbara-trust-score-card__score-max">/ {trustScore.maxScore}</span>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mnbara-trust-score-card__details">
          <div className="mnbara-trust-score-card__breakdown">
            <h4 className="mnbara-trust-score-card__section-title">Score Breakdown</h4>
            {breakdownItems.map((item, index) => (
              <div key={index} className="mnbara-trust-score-card__breakdown-item">
                <div className="mnbara-trust-score-card__breakdown-header">
                  <span className="mnbara-trust-score-card__breakdown-label">{item.label}</span>
                  <span className="mnbara-trust-score-card__breakdown-value">{item.value}%</span>
                </div>
                <div className="mnbara-trust-score-card__breakdown-bar">
                  <div 
                    className="mnbara-trust-score-card__breakdown-progress"
                    style={{ 
                      width: `${item.value}%`,
                      backgroundColor: getScoreColor(item.value)
                    }}
                  />
                </div>
                <span className="mnbara-trust-score-card__breakdown-weight">
                  Weight: {item.weight * 100}%
                </span>
              </div>
            ))}
          </div>

          <div className="mnbara-trust-score-card__improvements">
            <h4 className="mnbara-trust-score-card__section-title">Improvement Suggestions</h4>
            {improvements.map((imp, index) => (
              <div key={index} className={`mnbara-trust-score-card__improvement-item priority-${imp.priority}`}>
                <div className="mnbara-trust-score-card__improvement-header">
                  <span className="mnbara-trust-score-card__improvement-area">{imp.area}</span>
                  <span className={`mnbara-trust-score-card__improvement-priority priority-${imp.priority}`}>
                    {imp.priority}
                  </span>
                </div>
                <div className="mnbara-trust-score-card__improvement-scores">
                  <span>Current: {imp.currentScore}%</span>
                  <span>Target: {imp.targetScore}%</span>
                  <span className="mnbara-trust-score-card__improvement-impact">
                    +{imp.estimatedImpact} pts
                  </span>
                </div>
                <ul className="mnbara-trust-score-card__improvement-actions">
                  {imp.actions.map((action, actionIndex) => (
                    <li key={actionIndex}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustScoreCard;

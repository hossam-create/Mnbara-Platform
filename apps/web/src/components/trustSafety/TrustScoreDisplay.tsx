/**
 * Trust Score Display
 * Traveler trust score visualization (visual only)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trustSafetyService, TrustScore, TrustLevel } from '../../services/trustSafetyService';
import styles from './TrustScoreDisplay.module.css';

interface TrustScoreDisplayProps {
  userId: string;
  showDetails?: boolean;
  compact?: boolean;
}

export default function TrustScoreDisplay({ 
  userId, 
  showDetails = false, 
  compact = false 
}: TrustScoreDisplayProps) {
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrustScore();
  }, [userId]);

  const loadTrustScore = async () => {
    try {
      setLoading(true);
      const score = await trustSafetyService.getTrustScore(userId);
      setTrustScore(score);
    } catch (err) {
      console.error('Failed to load trust score:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.trustScore} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          {!compact && <span>Loading trust score...</span>}
        </div>
      </div>
    );
  }

  if (!trustScore) {
    return (
      <div className={`${styles.trustScore} ${compact ? styles.compact : ''}`}>
        <div className={styles.noScore}>
          <span>Trust score unavailable</span>
        </div>
      </div>
    );
  }

  const scorePercentage = (trustScore.overallScore / 100) * 100;
  const levelColor = trustSafetyService.getTrustLevelColor(trustScore.level);

  return (
    <div className={`${styles.trustScore} ${compact ? styles.compact : ''}`}>
      {/* Compact View */}
      {compact ? (
        <div className={styles.compactScore}>
          <div 
            className={styles.scoreCircle}
            style={{ borderColor: levelColor }}
          >
            <span 
              className={styles.scoreValue}
              style={{ color: levelColor }}
            >
              {trustScoreService.formatTrustScore(trustScore.overallScore)}
            </span>
          </div>
          <div className={styles.levelBadge} style={{ backgroundColor: levelColor }}>
            {trustScore.level}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className={styles.header}>
            <h3>Trust Score</h3>
            <div className={styles.lastUpdated}>
              Updated: {new Date(trustScore.lastUpdated).toLocaleDateString()}
            </div>
          </div>

          {/* Score Circle */}
          <div className={styles.scoreVisualization}>
            <div className={styles.scoreCircle}>
              <svg className={styles.progressRing} viewBox="0 0 36 36">
                <path
                  className={styles.progressRingBackground}
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                />
                <path
                  className={styles.progressRingFill}
                  stroke={levelColor}
                  strokeDasharray={`${scorePercentage} 100`}
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                />
              </svg>
              <div className={styles.scoreContent}>
                <div 
                  className={styles.scoreValue}
                  style={{ color: levelColor }}
                >
                  {trustSafetyService.formatTrustScore(trustScore.overallScore)}
                </div>
                <div 
                  className={styles.scoreLevel}
                  style={{ color: levelColor }}
                >
                  {trustScore.level}
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          {showDetails && (
            <div className={styles.breakdown}>
              <h4>Score Breakdown</h4>
              <div className={styles.breakdownItems}>
                <div className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span>Verification</span>
                    <span>{trustScore.breakdown.verificationScore}/100</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${trustScore.breakdown.verificationScore}%`,
                        backgroundColor: trustScore.breakdown.verificationScore >= 80 ? '#10b981' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                </div>

                <div className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span>Transactions</span>
                    <span>{trustScore.breakdown.transactionScore}/100</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${trustScore.breakdown.transactionScore}%`,
                        backgroundColor: trustScore.breakdown.transactionScore >= 80 ? '#10b981' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                </div>

                <div className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span>Behavior</span>
                    <span>{trustScore.breakdown.behaviorScore}/100</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${trustScore.breakdown.behaviorScore}%`,
                        backgroundColor: trustScore.breakdown.behaviorScore >= 80 ? '#10b981' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                </div>

                <div className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span>Community</span>
                    <span>{trustScore.breakdown.communityScore}/100</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${trustScore.breakdown.communityScore}%`,
                        backgroundColor: trustScore.breakdown.communityScore >= 80 ? '#10b981' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trust Factors */}
          {showDetails && (
            <div className={styles.factors}>
              <h4>Trust Factors</h4>
              <div className={styles.factorList}>
                {trustScore.factors.map((factor, index) => (
                  <motion.div
                    key={index}
                    className={styles.factor}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={styles.factorIcon}>
                      {factor.positive ? '✓' : '⚠️'}
                    </div>
                    <div className={styles.factorContent}>
                      <div className={styles.factorType}>{factor.type}</div>
                      <div className={styles.factorDescription}>{factor.description}</div>
                      <div className={styles.factorScore}>
                        Score: {factor.score}/100 (Weight: {factor.weight * 100}%)
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Level Description */}
          <div className={styles.levelDescription}>
            <h4>Trust Level: {trustScore.level}</h4>
            <p>
              {trustScore.level === TrustLevel.VERY_HIGH && 'Excellent trust score with outstanding community standing.'}
              {trustScore.level === TrustLevel.HIGH && 'High trust score with good community standing.'}
              {trustScore.level === TrustLevel.MEDIUM && 'Moderate trust score. Continue building positive reputation.'}
              {trustScore.level === TrustLevel.LOW && 'Low trust score. Focus on improving community interactions.'}
            </p>
          </div>
        </>
      )}

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <span>Visual trust score only</span>
        </div>
      </div>
    </div>
  );
}

// Helper function (duplicate of service function for component use)
const trustScoreService = {
  formatTrustScore: (score: number): string => {
    return score.toFixed(1);
  }
};

/**
 * Verification Checklist
 * Account verification checklist for trust building (visual only)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trustSafetyService, VerificationChecklist, VerificationStatus } from '../../services/trustSafetyService';
import styles from './VerificationChecklist.module.css';

interface VerificationChecklistProps {
  userId: string;
  showProgress?: boolean;
  compact?: boolean;
}

export default function VerificationChecklist({ 
  userId, 
  showProgress = true, 
  compact = false 
}: VerificationChecklistProps) {
  const [checklist, setChecklist] = useState<VerificationChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerificationChecklist();
  }, [userId]);

  const loadVerificationChecklist = async () => {
    try {
      setLoading(true);
      const data = await trustSafetyService.getVerificationChecklist(userId);
      setChecklist(data);
    } catch (err) {
      console.error('Failed to load verification checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status: VerificationStatus): string => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return '#10b981'; // Green
      case VerificationStatus.PENDING:
        return '#f59e0b'; // Yellow
      case VerificationStatus.REJECTED:
        return '#ef4444'; // Red
      case VerificationStatus.NOT_VERIFIED:
        return '#6b7280'; // Gray
      default:
        return '#6b7280'; // Gray
    }
  };

  const getVerificationStatusLabel = (status: VerificationStatus): string => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return 'Verified';
      case VerificationStatus.PENDING:
        return 'Pending';
      case VerificationStatus.REJECTED:
        return 'Rejected';
      case VerificationStatus.NOT_VERIFIED:
        return 'Not Verified';
      default:
        return 'Unknown';
    }
  };

  const getVerificationIcon = (status: VerificationStatus): string => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return '✓';
      case VerificationStatus.PENDING:
        return '⏳';
      case VerificationStatus.REJECTED:
        return '✗';
      case VerificationStatus.NOT_VERIFIED:
        return '○';
      default:
        return '○';
    }
  };

  if (loading) {
    return (
      <div className={`${styles.checklist} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          {!compact && <span>Loading verification status...</span>}
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className={`${styles.checklist} ${compact ? styles.compact : ''}`}>
        <div className={styles.noChecklist}>
          <span>Verification checklist unavailable</span>
        </div>
      </div>
    );
  }

  const completedItems = checklist.items.filter(item => item.status === VerificationStatus.VERIFIED).length;
  const totalItems = checklist.items.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className={`${styles.checklist} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3>Verification Checklist</h3>
        <div className={styles.overallStatus}>
          <span 
            className={styles.statusBadge}
            style={{ backgroundColor: getVerificationStatusColor(checklist.overallStatus) }}
          >
            {getVerificationStatusLabel(checklist.overallStatus)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && !compact && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>Verification Progress</span>
            <span>{completedItems}/{totalItems} completed</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className={styles.progressPercentage}>
            {Math.round(progressPercentage)}%
          </div>
        </div>
      )}

      {/* Verification Items */}
      <div className={styles.verificationItems}>
        {checklist.items.map((item, index) => (
          <motion.div
            key={item.id}
            className={`${styles.verificationItem} ${compact ? styles.compactItem : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={styles.itemHeader}>
              <div className={styles.itemIcon}>
                <div 
                  className={styles.iconCircle}
                  style={{ borderColor: getVerificationStatusColor(item.status) }}
                >
                  <span 
                    className={styles.icon}
                    style={{ color: getVerificationStatusColor(item.status) }}
                  >
                    {getVerificationIcon(item.status)}
                  </span>
                </div>
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>
                  <span>{item.label}</span>
                  {item.required && (
                    <span className={styles.requiredBadge}>Required</span>
                  )}
                </div>
                <div className={styles.itemDescription}>
                  {item.description}
                </div>
              </div>
              <div className={styles.itemStatus}>
                <span 
                  className={styles.statusText}
                  style={{ color: getVerificationStatusColor(item.status) }}
                >
                  {getVerificationStatusLabel(item.status)}
                </span>
              </div>
            </div>

            {/* Item Details */}
            {!compact && (
              <div className={styles.itemDetails}>
                {item.evidence && (
                  <div className={styles.evidence}>
                    <strong>Evidence:</strong> {item.evidence}
                  </div>
                )}
                {item.verifiedAt && (
                  <div className={styles.verifiedAt}>
                    <strong>Verified:</strong> {new Date(item.verifiedAt).toLocaleDateString()}
                  </div>
                )}
                {item.expiresAt && (
                  <div className={styles.expiresAt}>
                    <strong>Expires:</strong> {new Date(item.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {item.status === VerificationStatus.NOT_VERIFIED && !compact && (
              <div className={styles.itemActions}>
                <button className={styles.verifyButton}>
                  {item.type === 'ID_VERIFICATION' && 'Verify ID'}
                  {item.type === 'ADDRESS_VERIFICATION' && 'Verify Address'}
                  {item.type === 'PHONE_VERIFICATION' && 'Verify Phone'}
                  {item.type === 'EMAIL_VERIFICATION' && 'Verify Email'}
                  {item.type === 'BACKGROUND_CHECK' && 'Run Background Check'}
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Completion Status */}
      {checklist.completedAt && !compact && (
        <div className={styles.completionStatus}>
          <div className={styles.completionIcon}>✓</div>
          <div className={styles.completionInfo}>
            <h4>Verification Completed</h4>
            <p>Completed on {new Date(checklist.completedAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <span>Visual verification only - no automated processing</span>
        </div>
      </div>
    </div>
  );
}

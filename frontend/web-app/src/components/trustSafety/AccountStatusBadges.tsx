/**
 * Account Status Badges
 * Buyer/Seller warnings and account status badges (visual only)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trustSafetyService, AccountBadge, AccountStatus, UserWarning } from '../../services/trustSafetyService';
import styles from './AccountStatusBadges.module.css';

interface AccountStatusBadgesProps {
  userId: string;
  showWarnings?: boolean;
  compact?: boolean;
}

export default function AccountStatusBadges({ 
  userId, 
  showWarnings = false, 
  compact = false 
}: AccountStatusBadgesProps) {
  const [badges, setBadges] = useState<AccountBadge[]>([]);
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountData();
  }, [userId]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const [badgesData, warningsData] = await Promise.all([
        trustSafetyService.getAccountBadges(userId),
        showWarnings ? trustSafetyService.getUserWarnings(userId) : Promise.resolve([])
      ]);
      
      setBadges(badgesData);
      setWarnings(warningsData);
    } catch (err) {
      console.error('Failed to load account data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.badges} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  const activeBadges = badges.filter(badge => badge.isActive);
  const activeWarnings = warnings.filter(warning => !warning.acknowledgedAt);

  return (
    <div className={`${styles.badges} ${compact ? styles.compact : ''}`}>
      {/* Status Badges */}
      <div className={styles.statusBadges}>
        {activeBadges.length === 0 ? (
          <div className={styles.noBadges}>
            <span>No status badges</span>
          </div>
        ) : (
          activeBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              className={styles.badge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              style={{ backgroundColor: badge.color }}
            >
              <div className={styles.badgeIcon}>
                {badge.icon}
              </div>
              {!compact && (
                <div className={styles.badgeContent}>
                  <div className={styles.badgeLabel}>{badge.label}</div>
                  <div className={styles.badgeDescription}>{badge.description}</div>
                  {badge.expiresAt && (
                    <div className={styles.badgeExpiry}>
                      Expires: {new Date(badge.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Warnings */}
      {showWarnings && activeWarnings.length > 0 && (
        <div className={styles.warnings}>
          <h4>Account Warnings</h4>
          {activeWarnings.map((warning, index) => (
            <motion.div
              key={warning.id}
              className={styles.warning}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.warningIcon}>
                ⚠️
              </div>
              <div className={styles.warningContent}>
                <div className={styles.warningType}>{warning.type}</div>
                <div className={styles.warningMessage}>{warning.message}</div>
                <div className={styles.warningMeta}>
                  <span>Severity: {warning.severity}</span>
                  <span>Issued: {new Date(warning.issuedAt).toLocaleDateString()}</span>
                  {warning.expiresAt && (
                    <span>Expires: {new Date(warning.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Account Status Summary */}
      {!compact && (
        <div className={styles.statusSummary}>
          <h4>Account Status</h4>
          <div className={styles.statusInfo}>
            {activeBadges.some(b => b.type === 'VERIFIED') && (
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>✓</span>
                <span>Verified Account</span>
              </div>
            )}
            {activeBadges.some(b => b.type === 'TRUSTED') && (
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>🛡️</span>
                <span>Trusted User</span>
              </div>
            )}
            {activeBadges.some(b => b.type === 'WARNING') && (
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>⚠️</span>
                <span>Under Review</span>
              </div>
            )}
            {activeBadges.some(b => b.type === 'SUSPENDED') && (
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>🚫</span>
                <span>Suspended</span>
              </div>
            )}
            {activeBadges.some(b => b.type === 'BANNED') && (
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>🚫</span>
                <span>Banned</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <span>Visual status only - no automated actions</span>
        </div>
      </div>
    </div>
  );
}

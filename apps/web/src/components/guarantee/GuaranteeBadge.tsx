/**
 * Guarantee Badge Component
 * Shows "Protected by MNbarh Guarantee" with color-coded guarantee levels
 * Click opens GuaranteeInfoModal
 */

import React, { useState } from 'react';
import GuaranteeInfoModal from './GuaranteeInfoModal';
import styles from './GuaranteeBadge.module.css';

export type GuaranteeLevel = 'basic' | 'full' | 'traveler';

interface GuaranteeBadgeProps {
  level: GuaranteeLevel;
  escrowStatus?: 'HELD' | 'RELEASED' | 'DISPUTED';
  showTooltip?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function GuaranteeBadge({ 
  level, 
  escrowStatus, 
  showTooltip = false, 
  size = 'medium',
  className = ''
}: GuaranteeBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getBadgeConfig = () => {
    switch (level) {
      case 'basic':
        return {
          className: styles.badgeBasic,
          icon: '🛡️',
          label: 'Basic Protection',
          description: 'Standard MNbarh Guarantee'
        };
      case 'full':
        return {
          className: styles.badgeFull,
          icon: '🔒',
          label: 'Full Protection',
          description: 'Complete MNbarh Guarantee'
        };
      case 'traveler':
        return {
          className: styles.badgeTraveler,
          icon: '✈️',
          label: 'Traveler-Backed',
          description: 'Traveler-Verified MNbarh Guarantee'
        };
      default:
        return {
          className: styles.badgeBasic,
          icon: '🛡️',
          label: 'Basic Protection',
          description: 'Standard MNbarh Guarantee'
        };
    }
  };

  const getEscrowStatusConfig = () => {
    if (!escrowStatus) return null;
    
    switch (escrowStatus) {
      case 'HELD':
        return {
          className: styles.escrowHeld,
          label: 'Funds Secured',
          icon: '🔒'
        };
      case 'RELEASED':
        return {
          className: styles.escrowReleased,
          label: 'Funds Released',
          icon: '✅'
        };
      case 'DISPUTED':
        return {
          className: styles.escrowDisputed,
          label: 'Under Review',
          icon: '⚠️'
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  const escrowConfig = getEscrowStatusConfig();

  const handleBadgeClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div 
        className={`${styles.guaranteeBadge} ${config.className} ${styles[size]} ${className}`}
        onClick={handleBadgeClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBadgeClick();
          }
        }}
        aria-label={`MNbarh Guarantee - ${config.label}. Click for details`}
      >
        <div className={styles.badgeContent}>
          <span className={styles.badgeIcon}>{config.icon}</span>
          <span className={styles.badgeText}>
            Protected by MNbarh Guarantee
          </span>
          {escrowConfig && (
            <span className={`${styles.escrowStatus} ${escrowConfig.className}`}>
              <span className={styles.escrowIcon}>{escrowConfig.icon}</span>
              <span className={styles.escrowLabel}>{escrowConfig.label}</span>
            </span>
          )}
        </div>
        
        {showTooltip && (
          <div className={styles.tooltip}>
            <div className={styles.tooltipContent}>
              <strong>{config.label}</strong>
              <p>{config.description}</p>
              <small>Click for details</small>
            </div>
          </div>
        )}
      </div>

      <GuaranteeInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        guaranteeLevel={level}
        escrowStatus={escrowStatus}
      />
    </>
  );
}

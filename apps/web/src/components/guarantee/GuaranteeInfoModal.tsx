/**
 * Guarantee Info Modal
 * Shows detailed guarantee information
 * What is covered, what is NOT covered, escrow status, dispute rules
 */

import React from 'react';
import { GuaranteeLevel } from './GuaranteeBadge';
import styles from './GuaranteeInfoModal.module.css';

interface GuaranteeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  guaranteeLevel: GuaranteeLevel;
  escrowStatus?: 'HELD' | 'RELEASED' | 'DISPUTED';
}

export default function GuaranteeInfoModal({ 
  isOpen, 
  onClose, 
  guaranteeLevel, 
  escrowStatus 
}: GuaranteeInfoModalProps) {
  const getGuaranteeConfig = () => {
    switch (guaranteeLevel) {
      case 'basic':
        return {
          title: 'Basic MNbarh Guarantee',
          icon: '🛡️',
          description: 'Standard protection for your transactions',
          coverage: [
            'Item not as described',
            'Item never received',
            'Counterfeit items',
            'Damaged during shipping'
          ],
          exclusions: [
            'Buyer remorse',
            'Minor cosmetic differences',
            'Custom items (unless defective)',
            'Digital goods after delivery'
          ],
          maxCoverage: '$1,000'
        };
      case 'full':
        return {
          title: 'Full MNbarh Guarantee',
          icon: '🔒',
          description: 'Complete protection for high-value transactions',
          coverage: [
            'All Basic coverage',
            'Late delivery',
            'Item condition issues',
            'Custom item defects',
            'Service quality issues'
          ],
          exclusions: [
            'Buyer remorse',
            'Intentional damage',
            'Unauthorized modifications',
            'Violations of terms'
          ],
          maxCoverage: '$10,000'
        };
      case 'traveler':
        return {
          title: 'Traveler-Verified MNbarh Guarantee',
          icon: '✈️',
          description: 'Enhanced protection with traveler verification',
          coverage: [
            'All Full coverage',
            'Traveler verification issues',
            'Delivery timeline breaches',
            'Service agreement violations',
            'Cross-border compliance'
          ],
          exclusions: [
            'Buyer remorse',
            'Customs delays',
            'Force majeure events',
            'Regulatory compliance issues'
          ],
          maxCoverage: '$25,000'
        };
      default:
        return {
          title: 'Basic MNbarh Guarantee',
          icon: '🛡️',
          description: 'Standard protection for your transactions',
          coverage: ['Standard coverage'],
          exclusions: ['Standard exclusions'],
          maxCoverage: '$1,000'
        };
    }
  };

  const getEscrowStatusInfo = () => {
    if (!escrowStatus) return null;

    switch (escrowStatus) {
      case 'HELD':
        return {
          status: 'Funds Secured',
          description: 'Your payment is held safely in escrow until the transaction is completed successfully.',
          icon: '🔒',
          color: '#1e40af'
        };
      case 'RELEASED':
        return {
          status: 'Funds Released',
          description: 'Funds have been released to the seller. The transaction is complete.',
          icon: '✅',
          color: '#065f46'
        };
      case 'DISPUTED':
        return {
          status: 'Under Review',
          description: 'A dispute has been opened. Funds are held while our team reviews the case.',
          icon: '⚠️',
          color: '#92400e'
        };
      default:
        return null;
    }
  };

  const config = getGuaranteeConfig();
  const escrowInfo = getEscrowStatusInfo();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <span className={styles.modalIcon}>{config.icon}</span>
            <h2 className={styles.modalTitle}>{config.title}</h2>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close guarantee information"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.description}>
            <p>{config.description}</p>
          </div>

          {escrowInfo && (
            <div className={styles.escrowStatus}>
              <div className={styles.escrowHeader}>
                <span className={styles.escrowIcon} style={{ color: escrowInfo.color }}>
                  {escrowInfo.icon}
                </span>
                <span className={styles.escrowStatusText} style={{ color: escrowInfo.color }}>
                  {escrowInfo.status}
                </span>
              </div>
              <p className={styles.escrowDescription}>
                {escrowInfo.description}
              </p>
            </div>
          )}

          <div className={styles.coverageSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>✅</span>
              What's Covered
            </h3>
            <ul className={styles.coverageList}>
              {config.coverage.map((item, index) => (
                <li key={index} className={styles.coverageItem}>
                  <span className={styles.itemIcon}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.exclusionsSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>❌</span>
              What's NOT Covered
            </h3>
            <ul className={styles.exclusionsList}>
              {config.exclusions.map((item, index) => (
                <li key={index} className={styles.exclusionItem}>
                  <span className={styles.itemIcon}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.limitsSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>💰</span>
              Coverage Limits
            </h3>
            <div className={styles.limitsContent}>
              <div className={styles.maxCoverage}>
                <span className={styles.coverageAmount}>{config.maxCoverage}</span>
                <span className={styles.coverageLabel}>Maximum Coverage</span>
              </div>
              <div className={styles.processingTime}>
                <span className={styles.timeValue}>3-5 business days</span>
                <span className={styles.timeLabel}>Typical Resolution Time</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerActions}>
            <button 
              className={styles.disputeButton}
              onClick={() => {
                window.open('/help/disputes', '_blank');
              }}
            >
              Dispute Rules
            </button>
            <button 
              className={styles.helpButton}
              onClick={() => {
                window.open('/help/guarantees', '_blank');
              }}
            >
              Help Center
            </button>
          </div>
          <div className={styles.footerNote}>
            <p>
              This guarantee is powered by MNbarh's secure escrow system and dispute resolution process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

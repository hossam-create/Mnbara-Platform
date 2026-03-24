/**
 * Refund Request Card Component
 * Visual-only refund request details with status tracking
 */

import React, { useState } from 'react';
import { RefundRequest, RefundStatus, RefundReason } from '../../types/refund.types';
import refundService from '../../services/refundService';
import RefundStatusBadge from './RefundStatusBadge';
import styles from './RefundRequestCard.module.css';

interface RefundRequestCardProps {
  refund: RefundRequest;
  showOrderLink?: boolean;
  showEvidence?: boolean;
  onEvidenceUpload?: (files: File[]) => void;
}

export default function RefundRequestCard({
  refund,
  showOrderLink = true,
  showEvidence = true,
  onEvidenceUpload
}: RefundRequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getOrderLink = () => {
    if (!refund.orderId) return null;
    return `/orders/${refund.orderId}`;
  };

  const handleEvidenceUpload = (files: File[]) => {
    setUploading(true);
    onEvidenceUpload?.(files);
    setTimeout(() => setUploading(false), 2000); // Simulate upload completion
  };

  const getStatusIcon = () => {
    switch (refund.status) {
      case RefundStatus.REQUESTED:
        return '⏳';
      case RefundStatus.UNDER_REVIEW:
        return '👁️';
      case RefundStatus.APPROVED:
        return '✅';
      case RefundStatus.REJECTED:
        return '❌';
      case RefundStatus.PROCESSING:
        return '⚙️';
      case RefundStatus.COMPLETED:
        return '✅';
      case RefundStatus.FAILED:
        return '❌';
      case RefundStatus.CANCELLED:
        return '🚫';
      default:
        return '📄';
    }
  };

  const getTimelineColor = () => {
    switch (refund.status) {
      case RefundStatus.REQUESTED:
        return '#f59e0b';
      case RefundStatus.UNDER_REVIEW:
        return '#3b82f6';
      case RefundStatus.APPROVED:
        return '#10b981';
      case RefundStatus.REJECTED:
        return '#ef4444';
      case RefundStatus.PROCESSING:
        return '#8b5cf6';
      case RefundStatus.COMPLETED:
        return '#10b981';
      case RefundStatus.FAILED:
        return '#ef4444';
      case RefundStatus.CANCELLED:
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  return (
    <div className={styles.refundRequestCard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.statusSection}>
          <div className={styles.statusIcon}>
            {getStatusIcon()}
          </div>
          <div className={styles.statusInfo}>
            <h4 className={styles.statusTitle}>
              Refund {refundService.getRefundStatusLabel(refund.status)}
            </h4>
            <RefundStatusBadge
              status={refund.status}
              type="refund"
              size="small"
            />
            <span className={styles.requestDate}>
              Requested {new Date(refund.requestedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Amount and Reason */}
      <div className={styles.amountSection}>
        <div className={styles.amount}>
          <span className={styles.amountLabel}>Refund Amount:</span>
          <span className={styles.amountValue}>
            {refundService.formatCurrency(refund.amount, refund.currency)}
          </span>
        </div>
        <div className={styles.reason}>
          <span className={styles.reasonLabel}>Reason:</span>
          <span className={styles.reasonValue}>
            {refundService.getRefundReasonLabel(refund.reason)}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className={styles.expandedContent}>
          {/* Description */}
          <div className={styles.descriptionSection}>
            <h5>Description</h5>
            <p className={styles.description}>
              {refund.description}
            </p>
          </div>

          {/* Order Link */}
          {showOrderLink && refund.orderId && (
            <div className={styles.orderSection}>
              <h5>Order Information</h5>
              <a
                href={getOrderLink()}
                className={styles.orderLink}
                title="View Order Details"
              >
                📋 Order #{refund.orderId}
              </a>
            </div>
          )}

          {/* Guarantee Reference */}
          {refund.guaranteeReference && (
            <div className={styles.guaranteeSection}>
              <h5>Guarantee Coverage</h5>
              <div className={styles.guaranteeInfo}>
                <div className={styles.guaranteeLevel}>
                  <span className={styles.guaranteeLabel}>Guarantee Level:</span>
                  <span className={styles.guaranteeValue}>
                    {refund.guaranteeReference.guaranteeLevel}
                  </span>
                </div>
                <div className={styles.guaranteePolicy}>
                  <span className={styles.guaranteeLabel}>Policy:</span>
                  <span className={styles.guaranteeValue}>
                    {refund.guaranteeReference.guaranteePolicy}
                  </span>
                </div>
                <div className={styles.coverageAmount}>
                  <span className={styles.guaranteeLabel}>Coverage Amount:</span>
                  <span className={styles.guaranteeValue}>
                    {refundService.formatCurrency(refund.guaranteeReference.coverageAmount, refund.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Processing Details */}
          {refund.processingDetails && (
            <div className={styles.processingSection}>
              <h5>Processing Details</h5>
              <div className={styles.processingInfo}>
                <div className={styles.processingMethod}>
                  <span className={styles.processingLabel}>Method:</span>
                  <span className={styles.processingValue}>
                    {refund.processingDetails.method.replace(/_/g, ' ')}
                  </span>
                </div>
                {refund.processingDetails.estimatedCompletion && (
                  <div className={styles.estimatedCompletion}>
                    <span className={styles.processingLabel}>Estimated Completion:</span>
                    <span className={styles.processingValue}>
                      {new Date(refund.processingDetails.estimatedCompletion).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {refund.processingDetails.trackingNumber && (
                  <div className={styles.trackingNumber}>
                    <span className={styles.processingLabel}>Tracking:</span>
                    <span className={styles.processingValue}>
                      {refund.processingDetails.trackingNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence */}
          {showEvidence && (
            <div className={styles.evidenceSection}>
              <h5>Evidence</h5>
              <div className={styles.evidenceInfo}>
                {refund.evidence && refund.evidence.files.length > 0 && (
                  <div className={styles.evidenceFiles}>
                    <span className={styles.evidenceLabel}>Files:</span>
                    <div className={styles.evidenceList}>
                      {refund.evidence.files.map((file, index) => (
                        <div key={file.id} className={styles.evidenceFile}>
                          <span className={styles.fileName}>{file.fileName}</span>
                          <span className={styles.fileType}>{file.fileType}</span>
                          <span className={styles.uploadDate}>
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {refund.evidence && refund.evidence.description && (
                  <div className={styles.evidenceDescription}>
                    <span className={styles.evidenceLabel}>Description:</span>
                    <p className={styles.description}>
                      {refund.evidence.description}
                    </p>
                  </div>
                )}
              </div>
              
              <div className={styles.evidenceUpload}>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleEvidenceUpload(Array.from(e.target.files));
                    }
                  }}
                  disabled={uploading}
                  className={styles.uploadInput}
                />
                <button
                  onClick={() => document.querySelector(`input[accept="image/*,.pdf,.doc,.docx"]`)?.click()}
                  disabled={uploading}
                  className={styles.uploadButton}
                >
                  {uploading ? 'Uploading...' : 'Upload Evidence'}
                </button>
              </div>
            </div>
          )}

          {/* Review Information */}
          {(refund.reviewedBy || refund.reviewedAt || refund.approvedAt || refund.rejectedAt || refund.completedAt || refund.failedAt) && (
            <div className={styles.reviewSection}>
              <h5>Review Information</h5>
              <div className={styles.reviewInfo}>
                {refund.reviewedBy && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Reviewed By:</span>
                    <span className={styles.reviewValue}>{refund.reviewedBy}</span>
                  </div>
                )}
                {refund.reviewedAt && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Reviewed At:</span>
                    <span className={styles.reviewValue}>
                      {new Date(refund.reviewedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {refund.approvedAt && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Approved At:</span>
                    <span className={styles.reviewValue}>
                      {new Date(refund.approvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {refund.rejectedAt && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Rejected At:</span>
                    <span className={styles.reviewValue}>
                      {new Date(refund.rejectedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {refund.rejectionReason && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Rejection Reason:</span>
                    <span className={styles.reviewValue}>{refund.rejectionReason}</span>
                  </div>
                )}
                {refund.completedAt && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Completed At:</span>
                    <span className={styles.reviewValue}>
                      {new Date(refund.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {refund.failedAt && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Failed At:</span>
                    <span className={styles.reviewValue}>
                      {new Date(refund.failedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

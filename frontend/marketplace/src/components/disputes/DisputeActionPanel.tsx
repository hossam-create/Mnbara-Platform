/**
 * Dispute Action Panel
 * Buyer: Submit dispute reason + evidence
 * Seller: Respond / upload proof
 * NO decisions here - Control Center authority preserved
 */

import React, { useState } from 'react';
import { Dispute, disputeService } from '../../services/disputeService';
import EvidenceUploadBox from './EvidenceUploadBox';
import EvidenceList from './EvidenceList';
import GuaranteeBadge from '../guarantee/GuaranteeBadge';
import styles from './DisputeActionPanel.module.css';

interface DisputeActionPanelProps {
  dispute: Dispute | null;
  userRole: 'BUYER' | 'SELLER';
  orderId: string;
  escrowId?: string;
  onDisputeSubmit?: (disputeData: any) => void;
  onEvidenceUpload?: (files: File[]) => void;
}

export default function DisputeActionPanel({ 
  dispute, 
  userRole, 
  orderId, 
  escrowId,
  onDisputeSubmit,
  onEvidenceUpload 
}: DisputeActionPanelProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disputeReasons = {
    BUYER: [
      'Item not as described',
      'Item never received',
      'Damaged during shipping',
      'Counterfeit item',
      'Wrong item received',
      'Item defective on arrival'
    ],
    SELLER: [
      'Buyer claims item not received',
      'Buyer claims item damaged',
      'Buyer claims wrong item',
      'Buyer claims counterfeit',
      'Return condition dispute',
      'Payment dispute'
    ]
  };

  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      alert('Please provide both reason and description for the dispute.');
      return;
    }

    if (!escrowId) {
      alert('Escrow ID is required to open a dispute.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = 'current_user_id'; // This should come from auth context

      const disputeData = {
        escrowId: escrowId,
        initiatedBy: userId,
        initiatorRole: userRole,
        reason: disputeReason,
        description: disputeDescription,
        evidence: selectedFiles.map(file => ({
          type: 'file',
          name: file.name,
          size: file.size,
          contentType: file.type
        }))
      };

      // Call backend API to open dispute
      const newDispute = await disputeService.openDispute(disputeData);
      
      if (newDispute) {
        // Reset form
        setDisputeReason('');
        setDisputeDescription('');
        setSelectedFiles([]);
        
        alert('Dispute submitted successfully. Our team will review your case.');
        
        // Notify parent component to refresh dispute data
        if (onDisputeSubmit) {
          await onDisputeSubmit(newDispute);
        }
      } else {
        alert('Failed to submit dispute. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      alert('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    if (onEvidenceUpload) {
      onEvidenceUpload(files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // If dispute already exists, show evidence upload only
  if (dispute) {
    return (
      <div className={styles.disputeActionPanel}>
        <div className={styles.header}>
          <h3>Dispute Evidence</h3>
          <div className={styles.statusInfo}>
            <span className={styles.statusText}>
              Status: {dispute.status === 'OPEN' ? 'Opened' : dispute.status === 'UNDER_REVIEW' ? 'Under Review' : 'Resolved'}
            </span>
          </div>
        </div>

        {/* Guarantee Context */}
        <div className={styles.guaranteeContext}>
          <GuaranteeBadge 
            level="full" 
            escrowStatus="DISPUTED"
            size="medium"
            className={styles.guaranteeBadge}
          />
          <div className={styles.guaranteeInfo}>
            <h4>Guarantee Coverage</h4>
            <p>This dispute is covered by MNbarh Guarantee. Potential outcomes:</p>
            <ul className={styles.outcomeList}>
              <li>🔄 <strong>Refund to Buyer</strong> - If claim is valid</li>
              <li>💰 <strong>Release to Seller</strong> - If claim is rejected</li>
              <li>⏸️ <strong>Partial Refund</strong> - If both parties valid</li>
            </ul>
          </div>
        </div>

        {/* Evidence Upload */}
        <div className={styles.evidenceSection}>
          <h4>Upload Additional Evidence</h4>
          <EvidenceUploadBox
            onFileSelect={handleFileSelect}
            maxFiles={5}
            disabled={dispute.status === 'RESOLVED'}
          />
          
          {selectedFiles.length > 0 && (
            <EvidenceList
              files={selectedFiles.map((file, index) => ({
                id: index.toString(),
                fileName: file.name,
                fileType: file.type.startsWith('image/') ? 'image' : 'document',
                uploadStatus: 'uploaded' as const,
                uploadDate: new Date().toISOString()
              }))}
              maxFiles={5}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button className={styles.contactSupport}>
            Contact Support
          </button>
          <button className={styles.viewPolicy}>
            View Dispute Policy
          </button>
        </div>
      </div>
    );
  }

  // No dispute exists - show dispute creation form
  return (
    <div className={styles.disputeActionPanel}>
      <div className={styles.header}>
        <h3>Open Dispute</h3>
        <p className={styles.subtitle}>
          Submit a dispute for review by our team
        </p>
      </div>

      {/* Guarantee Context */}
      <div className={styles.guaranteeContext}>
        <GuaranteeBadge 
          level="full" 
          escrowStatus="HELD"
          size="medium"
          className={styles.guaranteeBadge}
        />
        <div className={styles.guaranteeInfo}>
          <h4>Guarantee Coverage</h4>
          <p>This order is protected by MNbarh Guarantee. Potential outcomes:</p>
          <ul className={styles.outcomeList}>
            <li>🔄 <strong>Refund to Buyer</strong> - If claim is valid</li>
            <li>💰 <strong>Release to Seller</strong> - If claim is rejected</li>
            <li>⏸️ <strong>Partial Refund</strong> - If both parties valid</li>
          </ul>
        </div>
      </div>

      {/* Dispute Form */}
      <div className={styles.formSection}>
        <h4>Dispute Details</h4>
        
        <div className={styles.formGroup}>
          <label htmlFor="reason">Dispute Reason *</label>
          <select
            id="reason"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">Select a reason...</option>
            {disputeReasons[userRole].map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={disputeDescription}
            onChange={(e) => setDisputeDescription(e.target.value)}
            placeholder="Provide detailed information about your dispute..."
            className={styles.textarea}
            rows={4}
            required
          />
        </div>
      </div>

      {/* Evidence Upload */}
      <div className={styles.evidenceSection}>
        <h4>Supporting Evidence</h4>
        <p className={styles.evidenceHelp}>
          Upload photos, screenshots, or documents to support your dispute
        </p>
        
        <EvidenceUploadBox
          onFileSelect={handleFileSelect}
          maxFiles={5}
        />
        
        {selectedFiles.length > 0 && (
          <EvidenceList
            files={selectedFiles.map((file, index) => ({
              id: index.toString(),
              fileName: file.name,
              fileType: file.type.startsWith('image/') ? 'image' : 'document',
              uploadStatus: 'uploaded' as const,
              uploadDate: new Date().toISOString()
            }))}
            maxFiles={5}
          />
        )}
      </div>

      {/* Submit Button */}
      <div className={styles.submitSection}>
        <button
          onClick={handleDisputeSubmit}
          disabled={isSubmitting || !disputeReason.trim() || !disputeDescription.trim()}
          className={styles.submitButton}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Dispute for Review'}
        </button>
        
        <div className={styles.disclaimer}>
          <p>
            <strong>Important:</strong> Submitting a dispute will place funds on hold while our team reviews the case.
            This process typically takes 3-5 business days.
          </p>
        </div>
      </div>
    </div>
  );
}

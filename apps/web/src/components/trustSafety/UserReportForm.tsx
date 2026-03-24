/**
 * User Report Form
 * Platform safety reporting interface (visual + workflow only)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { trustSafetyService, ReportType } from '../../services/trustSafetyService';
import styles from './UserReportForm.module.css';

interface UserReportFormProps {
  reportedUserId?: string;
  reportedContentId?: string;
  reportedListingId?: string;
  onSubmit?: (report: any) => void;
}

export default function UserReportForm({ 
  reportedUserId, 
  reportedContentId, 
  reportedListingId,
  onSubmit 
}: UserReportFormProps) {
  const [formData, setFormData] = useState({
    type: ReportType.INAPPROPRIATE_CONTENT,
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    evidence: [] as File[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setError('Please provide a description for your report');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const reportData = {
        reporterId: 'current_user', // Would come from auth context
        reportedUserId,
        reportedContentId,
        reportedListingId,
        type: formData.type,
        description: formData.description,
        evidence: formData.evidence.map(file => file.name),
        priority: formData.priority
      };
      
      // Submit report (UI only)
      const report = await trustSafetyService.submitReport(reportData);
      
      if (report) {
        setSuccess(true);
        onSubmit?.(report);
        
        // Reset form after delay
        setTimeout(() => {
          setFormData({
            type: ReportType.INAPPROPRIATE_CONTENT,
            description: '',
            priority: 'MEDIUM',
            evidence: []
          });
          setSuccess(false);
        }, 3000);
      } else {
        setError('Failed to submit report. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...files].slice(0, 5) // Max 5 files
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  if (success) {
    return (
      <div className={styles.reportForm}>
        <motion.div
          className={styles.successMessage}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.successIcon}>✓</div>
          <h3>Report Submitted Successfully</h3>
          <p>Thank you for helping keep our platform safe. We will review your report shortly.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.reportForm}>
      <div className={styles.header}>
        <h2>Report Content or User</h2>
        <p>Help us maintain a safe and trustworthy community</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Report Type */}
        <div className={styles.field}>
          <label>Report Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ReportType }))}
            className={styles.select}
          >
            <option value={ReportType.INAPPROPRIATE_CONTENT}>Inappropriate Content</option>
            <option value={ReportType.FRAUDULENT_LISTING}>Fraudulent Listing</option>
            <option value={ReportType.HARASSMENT}>Harassment</option>
            <option value={ReportType.SCAM}>Scam</option>
            <option value={ReportType.VIOLATION_OF_TERMS}>Violation of Terms</option>
            <option value={ReportType.SPAM}>Spam</option>
            <option value={ReportType.IMPERSONATION}>Impersonation</option>
            <option value={ReportType.DANGEROUS_GOODS}>Dangerous Goods</option>
            <option value={ReportType.COUNTERFEIT_GOODS}>Counterfeit Goods</option>
          </select>
        </div>

        {/* Priority */}
        <div className={styles.field}>
          <label>Priority</label>
          <div className={styles.priorityOptions}>
            <label className={styles.priorityOption}>
              <input
                type="radio"
                name="priority"
                value="LOW"
                checked={formData.priority === 'LOW'}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              />
              <span className={styles.priorityLabel}>Low</span>
            </label>
            <label className={styles.priorityOption}>
              <input
                type="radio"
                name="priority"
                value="MEDIUM"
                checked={formData.priority === 'MEDIUM'}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              />
              <span className={styles.priorityLabel}>Medium</span>
            </label>
            <label className={styles.priorityOption}>
              <input
                type="radio"
                name="priority"
                value="HIGH"
                checked={formData.priority === 'HIGH'}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              />
              <span className={styles.priorityLabel}>High</span>
            </label>
            <label className={styles.priorityOption}>
              <input
                type="radio"
                name="priority"
                value="URGENT"
                checked={formData.priority === 'URGENT'}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              />
              <span className={styles.priorityLabel}>Urgent</span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label>Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Please provide detailed information about your report..."
            rows={6}
            className={styles.textarea}
            required
          />
          <div className={styles.characterCount}>
            {formData.description.length} / 1000 characters
          </div>
        </div>

        {/* Evidence Upload */}
        <div className={styles.field}>
          <label>Evidence (Optional)</label>
          <div className={styles.fileUpload}>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className={styles.fileInput}
              id="evidence-upload"
            />
            <label htmlFor="evidence-upload" className={styles.fileUploadLabel}>
              <div className={styles.uploadIcon}>📎</div>
              <div>
                <p>Click to upload or drag and drop</p>
                <span>Images, PDFs, or documents (max 5 files)</span>
              </div>
            </label>
          </div>

          {/* Uploaded Files */}
          {formData.evidence.length > 0 && (
            <div className={styles.uploadedFiles}>
              <h4>Uploaded Files:</h4>
              {formData.evidence.map((file, index) => (
                <div key={index} className={styles.uploadedFile}>
                  <span className={styles.fileName}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={styles.removeFile}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <h4>UI Only - No Automated Actions</h4>
          <p>This is a demonstration interface. No automated bans or financial actions will be taken.</p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import styles from './EvidenceUploadBox.module.css';

interface EvidenceUploadBoxProps {
  onFileSelect?: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export default function EvidenceUploadBox({ 
  onFileSelect,
  maxFiles = 5,
  disabled = false,
  className = ''
}: EvidenceUploadBoxProps) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (onFileSelect && !disabled) {
      onFileSelect(files.slice(0, maxFiles));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    
    const files = Array.from(event.dataTransfer.files);
    if (onFileSelect) {
      onFileSelect(files.slice(0, maxFiles));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className={`${styles.uploadBox} ${disabled ? styles.disabled : ''} ${className}`}>
      <div 
        className={styles.dropArea}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className={styles.uploadIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        
        <div className={styles.content}>
          <h3 className={styles.title}>Provide Supporting Evidence</h3>
          <p className={styles.description}>
            Upload screenshots, receipts, or documents to support your case.
          </p>
          
          {!disabled && (
            <p className={styles.hint}>
              Drag and drop files here, or click to browse
            </p>
          )}
          
          {disabled && (
            <p className={styles.disabledText}>
              Evidence uploads are currently disabled
            </p>
          )}
        </div>
        
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          disabled={disabled}
          className={styles.fileInput}
        />
        
        {!disabled && (
          <button className={styles.uploadButton}>
            Choose Files
          </button>
        )}
      </div>
      
      <div className={styles.footer}>
        <p className={styles.fileInfo}>
          Accepted: JPG, PNG, PDF (Max {maxFiles} files)
        </p>
        <p className={styles.reassurance}>
          Our team will review this information.
        </p>
      </div>
    </div>
  );
}

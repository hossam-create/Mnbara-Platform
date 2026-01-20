import React from 'react';
import styles from './EvidenceFileItem.module.css';

interface EvidenceFileItemProps {
  fileName: string;
  fileType: 'image' | 'pdf' | 'document';
  uploadStatus: 'uploaded' | 'pending_review';
  uploadDate?: string;
  className?: string;
}

export default function EvidenceFileItem({ 
  fileName, 
  fileType, 
  uploadStatus, 
  uploadDate,
  className = '' 
}: EvidenceFileItemProps) {
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'document':
        return '📋';
      default:
        return '📎';
    }
  };

  const getStatusConfig = () => {
    switch (uploadStatus) {
      case 'uploaded':
        return {
          text: 'Uploaded',
          color: '#10b981',
          bgColor: '#f0fdf4'
        };
      case 'pending_review':
        return {
          text: 'Pending Review',
          color: '#f59e0b',
          bgColor: '#fffbeb'
        };
      default:
        return {
          text: 'Unknown',
          color: '#6b7280',
          bgColor: '#f9fafb'
        };
    }
  };

  const icon = getFileIcon();
  const statusConfig = getStatusConfig();

  return (
    <div className={`${styles.fileItem} ${className}`}>
      <div className={styles.fileInfo}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.details}>
          <div className={styles.fileName}>{fileName}</div>
          {uploadDate && (
            <div className={styles.uploadDate}>Uploaded {uploadDate}</div>
          )}
        </div>
      </div>
      
      <div className={styles.status}>
        <div 
          className={styles.statusBadge}
          style={{
            color: statusConfig.color,
            backgroundColor: statusConfig.bgColor
          }}
        >
          {statusConfig.text}
        </div>
      </div>
    </div>
  );
}

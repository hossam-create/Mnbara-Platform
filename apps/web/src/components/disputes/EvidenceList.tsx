import React from 'react';
import EvidenceFileItem from './EvidenceFileItem';
import styles from './EvidenceList.module.css';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'document';
  uploadStatus: 'uploaded' | 'pending_review';
  uploadDate: string;
}

interface EvidenceListProps {
  files: EvidenceFile[];
  maxFiles?: number;
  className?: string;
}

export default function EvidenceList({ 
  files, 
  maxFiles = 5,
  className = '' 
}: EvidenceListProps) {
  const sortedFiles = [...files].sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  return (
    <div className={`${styles.evidenceList} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Uploaded Evidence</h3>
        <div className={styles.count}>
          {files.length} / {maxFiles} files
        </div>
      </div>
      
      {files.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📁</div>
          <p className={styles.emptyText}>
            No evidence uploaded yet
          </p>
          <p className={styles.emptyHint}>
            Upload screenshots, receipts, or documents to support your case
          </p>
        </div>
      ) : (
        <div className={styles.fileList}>
          {sortedFiles.map((file) => (
            <EvidenceFileItem
              key={file.id}
              fileName={file.fileName}
              fileType={file.fileType}
              uploadStatus={file.uploadStatus}
              uploadDate={file.uploadDate}
            />
          ))}
        </div>
      )}
      
      {files.length > 0 && (
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Uploading evidence helps resolve disputes fairly.
          </p>
          <p className={styles.reassurance}>
            Our team will review all submitted evidence.
          </p>
        </div>
      )}
    </div>
  );
}

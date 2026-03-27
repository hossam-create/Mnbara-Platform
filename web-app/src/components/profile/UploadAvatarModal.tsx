/**
 * UploadAvatarModal Component
 * Modal for uploading and cropping profile avatar
 */

import React, { useState, useRef } from 'react';
import './UploadAvatarModal.css';

interface UploadAvatarModalProps {
  currentAvatarUrl?: string;
  onClose: () => void;
  onUpload: (avatarUrl: string) => void;
}

export const UploadAvatarModal: React.FC<UploadAvatarModalProps> = ({
  currentAvatarUrl,
  onClose,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Simulate upload - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would be the URL returned from the server
      const mockUploadedUrl = URL.createObjectURL(selectedFile);
      onUpload(mockUploadedUrl);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    
    if (file) {
      const fakeEvent = {
        target: { files: [file] },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(currentAvatarUrl || null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mnbara-upload-avatar-modal-overlay" onClick={onClose}>
      <div className="mnbara-upload-avatar-modal" onClick={e => e.stopPropagation()}>
        <div className="mnbara-upload-avatar-modal__header">
          <h2 className="mnbara-upload-avatar-modal__title">Change Profile Picture</h2>
          <button className="mnbara-upload-avatar-modal__close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mnbara-upload-avatar-modal__content">
          {!selectedFile ? (
            <div 
              className="mnbara-upload-avatar-modal__dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mnbara-upload-avatar-modal__dropzone-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="mnbara-upload-avatar-modal__dropzone-text">
                Drag and drop an image here, or click to select
              </p>
              <p className="mnbara-upload-avatar-modal__dropzone-hint">
                JPEG, PNG, GIF, or WebP (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="mnbara-upload-avatar-modal__file-input"
              />
            </div>
          ) : (
            <div className="mnbara-upload-avatar-modal__preview">
              <div className="mnbara-upload-avatar-modal__preview-container">
                <img 
                  src={previewUrl || ''} 
                  alt="Preview" 
                  className="mnbara-upload-avatar-modal__preview-image"
                />
              </div>
              <p className="mnbara-upload-avatar-modal__preview-filename">
                {selectedFile.name}
              </p>
              <p className="mnbara-upload-avatar-modal__preview-size">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {error && (
            <div className="mnbara-upload-avatar-modal__error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="mnbara-upload-avatar-modal__actions">
          {selectedFile ? (
            <>
              <button 
                className="mnbara-upload-avatar-modal__btn mnbara-upload-avatar-modal__btn--secondary"
                onClick={resetSelection}
                disabled={isUploading}
              >
                Change Photo
              </button>
              <button 
                className="mnbara-upload-avatar-modal__btn mnbara-upload-avatar-modal__btn--primary"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Save Photo'}
              </button>
            </>
          ) : (
            <button 
              className="mnbara-upload-avatar-modal__btn mnbara-upload-avatar-modal__btn--primary"
              onClick={onClose}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadAvatarModal;

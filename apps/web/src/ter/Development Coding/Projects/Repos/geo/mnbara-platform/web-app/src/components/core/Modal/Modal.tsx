import React, { useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  className = '',
}) => {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const modalClassNames = [
    'mnbara-modal',
    `mnbara-modal--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return createPortal(
    <div className="mnbara-modal-overlay" onClick={handleOverlayClick}>
      <div className={modalClassNames} role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
        {(title || showCloseButton) && (
          <div className="mnbara-modal-header">
            {title && (
              <h2 id="modal-title" className="mnbara-modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="mnbara-modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="mnbara-modal-content">{children}</div>
        {footer && <div className="mnbara-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;

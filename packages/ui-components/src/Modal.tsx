import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  portalTarget?: HTMLElement;
}

export interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> & { Header: React.FC<ModalHeaderProps>; Body: React.FC<ModalBodyProps>; Footer: React.FC<ModalFooterProps> } = ({
  isOpen, onClose, children, size = 'md', closeOnOverlayClick = true, closeOnEscape = true, portalTarget,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [portalContainer] = useState(() => {
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.setAttribute('data-modal-container', 'true');
      return container;
    }
    return null;
  });

  useEffect(() => {
    if (!portalContainer) return;

    const target = portalTarget || document.body;
    target.appendChild(portalContainer);

    return () => {
      if (target.contains(portalContainer)) {
        target.removeChild(portalContainer);
      }
    };
  }, [portalContainer, portalTarget]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Add event listener for escape key
      document.addEventListener('keydown', handleEscape);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal for accessibility
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current && document.body.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || !portalContainer) return null;

  const sizeStyles = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      role="dialog" 
      aria-modal="true"
      ref={modalRef}
      tabIndex={-1}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div className={`relative bg-white rounded-xl shadow-xl ${sizeStyles[size]} w-full transform transition-all`}>
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside the DOM hierarchy
  return createPortal(modalContent, portalContainer);
};

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end gap-3 ${className}`}>{children}</div>;
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

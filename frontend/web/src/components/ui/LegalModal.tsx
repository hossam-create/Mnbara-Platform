import { useState, useRef, useEffect } from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
  type: 'terms' | 'privacy' | 'disclaimer';
}

export default function LegalModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  content, 
  type 
}: LegalModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHasScrolled(false);
      // Reset scroll position when modal opens
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setHasScrolled(scrolledToBottom);
    }
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'terms': return '📋';
      case 'privacy': return '🔒';
      case 'disclaimer': return '⚠️';
      default: return '📄';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-gray-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getIcon()}</span>
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="prose prose-slate max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: content }}
              className="text-gray-700 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="scroll-confirm"
                checked={hasScrolled}
                readOnly
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="scroll-confirm" className="text-sm text-gray-600">
                {hasScrolled 
                  ? "I've read and understand this document"
                  : 'Please read through the document to continue'
                }
              </label>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Close
              </button>
              <button
                onClick={onConfirm}
                disabled={!hasScrolled}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
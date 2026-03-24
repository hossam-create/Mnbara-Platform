import React from 'react';
import { useControlCenterTheme } from '../../../contexts/ControlCenterThemeContext';

interface HologramPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  flicker?: boolean;
}

export const HologramPanel: React.FC<HologramPanelProps> = ({ 
  children, 
  title, 
  className = '',
  flicker = false 
}) => {
  const { theme, colors } = useControlCenterTheme();

  const getThemeClasses = () => {
    switch (theme) {
      case 'cyberpunk':
        return 'border border-neon-blue bg-[var(--cyber-grid)] shadow-[0_0_10px_rgba(0,243,255,0.2)]';
      case 'egyptian':
        return 'border border-egypt-gold bg-[rgba(20,20,10,0.85)] decoration-egypt-gold';
      case 'hacker':
        return 'border border-green-500 bg-black font-mono';
      default:
        return 'border border-slate-700 bg-[var(--ship-panel)] backdrop-blur-md';
    }
  };

  return (
    <div 
      className={`
        relative rounded-xl overflow-hidden p-1
        transition-all duration-500
        ${getThemeClasses()}
        ${flicker ? 'animate-[holographic-flicker_4s_infinite]' : ''}
        ${className}
      `}
    >
      {/* Scanline overlay */}
      {(theme === 'cyberpunk' || theme === 'hacker') && (
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-0" />
      )}

      {/* Header */}
      {title && (
        <div 
          className="relative z-10 flex items-center justify-between px-4 py-2 border-b mb-2"
          style={{ borderColor: theme === 'cyberpunk' ? 'var(--neon-blue)' : theme === 'egyptian' ? 'var(--egypt-gold)' : colors.secondary }}
        >
          <h3 
            className="uppercase tracking-[0.2em] text-xs font-bold"
            style={{ color: colors.accent }}
          >
            {title}
          </h3>
          <div className="flex gap-1">
            <div className={`w-2 h-2 rounded-full ${theme === 'hacker' ? 'bg-green-500' : 'bg-current'} opacity-50`} />
            <div className={`w-2 h-2 rounded-full ${theme === 'hacker' ? 'bg-green-500' : 'bg-current'} opacity-30`} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-4">
        {children}
      </div>

      {/* Corner Accents */}
      {(theme === 'modern' || theme === 'cyberpunk') && (
        <>
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-current opacity-30" style={{ color: colors.primary }} />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-current opacity-30" style={{ color: colors.primary }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-current opacity-30" style={{ color: colors.primary }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-current opacity-30" style={{ color: colors.primary }} />
        </>
      )}
    </div>
  );
};

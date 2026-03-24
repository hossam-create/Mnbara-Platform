import React from 'react';
import { useControlCenterTheme } from '../../../contexts/ControlCenterThemeContext';

interface HexButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  glow?: boolean;
}

export const HexButton: React.FC<HexButtonProps> = ({ 
  children, 
  icon, 
  variant = 'primary', 
  glow = false,
  className = '',
  ...props 
}) => {
  const { theme, colors } = useControlCenterTheme();
  
  const getVariantStyles = () => {
    switch(variant) {
      case 'primary': return `text-black font-bold`;
      case 'secondary': return `text-white bg-opacity-20`;
      case 'danger': return `text-white bg-opacity-80`;
      case 'ghost': return `bg-transparent border border-current`;
      default: return '';
    }
  };

  const getThemeGlow = () => {
    if (!glow) return '';
    if (theme === 'cyberpunk') return 'hover:shadow-[0_0_15px_var(--neon-blue)] border-neon-blue';
    if (theme === 'egyptian') return 'hover:shadow-[0_0_15px_var(--egypt-gold)] border-egypt-gold';
    return 'hover:shadow-lg';
  };

  // Inline styles for dynamic colors
  const buttonStyle: React.CSSProperties = {
    backgroundColor: variant === 'primary' ? colors.primary : 
                     variant === 'danger' ? colors.danger : 
                     variant === 'secondary' ? colors.secondary : 'transparent',
    color: variant === 'primary' ? theme === 'cyberpunk' ? '#000' : '#fff' : colors.text,
    borderColor: colors.accent,
    clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)'
  };

  return (
    <button
      style={buttonStyle}
      className={`
        relative overflow-hidden px-8 py-3 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0
        uppercase tracking-widest text-sm font-mono
        flex items-center gap-2
        ${getThemeGlow()}
        ${className}
      `}
      {...props}
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-white opacity-20" />
      <div className="absolute bottom-0 right-0 w-[4px] h-[4px] bg-white opacity-40" />
      
      {icon && <span className="text-lg">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

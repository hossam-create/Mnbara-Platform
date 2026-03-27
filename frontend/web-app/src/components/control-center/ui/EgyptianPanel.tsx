import React from 'react';
import { useControlCenterTheme } from '../../../contexts/ControlCenterThemeContext';

interface EgyptianPanelProps {
  children: React.ReactNode;
  headerIcon?: React.ReactNode;
  title?: string;
}

export const EgyptianPanel: React.FC<EgyptianPanelProps> = ({ children, headerIcon, title }) => {
  const { theme } = useControlCenterTheme();
  
  // Fallback to HologramPanel if not egyptian theme, but this component is specifically for decorative egyptian panels
  if (theme !== 'egyptian') {
     return <div className="p-4 border border-gray-700 rounded">{children}</div>;
  }

  return (
    <div className="relative p-[2px] bg-gradient-to-b from-[#ffd700] via-transparent to-[#ffd700] rounded-tl-3xl rounded-br-3xl">
      <div className="bg-[#0a0a05] h-full w-full rounded-tl-[22px] rounded-br-[22px] relative overflow-hidden">
        {/* Hieroglyph Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/hieroglyphs.png')] bg-repeat" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 p-4 border-b border-[#ffd700] border-opacity-30">
          {headerIcon && <div className="text-[#ffd700] drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">{headerIcon}</div>}
          {title && <h3 className="text-[#ffd700] font-serif tracking-widest text-lg uppercase">{title}</h3>}
          <div className="ml-auto w-16 h-[2px] bg-[#ffd700]" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 text-[#f5e6d3]">
          {children}
        </div>

        {/* Decorative Corners */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#ffd700]" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#ffd700]" />
      </div>
    </div>
  );
};

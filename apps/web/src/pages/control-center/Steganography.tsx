import React, { useState } from 'react';
import { HologramPanel } from '../../components/control-center/ui/HologramPanel';
import { HexButton } from '../../components/control-center/ui/HexButton';
import { useControlCenterTheme } from '../../contexts/ControlCenterThemeContext';

export default function Steganography() {
  const { colors, theme } = useControlCenterTheme();
  const [mode, setMode] = useState<'embed' | 'extract'>('embed');
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-center gap-4">
        <HexButton 
          variant={mode === 'embed' ? 'primary' : 'ghost'} 
          onClick={() => setMode('embed')}
        >
          EMBED DATA
        </HexButton>
        <HexButton 
          variant={mode === 'extract' ? 'primary' : 'ghost'} 
          onClick={() => setMode('extract')}
        >
          EXTRACT DATA
        </HexButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {/* Input Media */}
        <HologramPanel title="Source Media">
          <div 
            className={`
              h-64 border-2 border-dashed rounded-xl flex items-center justify-center
              transition-all duration-300
              ${dragActive ? 'border-green-500 bg-green-500/10' : 'border-gray-600 hover:border-gray-400'}
            `}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
          >
            <div className="text-center opacity-50">
              <div className="text-4xl mb-2">📁</div>
              <p>DROP IMAGE / AUDIO / VIDEO</p>
            </div>
          </div>
        </HologramPanel>

        {/* Configuration */}
        <HologramPanel title={mode === 'embed' ? 'Payload Configuration' : 'Extraction Keys'}>
          <div className="space-y-6">
            <div>
              <label className="text-xs uppercase opacity-70 block mb-2">Algorithm</label>
              <div className="flex gap-2">
                {['LSB', 'DCT', 'Fractal'].map(algo => (
                  <button key={algo} className="px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-xs">
                    {algo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase opacity-70 block mb-2">Encryption Key (AES-256)</label>
              <input 
                type="password" 
                className="w-full bg-black/20 border border-white/10 rounded p-2 outline-none focus:border-current transition-colors"
                style={{ borderColor: colors.primary }}
                placeholder="Enter secret key..."
              />
            </div>

            {mode === 'embed' && (
              <div>
                <label className="text-xs uppercase opacity-70 block mb-2">Secret Message / File</label>
                <textarea 
                  className="w-full h-32 bg-black/20 border border-white/10 rounded p-2 outline-none focus:border-current transition-colors resize-none"
                  style={{ borderColor: colors.primary }}
                  placeholder="Enter the data to hide..."
                />
              </div>
            )}

            <div className="pt-4">
               <HexButton glow className="w-full justify-center">
                 {mode === 'embed' ? 'INITIATE HIDING SEQUENCE' : 'ATTEMPT EXTRACTION'}
               </HexButton>
            </div>
          </div>
        </HologramPanel>
      </div>

      {theme === 'egyptian' && (
        <div className="text-center opacity-40 font-serif tracking-[0.5em] text-[#ffd700]">
          THE HIDDEN TRUTH REVEALS ITSELF
        </div>
      )}
    </div>
  );
}

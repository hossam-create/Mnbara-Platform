import React, { useState, useEffect, useRef } from 'react';
import { useControlCenterTheme } from '../../../contexts/ControlCenterThemeContext';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
}

interface CommandTerminalProps {
  initialLines?: string[];
  onCommand?: (cmd: string) => string | void;
  className?: string;
  minimized?: boolean;
}

export const CommandTerminal: React.FC<CommandTerminalProps> = ({ 
  initialLines = [], 
  onCommand,
  className = '',
  minimized = false
}) => {
  const { theme } = useControlCenterTheme();
  const [lines, setLines] = useState<TerminalLine[]>(
    initialLines.map(l => ({ type: 'output', content: l }))
  );
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      const newLine: TerminalLine = { type: 'input', content: input };
      setLines(prev => [...prev, newLine]);
      
      // Simulate processing
      setTimeout(() => {
        let response = 'Command not recognized.';
        if (onCommand) {
          const res = onCommand(input);
          if (res) response = res;
        } else {
          // Default mock responses
          if (input === 'help') response = 'Available commands: status, scan, clear, deploy';
          if (input === 'status') response = 'System All Green. 0 threats detected.';
          if (input === 'clear') {
             setLines([]);
             return;
          }
        }
        setLines(prev => [...prev, { type: 'success', content: response }]);
      }, 300);

      setInput('');
    }
  };

  if (minimized) return null;

  return (
    <div className={`
      font-mono text-sm p-4 rounded-lg
      ${theme === 'hacker' ? 'bg-black text-green-500 border border-green-800' : 'bg-slate-900 text-slate-300 border border-slate-700'}
      shadow-2xl overflow-hidden
      flex flex-col
      ${className}
    `}>
      <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-hide space-y-1">
        {lines.map((line, i) => (
          <div key={i} className={`
            ${line.type === 'input' ? 'text-white opacity-70' : ''}
            ${line.type === 'error' ? 'text-red-500' : ''}
            ${line.type === 'success' ? (theme === 'hacker' ? 'text-green-400' : 'text-cyan-400') : ''}
          `}>
            {line.type === 'input' ? '> ' : ''}{line.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      <div className="flex items-center mt-2 border-t border-white/10 pt-2">
        <span className="text-green-500 mr-2">$</span>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none flex-1 text-white placeholder-gray-600"
          placeholder="Enter command..."
          autoFocus={!minimized}
        />
      </div>
    </div>
  );
};

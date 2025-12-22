import { useState, useEffect, useRef } from 'react';
import { useComms } from '../../context/CommsContext';
import { useSecurity } from '../../context/SecurityContext';

export default function Intercom() {
  const { channels, activeChannel, setActiveChannel, messages, sendMessage } = useComms();
  const { role } = useSecurity();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeChannel]);

  // Filter messages for active channel
  const currentMessages = messages.filter(m => m.channelId === activeChannel);

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) return;
      sendMessage(inputText);
      setInputText('');
  };

  if (!role) return null; // Logic check: only logged in staff see this

  return (
    <>
        {/* Minimized Trigger */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-4 right-20 z-[90] p-4 rounded-full shadow-2xl transition-all hover:scale-110 ${isOpen ? 'bg-cyan-600 rotate-90' : 'bg-slate-800 border border-cyan-500/30'}`}
        >
            <span className="text-xl">{isOpen ? '✖️' : '💬'}</span>
            {!isOpen && messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                    {messages.length > 9 ? '9+' : messages.length}
                </span>
            )}
        </button>

        {/* The Chat Window */}
        <div className={`fixed bottom-24 right-8 w-96 h-[500px] z-[90] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
            
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">MNBARA <span className="text-cyan-500">NEXUS</span></h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-slate-500 uppercase">Secure Link Established</span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-600 font-mono">{role}</div>
            </div>

            {/* Layout: Sidebar + Chat */}
            <div className="flex-1 flex overflow-hidden">
                {/* Channel List Sidebar */}
                <div className="w-24 bg-slate-950/50 border-r border-slate-800 flex flex-col py-2">
                    {channels.map(ch => (
                        <button 
                            key={ch.id}
                            onClick={() => setActiveChannel(ch.id)}
                            className={`p-2 mx-2 mb-1 rounded text-[10px] font-bold text-left truncate transition-colors ${activeChannel === ch.id ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-900' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {ch.name}
                        </button>
                    ))}
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col bg-slate-900/30">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {currentMessages.length === 0 && (
                            <div className="text-center text-slate-600 text-xs mt-10">No messages in {activeChannel} yet.</div>
                        )}
                        {currentMessages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                                <div className={'flex items-baseline gap-2 mb-1'}>
                                    <span className={`text-[10px] font-bold ${msg.sender === 'You' ? 'text-cyan-400' : 'text-slate-400'}`}>{msg.sender}</span>
                                    <span className="text-[8px] text-slate-600">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className={`p-2 rounded-lg text-xs max-w-[90%] break-words shadow-sm ${
                                    msg.isSystem ? 'bg-red-900/20 border border-red-500/30 text-red-200 w-full text-center' :
                                    msg.sender === 'You' ? 'bg-cyan-600 text-white rounded-tr-none' : 
                                    'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800">
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={`Message ${activeChannel}...`}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                        />
                    </form>
                </div>
            </div>
        </div>
    </>
  );
}

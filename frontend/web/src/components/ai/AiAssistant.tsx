// ============================================
// 🤖 Mnbara AI Shopping & Support Assistant
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'product_card' | 'support_card';
  content: string;
  data?: any;
  timestamp: Date;
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'shopping' | 'support'>('shopping'); // New: Dual Mode
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m Mnbara AI. 👋 I can help you find products OR answer your support questions. What do you need?',
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing & response
    setTimeout(() => {
      const aiResponse = mode === 'shopping' ? generateShoppingResponse(input) : generateSupportResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // 🛍️ Shopping Logic
  const generateShoppingResponse = (query: string): Message => {
    const q = query.toLowerCase();
    
    // Detect intent to switch to support
    if (q.includes('help') || q.includes('problem') || q.includes('refund') || q.includes('issue')) {
         setMode('support');
         return {
            id: Date.now().toString(),
            type: 'ai',
            content: 'I see you might have an issue. I\'m switching to Support Mode 🛡️. How can I assist you with your order or account?',
            timestamp: new Date(),
         };
    }

    if (q.includes('iphone') || q.includes('phone') || q.includes('mobile')) {
      return {
        id: Date.now().toString(),
        type: 'product_card',
        content: 'I found some global deals for you:',
        data: {
          products: [
            { id: 1, name: 'iPhone 15 Pro', price: 999, image: '📱', location: 'USA -> CAI' },
            { id: 2, name: 'Samsung S24', price: 899, image: '📲', location: 'UAE -> RUH' },
          ]
        },
        timestamp: new Date(),
      };
    }

    return {
      id: Date.now().toString(),
      type: 'ai',
      content: 'I\'m searching global travelers for "' + query + '". (Shopping Mode)',
      timestamp: new Date(),
    };
  };

  // 🛡️ Support Logic (The Lawyer)
  const generateSupportResponse = (query: string): Message => {
      const q = query.toLowerCase();

      // Quick switch back
      if (q.includes('shop') || q.includes('buy')) {
          setMode('shopping');
          return {
              id: Date.now().toString(),
              type: 'ai',
              content: 'Switching back to Shopping Mode 🛍️. What are you looking for?',
              timestamp: new Date(),
          };
      }

      // Knowledge Base
      if (q.includes('refund') || q.includes('money') || q.includes('back')) {
          return {
              id: Date.now().toString(),
              type: 'support_card',
              content: 'According to our Money Back Guarantee:',
              data: {
                  title: '💰 Money Back Guarantee',
                  text: 'You are eligible for a full refund if your item is not received or significantly different from the description.',
                  link: '/legal/money-back'
              },
              timestamp: new Date(),
          };
      }

      if (q.includes('customs') || q.includes('tax') || q.includes('duties')) {
        return {
            id: Date.now().toString(),
            type: 'support_card',
            content: 'Here is our policy on Customs:',
            data: {
                title: '🛃 Customs & Duties',
                text: 'Shoppers are responsible for any applicable customs duties. Travelers must provide a receipt to be reimbursed.',
                link: '/legal/customs'
            },
            timestamp: new Date(),
        };
      }

      if (q.includes('scam') || q.includes('fake') || q.includes('report')) {
        return {
            id: Date.now().toString(),
            type: 'support_card',
            content: 'Safety is our priority. Please file a dispute immediately.',
            data: {
                title: '⚖️ Dispute Center',
                text: 'You can open a formal claim in our Resolution Center. We will hold the payment until verified.',
                link: '/dispute'
            },
            timestamp: new Date(),
        };
      }

      return {
          id: Date.now().toString(),
          type: 'ai',
          content: 'I can help with Refunds, Customs, Identity, or Disputes. Please be specific.',
          timestamp: new Date(),
      };
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        } bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white`}
      >
        <span className="text-3xl">🤖</span>
        {/* Notification Dot */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-3xl shadow-2xl border border-gray-100 transition-all duration-300 transform origin-bottom-right flex flex-col overflow-hidden ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{ height: '600px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between text-white shrink-0 transition-colors duration-500 ${mode === 'shopping' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">{mode === 'shopping' ? '🛍️' : '⚖️'}</span>
            </div>
            <div>
              <h3 className="font-bold">Mnbara AI</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/80">{mode === 'shopping' ? 'Shopping Assistant' : 'Legal Support Agent'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  msg.type === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 shadow-sm rounded-tl-none border border-gray-100'
                }`}
              >
                {/* Product Card */}
                {msg.type === 'product_card' && (
                  <div>
                    <p className="mb-2 text-sm">{msg.content}</p>
                    <div className="space-y-2">
                       {msg.data?.products.map((p: any) => (
                         <div key={p.id} className="flex gap-3 bg-gray-50 p-2 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                           <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                             {p.image}
                           </div>
                           <div>
                             <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                             <div className="text-xs text-gray-500">{p.location}</div>
                             <div className="text-pink-600 font-bold text-xs">${p.price}</div>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
                
                {/* Support Card */}
                {msg.type === 'support_card' && (
                  <div>
                      <p className="mb-2 text-sm">{msg.content}</p>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                          <h4 className="font-bold text-blue-900 text-sm mb-1">{msg.data.title}</h4>
                          <p className="text-xs text-blue-700 mb-2 leading-relaxed">{msg.data.text}</p>
                          <Link to={msg.data.link} className="text-xs font-bold text-blue-600 hover:underline">Read Full Policy →</Link>
                      </div>
                  </div>
                )}

                {/* Normal Text */}
                {['ai', 'user'].includes(msg.type) && (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}

                <div className={`text-[10px] mt-1 ${
                  msg.type === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={mode === 'shopping' ? 'Find Apple Watch, Nike...' : 'Ask about refunds, safety...'}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white rounded-lg disabled:opacity-50 transition-colors ${mode === 'shopping' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {mode === 'shopping' ? (
                // Shopping Chips
                ['Track Order', 'Find iPhone', 'Switch to Support'].map((suggestion) => (
                <button
                    key={suggestion}
                    onClick={() => {
                        if (suggestion === 'Switch to Support') { setMode('support'); return; }
                        setInput(suggestion);
                    }}
                    className="px-3 py-1 bg-gray-50 hover:bg-indigo-50 text-xs font-medium text-gray-600 hover:text-indigo-600 rounded-full border border-gray-200 hover:border-indigo-200 transition-colors whitespace-nowrap"
                >
                    {suggestion}
                </button>
                ))
            ) : (
                // Support Chips
                ['Refund Policy', 'Customs Fees', 'Report User', 'Back to Shopping'].map((suggestion) => (
                <button
                    key={suggestion}
                    onClick={() => {
                        if (suggestion === 'Back to Shopping') { setMode('shopping'); return; }
                        setInput(suggestion);
                    }}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-600 hover:text-blue-800 rounded-full border border-blue-200 hover:border-blue-300 transition-colors whitespace-nowrap"
                >
                    {suggestion}
                </button>
                ))
            )}
            
          </div>
        </div>
      </div>
    </>
  );
}

export default AiAssistant;

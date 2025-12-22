import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSecurity, AdminRole } from './SecurityContext';

export type ChannelType = 'PUBLIC' | 'RESTRICTED' | 'EMERGENCY' | 'BROADCAST';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  allowedRoles: AdminRole[]; // Who can see this
}

export interface Message {
  id: string;
  channelId: string;
  sender: string;
  senderRole: AdminRole;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface CommsContextType {
  channels: Channel[];
  activeChannel: string;
  messages: Message[];
  setActiveChannel: (id: string) => void;
  sendMessage: (content: string) => void;
  broadcast: (priority: 'NORMAL' | 'CRITICAL', message: string) => void;
  unreadCount: number;
}

const CommsContext = createContext<CommsContextType | undefined>(undefined);

export function CommsProvider({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated } = useSecurity();
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // 1. Define The Channels (The Neural Pathways) 📡
  const allChannels: Channel[] = [
      { id: 'general', name: '# general', type: 'PUBLIC', allowedRoles: ['SUPER_ADMIN', 'CS_AGENT', 'FINANCE_AUDITOR', 'OPS_COMMANDER', 'TECH_OFFICER'] },
      { id: 'finance-ops', name: '# finance-ops', type: 'RESTRICTED', allowedRoles: ['SUPER_ADMIN', 'FINANCE_AUDITOR', 'OPS_COMMANDER'] },
      { id: 'high-command', name: '# high-command', type: 'RESTRICTED', allowedRoles: ['SUPER_ADMIN'] },
      { id: 'emergency', name: '🚨 EMERGENCY', type: 'EMERGENCY', allowedRoles: ['SUPER_ADMIN', 'CS_AGENT', 'FINANCE_AUDITOR', 'OPS_COMMANDER', 'TECH_OFFICER'] },
  ];

  // Filter channels based on User Role (The Security Filter) 🛡️
  const accessibleChannels = allChannels.filter(ch => role && ch.allowedRoles.includes(role));

  // Mock Incoming Messages (The Pulse) 💓
  useEffect(() => {
      if (!isAuthenticated) return;

      const interval = setInterval(() => {
          if (Math.random() > 0.8) {
              const mockMsgs = [
                  { ch: 'general', text: 'Coffee machine on floor 4 is fixed ☕', sender: 'Sarah (Admin)' },
                  { ch: 'finance-ops', text: 'Payout batch #992 confirmed. Releasing funds.', sender: 'Mike (Finance)' },
                  { ch: 'emergency', text: 'Server metrics look stable. False alarm.', sender: 'System' },
              ];
              const randomMsg = mockMsgs[Math.floor(Math.random() * mockMsgs.length)];
              
              // Only add if user has access to this channel
              const channel = allChannels.find(c => c.id === randomMsg.ch);
              if (channel && role && channel.allowedRoles.includes(role)) {
                  addMessage(randomMsg.ch, randomMsg.text, randomMsg.sender, 'SUPER_ADMIN' /* Mock role */, true);
              }
          }
      }, 5000);
      return () => clearInterval(interval);
  }, [role, isAuthenticated]);

  const addMessage = (channelId: string, content: string, sender: string, senderRole: AdminRole, isSystem = false) => {
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          channelId,
          sender,
          senderRole,
          content,
          timestamp: new Date(),
          isSystem
      }]);
  };

  const sendMessage = (content: string) => {
      if (!role) return;
      addMessage(activeChannel, content, 'You', role);
  };

  const broadcast = (priority: 'NORMAL' | 'CRITICAL', message: string) => {
      // Send to ALL channels
      accessibleChannels.forEach(ch => {
          addMessage(ch.id, `📢 BROADCAST: ${message}`, 'COMMAND', 'SUPER_ADMIN', true);
      });
      if (priority === 'CRITICAL') {
          alert(`🚨 CRITICAL BROADCAST: ${message}`);
      }
  };

  const unreadCount = messages.length; // Simply total messages for now

  return (
    <CommsContext.Provider value={{ channels: accessibleChannels, activeChannel, setActiveChannel, messages, sendMessage, broadcast, unreadCount }}>
      {children}
    </CommsContext.Provider>
  );
}

export const useComms = () => {
    const context = useContext(CommsContext);
    if (!context) throw new Error('useComms must be used within a CommsProvider');
    return context;
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationApi } from '../api/p2p-exchange/communication.api';
import type { Message, SendMessageRequest } from '../types/p2p-exchange.types';

interface UseMatchChatOptions {
  matchId: string;
  enabled?: boolean;
  pollingInterval?: number;
}

interface UseMatchChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  isSending: boolean;
  hasExternalContact: boolean;
  flaggedMessages: Message[];
  refetch: () => void;
}

export function useMatchChat({
  matchId,
  enabled = true,
  pollingInterval = 3000,
}: UseMatchChatOptions): UseMatchChatReturn {
  const queryClient = useQueryClient();
  const [hasExternalContact, setHasExternalContact] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['match-messages', matchId],
    queryFn: () => communicationApi.getMessages(matchId),
    enabled,
    refetchInterval: pollingInterval,
    staleTime: 2000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (request: SendMessageRequest) =>
      communicationApi.sendMessage(matchId, request),
    onSuccess: (newMessage) => {
      // Optimistically update the cache
      queryClient.setQueryData<Message[]>(
        ['match-messages', matchId],
        (old = []) => [...old, newMessage]
      );

      // Check for external contact
      if (newMessage.containsExternalContact) {
        setHasExternalContact(true);
      }

      // Scroll to bottom
      scrollToBottom();
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });

  // Send message handler
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      await sendMessageMutation.mutateAsync({
        content: content.trim(),
      });
    },
    [sendMessageMutation]
  );

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Check for external contact in messages
  useEffect(() => {
    const hasExternal = messages.some((msg) => msg.containsExternalContact);
    setHasExternalContact(hasExternal);
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Get flagged messages
  const flaggedMessages = messages.filter((msg) => msg.isFlagged);

  return {
    messages,
    isLoading,
    error: error as Error | null,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    hasExternalContact,
    flaggedMessages,
    refetch,
  };
}

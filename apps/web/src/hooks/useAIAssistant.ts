/**
 * useAIAssistant Hook
 * 
 * Handles communication with AI Shopping Assistant
 */

import { useState } from 'react';
import axios from 'axios';

const AI_ASSISTANT_API = process.env.REACT_APP_AI_AGENT_SERVICE_URL || 'http://localhost:3028';

interface AssistantResponse {
  message: string;
  suggestions?: ProductSuggestion[];
  actions?: SuggestedAction[];
  metadata?: any;
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  reason: string;
}

interface SuggestedAction {
  type: string;
  label: string;
  data: any;
}

export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string): Promise<AssistantResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get userId from auth context or localStorage
      const userId = localStorage.getItem('userId') || 'guest';

      const response = await axios.post(`${AI_ASSISTANT_API}/api/shopping-assistant/chat`, {
        userId,
        message
      });

      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getConversationHistory = async (): Promise<any[]> => {
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      
      const response = await axios.get(
        `${AI_ASSISTANT_API}/api/shopping-assistant/conversation/${userId}`
      );

      return response.data.data;
    } catch (err) {
      console.error('Failed to get conversation history:', err);
      return [];
    }
  };

  const clearConversation = async (): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      
      await axios.delete(
        `${AI_ASSISTANT_API}/api/shopping-assistant/conversation/${userId}`
      );
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  return {
    sendMessage,
    getConversationHistory,
    clearConversation,
    isLoading,
    error
  };
};

export default useAIAssistant;

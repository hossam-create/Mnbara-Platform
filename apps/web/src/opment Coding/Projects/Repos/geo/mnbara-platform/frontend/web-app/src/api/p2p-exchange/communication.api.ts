import { apiClient } from './base';
import type { 
  Message, 
  SendMessageRequest,
  ApiResponse,
} from '../../types/p2p-exchange.types';

// ============================================================
// COMMUNICATION API
// ============================================================

class CommunicationAPI {
  /**
   * Get all messages for a match
   */
  async getMessages(
    matchId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<Message[]>> {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      `/matches/${matchId}/messages`,
      { params }
    );
    return response.data;
  }

  /**
   * Send a message in a match
   */
  async sendMessage(
    matchId: string,
    request: SendMessageRequest
  ): Promise<ApiResponse<Message>> {
    const response = await apiClient.post<ApiResponse<Message>>(
      `/matches/${matchId}/messages`,
      request
    );
    return response.data;
  }

  /**
   * Flag a message (admin only)
   */
  async flagMessage(messageId: string, reason: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `/messages/${messageId}/flag`,
      { reason }
    );
    return response.data;
  }

  /**
   * Get flagged messages (admin only)
   */
  async getFlaggedMessages(): Promise<ApiResponse<Message[]>> {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      '/admin/messages/flagged'
    );
    return response.data;
  }
}

const communicationApi = new CommunicationAPI();

export default communicationApi;

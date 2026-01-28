import { BaseAPI } from './base';
import type { Message, SendMessageRequest } from '../../types/p2p-exchange.types';

class CommunicationAPI extends BaseAPI {
  /**
   * Get all messages for a match
   */
  async getMessages(matchId: string): Promise<Message[]> {
    return this.get<Message[]>(`/matches/${matchId}/messages`);
  }

  /**
   * Send a message in a match
   */
  async sendMessage(
    matchId: string,
    request: SendMessageRequest
  ): Promise<Message> {
    return this.post<Message>(`/matches/${matchId}/messages`, request);
  }

  /**
   * Flag a message (admin only)
   */
  async flagMessage(messageId: string, reason: string): Promise<void> {
    return this.post<void>(`/messages/${messageId}/flag`, { reason });
  }

  /**
   * Get flagged messages (admin only)
   */
  async getFlaggedMessages(): Promise<Message[]> {
    return this.get<Message[]>('/admin/messages/flagged');
  }
}

export const communicationApi = new CommunicationAPI();

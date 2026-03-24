import { describe, it, expect } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import communicationApi from '../communication.api';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Communication API', () => {
  describe('GET /matches/:matchId/messages', () => {
    it('should fetch messages', async () => {
      const result = await communicationApi.getMessages('1');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle pagination', async () => {
      const result = await communicationApi.getMessages('1', {
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('POST /matches/:matchId/messages', () => {
    it('should send message', async () => {
      const result = await communicationApi.sendMessage('1', {
        content: 'Hello',
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Hello');
    });

    it('should detect external contact', async () => {
      const result = await communicationApi.sendMessage('1', {
        content: 'Contact me at john@example.com',
      });

      expect(result.success).toBe(true);
      if (result.data.containsExternalContact) {
        expect(result.data.isFlagged).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/matches/:matchId/messages`, () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(communicationApi.getMessages('1')).rejects.toThrow();
    });

    it('should handle empty message', async () => {
      server.use(
        http.post(`${API_BASE_URL}/matches/:matchId/messages`, () => {
          return HttpResponse.json(
            { success: false, error: 'Message cannot be empty' },
            { status: 400 }
          );
        })
      );

      await expect(
        communicationApi.sendMessage('1', { content: '' })
      ).rejects.toThrow();
    });
  });
});

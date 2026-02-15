import axios from 'axios';
import { Decimal } from 'decimal.js';
import crypto from 'crypto';
import { TatumEscrowAdapter } from '../TatumEscrowAdapter';
import { EscrowStatus, WebhookPayload } from '../ExternalEscrowAdapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TatumEscrowAdapter', () => {
  let adapter: TatumEscrowAdapter;
  const mockApiKey = 'test-api-key';
  const mockWebhookSecret = 'test-webhook-secret';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn()
    };
    mockedAxios.create = jest.fn(() => mockAxiosInstance as any);
    
    adapter = new TatumEscrowAdapter(mockApiKey, mockWebhookSecret);
  });

  describe('createEscrow', () => {
    it('should create escrow successfully', async () => {
      const mockResponse = {
        data: {
          escrowId: 'escrow-123',
          status: 'PENDING',
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000
        }
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adapter.createEscrow(
        new Decimal(1000),
        'USD',
        {
          matchId: 1,
          senderUserId: 1,
          recipientUserId: 2,
          description: 'Test escrow'
        }
      );

      expect(result.escrowId).toBe('escrow-123');
      expect(result.status).toBe(EscrowStatus.PENDING);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should map USD to USDT', async () => {
      const mockResponse = {
        data: {
          escrowId: 'escrow-123',
          status: 'PENDING',
          createdAt: Date.now()
        }
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      await adapter.createEscrow(
        new Decimal(1000),
        'USD',
        {
          matchId: 1,
          senderUserId: 1,
          recipientUserId: 2
        }
      );

      const callArgs = (mockAxiosInstance.post as jest.Mock).mock.calls[0];
      expect(callArgs[1].currency).toBe('USDT');
    });

    it('should include metadata in escrow creation', async () => {
      const mockResponse = {
        data: {
          escrowId: 'escrow-123',
          status: 'PENDING',
          createdAt: Date.now()
        }
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      await adapter.createEscrow(
        new Decimal(1000),
        'USD',
        {
          matchId: 1,
          senderUserId: 1,
          recipientUserId: 2,
          description: 'Test escrow'
        }
      );

      const callArgs = (mockAxiosInstance.post as jest.Mock).mock.calls[0];
      expect(callArgs[1].metadata.matchId).toBe(1);
      expect(callArgs[1].metadata.platform).toBe('Mnbara');
    });

    it('should throw error on API failure', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      await expect(
        adapter.createEscrow(
          new Decimal(1000),
          'USD',
          {
            matchId: 1,
            senderUserId: 1,
            recipientUserId: 2
          }
        )
      ).rejects.toThrow('Tatum escrow creation failed');
    });
  });

  describe('releaseEscrow', () => {
    it('should release escrow successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ data: {} });

      await adapter.releaseEscrow('escrow-123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/blockchain/escrow/escrow-123/release',
        expect.objectContaining({
          approverSignature: expect.any(String)
        })
      );
    });

    it('should throw error on release failure', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(
        new Error('Release failed')
      );

      await expect(
        adapter.releaseEscrow('escrow-123')
      ).rejects.toThrow('Tatum escrow release failed');
    });
  });

  describe('refundEscrow', () => {
    it('should refund escrow successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ data: {} });

      await adapter.refundEscrow('escrow-123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/blockchain/escrow/escrow-123/refund',
        expect.objectContaining({
          approverSignature: expect.any(String)
        })
      );
    });

    it('should throw error on refund failure', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(
        new Error('Refund failed')
      );

      await expect(
        adapter.refundEscrow('escrow-123')
      ).rejects.toThrow('Tatum escrow refund failed');
    });
  });

  describe('getStatus', () => {
    it('should get escrow status successfully', async () => {
      const mockResponse = {
        data: {
          escrowId: 'escrow-123',
          status: 'DEPOSITED',
          amount: '1000',
          currency: 'USDT',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          transactionHash: '0xabc123'
        }
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adapter.getStatus('escrow-123');

      expect(result.escrowId).toBe('escrow-123');
      expect(result.status).toBe(EscrowStatus.DEPOSITED);
      expect(result.amount.toString()).toBe('1000');
      expect(result.currency).toBe('USDT');
      expect(result.transactionHash).toBe('0xabc123');
    });

    it('should map all status types correctly', async () => {
      const statuses = [
        'PENDING',
        'DEPOSITED',
        'RELEASED',
        'REFUNDED',
        'EXPIRED',
        'FAILED'
      ];

      const mockAxiosInstance = mockedAxios.create();

      for (const status of statuses) {
        (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
          data: {
            escrowId: 'escrow-123',
            status,
            amount: '1000',
            currency: 'USDT',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        });

        const result = await adapter.getStatus('escrow-123');
        expect(result.status).toBe(status as EscrowStatus);
      }
    });

    it('should throw error on status check failure', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue(
        new Error('Status check failed')
      );

      await expect(
        adapter.getStatus('escrow-123')
      ).rejects.toThrow('Tatum escrow status check failed');
    });
  });

  describe('handleWebhook', () => {
    it('should handle escrow.created event', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.created',
        data: {
          escrowId: 'escrow-123',
          status: 'PENDING'
        },
        signature: generateSignature({ escrowId: 'escrow-123', status: 'PENDING' }, mockWebhookSecret),
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(true);
      expect(result.escrowId).toBe('escrow-123');
      expect(result.status).toBe(EscrowStatus.PENDING);
    });

    it('should handle escrow.deposited event', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.deposited',
        data: {
          escrowId: 'escrow-123',
          status: 'DEPOSITED'
        },
        signature: generateSignature({ escrowId: 'escrow-123', status: 'DEPOSITED' }, mockWebhookSecret),
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe(EscrowStatus.DEPOSITED);
    });

    it('should handle escrow.released event', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.released',
        data: {
          escrowId: 'escrow-123',
          status: 'RELEASED'
        },
        signature: generateSignature({ escrowId: 'escrow-123', status: 'RELEASED' }, mockWebhookSecret),
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe(EscrowStatus.RELEASED);
    });

    it('should handle escrow.refunded event', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.refunded',
        data: {
          escrowId: 'escrow-123',
          status: 'REFUNDED'
        },
        signature: generateSignature({ escrowId: 'escrow-123', status: 'REFUNDED' }, mockWebhookSecret),
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe(EscrowStatus.REFUNDED);
    });

    it('should handle escrow.expired event', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.expired',
        data: {
          escrowId: 'escrow-123',
          status: 'EXPIRED'
        },
        signature: generateSignature({ escrowId: 'escrow-123', status: 'EXPIRED' }, mockWebhookSecret),
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe(EscrowStatus.EXPIRED);
    });

    it('should reject webhook with invalid signature', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.created',
        data: {
          escrowId: 'escrow-123',
          status: 'PENDING'
        },
        signature: 'invalid-signature',
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should reject webhook without signature', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.created',
        data: {
          escrowId: 'escrow-123',
          status: 'PENDING'
        },
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should handle unknown event type', async () => {
      const payload: WebhookPayload = {
        event: 'escrow.unknown',
        data: {
          escrowId: 'escrow-123'
        },
        signature: generateSignature({ escrowId: 'escrow-123' }, mockWebhookSecret),
        timestamp: new Date()
      };

      const result = await adapter.handleWebhook(payload);

      expect(result.processed).toBe(false);
      expect(result.error).toContain('Unknown event type');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const data = { escrowId: 'escrow-123', status: 'PENDING' };
      const signature = generateSignature(data, mockWebhookSecret);

      const payload: WebhookPayload = {
        event: 'escrow.created',
        data,
        signature,
        timestamp: new Date()
      };

      const isValid = adapter.verifyWebhookSignature(payload);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload: WebhookPayload = {
        event: 'escrow.created',
        data: { escrowId: 'escrow-123' },
        signature: 'invalid-signature',
        timestamp: new Date()
      };

      const isValid = adapter.verifyWebhookSignature(payload);
      expect(isValid).toBe(false);
    });

    it('should reject missing signature', () => {
      const payload: WebhookPayload = {
        event: 'escrow.created',
        data: { escrowId: 'escrow-123' },
        timestamp: new Date()
      };

      const isValid = adapter.verifyWebhookSignature(payload);
      expect(isValid).toBe(false);
    });
  });
});

// Helper function to generate valid webhook signature
function generateSignature(data: any, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}

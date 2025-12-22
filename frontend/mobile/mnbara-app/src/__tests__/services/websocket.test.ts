/**
 * WebSocket Service Tests
 * Tests for WebSocket handling and auction events
 * Requirements: 8.1, 8.2, 8.3 - Real-time auction updates, bidding via WebSocket
 */

import { wsService, auctionEvents, AuctionState, BidPlacedEvent, BidRejectedEvent } from '../../services/websocket';

// Mock secure storage
jest.mock('../../services/secureStorage', () => ({
  getAccessToken: jest.fn().mockResolvedValue('mock-token'),
}));

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  
  send = jest.fn();
  close = jest.fn();
  
  // Helper to simulate connection
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }
  
  // Helper to simulate message
  simulateMessage(type: string, data: unknown) {
    this.onmessage?.({ data: JSON.stringify({ type, data }) });
  }
  
  // Helper to simulate close
  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }
}

let mockWsInstance: MockWebSocket;

// Override global WebSocket
const MockWebSocketConstructor = jest.fn().mockImplementation(() => {
  mockWsInstance = new MockWebSocket();
  // Auto-connect after a tick
  setTimeout(() => mockWsInstance.simulateOpen(), 0);
  return mockWsInstance;
});

// Assign static properties
Object.assign(MockWebSocketConstructor, {
  OPEN: MockWebSocket.OPEN,
  CLOSED: MockWebSocket.CLOSED,
});

(global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocketConstructor;

describe('WebSocket Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state by disconnecting
    wsService.disconnect();
  });

  describe('connection', () => {
    it('should connect to WebSocket server', async () => {
      await wsService.connect();
      
      expect(wsService.isConnected).toBe(true);
      expect(global.WebSocket).toHaveBeenCalled();
    });

    it('should not create multiple connections if already connected', async () => {
      await wsService.connect();
      await wsService.connect();
      
      // Should only create one WebSocket instance
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });

    it('should disconnect properly', async () => {
      await wsService.connect();
      wsService.disconnect();
      
      expect(mockWsInstance.close).toHaveBeenCalledWith(1000, 'Client disconnect');
    });
  });

  describe('auction subscription', () => {
    it('should subscribe to auction', async () => {
      await wsService.connect();
      
      wsService.subscribeToAuction('auction-123');
      
      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'auction:subscribe', data: { auctionId: 'auction-123' } })
      );
    });

    it('should unsubscribe from auction', async () => {
      await wsService.connect();
      
      wsService.unsubscribeFromAuction('auction-123');
      
      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'auction:unsubscribe', data: { auctionId: 'auction-123' } })
      );
    });
  });

  describe('bidding', () => {
    it('should send bid via WebSocket', async () => {
      await wsService.connect();
      
      wsService.placeBid('auction-123', 150);
      
      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'auction:bid', data: { auctionId: 'auction-123', amount: 150 } })
      );
    });

    it('should send proxy bid via WebSocket', async () => {
      await wsService.connect();
      
      wsService.setProxyBid('auction-123', 500);
      
      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'auction:proxy_bid', data: { auctionId: 'auction-123', maxAmount: 500 } })
      );
    });

    it('should not send if not connected', async () => {
      // Don't connect
      wsService.placeBid('auction-123', 150);
      
      expect(mockWsInstance?.send).not.toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('should handle auction state events', async () => {
      await wsService.connect();
      
      const callback = jest.fn();
      const unsubscribe = auctionEvents.onState(callback);
      
      const stateData: AuctionState = {
        auctionId: 'auction-123',
        currentPrice: 200,
        totalBids: 5,
        endTime: '2025-12-31T23:59:59Z',
        status: 'active',
      };
      
      mockWsInstance.simulateMessage('auction:state', stateData);
      
      expect(callback).toHaveBeenCalledWith(stateData);
      
      unsubscribe();
    });

    it('should handle bid placed events', async () => {
      await wsService.connect();
      
      const callback = jest.fn();
      const unsubscribe = auctionEvents.onBidPlaced(callback);
      
      const bidData: BidPlacedEvent = {
        auctionId: 'auction-123',
        bid: {
          id: 'bid-1',
          bidderId: 'user-1',
          bidder: { id: 'user-1', name: 'John', rating: 4.5 },
          amount: 150,
          isProxy: false,
          createdAt: '2025-12-11T10:00:00Z',
        },
        newHighest: 150,
        totalBids: 6,
      };
      
      mockWsInstance.simulateMessage('auction:bid_placed', bidData);
      
      expect(callback).toHaveBeenCalledWith(bidData);
      
      unsubscribe();
    });

    it('should handle bid rejected events', async () => {
      await wsService.connect();
      
      const callback = jest.fn();
      const unsubscribe = auctionEvents.onBidRejected(callback);
      
      const rejectData: BidRejectedEvent = {
        auctionId: 'auction-123',
        reason: 'bid_too_low',
      };
      
      mockWsInstance.simulateMessage('auction:bid_rejected', rejectData);
      
      expect(callback).toHaveBeenCalledWith(rejectData);
      
      unsubscribe();
    });

    it('should handle outbid events', async () => {
      await wsService.connect();
      
      const callback = jest.fn();
      const unsubscribe = auctionEvents.onOutbid(callback);
      
      const outbidData = {
        auctionId: 'auction-123',
        newHighest: 200,
        outbidBy: { id: 'user-2', name: 'Jane' },
      };
      
      mockWsInstance.simulateMessage('auction:outbid', outbidData);
      
      expect(callback).toHaveBeenCalledWith(outbidData);
      
      unsubscribe();
    });

    it('should handle auction ended events', async () => {
      await wsService.connect();
      
      const callback = jest.fn();
      const unsubscribe = auctionEvents.onEnded(callback);
      
      const endedData = {
        auctionId: 'auction-123',
        winner: { id: 'user-1', name: 'John' },
        finalPrice: 250,
      };
      
      mockWsInstance.simulateMessage('auction:ended', endedData);
      
      expect(callback).toHaveBeenCalledWith(endedData);
      
      unsubscribe();
    });

    it('should handle ending soon events', async () => {
      await wsService.connect();
      
      const callback = jest.fn();
      const unsubscribe = auctionEvents.onEndingSoon(callback);
      
      const endingSoonData = {
        auctionId: 'auction-123',
        secondsRemaining: 120,
      };
      
      mockWsInstance.simulateMessage('auction:ending_soon', endingSoonData);
      
      expect(callback).toHaveBeenCalledWith(endingSoonData);
      
      unsubscribe();
    });

    it('should unsubscribe from events correctly', async () => {
      await wsService.connect();
      
      const callback = jest.fn();
      const unsubscribe = auctionEvents.onState(callback);
      
      // Unsubscribe
      unsubscribe();
      
      // Send event after unsubscribe
      mockWsInstance.simulateMessage('auction:state', { auctionId: 'auction-123' });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

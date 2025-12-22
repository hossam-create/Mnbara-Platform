import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useAuctionNotifications } from '../AuctionNotifications';

// Store subscription handlers for testing
const subscriptionHandlers: Map<string, ((data: unknown) => void)[]> = new Map();

// Mock the WebSocket service
vi.mock('../../../services/websocket', () => ({
  wsService: {
    subscribe: vi.fn((event: string, handler: (data: unknown) => void) => {
      if (!subscriptionHandlers.has(event)) {
        subscriptionHandlers.set(event, []);
      }
      subscriptionHandlers.get(event)!.push(handler);
      return () => {
        const handlers = subscriptionHandlers.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) handlers.splice(index, 1);
        }
      };
    }),
    send: vi.fn(),
    isConnected: true,
  },
}));

// Helper to emit WebSocket events
const emitEvent = (event: string, data: unknown) => {
  const handlers = subscriptionHandlers.get(event);
  if (handlers) {
    handlers.forEach(handler => handler(data));
  }
};

describe('useAuctionNotifications Hook', () => {
  beforeEach(() => {
    subscriptionHandlers.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should track outbid events', () => {
    const { result } = renderHook(() => useAuctionNotifications('auction-123', 'user-456'));
    
    act(() => {
      emitEvent('auction:outbid', {
        auctionId: 'auction-123',
        newHighest: 150,
      });
    });
    
    expect(result.current.lastOutbid).toEqual({
      auctionId: 'auction-123',
      newHighest: 150,
    });
  });

  it('should track auction end events', () => {
    const { result } = renderHook(() => useAuctionNotifications('auction-123', 'user-456'));
    
    act(() => {
      emitEvent('auction:end', {
        auctionId: 'auction-123',
        winner: { id: 'user-456', fullName: 'Test User' },
        finalPrice: 200,
      });
    });
    
    expect(result.current.auctionEnded).toBeTruthy();
    expect(result.current.isWinner).toBe(true);
  });

  it('should identify when user is not the winner', () => {
    const { result } = renderHook(() => useAuctionNotifications('auction-123', 'user-456'));
    
    act(() => {
      emitEvent('auction:end', {
        auctionId: 'auction-123',
        winner: { id: 'other-user', fullName: 'Other User' },
        finalPrice: 200,
      });
    });
    
    expect(result.current.auctionEnded).toBeTruthy();
    expect(result.current.isWinner).toBe(false);
  });

  it('should clear outbid state', () => {
    const { result } = renderHook(() => useAuctionNotifications('auction-123', 'user-456'));
    
    act(() => {
      emitEvent('auction:outbid', {
        auctionId: 'auction-123',
        newHighest: 150,
      });
    });
    
    expect(result.current.lastOutbid).toBeTruthy();
    
    act(() => {
      result.current.clearOutbid();
    });
    
    expect(result.current.lastOutbid).toBeNull();
  });

  it('should clear ended state', () => {
    const { result } = renderHook(() => useAuctionNotifications('auction-123', 'user-456'));
    
    act(() => {
      emitEvent('auction:end', {
        auctionId: 'auction-123',
        winner: { id: 'user-456', fullName: 'Test User' },
        finalPrice: 200,
      });
    });
    
    expect(result.current.auctionEnded).toBeTruthy();
    
    act(() => {
      result.current.clearEnded();
    });
    
    expect(result.current.auctionEnded).toBeNull();
  });

  it('should filter events by auctionId', () => {
    const { result } = renderHook(() => useAuctionNotifications('auction-123', 'user-456'));
    
    act(() => {
      emitEvent('auction:outbid', {
        auctionId: 'different-auction',
        newHighest: 150,
      });
    });
    
    expect(result.current.lastOutbid).toBeNull();
  });

  it('should receive events when no auctionId filter is set', () => {
    const { result } = renderHook(() => useAuctionNotifications(undefined, 'user-456'));
    
    act(() => {
      emitEvent('auction:outbid', {
        auctionId: 'any-auction',
        newHighest: 150,
      });
    });
    
    expect(result.current.lastOutbid).toEqual({
      auctionId: 'any-auction',
      newHighest: 150,
    });
  });
});

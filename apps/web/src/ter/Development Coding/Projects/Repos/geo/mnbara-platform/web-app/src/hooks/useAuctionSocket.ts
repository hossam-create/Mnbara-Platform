import { useState, useEffect, useCallback, useRef } from 'react';
import type { Bid, AuctionDetails } from '../types/product';

export interface UseAuctionSocketOptions {
  auctionId: string;
  productId: string;
  userId?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseAuctionSocketReturn {
  isConnected: boolean;
  currentBid: number;
  bidCount: number;
  bids: Bid[];
  auctionDetails: AuctionDetails | null;
  lastBid: Bid | null;
  error: Error | null;
  placeBid: (amount: number) => Promise<void>;
  setAutoBid: (maxAmount: number) => Promise<void>;
  reconnect: () => void;
  disconnect: () => void;
}

export const useAuctionSocket = ({
  auctionId,
  productId,
  userId,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseAuctionSocketOptions): UseAuctionSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [bidCount, setBidCount] = useState<number>(0);
  const [bids, setBids] = useState<Bid[]>([]);
  const [auctionDetails, setAuctionDetails] = useState<AuctionDetails | null>(null);
  const [lastBid, setLastBid] = useState<Bid | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectingRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // In production, this would connect to the actual WebSocket server
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/auctions/${auctionId}`;
    
    try {
      // Simulated WebSocket for development
      // In production, use: const ws = new WebSocket(wsUrl);
      console.log('Would connect to:', wsUrl);
      
      // Simulate connection
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Connection failed'));
      handleReconnect();
    }
  }, [auctionId]);

  const handleReconnect = useCallback(() => {
    if (reconnectingRef.current || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return;
    }

    reconnectingRef.current = true;
    reconnectAttemptsRef.current++;

    console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
      reconnectingRef.current = false;
    }, reconnectInterval);
  }, [connect, maxReconnectAttempts, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  const placeBid = useCallback(async (amount: number) => {
    // In production, this would send a message through WebSocket
    // wsRef.current?.send(JSON.stringify({ type: 'PLACE_BID', amount }));
    
    // Simulate bid placement
    const simulatedBid: Bid = {
      id: `bid-${Date.now()}`,
      auctionId,
      productId,
      bidderId: userId || 'anonymous',
      bidderName: userId ? 'You' : 'Anonymous',
      amount,
      currency: 'USD',
      isWinningBid: true,
      isAutoBid: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    setLastBid(simulatedBid);
    setCurrentBid(amount);
    setBidCount(prev => prev + 1);
    setBids(prev => [simulatedBid, ...prev]);
  }, [auctionId, productId, userId]);

  const setAutoBid = useCallback(async (maxAmount: number) => {
    // In production, this would send auto-bid configuration
    // wsRef.current?.send(JSON.stringify({ type: 'SET_AUTO_BID', maxAmount }));
    
    console.log('Auto-bid set with max amount:', maxAmount);
  }, []);

  // Simulate receiving new bids (for development)
  useEffect(() => {
    if (!isConnected) return;

    const simulationInterval = setInterval(() => {
      // Simulate occasional bid updates
      if (Math.random() > 0.95) {
        const newAmount = currentBid + Math.floor(Math.random() * 10) + 1;
        const simulatedBid: Bid = {
          id: `bid-${Date.now()}`,
          auctionId,
          productId,
          bidderId: 'other-user',
          bidderName: ['John D.', 'Sarah M.', 'Mike R.', 'Emma K.'][Math.floor(Math.random() * 4)],
          amount: newAmount,
          currency: 'USD',
          isWinningBid: true,
          isAutoBid: Math.random() > 0.7,
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };

        setLastBid(simulatedBid);
        setCurrentBid(newAmount);
        setBidCount(prev => prev + 1);
        setBids(prev => [simulatedBid, ...prev].slice(0, 50));
      }
    }, 5000);

    return () => clearInterval(simulationInterval);
  }, [isConnected, auctionId, productId, currentBid]);

  return {
    isConnected,
    currentBid,
    bidCount,
    bids,
    auctionDetails,
    lastBid,
    error,
    placeBid,
    setAutoBid,
    reconnect,
    disconnect,
  };
};

export default useAuctionSocket;

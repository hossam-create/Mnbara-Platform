import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuctionTimer } from '../AuctionTimer';

// Mock the WebSocket service
vi.mock('../../../services/websocket', () => ({
  wsService: {
    subscribe: vi.fn(() => vi.fn()),
    send: vi.fn(),
    isConnected: true,
  },
}));

describe('AuctionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Countdown Display', () => {
    it('should display days, hours, and minutes when more than 1 day remaining', () => {
      const endTime = new Date('2025-12-12T14:30:00Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" />);
      
      expect(screen.getByText(/2d 2h 30m/)).toBeInTheDocument();
    });

    it('should display hours, minutes, and seconds when less than 1 day remaining', () => {
      const endTime = new Date('2025-12-10T15:30:45Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" />);
      
      expect(screen.getByText(/3h 30m 45s/)).toBeInTheDocument();
    });

    it('should display minutes and seconds when less than 1 hour remaining', () => {
      const endTime = new Date('2025-12-10T12:30:45Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" />);
      
      expect(screen.getByText(/30m 45s/)).toBeInTheDocument();
    });

    it('should display "Auction Ended" when auction has ended', () => {
      const endTime = new Date('2025-12-10T11:00:00Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" />);
      
      expect(screen.getByText('Auction Ended')).toBeInTheDocument();
    });

    it('should display "Auction Ended" when status is ended', () => {
      const endTime = new Date('2025-12-12T12:00:00Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="ended" />);
      
      expect(screen.getByText('Auction Ended')).toBeInTheDocument();
    });
  });

  describe('Countdown Updates', () => {
    it('should update countdown every second', () => {
      const endTime = new Date('2025-12-10T12:01:00Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" />);
      
      expect(screen.getByText(/1m 0s/)).toBeInTheDocument();
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(screen.getByText(/0m 59s/)).toBeInTheDocument();
    });
  });

  describe('Ending Soon Warning', () => {
    it('should show warning when less than 2 minutes remaining', () => {
      const endTime = new Date('2025-12-10T12:01:30Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" showWarning={true} />);
      
      expect(screen.getByText(/Ending soon/)).toBeInTheDocument();
    });

    it('should not show warning when showWarning is false', () => {
      const endTime = new Date('2025-12-10T12:01:30Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" showWarning={false} />);
      
      expect(screen.queryByText(/Ending soon/)).not.toBeInTheDocument();
    });

    it('should call onEndingSoon callback when entering warning threshold', () => {
      const onEndingSoon = vi.fn();
      const endTime = new Date('2025-12-10T12:02:30Z').toISOString();
      
      render(
        <AuctionTimer 
          endTime={endTime} 
          status="active" 
          onEndingSoon={onEndingSoon}
        />
      );
      
      // Advance time to enter warning threshold (2 minutes)
      act(() => {
        vi.advanceTimersByTime(31000);
      });
      
      expect(onEndingSoon).toHaveBeenCalled();
    });
  });

  describe('Auction End Callback', () => {
    it('should call onEnd callback when auction ends', () => {
      const onEnd = vi.fn();
      const endTime = new Date('2025-12-10T12:00:02Z').toISOString();
      
      render(
        <AuctionTimer 
          endTime={endTime} 
          status="active" 
          onEnd={onEnd}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('Size Variants', () => {
    it('should render with small size', () => {
      const endTime = new Date('2025-12-10T13:00:00Z').toISOString();
      
      const { container } = render(
        <AuctionTimer endTime={endTime} status="active" size="sm" />
      );
      
      expect(container.querySelector('.text-sm')).toBeInTheDocument();
    });

    it('should render time blocks with large size', () => {
      const endTime = new Date('2025-12-10T13:00:00Z').toISOString();
      
      render(<AuctionTimer endTime={endTime} status="active" size="lg" />);
      
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Mins')).toBeInTheDocument();
      expect(screen.getByText('Secs')).toBeInTheDocument();
    });
  });
});

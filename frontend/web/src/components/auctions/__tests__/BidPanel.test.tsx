import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BidPanel } from '../BidPanel';

// Mock functions - defined before vi.mock calls
const mockPlaceBid = vi.fn();
const mockAuctionEventsPlaceBid = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSubscribe: any = vi.fn(() => vi.fn());

// Track connection state
let isConnectedState = true;

vi.mock('../../../services/api', () => ({
  auctionApi: {
    placeBid: (auctionId: string, amount: number) => mockPlaceBid(auctionId, amount),
  },
}));

vi.mock('../../../services/websocket', () => ({
  wsService: {
    subscribe: (event: string, handler: (data: unknown) => void) => mockSubscribe(event, handler),
    send: vi.fn(),
    get isConnected() {
      return isConnectedState;
    },
  },
  auctionEvents: {
    placeBid: (auctionId: string, amount: number) => mockAuctionEventsPlaceBid(auctionId, amount),
  },
}));

describe('BidPanel', () => {
  const defaultProps = {
    auctionId: 'auction-123',
    currentPrice: 100,
    minIncrement: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    isConnectedState = true;
  });

  describe('Rendering', () => {
    it('should render bid input with minimum bid amount', () => {
      render(<BidPanel {...defaultProps} />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(110); // currentPrice + minIncrement
    });

    it('should render quick bid buttons', () => {
      render(<BidPanel {...defaultProps} />);
      
      expect(screen.getByText('$110')).toBeInTheDocument();
      expect(screen.getByText('$120')).toBeInTheDocument();
      expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('should display min increment info', () => {
      render(<BidPanel {...defaultProps} />);
      
      expect(screen.getByText(/Min increment: \$10/)).toBeInTheDocument();
    });

    it('should show highest bidder notice when user is highest bidder', () => {
      render(<BidPanel {...defaultProps} isUserHighestBidder={true} />);
      
      expect(screen.getByText("You're the highest bidder!")).toBeInTheDocument();
    });
  });

  describe('Bid Validation', () => {
    it('should disable bid button when amount is less than or equal to current price', () => {
      render(<BidPanel {...defaultProps} />);
      
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '100' } });
      
      const bidButton = screen.getByRole('button', { name: /Place Bid/i });
      expect(bidButton).toBeDisabled();
    });

    it('should disable bid button when amount is below minimum', () => {
      render(<BidPanel {...defaultProps} />);
      
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '50' } });
      
      const bidButton = screen.getByRole('button', { name: /Place Bid/i });
      expect(bidButton).toBeDisabled();
    });

    it('should enable bid button when amount is valid', () => {
      render(<BidPanel {...defaultProps} />);
      
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '150' } });
      
      const bidButton = screen.getByRole('button', { name: /Place Bid/i });
      expect(bidButton).not.toBeDisabled();
    });
  });

  describe('Bid Submission', () => {
    it('should place bid via WebSocket when connected', async () => {
      render(<BidPanel {...defaultProps} />);
      
      const bidButton = screen.getByRole('button', { name: /Place Bid/i });
      await userEvent.click(bidButton);
      
      expect(mockAuctionEventsPlaceBid).toHaveBeenCalledWith('auction-123', 110);
    });

    it('should show success message after placing bid', async () => {
      render(<BidPanel {...defaultProps} />);
      
      const bidButton = screen.getByRole('button', { name: /Place Bid/i });
      await userEvent.click(bidButton);
      
      expect(screen.getByText('Bid placed successfully!')).toBeInTheDocument();
    });

    it('should call onBidPlaced callback after successful bid', async () => {
      const onBidPlaced = vi.fn();
      render(<BidPanel {...defaultProps} onBidPlaced={onBidPlaced} />);
      
      const bidButton = screen.getByRole('button', { name: /Place Bid/i });
      await userEvent.click(bidButton);
      
      expect(onBidPlaced).toHaveBeenCalledWith(110);
    });

    it('should place bid with quick bid button amount', async () => {
      render(<BidPanel {...defaultProps} />);
      
      // Click the +20 quick bid button ($120)
      const quickBidButton = screen.getByText('$120').closest('button');
      await userEvent.click(quickBidButton!);
      
      expect(mockAuctionEventsPlaceBid).toHaveBeenCalledWith('auction-123', 120);
    });

    it('should fallback to REST API when WebSocket is not connected', async () => {
      isConnectedState = false;
      mockPlaceBid.mockResolvedValue({ data: { success: true } });
      
      render(<BidPanel {...defaultProps} />);
      
      const bidButton = screen.getByRole('button', { name: /Place Bid/i });
      await userEvent.click(bidButton);
      
      await waitFor(() => {
        expect(mockPlaceBid).toHaveBeenCalledWith('auction-123', 110);
      });
    });
  });

  describe('WebSocket Bid Rejection', () => {
    it('should display error message on bid rejection', async () => {
      let rejectionHandler: (data: unknown) => void = () => {};
      
      mockSubscribe.mockImplementation((event: string, handler: (data: unknown) => void) => {
        if (event === 'auction:bid_rejected') {
          rejectionHandler = handler;
        }
        return vi.fn();
      });
      
      render(<BidPanel {...defaultProps} />);
      
      // Simulate bid rejection wrapped in act
      act(() => {
        rejectionHandler({ auctionId: 'auction-123', reason: 'auction_ended' });
      });
      
      await waitFor(() => {
        expect(screen.getByText('This auction has ended')).toBeInTheDocument();
      });
    });
  });

  describe('Proxy Bid Modal', () => {
    it('should open proxy bid modal when clicking Set Proxy Bid', async () => {
      render(<BidPanel {...defaultProps} />);
      
      const proxyBidButton = screen.getByText('Set Proxy Bid');
      await userEvent.click(proxyBidButton);
      
      expect(screen.getByText('How Proxy Bidding Works')).toBeInTheDocument();
    });
  });

  describe('Price Updates', () => {
    it('should update minimum bid when current price changes', () => {
      const { rerender } = render(<BidPanel {...defaultProps} />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(110);
      
      rerender(<BidPanel {...defaultProps} currentPrice={200} />);
      
      expect(input).toHaveValue(210);
    });
  });
});

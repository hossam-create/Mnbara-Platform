/**
 * BidPanel Component Tests
 * Tests for bid submission functionality
 * Requirements: 8.2, 8.3 - Quick-bid buttons, custom amount input, proxy bid
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { BidPanel } from '../../../screens/auctions/components/BidPanel';

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('BidPanel', () => {
  const defaultProps = {
    auctionId: 'auction-123',
    currentBid: 100,
    minIncrement: 10,
    currency: 'USD',
    isEnded: false,
    isHighestBidder: false,
    onPlaceBid: jest.fn(),
    onSetProxyBid: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display current bid amount', () => {
      const { getByText } = render(<BidPanel {...defaultProps} />);
      
      expect(getByText('$100')).toBeTruthy();
      expect(getByText('Current Bid')).toBeTruthy();
    });

    it('should display quick bid buttons with correct amounts', () => {
      const { getByText } = render(<BidPanel {...defaultProps} />);
      
      // minBid = 100 + 10 = 110
      // Quick bids: 110, 120, 130
      expect(getByText('$110')).toBeTruthy();
      expect(getByText('$120')).toBeTruthy();
      expect(getByText('$130')).toBeTruthy();
    });

    it('should show "You\'re winning!" badge when highest bidder', () => {
      const { getByText } = render(
        <BidPanel {...defaultProps} isHighestBidder={true} />
      );
      
      expect(getByText("You're winning!")).toBeTruthy();
    });

    it('should show ended message when auction is ended', () => {
      const { getByText, queryByText } = render(
        <BidPanel {...defaultProps} isEnded={true} />
      );
      
      expect(getByText('This auction has ended')).toBeTruthy();
      expect(queryByText('Quick Bid')).toBeNull();
    });
  });

  describe('quick bid submission', () => {
    it('should call onPlaceBid with correct amount when quick bid pressed', async () => {
      const onPlaceBid = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <BidPanel {...defaultProps} onPlaceBid={onPlaceBid} />
      );
      
      fireEvent.press(getByText('$110'));
      
      await waitFor(() => {
        expect(onPlaceBid).toHaveBeenCalledWith(110);
      });
    });

    it('should show alert on bid failure', async () => {
      const onPlaceBid = jest.fn().mockRejectedValue(new Error('Bid too low'));
      const { getByText } = render(
        <BidPanel {...defaultProps} onPlaceBid={onPlaceBid} />
      );
      
      fireEvent.press(getByText('$110'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Bid Failed', 'Bid too low');
      });
    });
  });

  describe('custom bid submission', () => {
    it('should submit custom bid amount', async () => {
      const onPlaceBid = jest.fn().mockResolvedValue(undefined);
      const { getByPlaceholderText, getByText } = render(
        <BidPanel {...defaultProps} onPlaceBid={onPlaceBid} />
      );
      
      const input = getByPlaceholderText('110');
      fireEvent.changeText(input, '150');
      fireEvent.press(getByText('Place Bid'));
      
      await waitFor(() => {
        expect(onPlaceBid).toHaveBeenCalledWith(150);
      });
    });

    it('should show alert for bid below minimum', async () => {
      const { getByPlaceholderText, getByText } = render(<BidPanel {...defaultProps} />);
      
      const input = getByPlaceholderText('110');
      fireEvent.changeText(input, '50');
      fireEvent.press(getByText('Place Bid'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Invalid Bid', 'Minimum bid is $110');
      });
    });

    it('should clear input after successful bid', async () => {
      const onPlaceBid = jest.fn().mockResolvedValue(undefined);
      const { getByPlaceholderText, getByText } = render(
        <BidPanel {...defaultProps} onPlaceBid={onPlaceBid} />
      );
      
      const input = getByPlaceholderText('110');
      fireEvent.changeText(input, '200');
      fireEvent.press(getByText('Place Bid'));
      
      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });
  });

  describe('proxy bid', () => {
    it('should open proxy bid modal when button pressed', () => {
      const { getByText } = render(<BidPanel {...defaultProps} />);
      
      fireEvent.press(getByText('Set Proxy Bid'));
      
      expect(getByText('Enter your maximum bid. We\'ll automatically bid for you up to this amount.')).toBeTruthy();
    });

    it('should submit proxy bid successfully', async () => {
      const onSetProxyBid = jest.fn().mockResolvedValue(undefined);
      const { getByText, getAllByPlaceholderText } = render(
        <BidPanel {...defaultProps} onSetProxyBid={onSetProxyBid} />
      );
      
      fireEvent.press(getByText('Set Proxy Bid'));
      
      // Get the modal input (second placeholder with '110')
      const inputs = getAllByPlaceholderText('110');
      const modalInput = inputs[inputs.length - 1];
      fireEvent.changeText(modalInput, '500');
      
      // Press the confirm button in modal
      const confirmButtons = getByText('Set Proxy Bid', { exact: true });
      fireEvent.press(confirmButtons);
      
      await waitFor(() => {
        expect(onSetProxyBid).toHaveBeenCalledWith(500);
      });
    });

    it('should close modal on cancel', () => {
      const { getByText, queryByText } = render(<BidPanel {...defaultProps} />);
      
      fireEvent.press(getByText('Set Proxy Bid'));
      expect(getByText('Enter your maximum bid. We\'ll automatically bid for you up to this amount.')).toBeTruthy();
      
      fireEvent.press(getByText('Cancel'));
      
      // Modal description should not be visible after cancel
      expect(queryByText('Enter your maximum bid. We\'ll automatically bid for you up to this amount.')).toBeNull();
    });
  });
});

/**
 * Disputes Page Tests
 * Requirements: 12.1, 12.2, 12.3 - Test dispute list rendering and resolution action flow
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Disputes from '../Disputes';

// Mock dispute service
const mockGetDisputes = vi.fn();

vi.mock('../../services/admin.service', () => ({
  disputeService: {
    getDisputes: (...args: any[]) => mockGetDisputes(...args),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockDisputes = [
  {
    id: 'dispute-1',
    orderId: 'order-1',
    order: {
      id: 'order-1',
      listingTitle: 'iPhone 15 Pro',
      amount: 999.99,
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
    },
    raisedBy: 'buyer',
    raisedByUser: {
      id: 'buyer-1',
      fullName: 'John Buyer',
      avatarUrl: null,
    },
    reason: 'Item not as described',
    description: 'The phone has scratches not shown in photos',
    status: 'open',
    priority: 'high',
    evidence: [],
    messages: [],
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'dispute-2',
    orderId: 'order-2',
    order: {
      id: 'order-2',
      listingTitle: 'MacBook Air M2',
      amount: 1299.00,
      buyerId: 'buyer-2',
      sellerId: 'seller-2',
    },
    raisedBy: 'seller',
    raisedByUser: {
      id: 'seller-2',
      fullName: 'Jane Seller',
      avatarUrl: null,
    },
    reason: 'Buyer claims not received',
    description: 'Tracking shows delivered but buyer disputes',
    status: 'under_review',
    priority: 'medium',
    evidence: [],
    messages: [],
    createdAt: '2024-12-09T14:00:00Z',
    updatedAt: '2024-12-10T08:00:00Z',
  },
  {
    id: 'dispute-3',
    orderId: 'order-3',
    order: {
      id: 'order-3',
      listingTitle: 'Sony Headphones',
      amount: 299.00,
      buyerId: 'buyer-3',
      sellerId: 'seller-3',
    },
    raisedBy: 'buyer',
    raisedByUser: {
      id: 'buyer-3',
      fullName: 'Bob Customer',
      avatarUrl: null,
    },
    reason: 'Defective product',
    description: 'Left ear not working',
    status: 'resolved',
    priority: 'low',
    evidence: [],
    messages: [],
    resolution: {
      outcome: 'refund_buyer',
      amount: 299.00,
      notes: 'Full refund issued',
      resolvedBy: 'admin-1',
      resolvedAt: '2024-12-08T16:00:00Z',
    },
    createdAt: '2024-12-05T10:00:00Z',
    updatedAt: '2024-12-08T16:00:00Z',
  },
];

describe('Disputes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock returns all disputes
    mockGetDisputes.mockResolvedValue({
      data: mockDisputes,
      total: mockDisputes.length,
      page: 1,
      limit: 20,
    });
  });

  const renderDisputes = () => {
    return render(
      <BrowserRouter>
        <Disputes />
      </BrowserRouter>
    );
  };

  it('renders dispute resolution page with title', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('Dispute Resolution')).toBeInTheDocument();
    });
  });

  it('displays dispute list from API', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    expect(screen.getByText('MacBook Air M2')).toBeInTheDocument();
    expect(screen.getByText('Sony Headphones')).toBeInTheDocument();
  });

  it('displays dispute statistics cards', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('Open Disputes')).toBeInTheDocument();
    });

    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Escalated')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('displays correct status tags for disputes', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('OPEN')).toBeInTheDocument();
    });

    expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
    expect(screen.getByText('RESOLVED')).toBeInTheDocument();
  });

  it('displays correct priority tags', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('displays raised by user information', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('John Buyer')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Seller')).toBeInTheDocument();
    expect(screen.getByText('Bob Customer')).toBeInTheDocument();
  });

  it('navigates to dispute detail when clicking view button', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/disputes/dispute-1');
  });

  it('calls getDisputes on initial load', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(mockGetDisputes).toHaveBeenCalled();
    });

    // Verify initial call was made with default pagination
    expect(mockGetDisputes).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('displays order amount formatted as currency', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('$999.99')).toBeInTheDocument();
    });

    expect(screen.getByText('$1,299.00')).toBeInTheDocument();
    expect(screen.getByText('$299.00')).toBeInTheDocument();
  });

  it('displays dispute reason', async () => {
    renderDisputes();

    await waitFor(() => {
      expect(screen.getByText('Item not as described')).toBeInTheDocument();
    });

    expect(screen.getByText('Buyer claims not received')).toBeInTheDocument();
    expect(screen.getByText('Defective product')).toBeInTheDocument();
  });
});

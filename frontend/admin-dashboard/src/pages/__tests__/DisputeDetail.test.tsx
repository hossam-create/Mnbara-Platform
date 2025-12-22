/**
 * DisputeDetail Page Tests
 * Requirements: 12.2, 12.3 - Test dispute detail display and resolution action flow
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DisputeDetail from '../DisputeDetail';

// Mock dispute service
const mockGetDispute = vi.fn();
const mockUpdateDisputeStatus = vi.fn();
const mockResolveDispute = vi.fn();
const mockAddMessage = vi.fn();
const mockGetResolutionAuditLogs = vi.fn();

vi.mock('../../services/admin.service', () => ({
  disputeService: {
    getDispute: (...args: any[]) => mockGetDispute(...args),
    updateDisputeStatus: (...args: any[]) => mockUpdateDisputeStatus(...args),
    resolveDispute: (...args: any[]) => mockResolveDispute(...args),
    addMessage: (...args: any[]) => mockAddMessage(...args),
    getResolutionAuditLogs: (...args: any[]) => mockGetResolutionAuditLogs(...args),
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

const mockDispute = {
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
  status: 'under_review',
  priority: 'high',
  evidence: [
    {
      id: 'evidence-1',
      type: 'image',
      url: 'https://example.com/photo1.jpg',
      uploadedBy: 'buyer-1',
      uploadedAt: '2024-12-10T10:00:00Z',
    },
    {
      id: 'evidence-2',
      type: 'text',
      content: 'Seller did not respond to my messages',
      uploadedBy: 'buyer-1',
      uploadedAt: '2024-12-10T11:00:00Z',
    },
  ],
  messages: [
    {
      id: 'msg-1',
      senderId: 'buyer-1',
      senderName: 'John Buyer',
      senderRole: 'buyer',
      message: 'Please help resolve this issue',
      createdAt: '2024-12-10T10:30:00Z',
    },
    {
      id: 'msg-2',
      senderId: 'admin-1',
      senderName: 'Admin User',
      senderRole: 'admin',
      message: 'We are reviewing your case',
      createdAt: '2024-12-10T12:00:00Z',
    },
  ],
  createdAt: '2024-12-10T10:00:00Z',
  updatedAt: '2024-12-10T12:00:00Z',
};

const mockResolvedDispute = {
  ...mockDispute,
  status: 'resolved',
  resolution: {
    outcome: 'refund_buyer',
    amount: 999.99,
    notes: 'Full refund issued due to item condition',
    resolvedBy: 'admin-1',
    resolvedAt: '2024-12-11T10:00:00Z',
  },
};

describe('DisputeDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDispute.mockResolvedValue(mockDispute);
    mockGetResolutionAuditLogs.mockResolvedValue({ logs: [] });
    mockUpdateDisputeStatus.mockResolvedValue({ ...mockDispute, status: 'escalated' });
    mockResolveDispute.mockResolvedValue({
      dispute: mockResolvedDispute,
      escrowAction: {
        type: 'refund',
        amount: 999.99,
        transactionId: 'txn-123',
        status: 'success',
      },
    });
    mockAddMessage.mockResolvedValue({
      id: 'msg-3',
      senderId: 'admin-1',
      senderName: 'Admin User',
      senderRole: 'admin',
      message: 'Test message',
      createdAt: new Date().toISOString(),
    });
  });

  const renderDisputeDetail = (disputeId = 'dispute-1') => {
    return render(
      <MemoryRouter initialEntries={[`/disputes/${disputeId}`]}>
        <Routes>
          <Route path="/disputes/:disputeId" element={<DisputeDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders dispute detail page with dispute information', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Dispute Details')).toBeInTheDocument();
    });

    expect(screen.getByText('Item not as described')).toBeInTheDocument();
    expect(screen.getByText('The phone has scratches not shown in photos')).toBeInTheDocument();
  });

  it('displays order information', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Order Information')).toBeInTheDocument();
    });

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
  });

  it('displays raised by user information', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      // Use getAllByText since the name appears multiple times
      const buyerNames = screen.getAllByText('John Buyer');
      expect(buyerNames.length).toBeGreaterThan(0);
    });

    expect(screen.getByText('BUYER')).toBeInTheDocument();
  });

  it('displays status and priority tags', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
    });

    expect(screen.getByText('HIGH PRIORITY')).toBeInTheDocument();
  });

  it('displays evidence section with buyer evidence', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Submitted Evidence')).toBeInTheDocument();
    });

    // Check evidence tabs exist
    expect(screen.getByText(/Buyer Evidence/)).toBeInTheDocument();
    expect(screen.getByText(/Seller Evidence/)).toBeInTheDocument();
  });

  it('displays communication history', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Communication History')).toBeInTheDocument();
    });

    expect(screen.getByText('Please help resolve this issue')).toBeInTheDocument();
    expect(screen.getByText('We are reviewing your case')).toBeInTheDocument();
  });

  it('displays resolve dispute button for under_review status', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Resolve Dispute')).toBeInTheDocument();
    });

    expect(screen.getByText('Escalate')).toBeInTheDocument();
  });

  it('has resolve dispute button that can be clicked', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Resolve Dispute')).toBeInTheDocument();
    });

    // Verify the button exists and is clickable
    const resolveButton = screen.getByText('Resolve Dispute');
    expect(resolveButton).toBeEnabled();
  });

  it('calls updateDisputeStatus when escalating dispute', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Escalate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Escalate'));

    await waitFor(() => {
      expect(mockUpdateDisputeStatus).toHaveBeenCalledWith('dispute-1', 'escalated');
    });
  });

  it('navigates back to disputes list when clicking back button', async () => {
    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Back to Disputes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Back to Disputes'));

    expect(mockNavigate).toHaveBeenCalledWith('/disputes');
  });

  it('displays resolution information for resolved disputes', async () => {
    mockGetDispute.mockResolvedValue(mockResolvedDispute);

    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Resolution')).toBeInTheDocument();
    });

    expect(screen.getByText('REFUND BUYER')).toBeInTheDocument();
    expect(screen.getByText('Full refund issued due to item condition')).toBeInTheDocument();
  });

  it('displays resolved message for resolved disputes', async () => {
    mockGetDispute.mockResolvedValue(mockResolvedDispute);

    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('This dispute has been resolved')).toBeInTheDocument();
    });
  });

  it('displays start review button for open disputes', async () => {
    mockGetDispute.mockResolvedValue({ ...mockDispute, status: 'open' });

    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Start Review')).toBeInTheDocument();
    });
  });

  it('calls updateDisputeStatus when starting review', async () => {
    mockGetDispute.mockResolvedValue({ ...mockDispute, status: 'open' });

    renderDisputeDetail();

    await waitFor(() => {
      expect(screen.getByText('Start Review')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start Review'));

    await waitFor(() => {
      expect(mockUpdateDisputeStatus).toHaveBeenCalledWith('dispute-1', 'under_review');
    });
  });
});

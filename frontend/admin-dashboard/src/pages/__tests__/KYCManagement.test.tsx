/**
 * KYC Management Page Tests
 * Requirements: 11.3 - Test KYC approval workflow
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import KYCManagement from '../KYCManagement';

// Mock admin service
const mockGetKYCSubmissions = vi.fn();
const mockApproveKYC = vi.fn();
const mockRejectKYC = vi.fn();

vi.mock('../../services/admin.service', () => ({
  adminService: {
    getKYCSubmissions: (...args: any[]) => mockGetKYCSubmissions(...args),
    approveKYC: (...args: any[]) => mockApproveKYC(...args),
    rejectKYC: (...args: any[]) => mockRejectKYC(...args),
  },
}));

const mockKYCSubmissions = [
  {
    id: 'kyc-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      email: 'john@example.com',
      fullName: 'John Doe',
      role: 'buyer',
      status: 'active',
      kycStatus: 'pending',
      ratingAvg: 4.5,
    },
    documents: [
      {
        id: 'doc-1',
        type: 'passport',
        frontImageUrl: 'https://example.com/front.jpg',
        backImageUrl: 'https://example.com/back.jpg',
        selfieUrl: 'https://example.com/selfie.jpg',
        status: 'pending',
        submittedAt: '2024-12-01T10:00:00Z',
      },
    ],
    status: 'pending',
    submittedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'kyc-2',
    userId: 'user-2',
    user: {
      id: 'user-2',
      email: 'jane@example.com',
      fullName: 'Jane Smith',
      role: 'seller',
      status: 'active',
      kycStatus: 'verified',
      ratingAvg: 4.8,
    },
    documents: [
      {
        id: 'doc-2',
        type: 'drivers_license',
        frontImageUrl: 'https://example.com/dl-front.jpg',
        backImageUrl: 'https://example.com/dl-back.jpg',
        selfieUrl: 'https://example.com/dl-selfie.jpg',
        status: 'approved',
        submittedAt: '2024-11-15T14:00:00Z',
        reviewedAt: '2024-11-16T09:00:00Z',
      },
    ],
    status: 'approved',
    submittedAt: '2024-11-15T14:00:00Z',
  },
];

describe('KYC Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetKYCSubmissions.mockResolvedValue({
      data: mockKYCSubmissions,
      total: mockKYCSubmissions.length,
      page: 1,
      limit: 20,
    });
    mockApproveKYC.mockResolvedValue({ id: 'kyc-1', status: 'approved' });
    mockRejectKYC.mockResolvedValue({ id: 'kyc-1', status: 'rejected' });
  });

  const renderKYCManagement = () => {
    return render(
      <BrowserRouter>
        <KYCManagement />
      </BrowserRouter>
    );
  };

  it('renders KYC management page with title', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByText('KYC Verification Management')).toBeInTheDocument();
    });
  });

  it('displays KYC submissions list', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows status filter buttons', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approved' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rejected' })).toBeInTheDocument();
  });

  it('filters by status when clicking filter buttons', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(mockGetKYCSubmissions).toHaveBeenCalled();
    });

    const approvedButton = screen.getByRole('button', { name: 'Approved' });
    fireEvent.click(approvedButton);

    await waitFor(() => {
      expect(mockGetKYCSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' })
      );
    });
  });

  it('calls approveKYC when clicking approve button', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByRole('button', { name: /approve/i });
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockApproveKYC).toHaveBeenCalledWith('kyc-1');
    });
  });

  it('displays document type correctly', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByText('PASSPORT')).toBeInTheDocument();
    });

    expect(screen.getByText('DRIVERS LICENSE')).toBeInTheDocument();
  });

  it('shows correct status tags', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });

  it('opens modal when clicking view button', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('KYC Submission Details')).toBeInTheDocument();
    });
  });

  it('shows rejection reason input in modal for pending submissions', async () => {
    renderKYCManagement();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter reason for rejection...')).toBeInTheDocument();
    });
  });
});

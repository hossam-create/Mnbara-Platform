/**
 * Users Page Tests
 * Requirements: 11.1 - Test user list filtering
 * Requirements: 11.2, 11.3 - Test user management functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Users from '../Users';

// Mock admin service
const mockGetUsers = vi.fn();
const mockGetUserStats = vi.fn();

vi.mock('../../services/admin.service', () => ({
  adminService: {
    getUsers: (...args: any[]) => mockGetUsers(...args),
    getUserStats: (...args: any[]) => mockGetUserStats(...args),
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

const mockUsers = [
  {
    id: 'user-1',
    email: 'john@example.com',
    fullName: 'John Doe',
    role: 'buyer',
    status: 'active',
    kycStatus: 'verified',
    ratingAvg: 4.5,
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-12-10T08:00:00Z',
    lastLoginCountry: 'USA',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    fullName: 'Jane Smith',
    role: 'seller',
    status: 'suspended',
    kycStatus: 'pending',
    ratingAvg: 3.8,
    createdAt: '2024-02-20T14:00:00Z',
  },
];

const mockStats = {
  totalUsers: 150,
  activeUsers: 120,
  pendingKYC: 15,
  newUsersThisWeek: 8,
};

describe('Users Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUsers.mockResolvedValue({
      data: mockUsers,
      total: mockUsers.length,
      page: 1,
      limit: 20,
    });
    mockGetUserStats.mockResolvedValue(mockStats);
  });

  const renderUsers = () => {
    return render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );
  };

  it('renders user management page with statistics', async () => {
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Pending KYC')).toBeInTheDocument();
  });

  it('displays user list from API', async () => {
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('calls getUsers with filters when searching', async () => {
    renderUsers();

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john', page: 1 })
      );
    });
  });

  it('navigates to user detail when clicking view button', async () => {
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/users/user-1');
  });

  it('displays correct status tags', async () => {
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    expect(screen.getByText('SUSPENDED')).toBeInTheDocument();
    expect(screen.getByText('BUYER')).toBeInTheDocument();
    expect(screen.getByText('SELLER')).toBeInTheDocument();
  });

  it('displays user statistics from API', async () => {
    renderUsers();

    await waitFor(() => {
      expect(mockGetUserStats).toHaveBeenCalled();
    });

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays KYC status tags correctly', async () => {
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });
});

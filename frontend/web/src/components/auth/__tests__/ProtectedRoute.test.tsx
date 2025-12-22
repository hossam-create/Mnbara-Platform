import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, withAuth } from '../ProtectedRoute';
import * as AuthContext from '../../../context/AuthContext';
import type { ReactNode } from 'react';

// Mock the useAuth hook
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = AuthContext.useAuth as ReturnType<typeof vi.fn>;

// Test component
const TestComponent = () => <div>Protected Content</div>;

// Helper to render with router
const renderWithRouter = (
  ui: ReactNode,
  { initialEntries = ['/protected'] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/kyc" element={<div>KYC Page</div>} />
        <Route path="/protected" element={ui} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while checking authentication', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to custom path when specified', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/custom-login" element={<div>Custom Login</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute redirectTo="/custom-login">
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Custom Login')).toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'buyer',
          kycVerified: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin',
          kycVerified: true,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'buyer@example.com',
          fullName: 'Buyer User',
          role: 'buyer',
          kycVerified: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin', 'seller']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'seller@example.com',
          fullName: 'Seller User',
          role: 'seller',
          kycVerified: true,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin', 'seller']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('KYC Verification', () => {
    it('should allow access when KYC is verified', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'verified@example.com',
          fullName: 'Verified User',
          role: 'traveler',
          kycVerified: true,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireKyc>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show KYC required message when not verified', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'unverified@example.com',
          fullName: 'Unverified User',
          role: 'traveler',
          kycVerified: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireKyc>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('KYC Verification Required')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('withAuth HOC', () => {
    it('should wrap component with ProtectedRoute', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'buyer',
          kycVerified: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const WrappedComponent = withAuth(TestComponent);

      renderWithRouter(<WrappedComponent />);

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should pass options to ProtectedRoute', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'buyer@example.com',
          fullName: 'Buyer User',
          role: 'buyer',
          kycVerified: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const WrappedComponent = withAuth(TestComponent, { requiredRoles: ['admin'] });

      renderWithRouter(<WrappedComponent />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});

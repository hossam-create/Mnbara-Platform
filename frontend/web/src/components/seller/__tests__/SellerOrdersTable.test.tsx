import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SellerOrdersTable } from '../SellerOrdersTable';
import type { SellerOrder } from '../../../services/seller.service';

// Helper to create mock orders
const createMockOrder = (overrides: Partial<SellerOrder> = {}): SellerOrder => ({
  id: 'order-1',
  orderNumber: 'ORD-001',
  buyer: {
    id: 'buyer-1',
    email: 'buyer@example.com',
    fullName: 'Test Buyer',
    role: 'buyer',
    kycVerified: true,
    rating: 4.5,
    totalReviews: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
  seller: {
    id: 'seller-1',
    email: 'seller@example.com',
    fullName: 'Test Seller',
    role: 'seller',
    kycVerified: true,
    rating: 4.8,
    totalReviews: 50,
    createdAt: '2024-01-01T00:00:00Z',
  },
  items: [],
  subtotal: 100,
  deliveryFee: 10,
  platformFee: 5,
  total: 110,
  currency: 'USD',
  status: 'pending',
  paymentStatus: 'paid',
  escrowStatus: 'held',
  deliveryMethod: 'courier',
  shippingAddress: {
    id: 'addr-1',
    label: 'Home',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001',
    phone: '+1234567890',
    isDefault: true,
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  buyerName: 'Test Buyer',
  buyerEmail: 'buyer@example.com',
  productTitle: 'Test Product',
  productImage: 'https://example.com/image.jpg',
  escrow: true,
  ...overrides,
});

describe('SellerOrdersTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnViewOrder = vi.fn();
  const mockOnUpdateStatus = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnStatusFilter = vi.fn();

  const defaultProps = {
    orders: [createMockOrder()],
    totalCount: 1,
    currentPage: 1,
    pageSize: 10,
    onPageChange: mockOnPageChange,
    onViewOrder: mockOnViewOrder,
    onUpdateStatus: mockOnUpdateStatus,
    onSearch: mockOnSearch,
    onStatusFilter: mockOnStatusFilter,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render order table with headers', () => {
      render(<SellerOrdersTable {...defaultProps} />);

      expect(screen.getByText('Order')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Buyer')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render order data correctly', () => {
      render(<SellerOrdersTable {...defaultProps} />);

      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Test Buyer')).toBeInTheDocument();
      // Check for USD currency label
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('should show empty state when no orders', () => {
      render(<SellerOrdersTable {...defaultProps} orders={[]} totalCount={0} />);

      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<SellerOrdersTable {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });
  });

  describe('Order Status Display', () => {
    it('should display pending status badge in table', () => {
      const order = createMockOrder({ status: 'pending' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      // Find the status badge in the table body (not the dropdown)
      const tbody = screen.getByRole('table').querySelector('tbody');
      const statusBadge = within(tbody!).getByText('Pending');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-yellow-100');
    });

    it('should display shipped status badge in table', () => {
      const order = createMockOrder({ status: 'shipped' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      const tbody = screen.getByRole('table').querySelector('tbody');
      const statusBadge = within(tbody!).getByText('Shipped');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-purple-100');
    });

    it('should display delivered status badge in table', () => {
      const order = createMockOrder({ status: 'delivered' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      const tbody = screen.getByRole('table').querySelector('tbody');
      const statusBadge = within(tbody!).getByText('Delivered');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-green-100');
    });

    it('should display escrow badge for escrow orders', () => {
      const order = createMockOrder({ escrow: true });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      expect(screen.getByText('🔒 Escrow')).toBeInTheDocument();
    });
  });

  describe('Order Status Updates', () => {
    it('should show update status button for pending paid orders', () => {
      const order = createMockOrder({ status: 'pending', paymentStatus: 'paid' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      // Find the button in the actions column (not the dropdown option)
      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find(btn => btn.textContent === 'Confirmed');
      expect(confirmButton).toBeInTheDocument();
    });

    it('should call onUpdateStatus when status update button is clicked', async () => {
      const order = createMockOrder({ status: 'pending', paymentStatus: 'paid' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find(btn => btn.textContent === 'Confirmed');
      await userEvent.click(confirmButton!);

      expect(mockOnUpdateStatus).toHaveBeenCalledWith('order-1', 'confirmed');
    });

    it('should show Processing button for confirmed orders', async () => {
      const order = createMockOrder({ status: 'confirmed', paymentStatus: 'paid' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      const buttons = screen.getAllByRole('button');
      const processingButton = buttons.find(btn => btn.textContent === 'Processing');
      expect(processingButton).toBeInTheDocument();
    });

    it('should call onUpdateStatus with shipped when Ship button is clicked', async () => {
      const order = createMockOrder({ status: 'processing', paymentStatus: 'paid' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      const buttons = screen.getAllByRole('button');
      const shipButton = buttons.find(btn => btn.textContent === 'Ship');
      await userEvent.click(shipButton!);

      expect(mockOnUpdateStatus).toHaveBeenCalledWith('order-1', 'shipped');
    });

    it('should not show update button for delivered orders', () => {
      const order = createMockOrder({ status: 'delivered', paymentStatus: 'paid' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      // Should only have View button in actions, not status update button
      const tbody = screen.getByRole('table').querySelector('tbody');
      const actionButtons = within(tbody!).getAllByRole('button');
      expect(actionButtons.length).toBe(1);
      expect(actionButtons[0]).toHaveTextContent('View');
    });

    it('should not show update button for unpaid orders', () => {
      const order = createMockOrder({ status: 'pending', paymentStatus: 'pending' });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      // Should only have View button in actions
      const tbody = screen.getByRole('table').querySelector('tbody');
      const actionButtons = within(tbody!).getAllByRole('button');
      expect(actionButtons.length).toBe(1);
      expect(actionButtons[0]).toHaveTextContent('View');
    });
  });

  describe('View Order', () => {
    it('should call onViewOrder when View button is clicked', async () => {
      const order = createMockOrder();
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      const viewButton = screen.getByText('View');
      await userEvent.click(viewButton);

      expect(mockOnViewOrder).toHaveBeenCalledWith(order);
    });
  });

  describe('Search and Filter', () => {
    it('should call onSearch when search form is submitted', async () => {
      render(<SellerOrdersTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search orders...');
      await userEvent.type(searchInput, 'test query');
      
      fireEvent.submit(searchInput.closest('form')!);

      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    });

    it('should call onStatusFilter when status filter is changed', async () => {
      render(<SellerOrdersTable {...defaultProps} />);

      const statusSelect = screen.getByRole('combobox');
      await userEvent.selectOptions(statusSelect, 'shipped');

      expect(mockOnStatusFilter).toHaveBeenCalledWith('shipped');
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are multiple pages', () => {
      render(<SellerOrdersTable {...defaultProps} totalCount={25} pageSize={10} />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should call onPageChange when page button is clicked', async () => {
      render(<SellerOrdersTable {...defaultProps} totalCount={25} pageSize={10} />);

      const page2Button = screen.getByText('2');
      await userEvent.click(page2Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should disable Previous button on first page', () => {
      render(<SellerOrdersTable {...defaultProps} totalCount={25} pageSize={10} currentPage={1} />);

      expect(screen.getByText('Previous')).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(<SellerOrdersTable {...defaultProps} totalCount={25} pageSize={10} currentPage={3} />);

      expect(screen.getByText('Next')).toBeDisabled();
    });
  });

  describe('Order Selection', () => {
    it('should render checkboxes when selection is enabled', () => {
      const mockOnSelectOrder = vi.fn();
      const mockOnSelectAll = vi.fn();

      render(
        <SellerOrdersTable
          {...defaultProps}
          selectedOrders={[]}
          onSelectOrder={mockOnSelectOrder}
          onSelectAll={mockOnSelectAll}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should call onSelectOrder when order checkbox is clicked', async () => {
      const mockOnSelectOrder = vi.fn();
      const mockOnSelectAll = vi.fn();

      render(
        <SellerOrdersTable
          {...defaultProps}
          selectedOrders={[]}
          onSelectOrder={mockOnSelectOrder}
          onSelectAll={mockOnSelectAll}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is select all, second is the order checkbox
      await userEvent.click(checkboxes[1]);

      expect(mockOnSelectOrder).toHaveBeenCalledWith('order-1', true);
    });
  });

  describe('Tracking Info Display', () => {
    it('should display tracking number when available', () => {
      const order = createMockOrder({
        trackingInfo: {
          carrier: 'FedEx',
          trackingNumber: 'TRACK123',
          estimatedDelivery: '2024-01-20',
          status: 'in_transit',
          updates: [],
        },
      });
      render(<SellerOrdersTable {...defaultProps} orders={[order]} />);

      expect(screen.getByText('📦 TRACK123')).toBeInTheDocument();
    });
  });
});

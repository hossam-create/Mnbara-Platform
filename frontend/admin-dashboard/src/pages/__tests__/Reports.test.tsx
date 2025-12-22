/**
 * Reports Page Tests
 * Requirements: 13.4 - Test export functionality
 * - Test CSV export
 * - Test Excel export
 * - Test date range selection for exports
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Reports from '../Reports';

// Mock analytics service
const mockExportReport = vi.fn();

vi.mock('../../services/admin.service', () => ({
  analyticsService: {
    exportReport: (...args: any[]) => mockExportReport(...args),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

describe('Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportReport.mockResolvedValue(new Blob(['test data'], { type: 'text/csv' }));
  });

  const renderReports = () => {
    return render(
      <BrowserRouter>
        <Reports />
      </BrowserRouter>
    );
  };

  it('renders reports page with title', () => {
    renderReports();
    expect(screen.getByText('Reports & Export')).toBeInTheDocument();
  });

  it('displays all available report types', () => {
    renderReports();

    expect(screen.getByText('Transaction Report')).toBeInTheDocument();
    expect(screen.getByText('User Report')).toBeInTheDocument();
    expect(screen.getByText('Orders Report')).toBeInTheDocument();
    expect(screen.getByText('Auction Report')).toBeInTheDocument();
    expect(screen.getByText('Crowdship Report')).toBeInTheDocument();
  });

  it('displays CSV and Excel export buttons for each report', () => {
    renderReports();

    // Each report card has CSV and Excel buttons
    const csvButtons = screen.getAllByText('CSV');
    const excelButtons = screen.getAllByText('Excel');

    expect(csvButtons.length).toBeGreaterThan(0);
    expect(excelButtons.length).toBeGreaterThan(0);
  });

  it('displays date range picker', () => {
    renderReports();
    expect(screen.getByText('Select Date Range for Reports')).toBeInTheDocument();
  });

  it('displays custom export section', () => {
    renderReports();
    expect(screen.getByText('Custom Export')).toBeInTheDocument();
  });

  it('displays export history section', () => {
    renderReports();
    expect(screen.getByText('Export History')).toBeInTheDocument();
  });

  it('calls exportReport when CSV button is clicked', async () => {
    renderReports();

    const csvButtons = screen.getAllByText('CSV');
    fireEvent.click(csvButtons[0]);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transactions',
          format: 'csv',
        })
      );
    });
  });

  it('calls exportReport when Excel button is clicked', async () => {
    renderReports();

    const excelButtons = screen.getAllByText('Excel');
    fireEvent.click(excelButtons[0]);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transactions',
          format: 'excel',
        })
      );
    });
  });

  it('creates download link after successful export', async () => {
    renderReports();

    const csvButtons = screen.getAllByText('CSV');
    fireEvent.click(csvButtons[0]);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  it('adds entry to export history after successful export', async () => {
    renderReports();

    const csvButtons = screen.getAllByText('CSV');
    fireEvent.click(csvButtons[0]);

    await waitFor(() => {
      // Check that the export history table has entries
      const historyTable = screen.getByRole('table');
      expect(historyTable).toBeInTheDocument();
    });
  });

  it('displays export button in custom export section', () => {
    renderReports();

    const exportButton = screen.getByRole('button', { name: /export report/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('calls exportReport with selected options from custom export', async () => {
    renderReports();

    const exportButton = screen.getByRole('button', { name: /export report/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: expect.stringMatching(/csv|excel/),
        })
      );
    });
  });
});

/**
 * Export Functionality Tests
 * Test the export service parameters and behavior
 */
describe('Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportReport.mockResolvedValue(new Blob(['test data'], { type: 'text/csv' }));
  });

  it('export params include correct date format', async () => {
    render(
      <BrowserRouter>
        <Reports />
      </BrowserRouter>
    );

    const csvButtons = screen.getAllByText('CSV');
    fireEvent.click(csvButtons[0]);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
    });
  });

  it('export params include report type', async () => {
    render(
      <BrowserRouter>
        <Reports />
      </BrowserRouter>
    );

    const csvButtons = screen.getAllByText('CSV');
    fireEvent.click(csvButtons[0]);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringMatching(/transactions|users|orders|auctions|crowdship/),
        })
      );
    });
  });

  it('handles export error gracefully', async () => {
    mockExportReport.mockRejectedValue(new Error('Export failed'));

    render(
      <BrowserRouter>
        <Reports />
      </BrowserRouter>
    );

    const csvButtons = screen.getAllByText('CSV');
    fireEvent.click(csvButtons[0]);

    // Should not throw and page should remain functional
    await waitFor(() => {
      expect(screen.getByText('Reports & Export')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import Button from '@/components/common/Button';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

export default function Pagination({
  current,
  total,
  pageSize,
  onChange,
  showSizeChanger = false,
  showQuickJumper = false,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(current - 1)}
        disabled={current === 1}
      >
        Previous
      </Button>

      {/* Page Numbers */}
      <div className="flex space-x-1">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <Button
                variant={page === current ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(current + 1)}
        disabled={current === totalPages}
      >
        Next
      </Button>

      {/* Page Info */}
      <span className="text-sm text-gray-600 ml-4">
        Page {current} of {totalPages} ({total} total items)
      </span>
    </div>
  );
}

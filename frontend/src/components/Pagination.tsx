import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
}) => {
  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | string)[] = [];

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1); // Always show first page

    if (left > 2) {
      range.push('...');
    }

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < totalPages - 1) {
      range.push('...');
    }

    if (totalPages > 1) {
      range.push(totalPages); // Always show last page
    }

    return range;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        className={`font-bold ${!hasPrevious ? 'text-gray-300 cursor-not-allowed' : 'text-primary-600'}`}
      >
        Previous
      </button>

      {getPaginationRange().map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(Number(page))}
            className={`font-bold px-2 ${
              page === currentPage ? 'text-primary-900' : 'text-primary-600'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className={`font-bold ${!hasNext ? 'text-gray-300 cursor-not-allowed' : 'text-primary-600'}`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

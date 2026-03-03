import React from 'react';

const Pagination = ({ page, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-gray-500">
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} items
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show first, last, and pages around current
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 border rounded ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === page - 2 ||
                pageNum === page + 2
              ) {
                return <span key={pageNum} className="px-2 py-1">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
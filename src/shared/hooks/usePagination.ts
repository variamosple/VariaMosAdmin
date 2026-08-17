import { useEffect, useState } from "react";

export interface UsePaginationProps {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function usePagination({
  totalItems,
  pageSize = 10,
  initialPage = 1,
}: UsePaginationProps): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Keep currentPage within bounds if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    currentPage: Math.min(currentPage, totalPages),
    totalPages,
    onPageChange: handlePageChange,
  };
}

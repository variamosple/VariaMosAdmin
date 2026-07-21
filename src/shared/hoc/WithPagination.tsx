import React, { ComponentType, useState, useEffect } from "react";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface WithPaginationProps {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export function withPagination<T extends PaginationControlsProps>(
  WrappedComponent: ComponentType<T>,
) {
  return function WithPaginationComponent(
    props: Omit<T, keyof PaginationControlsProps> & WithPaginationProps,
  ) {
    const { totalItems, pageSize = 10, initialPage = 1, ...rest } = props;
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

    const paginationProps: PaginationControlsProps = {
      currentPage: Math.min(currentPage, totalPages),
      totalPages,
      onPageChange: handlePageChange,
    };

    return <WrappedComponent {...(rest as any)} {...paginationProps} />;
  };
}

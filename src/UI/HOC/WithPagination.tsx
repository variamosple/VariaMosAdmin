import { useState } from "react";

export interface WithPaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  totalCount: number;
}

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function withPagination<T>(
  Component: React.ComponentType<PaginationControlsProps & { items: T[] }>
) {
  return function WithPagination({
    items,
    itemsPerPage,
    totalCount,
  }: WithPaginationProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const goToPage = (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    return (
      <Component
        items={items}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    );
  };
}

export default withPagination;

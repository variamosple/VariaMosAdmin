interface WithPaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  totalCount: number;
}

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

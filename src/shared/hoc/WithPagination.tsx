import type { ComponentType } from "react";
import { usePagination } from "../hooks/usePagination";

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
    const paginationProps = usePagination({
      totalItems,
      pageSize,
      initialPage,
    });

    interface GenericPropObject {
      [key: string]:
        | string
        | number
        | boolean
        | ((
            ...args: never[]
          ) => undefined | object | string | number | boolean | null)
        | object
        | null
        | undefined;
    }

    const combinedProps = Object.assign(
      {},
      rest as GenericPropObject as Omit<T, keyof PaginationControlsProps>,
      paginationProps,
    ) as T;

    return <WrappedComponent {...combinedProps} />;
  };
}

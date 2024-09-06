import { PagedModel } from "@/Domain/Core/Entity/PagedModel";
import { ResponseModel } from "@/Domain/Core/Entity/ResponseModel";
import { useCallback, useState } from "react";

interface UsePaginatedQueryProps<Filter extends PagedModel, Response> {
  queryFunction: (filter: Filter) => Promise<ResponseModel<Response[]>>;
  initialFilter: Filter;
  initialPage?: number;
}

interface PaginatedQueryResult<Filter extends PagedModel, Response> {
  data: Response[];
  loadData: (filter: Filter) => void;
  filter: Filter | null;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
}

export function usePaginatedQuery<Filter extends PagedModel, Response>({
  queryFunction,
  initialPage = 1,
}: UsePaginatedQueryProps<Filter, Response>): PaginatedQueryResult<
  Filter,
  Response
> {
  const [data, setData] = useState<Response[]>([]);
  const [filter, setFilter] = useState<Filter | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  const loadData = useCallback(
    (filter: Filter) => {
      setFilter(filter);
      setIsloading(true);

      queryFunction(filter)
        .then((response) => {
          setData(response.data ?? []);
          setTotalPages(
            Math.ceil((response.totalCount || 0) / filter.pageSize)
          );
        })
        .finally(() => {
          setIsloading(false);
        });
    },
    [queryFunction]
  );

  const onPageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    loadData(
      Object.assign(filter!, {
        pageNumber,
      })
    );
  };

  return {
    data,
    loadData,
    filter,
    currentPage,
    totalPages,
    isLoading,
    error,
    onPageChange,
  };
}

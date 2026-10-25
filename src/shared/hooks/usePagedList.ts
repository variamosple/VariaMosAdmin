import {
  type PagedModel,
  type ResponseModel,
  usePaginatedQuery,
} from "@variamosple/variamos-components";
import { useCallback, useMemo, useState } from "react";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";

/** What a list table needs to tell loading, failure and emptiness apart. */
export interface ListState {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  // A search or a filter is applied: an empty list means "no match"
  isFiltered: boolean;
}

const PAGING_KEYS = new Set(["pageNumber", "pageSize"]);

const isFilterApplied = (filter: object | null) =>
  !!filter &&
  Object.entries(filter).some(
    ([key, value]) =>
      !PAGING_KEYS.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== "",
  );

/**
 * usePaginatedQuery, plus the error of the last load, which the library
 * hook does not keep (UX-23), and a retry of that load. The query function
 * must be stable (a module function): it is a dependency.
 */
export const usePagedList = <Filter extends PagedModel, Item>({
  queryFunction,
  initialFilter,
}: {
  queryFunction: (filter: Filter) => Promise<ResponseModel<Item[]>>;
  initialFilter: Filter;
}) => {
  const [error, setError] = useState<string | null>(null);
  const query = useCallback(
    (filter: Filter) =>
      queryFunction(filter).then((response) => {
        setError(
          response.errorCode ? response.message || SYSTEM_ERROR_MESSAGE : null,
        );
        return response;
      }),
    [queryFunction],
  );
  const paged = usePaginatedQuery<Filter, Item>({
    queryFunction: query,
    initialFilter,
  });
  const { filter, loadData, isLoading } = paged;

  const onRetry = useCallback(() => {
    if (filter) {
      void loadData(filter);
    }
  }, [filter, loadData]);

  const listState: ListState = useMemo(
    () => ({
      isLoading,
      error,
      onRetry,
      isFiltered: isFilterApplied(filter),
    }),
    [isLoading, error, onRetry, filter],
  );

  return { ...paged, listState };
};
